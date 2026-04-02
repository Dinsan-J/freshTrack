import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import axios from 'axios';
import { ScanBarcode, AlertCircle, Loader2, ArrowRight, RefreshCw, XCircle } from 'lucide-react';

const BarcodeScanner = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const scannerRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const initializeCameras = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          if (!isMounted.current) return;
          setCameras(devices);
          // Auto start with back camera if possible
          const backCam = devices.find(d => d.label.toLowerCase().includes('back')) || devices[0];
          const bIdx = devices.indexOf(backCam);
          setCurrentCameraIndex(bIdx !== -1 ? bIdx : 0);
          await startScanner(backCam.id);
        } else {
          if (!isMounted.current) return;
          setError('No cameras found. Please check permissions.');
        }
      } catch (err) {
        console.error("Failed to get cameras", err);
        if (isMounted.current) {
          setError('Camera access denied. Please allow camera permissions in your browser settings.');
        }
      }
    };

    initializeCameras();

    return () => {
        isMounted.current = false;
        // Immediate cleanup of library
        if (scannerRef.current) {
            if (scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current.clear();
                }).catch(e => console.error("Unmount stop failed", e));
            } else {
              scannerRef.current.clear();
            }
        }
    };
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
        try {
            await scannerRef.current.stop();
            scannerRef.current.clear();
            if (isMounted.current) setIsStarted(false);
        } catch (e) {
            console.error("Stop error", e);
        }
    }
  };

  const startScanner = async (cameraId) => {
    if (!isMounted.current) return;
    
    setError('');
    setLoading(false);
    setIsStarted(false);

    // Stop and clear existing if any
    if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
        }
        scannerRef.current.clear();
    }

    // Ensure terminal element is empty
    const readerElement = document.getElementById("reader");
    if (readerElement) readerElement.innerHTML = '';

    const formatsToSupport = [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.ITF,
      Html5QrcodeSupportedFormats.RSS_14,
      Html5QrcodeSupportedFormats.QR_CODE
    ];

    const html5QrCode = new Html5Qrcode("reader", { formatsToSupport });
    scannerRef.current = html5QrCode;
    
    // Improved scan box for both wide barcodes and square QR codes
    const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
        let minEdgePercentage = 0.7; 
        let minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
        let qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
        return {
            width: qrboxSize * 1.2, // Slightly wider for 1D barcodes
            height: qrboxSize * 0.8
        };
    };

    const config = {
      fps: 30, // Faster detection
      qrbox: qrboxFunction,
      aspectRatio: 1.0,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      },
      videoConstraints: {
        facingMode: "environment",
        focusMode: "continuous",
        exposureMode: "continuous"
      }
    };

    try {
      await html5QrCode.start(
        cameraId,
        config,
        onScanSuccess,
        onScanFailure
      );
      if (isMounted.current) setIsStarted(true);
    } catch (err) {
      console.error("Start error", err);
      // Fallback
      if (isMounted.current) {
          try {
              await html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure);
              setIsStarted(true);
          } catch (e2) {
              setError('Could not start camera. Please refresh the page.');
          }
      }
    }
  };

  const switchCamera = async () => {
    if (cameras.length < 2) return;
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    await startScanner(cameras[nextIndex].id);
  };

  async function onScanSuccess(decodedText) {
    if (scannerRef.current && scannerRef.current.isScanning) {
        try {
            // Stop library FIRST
            await scannerRef.current.stop();
            scannerRef.current.clear();
            
            if (isMounted.current) {
                setIsStarted(false);
                fetchProductDetails(decodedText);
            }
        } catch (err) {
            console.error("Stop failed during success", err);
            // Proceed anyway if it's already dead
            if (isMounted.current) {
                setIsStarted(false);
                fetchProductDetails(decodedText);
            }
        }
    } else {
        // Fallback for cases where isScanning might be false but success triggered
        if (isMounted.current) {
            setIsStarted(false);
            fetchProductDetails(decodedText);
        }
    }
  }

  function onScanFailure(error) {
    // Noise
  }

  const fetchProductDetails = async (barcode) => {
    setLoading(true);
    setProductData(null);
    try {
      // Parallel lookups for speed
      const urls = [
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        `https://world.openbeautyfacts.org/api/v0/product/${barcode}.json`,
        `https://world.openpetfoodfacts.org/api/v0/product/${barcode}.json`
      ];

      // Use reflect to catch errors individually and continue
      const results = await Promise.all(urls.map(url => axios.get(url).catch(e => ({ data: { status: 0 } }))));
      
      let pData = { barcode };
      // Find first successful results
      const successResult = results.find(r => r.data.status === 1);

      if (successResult && successResult.data.product) {
        const prod = successResult.data.product;
        pData = {
          barcode,
          name: prod.product_name || prod.product_name_en || '',
          brand: prod.brands || prod.brand_owner || '',
          image: prod.image_url || prod.image_front_url || ''
        };
      } else {
          // If no results, try one more generic search or fallback
          pData = { barcode };
      }

      if (isMounted.current) setProductData(pData);
    } catch (err) {
      console.error(err);
      if (isMounted.current) {
          setError('Product not found, but you can still record it.');
          setProductData({ barcode });
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const retryScan = async () => {
    setProductData(null);
    setError('');
    if (cameras.length > 0) {
        await startScanner(cameras[currentCameraIndex].id);
    } else {
        window.location.reload();
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in relative z-10 pt-4 px-2 pb-16">
      <div className="text-center mb-8">
        <div className="inline-flex bg-primary/10 p-4 rounded-3xl mb-4 shadow-sm ring-1 ring-primary/20">
          <ScanBarcode className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Product Scanner</h2>
        <p className="text-slate-500 mt-2 font-medium">Scan a barcode to manage expiry</p>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[500px] relative border-[6px] border-white/10 ring-1 ring-white/20">
         {/* Container for scanner + overlays */}
         <div className={`relative w-full h-full ${productData || loading ? 'hidden' : 'block'}`}>
             <div className="relative w-full h-[500px] md:h-[600px] bg-slate-900 overflow-hidden">
                {/* 
                   DANGER: #reader must stay EMPTY for React. 
                   html5-qrcode will manipulate its innerHTML.
                */}
                <div id="reader" className="w-full h-full scale-[1.05]"></div>

                {/* React overlays SIT ON TOP of the reader div as siblings */}
                {!isStarted && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900 z-10">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
                        <p className="font-bold tracking-tight">Initializing Camera...</p>
                    </div>
                )}

                {isStarted && (
                  <div className="absolute inset-0 z-10 pointer-events-none">
                    <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
                      {cameras.length > 1 && (
                        <button onClick={switchCamera} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/30 hover:bg-white/40">
                          <RefreshCw className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[85%] h-[60%] border border-white/20 rounded-[2rem] relative overflow-hidden backdrop-blur-[1px]">
                            <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent top-0 animate-[scan_2s_infinite]"></div>
                            
                            {/* Decorative framing corners */}
                            <div className="absolute top-0 left-0 w-10 h-10 border-t-[6px] border-l-[6px] border-primary rounded-tl-3xl shadow-[0_0_20px_rgba(var(--primary-rgb),0.6)]"></div>
                            <div className="absolute top-0 right-0 w-10 h-10 border-t-[6px] border-r-[6px] border-primary rounded-tr-3xl shadow-[0_0_20px_rgba(var(--primary-rgb),0.6)]"></div>
                            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[6px] border-l-[6px] border-primary rounded-bl-3xl shadow-[0_0_20px_rgba(var(--primary-rgb),0.6)]"></div>
                            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[6px] border-r-[6px] border-primary rounded-br-3xl shadow-[0_0_20px_rgba(var(--primary-rgb),0.6)]"></div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                                <ScanBarcode className="w-16 h-16 text-white/20" />
                            </div>
                        </div>
                    </div>
                  </div>
                )}
             </div>
         </div>

         {loading && (
           <div className="p-16 flex flex-col items-center justify-center min-h-[400px] animate-pulse">
             <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mb-8 ring-1 ring-primary/10">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
             </div>
             <p className="text-xl font-black text-slate-800 tracking-tight">Analyzing Code...</p>
             <p className="text-sm text-slate-400 mt-2 font-bold uppercase tracking-widest">Open Food Facts API</p>
           </div>
         )}

         {productData && !loading && (
           <div className="p-8 text-center animate-slide-up">
              <div className="relative inline-block mb-8">
                {productData.image ? (
                    <img src={productData.image} alt="Product" className="w-40 h-40 object-contain mx-auto bg-slate-50 p-4 rounded-[2.5rem] shadow-sm border border-slate-100" />
                ) : (
                    <div className="w-32 h-32 bg-primary/5 rounded-[2rem] mx-auto flex items-center justify-center">
                        <ScanBarcode className="w-12 h-12 text-primary" />
                    </div>
                )}
                <button onClick={retryScan} className="absolute -bottom-2 -right-2 bg-slate-800 p-2.5 rounded-full text-white shadow-lg ring-4 ring-white hover:bg-primary transition-colors">
                    <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-2">{productData.name || 'Unknown Item'}</h3>
              <p className="text-slate-400 font-black mb-6 uppercase tracking-widest text-[10px]">{productData.brand || 'No Brand'}</p>
              
              <div className="bg-slate-50 px-6 py-3 rounded-2xl mb-10 inline-flex items-center gap-4">
                 <span className="text-[10px] font-black text-slate-400 uppercase">Track ID</span>
                 <span className="text-sm font-mono font-black text-slate-800 tracking-tighter">{productData.barcode}</span>
              </div>
              
              <button 
                onClick={() => navigate('/add', { state: { productData } })}
                className="w-full bg-slate-900 text-white font-black py-5 rounded-[1.75rem] shadow-xl shadow-slate-900/10 hover:bg-primary hover:-translate-y-1 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                Continue to Batch Info <ArrowRight className="w-5 h-5" />
              </button>
           </div>
         )}

         {error && !loading && !productData && (
            <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                    <XCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Scan Failed</h3>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed max-w-[200px] mx-auto">{error}</p>
                <button onClick={retryScan} className="px-8 py-3 bg-slate-100 text-slate-800 font-black rounded-xl hover:bg-slate-200 transition-colors">Try Again</button>
            </div>
         )}
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 0; opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { top: 100%; }
        }
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
