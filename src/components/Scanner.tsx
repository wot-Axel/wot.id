'use client';

import React, { useState, useEffect, useRef } from 'react';
// Dynamic imports to prevent build-time errors
type Html5QrcodeType = any;
type TesseractType = any;

let Html5Qrcode: Html5QrcodeType;
let Tesseract: TesseractType;

interface ScannerProps {
  onScanSuccess: (data: string, type: 'qrcode' | 'document') => void;
  onScanError?: (error: string) => void;
  onClose: () => void;
  scannerType: 'qrcode' | 'document';
}

const Scanner: React.FC<ScannerProps> = ({
  onScanSuccess,
  onScanError,
  onClose,
  scannerType = 'qrcode'
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const scannerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Initialize scanner and libraries on component mount
  useEffect(() => {
    // Dynamically import the libraries only on the client side
    const loadLibraries = async () => {
      try {
        // Check if we're on iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        
        // Import html5-qrcode with error handling
        try {
          const html5QrcodeModule = await import('html5-qrcode');
          Html5Qrcode = html5QrcodeModule.Html5Qrcode;
          
          // Initialize the scanner after libraries are loaded
          if (Html5Qrcode) {
            scannerRef.current = new Html5Qrcode('scanner-container');
          }
        } catch (qrError) {
          console.error('Error loading QR code library:', qrError);
          // Continue to load Tesseract even if QR code library fails
        }
        
        // Import tesseract.js with error handling
        try {
          const tesseractModule = await import('tesseract.js');
          Tesseract = tesseractModule.default;
        } catch (ocrError) {
          console.error('Error loading OCR library:', ocrError);
          // If we're specifically in document scanning mode, this is a critical error
          if (scannerType === 'document') {
            throw new Error('Could not load document scanning library');
          }
        }
        
        // Get available cameras with better error handling for iOS
        if (Html5Qrcode) {
          try {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length) {
              setCameras(devices.map((device: { id: string; label: string }) => ({
                id: device.id,
                label: device.label || `Camera ${device.id}`
              })));
              
              // On iOS, prefer the back camera (environment facing)
              if (isIOS) {
                const backCamera = devices.find((device: { id: string; label: string }) => 
                  device.label && device.label.toLowerCase().includes('back'));
                setSelectedCamera(backCamera ? backCamera.id : devices[0].id);
              } else {
                setSelectedCamera(devices[0].id);
              }
            } else {
              // If no cameras found through the API, try a direct approach for mobile
              setSelectedCamera('environment');
              setCameras([{ id: 'environment', label: 'Back Camera' }]);
            }
          } catch (err: any) {
            console.error('Error getting cameras:', err);
            // Fallback for iOS devices that may not expose camera list
            if (isIOS) {
              setSelectedCamera('environment');
              setCameras([{ id: 'environment', label: 'Back Camera' }]);
            } else {
              setError('Error accessing cameras: ' + err);
              if (onScanError) onScanError('Error accessing cameras: ' + err);
            }
          }
        }
      } catch (error: any) {
        console.error('Error loading libraries:', error);
        setError('Failed to load scanning libraries. Please try again later.');
        if (onScanError) onScanError('Failed to load scanning libraries: ' + error);
      }
    };
    
    loadLibraries();
    
    // Cameras are now loaded in the loadLibraries function
      
    return () => {
      // Clean up scanner on component unmount
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop()
          .catch((err: any) => console.error('Error stopping scanner:', err));
      }
    };
  }, [onScanError]);
  
  // Start QR code scanning
  const startQRScanner = async () => {
    if (!scannerRef.current || !selectedCamera) return;
    
    setIsScanning(true);
    setError('');
    
    try {
      // Check if we're using the environment fallback
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      };
      
      // Add specific config for iOS devices
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        // iOS devices may need different settings
        Object.assign(config, {
          aspectRatio: 1.0,
          formatsToSupport: ['QR_CODE'],
        });
      }
      
      await scannerRef.current.start(
        selectedCamera,
        config,
        (decodedText: string) => {
          // QR Code scanned successfully
          onScanSuccess(decodedText, 'qrcode');
          stopScanner();
        },
        (errorMessage: string) => {
          // QR Code scanning error (this is often just a frame without QR code, not an actual error)
          console.log(errorMessage);
        }
      );
    } catch (err: any) {
      console.error('QR scanner error:', err);
      setIsScanning(false);
      setError('Error starting scanner: ' + err);
      if (onScanError) onScanError('Error starting scanner: ' + err);
      
      // Try alternative approach for iOS if the first method fails
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        setError('Having trouble with the scanner? Try using the document scanner instead.');
      }
    }
  };
  
  // Stop the scanner
  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop()
        .then(() => {
          setIsScanning(false);
        })
        .catch((err: any) => {
          console.error('Error stopping scanner:', err);
        });
    } else {
      setIsScanning(false);
    }
  };
  
  // Capture image for document scanning
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data URL
    const imageDataUrl = canvas.toDataURL('image/png');
    setCapturedImage(imageDataUrl);
    
    // Stop video stream
    if (video.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };
  
  // Process captured image with Tesseract OCR
  const processDocumentImage = async () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);
    setError('');
    
    try {
      // Check if Tesseract is loaded
      if (!Tesseract) {
        throw new Error('Document scanning library not available');
      }
      
      // Show processing status to user
      setError('Processing document... This may take a moment.');
      
      // For iOS, we might need to compress the image first
      let imageToProcess = capturedImage;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      
      if (isIOS) {
        // Attempt to reduce memory usage for iOS devices
        const img = new Image();
        img.src = capturedImage;
        await new Promise(resolve => { img.onload = resolve; });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Resize to a more manageable size for processing
        const maxDimension = 1200;
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Use lower quality for better performance
        imageToProcess = canvas.toDataURL('image/jpeg', 0.7);
      }
      
      const result = await Tesseract.recognize(
        imageToProcess,
        'eng',
        { 
          logger: (m: any) => {
            console.log(m);
            // Update progress for user
            if (m.status === 'recognizing text' && m.progress) {
              setError(`Processing document: ${Math.floor(m.progress * 100)}%`);
            }
          }
        }
      );
      
      // Clear the processing message
      setError('');
      
      // Extract the recognized text
      const text = result.data.text;
      onScanSuccess(text, 'document');
      
    } catch (err) {
      console.error('Document processing error:', err);
      setError('Error processing document: ' + err);
      if (onScanError) onScanError('Error processing document: ' + err);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Start document scanner
  const startDocumentScanner = async () => {
    setIsScanning(true);
    setError('');
    setCapturedImage(null);
    
    try {
      // Check if Tesseract is loaded before starting document scanner
      if (!Tesseract && scannerType === 'document') {
        throw new Error('Document scanning library not loaded');
      }
      
      // iOS specific constraints
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          // Add iOS specific constraints
          ...(isIOS ? {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } : {})
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // For iOS, we need to ensure the video plays
        if (isIOS) {
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('autoplay', 'true');
          videoRef.current.setAttribute('muted', 'true');
        }
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setIsScanning(false);
      setError('Error accessing camera: ' + err);
      if (onScanError) onScanError('Error accessing camera: ' + err);
    }
  };
  
  // Handle camera change
  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCamera(e.target.value);
    
    // If already scanning, restart with new camera
    if (isScanning && scannerRef.current) {
      stopScanner();
      setTimeout(() => {
        if (scannerType === 'qrcode') {
          startQRScanner();
        } else {
          startDocumentScanner();
        }
      }, 500);
    }
  };
  
  // Start scanning based on scanner type
  const startScanning = () => {
    if (scannerType === 'qrcode') {
      startQRScanner();
    } else {
      startDocumentScanner();
    }
  };
  
  return (
    <div className="scanner-modal">
      <div className="scanner-content">
        <div className="scanner-header">
          <h3>{scannerType === 'qrcode' ? 'Scan QR Code' : 'Scan Document'}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {error && (
          <div className="scanner-error">
            <p>{error}</p>
          </div>
        )}
        
        <div className="camera-selection">
          <label htmlFor="camera-select">Select Camera:</label>
          <select 
            id="camera-select" 
            value={selectedCamera} 
            onChange={handleCameraChange}
            disabled={isScanning}
          >
            {cameras.map(camera => (
              <option key={camera.id} value={camera.id}>
                {camera.label}
              </option>
            ))}
          </select>
        </div>
        
        {scannerType === 'qrcode' ? (
          // QR Code Scanner
          <div id="scanner-container" className="scanner-container"></div>
        ) : (
          // Document Scanner
          <div className="document-scanner">
            {!capturedImage ? (
              // Video preview for document scanning
              <>
                <video 
                  ref={videoRef} 
                  className="document-video" 
                  autoPlay 
                  playsInline
                  muted
                ></video>
                <button 
                  className="capture-button"
                  onClick={captureImage}
                  disabled={!isScanning}
                >
                  Capture
                </button>
              </>
            ) : (
              // Captured image preview
              <>
                <div className="captured-image-container">
                  <img src={capturedImage} alt="Captured document" className="captured-image" />
                </div>
                <div className="document-actions">
                  <button 
                    className="process-button"
                    onClick={processDocumentImage}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Process Document'}
                  </button>
                  <button 
                    className="retake-button"
                    onClick={() => {
                      setCapturedImage(null);
                      startDocumentScanner();
                    }}
                    disabled={isProcessing}
                  >
                    Retake
                  </button>
                </div>
              </>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
          </div>
        )}
        
        <div className="scanner-actions">
          {!isScanning ? (
            <button 
              className="start-button"
              onClick={startScanning}
              disabled={!selectedCamera}
            >
              Start Scanning
            </button>
          ) : (
            scannerType === 'qrcode' && (
              <button 
                className="stop-button"
                onClick={stopScanner}
              >
                Stop Scanning
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Scanner;
