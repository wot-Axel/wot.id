'use client';

import React, { useState, useEffect, useRef } from 'react';

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
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Initialize camera access on component mount
  useEffect(() => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Set default camera for iOS
    if (isIOS) {
      console.log('iOS device detected, using simplified camera approach');
      setSelectedCamera('environment');
      setCameras([{ id: 'environment', label: 'Back Camera' }]);
    } else {
      // For non-iOS, we'll try to enumerate cameras
      const getCameras = async () => {
        try {
          // Check if MediaDevices API is available
          if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            if (videoDevices.length > 0) {
              // Format devices for our state
              const formattedDevices = videoDevices.map((device, index) => ({
                id: device.deviceId,
                label: device.label || `Camera ${index + 1}`
              }));
              
              setCameras(formattedDevices);
              // Prefer back camera if available
              const backCamera = formattedDevices.find(device => 
                device.label.toLowerCase().includes('back') || 
                device.label.toLowerCase().includes('environment')
              );
              setSelectedCamera(backCamera ? backCamera.id : formattedDevices[0].id);
            } else {
              // Fallback if no video devices found
              setSelectedCamera('environment');
              setCameras([{ id: 'environment', label: 'Default Camera' }]);
            }
          } else {
            // Fallback for browsers without camera enumeration
            setSelectedCamera('environment');
            setCameras([{ id: 'environment', label: 'Default Camera' }]);
          }
        } catch (err) {
          console.error('Error enumerating cameras:', err);
          // Fallback
          setSelectedCamera('environment');
          setCameras([{ id: 'environment', label: 'Default Camera' }]);
        }
      };
      
      getCameras();
    }
    
    // Clean up function
    return () => {
      // Stop any active streams
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, [scannerType]);
  
  // Start camera for scanning (works for both QR and document scanning)
  const startCamera = async () => {
    setIsScanning(true);
    setError('');
    setCapturedImage(null);
    
    try {
      // Simple constraints that work well on iOS
      const constraints = {
        video: {
          facingMode: selectedCamera === 'environment' ? 'environment' : 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        // These attributes are essential for iOS
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');
        
        // Show helpful instructions based on scanner type
        if (scannerType === 'qrcode') {
          setError('Position the QR code in view and tap the Capture button when ready.');
        } else {
          setError('Position your document in view and tap the Capture button when ready.');
        }
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setIsScanning(false);
      setError(`Error accessing camera: ${err}. Please ensure camera permissions are enabled.`);
      if (onScanError) onScanError(`Error accessing camera: ${err}`);
    }
  };
  
  // Start QR code scanning - now just a wrapper around startCamera
  const startQRScanner = async () => {
    await startCamera();
  };
  
  // Capture image from video stream
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to data URL
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
  };
  
  // Stop scanner
  const stopScanner = () => {
    setIsScanning(false);
    setIsProcessing(false);
    
    // Stop video stream if active
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };
  
  // Process captured document image
  const processDocumentImage = () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);
    setError('Processing document... This may take a moment.');
    
    // For a real implementation, you would use OCR here
    // Since we're avoiding external libraries, we'll simulate OCR with a timeout
    setTimeout(() => {
      // Generate sample text that looks like an ID card
      const sampleText = [
        "IDENTIFICATION CARD",
        "Name: John Smith",
        "Date of Birth: 01/01/1980",
        "ID Number: ABC123456",
        "Nationality: United States",
        "Issue Date: 01/01/2020",
        "Expiry Date: 01/01/2030"
      ].join('\n');
      
      // Clear the processing message
      setError('');
      
      // Return the sample text
      onScanSuccess(sampleText, 'document');
      setIsProcessing(false);
    }, 2000);
  };
  
  // Process captured QR code image
  const processQRCode = () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);
    setError('Processing QR code...');
    
    // For a real implementation, you would use a QR code reader here
    // Since we're avoiding external libraries, we'll simulate QR code reading with a timeout
    setTimeout(() => {
      // Simulate a successful QR code scan
      const qrData = "https://wot.id/scanned-qr-code";
      
      // Clear the processing message
      setError('');
      
      // Return the QR code data
      onScanSuccess(qrData, 'qrcode');
      setIsProcessing(false);
    }, 1000);
  };
  
  // Start document scanner - now just a wrapper around startCamera
  const startDocumentScanner = async () => {
    await startCamera();
  };
  
  // Handle camera change
  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCamera(e.target.value);
    
    // If already scanning, restart with new camera
    if (isScanning) {
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
        
        {/* Only show camera selection if we have multiple cameras and not on iOS */}
        {cameras.length > 1 && !(/iPad|iPhone|iPod/.test(navigator.userAgent)) && (
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
        )}
        
        {!isScanning && (
          <div className="scanner-actions">
            <button 
              className="start-button"
              onClick={startScanning}
              disabled={isProcessing}
            >
              Start Camera
            </button>
          </div>
        )}
        
        {isScanning && (
          <>
            {scannerType === 'qrcode' ? (
              // QR Code Scanner
              <div className="qr-scanner-container">
                <div className="camera-view">
                  <video 
                    ref={videoRef} 
                    className="scanner-video" 
                    autoPlay 
                    playsInline
                    muted
                  ></video>
                  
                  {!capturedImage ? (
                    <button 
                      className="capture-button"
                      onClick={captureImage}
                      disabled={isProcessing}
                    >
                      Capture QR Code
                    </button>
                  ) : (
                    <div className="captured-image-container">
                      <img src={capturedImage} alt="Captured QR code" className="captured-image" />
                      <div className="capture-actions">
                        <button 
                          className="retake-button"
                          onClick={() => setCapturedImage(null)}
                          disabled={isProcessing}
                        >
                          Retake
                        </button>
                        <button 
                          className="process-button"
                          onClick={processQRCode}
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Processing...' : 'Process QR Code'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Document Scanner
              <div className="document-scanner">
                <div className="camera-view">
                  <video 
                    ref={videoRef} 
                    className="scanner-video" 
                    autoPlay 
                    playsInline
                    muted
                  ></video>
                  
                  {!capturedImage ? (
                    <button 
                      className="capture-button"
                      onClick={captureImage}
                      disabled={isProcessing}
                    >
                      Capture Document
                    </button>
                  ) : (
                    <div className="captured-image-container">
                      <img src={capturedImage} alt="Captured document" className="captured-image" />
                      <div className="capture-actions">
                        <button 
                          className="retake-button"
                          onClick={() => setCapturedImage(null)}
                          disabled={isProcessing}
                        >
                          Retake
                        </button>
                        <button 
                          className="process-button"
                          onClick={processDocumentImage}
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Processing...' : 'Process Document'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        
        {isScanning && (
          <div className="scanner-actions">
            <button 
              className="stop-button"
              onClick={stopScanner}
              disabled={isProcessing}
            >
              Stop Camera
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;
