'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { EAS } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';
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

export const TrustBalanceSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isConnected && address) {
      fetchAttestations();
    }
  }, [isConnected, address]);

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
        },
        {
          id: '0x456def789ghi0123',
          attester: address,
          recipient: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
          data: '0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000067573657233343500000000000000000000000000000000000000000000000000',
          timeCreated: Math.floor(Date.now() / 1000 - 43200).toString()
        },
        {
          id: '0xabc123def456ghi7',
          attester: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
          recipient: address,
          data: '0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000067573657234353600000000000000000000000000000000000000000000000000',
          timeCreated: Math.floor(Date.now() / 1000 - 21600).toString()
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

  // Filter attestations based on type
  const trustGiven = attestations.filter(att => 
    att.attester.toLowerCase() === address?.toLowerCase()
  );
  
  const trustReceived = attestations.filter(att => 
    att.recipient.toLowerCase() === address?.toLowerCase()
  );

  return (
    <div className="legal-section">
      <h2>My Trust Balance</h2>
      <div className="legal-content">
        {!isConnected ? (
          <p>Please connect your wallet to view your trust balance.</p>
        ) : loading ? (
          <p>Loading trust data...</p>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchAttestations} className="button-primary logged-in-button">
              Try Again
            </button>
          </div>
        ) : (
          <div className="trust-balance-container">
            <div className="trust-balance-table">
              <div className="trust-balance-header">
                <div className="trust-balance-cell header-cell">The Trust I Gave ({trustGiven.length})</div>
                <div className="trust-balance-cell header-cell">The Trust I Received ({trustReceived.length})</div>
              </div>
              
              <div className="trust-balance-body">
                {Math.max(trustGiven.length, trustReceived.length) === 0 ? (
                  <div className="trust-balance-row empty-row">
                    <div className="trust-balance-cell">No trust given yet</div>
                    <div className="trust-balance-cell">No trust received yet</div>
                  </div>
                ) : (
                  Array.from({ length: Math.max(trustGiven.length, trustReceived.length) }).map((_, index) => (
                    <div key={index} className="trust-balance-row">
                      <div className="trust-balance-cell">
                        {index < trustGiven.length ? (
                          <div className="trust-item">
                            <div>To: {formatAddress(trustGiven[index].recipient)}</div>
                            <div>ID: {trustGiven[index].decodedData.wotId}</div>
                            <div className="trust-date">{formatTimestamp(parseInt(trustGiven[index].timeCreated))}</div>
                          </div>
                        ) : null}
                      </div>
                      <div className="trust-balance-cell">
                        {index < trustReceived.length ? (
                          <div className="trust-item">
                            <div>From: {formatAddress(trustReceived[index].attester)}</div>
                            <div>ID: {trustReceived[index].decodedData.wotId}</div>
                            <div className="trust-date">{formatTimestamp(parseInt(trustReceived[index].timeCreated))}</div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="trust-links">
              <a href="/write" className="text-link">Give Trust</a>
              <span className="separator">|</span>
              <a href="/read" className="text-link">View All Attestations</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
