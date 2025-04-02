'use client'

import React from 'react';
import Link from 'next/link';
import styles from './chat.module.css';

export default function ChatPage() {
  return (
    <div className="legal-page">
      <h1>Chat</h1>
      
      <div className={styles.constructionContainer}>
        <div className={styles.constructionIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="64" height="64">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
            <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
            <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
        
        <h2 className={styles.constructionTitle}>Chat Coming Soon!</h2>
        
        <div className={styles.constructionMessage}>
          <p>Our secure, wallet-based chat functionality is currently under construction and will be available shortly.</p>
          <p>Using the XMTP protocol, this feature will enable decentralized, end-to-end encrypted messaging between wallet addresses.</p>
          <p>Please revisit regularly for updates on this exciting feature!</p>
        </div>
        
        <div className={styles.constructionFeatures}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div className={styles.featureText}>
              <h3>Secure</h3>
              <p>End-to-end encrypted messaging</p>
            </div>
          </div>
          
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                <path d="M20 9v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9"></path>
                <path d="M9 22V12h6v10M2 10.6L12 2l10 8.6"></path>
              </svg>
            </div>
            <div className={styles.featureText}>
              <h3>Decentralized</h3>
              <p>No central server or authority</p>
            </div>
          </div>
          
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className={styles.featureText}>
              <h3>Coming Soon</h3>
              <p>Check back for updates</p>
            </div>
          </div>
        </div>
        
        <Link href="/" className={styles.homeButton}>
          Return to Home
        </Link>
      </div>
    </div>
  );
}
