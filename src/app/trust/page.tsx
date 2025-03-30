'use client'

import React, { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { ConnectButton } from '@/components/ConnectButton';
import Link from 'next/link';
import styles from './trust.module.css';

export default function TrustPage() {
  const { isConnected } = useAppKitAccount();
  const [activeTab, setActiveTab] = useState('give'); // 'give' or 'get'

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
    <div className="page-content">
      <h1>Trust</h1>
      
      <div className={styles.trustTabs}>
        <button 
          className={`${styles.trustTab} ${activeTab === 'give' ? styles.active : ''}`}
          onClick={() => setActiveTab('give')}
        >
          Give Trust
        </button>
        <button 
          className={`${styles.trustTab} ${activeTab === 'get' ? styles.active : ''}`}
          onClick={() => setActiveTab('get')}
        >
          Get Trust
        </button>
      </div>
      
      <div className={styles.trustContent}>
        {activeTab === 'give' ? (
          <div className={styles.giveTrustSection}>
            <h2>Give Trust to Others</h2>
            <p>Provide attestations and build trust in the network</p>
            
            <div className={styles.trustForm}>
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
                Give Trust
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.getTrustSection}>
            <h2>Trust Received</h2>
            <p>View attestations others have given you</p>
            
            <div className={styles.trustReceived}>
              <p className={styles.emptyState}>No trust attestations received yet</p>
              
              <p className={styles.trustTip}>
                Share your profile with others to receive trust attestations.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
