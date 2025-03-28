'use client';

import { useAppKitAccount, useDisconnect } from '@reown/appkit/react';
// Footer is now included in the layout
import { PrivateDataSection } from "@/components/PrivateDataSection";
import { MedicalDataSection } from "@/components/MedicalDataSection";
import { AccountsPasswordsSection } from "@/components/AccountsPasswordsSection";
import { HumanRelationshipsSection } from "@/components/HumanRelationshipsSection";
import { OrganizationalAffiliationsSection } from "@/components/OrganizationalAffiliationsSection";
import { CurrenciesSection } from "@/components/CurrenciesSection";
import { DigitalAssetsSection } from "@/components/DigitalAssetsSection";
import { IdentitySection } from "@/components/IdentitySection";
import { DocumentsSection } from "@/components/DocumentsSection";
import { RealWorldAssetsSection } from "@/components/RealWorldAssetsSection";
import { TrustBalanceSection } from "@/components/TrustBalanceSection";
import { useEffect, useState } from 'react';
import { formatAddress } from '@/utils/attestationUtils';
import { useRouter } from 'next/navigation';

const MePage = () => {
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const [walletAddress, setWalletAddress] = useState<string>('');
  const router = useRouter();
  
  useEffect(() => {
    if (address) {
      setWalletAddress(address);
    }
    
    // Redirect to homepage if not connected
    if (!isConnected) {
      router.push('/');
    }
  }, [address, isConnected, router]);
  
  return (
    <div className="legal-page">
      
      {isConnected && (
        <>
          <IdentitySection />
          
          <DocumentsSection />
          
          <RealWorldAssetsSection />
          
          <TrustBalanceSection />
          
          {/* Private Data Section temporarily hidden
          <PrivateDataSection />
          */}
          
          <MedicalDataSection />
          
          <AccountsPasswordsSection />
          
          <HumanRelationshipsSection />
          
          <OrganizationalAffiliationsSection />
          
          <CurrenciesSection />
          
          <DigitalAssetsSection />
          
          <div className="legal-section">
            <h2>My Ethereum Account</h2>
            <div className="legal-content">
              <div className="account-detail">
                <span className="detail-label">Address:</span>
                <span className="detail-value">{address}</span>
              </div>
            </div>
          </div>
          
          <div className="legal-section disconnect-section">
            <div className="legal-content" style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
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
      
      {/* Footer is now included in the layout */}
    </div>
  );
};

export default MePage;
