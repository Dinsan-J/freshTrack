import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { ScanBarcode, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

const BarcodeScanner = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 },
      false
    );

    scanner.render(onScanSuccess, onScanFailure);

    function onScanSuccess(decodedText) {
      scanner.clear();
      fetchProductDetails(decodedText);
    }

    function onScanFailure(error) {
       // Ignore noisy errors
    }

    return () => {
      scanner.clear().catch(e => console.error("Failed to clear scanner", e));
    };
  }, []);

  const fetchProductDetails = async (barcode) => {
    setLoading(true);
    setError('');
    try {
      // Fetch details from OpenFoodFacts
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
      setError('Could not fetch product details automatically. You can still add it manually.');
      setProductData({ barcode });
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/add', { state: { productData } });
  };

  return (
    <div className="max-w-md mx-auto animate-fade-in relative z-10 pt-4">
      <div className="text-center mb-8">
        <div className="inline-flex bg-primary/10 p-4 rounded-3xl mb-4 shadow-inner ring-1 ring-primary/20">
          <ScanBarcode className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Scan Barcode</h2>
        <p className="text-slate-500 mt-2 font-medium">Position the barcode within the frame</p>
      </div>

      <div className="bg-white rounded-[2rem] p-4 shadow-xl shadow-primary/5 border border-slate-100 overflow-hidden relative">
         {!productData && !loading && (
           <div id="reader" className="w-full bg-slate-50 rounded-2xl overflow-hidden [&_video]:rounded-2xl border-none"></div>
         )}

         {loading && (
           <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
             <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
             <p className="text-slate-600 font-bold">Fetching product info...</p>
             <p className="text-sm text-slate-400 mt-1">Checking global databases</p>
           </div>
         )}

         {productData && !loading && (
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center animate-slide-up">
              {productData.image ? (
                <img src={productData.image} alt="Product" className="w-32 h-32 object-contain mx-auto mb-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100" />
              ) : (
                <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center ring-4 ring-white shadow-sm">
                  <ScanBarcode className="w-10 h-10 text-primary" />
                </div>
              )}
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-1">{productData.name || 'Unknown Product'}</h3>
              <p className="text-slate-500 font-medium mb-3">{productData.brand || 'No Brand Info'}</p>
              <div className="inline-flex items-center gap-2 bg-slate-200/50 px-4 py-1.5 rounded-full mb-6">
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Code</span>
                 <span className="text-sm font-mono font-bold text-slate-700">{productData.barcode}</span>
              </div>
              
              <button 
                onClick={handleContinue}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-indigo-600 text-white font-bold py-4 rounded-[1.25rem] hover:shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-1 group"
              >
                Set Expiry Date
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
         )}

         {error && (
            <div className="mt-4 p-4 bg-orange-50 border border-warning/20 rounded-2xl flex items-start gap-3 animate-fade-in text-left">
              <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <p className="text-sm text-warning font-medium">{error}</p>
            </div>
         )}
      </div>

      <style>{`
        /* Overriding html5-qrcode standard styles for cleaner UI */
        #reader { border: none !important; }
        #reader__dashboard_section_csr span { display: none !important; }
        #reader__dashboard_section_csr select { @apply w-full p-3 rounded-xl border-slate-200 text-sm focus:ring-primary focus:border-primary bg-white shadow-sm mb-3; }
        #reader button { @apply bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm w-full transition-colors hover:bg-slate-700 shadow-sm ; }
        #reader__camera_selection { margin-bottom: 12px; }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
