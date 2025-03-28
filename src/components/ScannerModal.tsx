'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Scanner component with no SSR
const Scanner = dynamic(() => import('./Scanner'), {
  ssr: false,
  loading: () => <div className="loading-scanner">Initializing scanner...</div>
});

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: string, type: 'qrcode' | 'document') => void;
  scannerType: 'qrcode' | 'document';
}

const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  scannerType = 'qrcode'
}) => {
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError('')}>Dismiss</button>
          </div>
        )}
        
        <Scanner
          onScanSuccess={onScanSuccess}
          onScanError={setError}
          onClose={onClose}
          scannerType={scannerType}
        />
      </div>
    </div>
  );
};

export default ScannerModal;
