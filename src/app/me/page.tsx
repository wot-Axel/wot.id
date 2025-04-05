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
          
          <RealWorldAssetsSection />
          
          <div className="legal-section">
            <h2>My Ethereum Account</h2>
            <div className="section-content">
              <div className="account-detail">
                <span className="detail-label">Address:</span>
                <span className="detail-value">{address}</span>
              </div>
            </div>
          </div>
          
          <div className="button-bottom">
            <button 
              onClick={() => disconnect()}
              className="button-primary"
            >
              Disconnect
            </button>
          </div>
        </>
      )}
      
      {/* Footer is now included in the layout */}
    </div>
  );
};

export default MePage;
