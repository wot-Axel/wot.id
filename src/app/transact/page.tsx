'use client'

import React from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { ConnectButton } from '@/components/ConnectButton';
import styles from './transact.module.css';

export default function TransactPage() {
  const { isConnected } = useAppKitAccount();

  if (!isConnected) {
    return (
      <div className="main-content">
        <h1>Transact</h1>
        <p>Connect your wallet to send and receive assets</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="main-content">
      <h1>Transact</h1>
      
      <div className={styles.transactionContainer}>
        <div className={styles.transactionSection}>
          <h2>Send Assets</h2>
          <p>Send currency or real-world assets to other users</p>
          
          <div className={styles.transactionForm}>
            <div className={styles.formGroup}>
              <label htmlFor="recipient">Recipient Address</label>
              <input 
                type="text" 
                id="recipient" 
                placeholder="0x..." 
                className={styles.formControl}
              />
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
        
        <div className={styles.transactionSection}>
          <h2>Transaction History</h2>
          <p>View your recent transactions</p>
          
          <div className={styles.transactionHistory}>
            <p className={styles.emptyState}>No transactions yet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
