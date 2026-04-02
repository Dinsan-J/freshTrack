import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { ScanBarcode, AlertCircle, Loader2, ArrowRight, Camera, RefreshCw } from 'lucide-react';

const BarcodeScanner = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const scannerRef = useRef(null);

  useEffect(() => {
    // 1. Initial listing of cameras
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length > 0) {
        setCameras(devices);
        startScanner(devices[0].id);
      } else {
        setError('No cameras found on your device.');
      }
    }).catch(err => {
      console.error("Failed to get cameras", err);
      setError('Camera permission denied or not available. Please ensure your browser has camera access.');
    });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Stopping failed", err));
      }
    };
  }, []);

  const startScanner = async (cameraId) => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;
    
    try {
      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 180 },
          aspectRatio: 1.0
        },
        onScanSuccess,
        onScanFailure
      );
      setIsStarted(true);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Could not start camera. Make sure it is not used by another application.');
      setIsStarted(false);
    }
  };

  const switchCamera = () => {
    if (cameras.length < 2) return;
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    startScanner(cameras[nextIndex].id);
  };

  function onScanSuccess(decodedText) {
    if (scannerRef.current) {
        scannerRef.current.stop().then(() => {
            setIsStarted(false);
            fetchProductDetails(decodedText);
        }).catch(err => console.error("Stop failed", err));
    }
  }

  function onScanFailure(error) {
    // Silently ignore regular scanning failures (when barcode is not in frame)
  }

  const fetchProductDetails = async (barcode) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      
      let pData = { barcode };
      if (data.status === 1 && data.product) {
        pData = {
          barcode,
          name: data.product.product_name || '',
          brand: data.product.brands || '',
          image: data.product.image_url || ''
        };
      }
      setProductData(pData);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Product not found in database, but you can still add it manually.');
      setProductData({ barcode });
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/add', { state: { productData } });
  };

  const retryScan = () => {
    setProductData(null);
    if (cameras.length > 0) {
        startScanner(cameras[currentCameraIndex].id);
    }
  };

  return (
    <div className="max-w-md mx-auto animate-fade-in relative z-10 pt-4 px-2">
      <div className="text-center mb-8">
        <div className="inline-flex bg-primary/10 p-4 rounded-[1.5rem] mb-4 shadow-inner ring-1 ring-primary/20">
          <ScanBarcode className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Scanner</h2>
        <p className="text-slate-500 mt-2 font-medium">Camera scan only mode active</p>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-primary/10 border border-slate-100 overflow-hidden relative">
         {!productData && !loading && (
           <div className="relative">
             <div id="reader" className="w-full aspect-square bg-slate-900 overflow-hidden relative">
                {!isStarted && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center">
                        <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
                        <p className="font-bold">Initializing camera...</p>
                    </div>
                )}
             </div>
             
             {isStarted && (
               <div className="absolute top-4 right-4 flex gap-2">
                 {cameras.length > 1 && (
                    <button 
                      onClick={switchCamera}
                      className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/30 hover:bg-white/30 transition-all"
                      title="Switch Camera"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                 )}
               </div>
             )}

             <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-48 border-2 border-primary/50 rounded-2xl relative overflow-hidden">
                    <div className="absolute inset-x-0 h-0.5 bg-primary/80 top-0 animate-[scan_2s_infinite]"></div>
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                </div>
             </div>
           </div>
         )}

         {loading && (
           <div className="flex flex-col items-center justify-center p-16 bg-slate-50 min-h-[300px]">
             <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
             </div>
             <p className="text-slate-800 text-xl font-black tracking-tight">Analyzing...</p>
             <p className="text-sm text-slate-500 mt-2 font-medium">Fetching product data</p>
           </div>
         )}

         {productData && !loading && (
           <div className="p-8 bg-white text-center animate-slide-up">
              <div className="relative inline-block mb-6">
                {productData.image ? (
                    <img src={productData.image} alt="Product" className="w-40 h-40 object-contain mx-auto bg-slate-50 p-4 rounded-[2rem] shadow-sm border border-slate-100" />
                ) : (
                    <div className="w-32 h-32 bg-primary/5 rounded-[2rem] mx-auto flex items-center justify-center ring-1 ring-primary/10">
                        <ScanBarcode className="w-12 h-12 text-primary" />
                    </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-green-500 p-2 rounded-full text-white shadow-lg ring-4 ring-white">
                    <RefreshCw className="w-4 h-4" onClick={retryScan} cursor="pointer" />
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{productData.name || 'Unknown Product'}</h3>
              <p className="text-slate-500 font-bold mb-4 uppercase tracking-wider text-xs">{productData.brand || 'Generic'}</p>
              
              <div className="inline-flex items-center gap-3 bg-slate-100 px-5 py-2 rounded-2xl mb-8">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Barcode</span>
                 <span className="text-sm font-bold text-slate-700 tracking-wider">{productData.barcode}</span>
              </div>
              
              <button 
                onClick={handleContinue}
                className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white font-black py-5 rounded-3xl hover:bg-primary transition-all active:scale-[0.98] shadow-xl shadow-slate-900/10 group"
              >
                Set Expiry Date
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={retryScan}
                className="mt-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Scan again
              </button>
           </div>
         )}
      </div>
      
      {error && !loading && (
        <div className="mt-6 p-5 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4 shadow-sm animate-shake">
            <div className="p-2 bg-red-500 rounded-xl text-white">
                <AlertCircle className="w-5 h-5" />
            </div>
            <div className="text-left">
                <p className="text-sm font-black text-red-900 uppercase tracking-tighter">System Error</p>
                <p className="text-sm text-red-600 font-medium leading-relaxed">{error}</p>
            </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        
        #reader video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
