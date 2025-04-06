'use client'

import React, { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { ConnectButton } from '@/components/ConnectButton';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import ScannerModal from '@/components/ScannerModal';
import styles from './transact.module.css';

export default function TransactPage() {
  const { isConnected, address } = useAppKitAccount();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');

  if (!isConnected) {
    return (
      <div className="page-content">
        <h1>Transact</h1>
        <p>Connect your wallet to send and receive assets</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="legal-page">
      
      {/* Receive Transaction Section */}
      <div className="legal-section">
        <h2>Receive Transaction</h2>
        <div className="section-content">
          <div className={styles.qrCodeContainer}>
            <QRCodeDisplay
              data={address || ''}
              title=""
              description="This is my address on the Ethereum Blockchain where I can receive transactions. I can also share this address in string format"
            />
          </div>
        </div>
      </div>
      
      {/* Send Transaction Section */}
      <div className="legal-section">
        <h2>Send Transaction</h2>
        <div className="section-content">
          <p>Send currency or real-world assets to this address</p>
          
          <button 
            className="button-primary"
            onClick={() => setIsScannerOpen(true)}
            type="button"
          >
            <span role="img" aria-label="scan">📷</span> Scan QR Code
          </button>
          
          <div className={styles.transactionForm}>
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
              <label htmlFor="asset-type">Asset Type</label>
              <select id="asset-type" className={styles.formControl}>
                <option value="currency">Currency</option>
                <option value="rwa">Real-World Asset</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="amount">Amount</label>
              <input 
                type="number" 
                id="amount" 
                placeholder="0.0" 
                className={styles.formControl}
              />
            </div>
            
            <button className="button-primary">
              Send Transaction
            </button>
          </div>
        </div>
      </div>
      
      {/* Transaction History Section */}
      <div className="legal-section">
        <h2>Transaction History</h2>
        <div className="section-content">
          <p>View your recent transactions</p>
          <div className={styles.transactionHistory}>
            <p className={styles.emptyState}>No transactions yet</p>
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
