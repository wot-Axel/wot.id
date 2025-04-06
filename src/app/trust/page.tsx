'use client'

import React, { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { ConnectButton } from '@/components/ConnectButton';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import ScannerModal from '@/components/ScannerModal';
import styles from './trust.module.css';

export default function TrustPage() {
  const { isConnected, address } = useAppKitAccount();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');

  if (!isConnected) {
    return (
      <div className="page-content">
        <h1>Trust</h1>
        <p>Connect your wallet to manage trust relationships</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="legal-page">
      
      {/* Receive Trust Section */}
      <div className="legal-section">
        <h2>Receive Trust</h2>
        <div className="section-content">
          <div className={styles.qrCodeContainer}>
            <QRCodeDisplay
              data={address || ''}
              title=""
              description="This is my address on the Ethereum Blockchain where I can receive trust. I can also share this address in string format"
            />
          </div>
        </div>
      </div>
      
      {/* Send Trust Section */}
      <div className="legal-section">
        <h2>Send Trust</h2>
        <div className="section-content">
          <p>Send trust attestations to this address</p>
          
          <button 
            className="button-primary"
            onClick={() => setIsScannerOpen(true)}
            type="button"
          >
            <span role="img" aria-label="scan">📷</span> Scan QR Code
          </button>
          
          <div className={styles.trustForm}>
            <div className={styles.formGroup}>
              <label htmlFor="recipient">Or enter Recipient Address</label>
              <div className={styles.addressInputContainer}>
                <input 
                  type="text" 
                  id="recipient" 
                  placeholder="0x..." 
                  className={styles.formControl}
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="trust-type">Trust Type</label>
              <select id="trust-type" className={styles.formControl}>
                <option value="identity">Identity Verification</option>
                <option value="skills">Skills & Expertise</option>
                <option value="reputation">General Reputation</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="trust-details">Details</label>
              <textarea 
                id="trust-details" 
                placeholder="Describe the basis for your trust..." 
                className={styles.formControl}
                rows={4}
              />
            </div>
            
            <button className="button-primary">
              Send Trust
            </button>
          </div>
        </div>
      </div>
      
      {/* Trust History Section */}
      <div className="legal-section">
        <h2>Trust History</h2>
        <div className="section-content">
          <p>View your trust relationships</p>
          <div className={styles.trustHistory}>
            <p className={styles.emptyState}>No trust relationships yet</p>
          </div>
        </div>
      </div>

      {/* QR Code Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        scannerType="qrcode"
        onScanSuccess={(data) => {
          setIsScannerOpen(false);
          setRecipientAddress(data);
        }}
      />
    </div>
  );
}


export const viewport = {
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};
