'use client';

// Footer is now included in the layout
import { ConnectButton } from "@/components/ConnectButton";
import AttestationForm from '@/components/AttestationForm';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import ScanButton from '@/components/ScanButton';
import { useAppKitAccount, useAppKit } from '@reown/appkit/react';
import { useClientMounted } from "@/hooks/useClientMount";
import { useState, useEffect } from 'react';

const WritePage = () => {
  const { isConnected, address } = useAppKitAccount();
  const { open } = useAppKit();
  const mounted = useClientMounted();
  const [qrData, setQrData] = useState('');

  // Generate QR code data when address is available
  useEffect(() => {
    if (address) {
      // Create a URL that can be used to make an attestation
      // Format: https://wot.id/write?recipient=<address>
      const attestationUrl = `https://wot.id/write?recipient=${address}`;
      setQrData(attestationUrl);
    }
  }, [address]);

  if (!mounted) {
    return null; // Prevent rendering until client is mounted
  }

  return (
    <div className="pages">
      <h1>Give Trust</h1>
      <p>Create your attestation on the Optimism blockchain</p>
      
      <ConnectButton />
      
      <div className="scan-actions">
        <ScanButton scannerType="qrcode" buttonText="Scan QR Code" />
        <ScanButton scannerType="document" buttonText="Scan Document" />
      </div>
      
      {!isConnected && (
        <div style={{ margin: '20px 0' }}>
          <button onClick={() => open()}>Connect Wallet</button>
        </div>
      )}
      
      <div className="attestation-container">
        <AttestationForm />
      </div>
      
      {isConnected && address && (
        <QRCodeDisplay 
          data={qrData} 
          title="Scan to Give Trust"
          description="Scan this QR code with your mobile device to give trust to this address"
        />
      )}
      
      <div className="advice">
        <p>
          This attestation uses schema: <code>0xfda16985b01f97d81468a76dee939af365d518910ed2ebf06400290aff490fcf</code>
        </p>
        <p>
          <b>Caution:</b> This is an experimental feature. Attestations are permanent on the blockchain.
        </p>
      </div>
      
      {/* Footer is now included in the layout */}
    </div>
  );
};

export default WritePage;
