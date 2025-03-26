'use client';

import { useAppKitAccount } from '@reown/appkit/react';
import { ConnectButton } from "@/components/ConnectButton";
import { Footer } from "@/components/Footer";
import { PrivateDataSection } from "@/components/PrivateDataSection";
import { useEffect, useState } from 'react';
import { formatAddress } from '@/utils/attestationUtils';

const MePage = () => {
  const { address, isConnected } = useAppKitAccount();
  const [walletAddress, setWalletAddress] = useState<string>('');
  
  useEffect(() => {
    if (address) {
      setWalletAddress(address);
    }
  }, [address]);
  
  return (
    <div className="legal-page">
      <h1 className="page-title">My Account</h1>
      
      {!isConnected ? (
        <div className="legal-section">
          <h2>Connect Your Wallet</h2>
          <div className="legal-content">
            <p>Please connect your wallet to view your account information.</p>
            <div className="connect-container">
              <ConnectButton />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="legal-section">
            <h2>Wallet Information</h2>
            <div className="legal-content">
              <div className="account-detail">
                <span className="detail-label">Address:</span>
                <span className="detail-value">{address}</span>
              </div>
            </div>
          </div>
          
          <div className="legal-section">
            <h2>Your Attestations</h2>
            <div className="legal-content">
              <p>
                View your attestations on the <a href="/read" className="text-link">Get page</a>.
              </p>
            </div>
          </div>
          
          <PrivateDataSection />
        </>
      )}
      
      <Footer />
    </div>
  );
};

export default MePage;
