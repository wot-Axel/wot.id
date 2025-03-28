'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { EAS } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';
// Footer is now included in the layout
import { ConnectButton } from "@/components/ConnectButton";
import QRCodeDisplay from '@/components/QRCodeDisplay';
import ScanButton from '@/components/ScanButton';
import { 
  decodeAttestationData, 
  formatAddress, 
  formatTimestamp,
  type DecodedData,
  type AttestationData
} from '@/utils/attestationUtils';

// Constants for EAS
const EAS_CONTRACT_ADDRESS = '0x4200000000000000000000000000000000000021';
const SCHEMA_ID = '0xfda16985b01f97d81468a76dee939af365d518910ed2ebf06400290aff490fcf';

// Define interface for our combined attestation data
interface Attestation {
  id: string;
  attester: string;
  recipient: string;
  decodedData: DecodedData;
  timeCreated: string;
}

const ReadAttestationPage = () => {
  const { address, isConnected } = useAppKitAccount();
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'received', 'created'

  // Function to fetch attestations
  const fetchAttestations = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create provider
      let provider;
      if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum as unknown as ethers.Eip1193Provider);
      } else {
        // Fallback to a public provider for read-only operations
        provider = new ethers.JsonRpcProvider('https://mainnet.optimism.io');
      }

      // Initialize EAS SDK
      const eas = new EAS(EAS_CONTRACT_ADDRESS);
      eas.connect(provider);

      // In a real implementation, you would use the EAS SDK to query the blockchain
      // or connect to the EAS subgraph for data
      
      // For demo purposes, we'll simulate fetched data
      // This simulates what we'd get from the EAS API
      const mockData: AttestationData[] = [
        {
          id: '0x123abc456def7890',
          attester: address,
          recipient: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          data: '0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000067573657231323300000000000000000000000000000000000000000000000000',
          timeCreated: Math.floor(Date.now() / 1000 - 86400).toString()
        },
        {
          id: '0x789ghi101jkl2345',
          attester: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          recipient: address,
          data: '0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000087573657232313233000000000000000000000000000000000000000000000000',
          timeCreated: Math.floor(Date.now() / 1000).toString()
        }
      ];
      
      // Process the mock data
      const processedAttestations = mockData.map(att => ({
        id: att.id,
        attester: att.attester,
        recipient: att.recipient,
        decodedData: decodeAttestationData(att.data),
        timeCreated: att.timeCreated
      }));
      
      setAttestations(processedAttestations);
    } catch (err) {
      console.error('Error fetching attestations:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Filter attestations based on selection
  const filteredAttestations = attestations.filter(att => {
    if (filter === 'all') return true;
    if (filter === 'received') return att.recipient.toLowerCase() === address?.toLowerCase();
    if (filter === 'created') return att.attester.toLowerCase() === address?.toLowerCase();
    return true;
  });

  // Check if address matches current user
  const isCurrentUser = (addr: string) => {
    return addr.toLowerCase() === address?.toLowerCase();
  };

  // Generate QR code data when address is available
  const [qrData, setQrData] = useState('');

  useEffect(() => {
    if (address) {
      // Create a URL that can be used to view attestations for this address
      // Format: https://wot.id/read?address=<address>
      const attestationUrl = `https://wot.id/read?address=${address}`;
      setQrData(attestationUrl);
    }
  }, [address]);

  return (
    <div className="pages">
      <h1>Get Trust</h1>
      <p>View attestations for the schema: <code>{SCHEMA_ID.substring(0, 10)}...{SCHEMA_ID.substring(SCHEMA_ID.length - 8)}</code></p>
      
      <ConnectButton />
      
      <div className="scan-actions">
        <ScanButton scannerType="qrcode" buttonText="Scan QR Code" />
        <ScanButton scannerType="document" buttonText="Scan Document" />
      </div>
      
      {isConnected && address && (
        <QRCodeDisplay 
          data={qrData} 
          title="Scan to View Trust"
          description="Scan this QR code to view attestations for this address"
        />
      )}
      
      {isConnected && (
        <div className="attestation-container">
          <div className="controls">
            <button 
              onClick={fetchAttestations}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Fetch Attestations'}
            </button>
            
            <div className="filter-controls">
              <label>
                <input 
                  type="radio" 
                  name="filter" 
                  value="all" 
                  checked={filter === 'all'} 
                  onChange={() => setFilter('all')} 
                />
                All
              </label>
              <label>
                <input 
                  type="radio" 
                  name="filter" 
                  value="received" 
                  checked={filter === 'received'} 
                  onChange={() => setFilter('received')} 
                />
                Received
              </label>
              <label>
                <input 
                  type="radio" 
                  name="filter" 
                  value="created" 
                  checked={filter === 'created'} 
                  onChange={() => setFilter('created')} 
                />
                Created
              </label>
            </div>
          </div>
          
          {error && (
            <div className="error">
              <p>{error}</p>
            </div>
          )}
          
          {filteredAttestations.length > 0 ? (
            <div className="attestations-list">
              {filteredAttestations.map(att => (
                <div key={att.id} className="attestation-card">
                  <h3>Attestation ID: <a 
                    href={`https://optimistic.etherscan.io/tx/${att.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {att.id.substring(0, 10)}...
                  </a></h3>
                  <div className="attestation-details">
                    <p>
                      <strong>Attester:</strong> {isCurrentUser(att.attester) ? 
                        <span className="highlight">You ({formatAddress(att.attester)})</span> : 
                        formatAddress(att.attester)
                      }
                    </p>
                    <p>
                      <strong>Recipient:</strong> {isCurrentUser(att.recipient) ? 
                        <span className="highlight">You ({formatAddress(att.recipient)})</span> : 
                        formatAddress(att.recipient)
                      }
                    </p>
                    <p><strong>WOT ID:</strong> {att.decodedData.wotId}</p>
                    <p><strong>Is Human:</strong> {att.decodedData.isHuman ? 'Yes' : 'No'}</p>
                    <p><strong>Time:</strong> {formatTimestamp(parseInt(att.timeCreated))}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-attestations">
              {loading ? 
                <p>Loading attestations...</p> : 
                attestations.length === 0 ? 
                  <p>No attestations found. Click "Fetch Attestations" to load data.</p> :
                  <p>No attestations match the selected filter.</p>
              }
            </div>
          )}
        </div>
      )}
      
      <div className="advice">
        <p>
          <b>Note:</b> This page shows attestations where you are either the attester or recipient.
        </p>
      </div>
      
      {/* Footer is now included in the layout */}
    </div>
  );
};

export default ReadAttestationPage;
