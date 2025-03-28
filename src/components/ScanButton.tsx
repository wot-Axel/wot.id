'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

// Dynamically import the ScannerModal component with no SSR
const ScannerModal = dynamic(() => import('./ScannerModal'), {
  ssr: false,
  loading: () => <div className="loading-scanner">Loading scanner...</div>
});

interface ScanButtonProps {
  scannerType?: 'qrcode' | 'document';
  buttonText?: string;
  className?: string;
}

const ScanButton: React.FC<ScanButtonProps> = ({
  scannerType = 'qrcode',
  buttonText = scannerType === 'qrcode' ? 'Scan QR Code' : 'Scan Document',
  className = 'scan-button'
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const router = useRouter();

  const handleScanSuccess = (data: string, type: 'qrcode' | 'document') => {
    setIsModalOpen(false);
    
    if (type === 'qrcode') {
      // Handle QR code data
      // If it's a URL, we can navigate to it
      if (data.startsWith('http')) {
        // Check if it's a wot.id URL
        if (data.includes('wot.id')) {
          router.push(data);
        } else {
          // For external URLs, open in new tab
          window.open(data, '_blank');
        }
      } else {
        // For non-URL QR codes, we can handle them differently
        // For example, if it's an address, we could go to the read page with that address
        if (data.startsWith('0x') && data.length === 42) {
          router.push(`/read?address=${data}`);
        } else {
          // Show the data in an alert for now
          alert(`Scanned QR Code: ${data}`);
        }
      }
    } else if (type === 'document') {
      // Handle document scan data
      // For now, just show the extracted text
      alert(`Extracted text from document: ${data.substring(0, 100)}${data.length > 100 ? '...' : ''}`);
    }
  };

  return (
    <>
      <button 
        className={className}
        onClick={() => setIsModalOpen(true)}
      >
        {buttonText}
      </button>
      
      <ScannerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onScanSuccess={handleScanSuccess}
        scannerType={scannerType}
      />
    </>
  );
};

export default ScanButton;
