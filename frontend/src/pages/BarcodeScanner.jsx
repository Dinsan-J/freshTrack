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

