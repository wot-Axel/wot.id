'use client';

import { useAppKitAccount, useDisconnect } from '@reown/appkit/react';
import { ConnectButton } from "@/components/ConnectButton";
import { Footer } from "@/components/Footer";
import { PrivateDataSection } from "@/components/PrivateDataSection";
import { MedicalDataSection } from "@/components/MedicalDataSection";
import { IdentitySection } from "@/components/IdentitySection";
import { DocumentsSection } from "@/components/DocumentsSection";
import { RealWorldAssetsSection } from "@/components/RealWorldAssetsSection";
import { TrustBalanceSection } from "@/components/TrustBalanceSection";
import { useEffect, useState } from 'react';
import { formatAddress } from '@/utils/attestationUtils';

const MePage = () => {
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const [walletAddress, setWalletAddress] = useState<string>('');
  
  useEffect(() => {
    if (address) {
      setWalletAddress(address);
    }
  }, [address]);
  
  return (
    <div className="legal-page">
      
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
          <IdentitySection />
          
          <DocumentsSection />
          
          <RealWorldAssetsSection />
          
          <TrustBalanceSection />
          
          {/* Private Data Section temporarily hidden
          <PrivateDataSection />
          */}
          
          <MedicalDataSection />
          
          <div className="legal-section">
            <h2>My Ethereum Account</h2>
            <div className="legal-content">
              <div className="account-detail">
                <span className="detail-label">Address:</span>
                <span className="detail-value">{address}</span>
              </div>
            </div>
          </div>
          
          <div className="legal-section">
            <div className="legal-content" style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
              <button 
                onClick={() => disconnect()}
                className="logged-in-button"
              >
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}
      
      <Footer />
    </div>
  );
};

export default MePage;
