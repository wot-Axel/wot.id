'use client';

import { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';

// Constants for EAS
const EAS_CONTRACT_ADDRESS = '0x4200000000000000000000000000000000000021';
const SCHEMA_ID = '0xfda16985b01f97d81468a76dee939af365d518910ed2ebf06400290aff490fcf';

// Create a type for our transaction that allows dynamic access
type LooseObject = {
  [key: string]: any;
};

const AttestationForm = () => {
  // Use the AppKit account for authentication status
  const { address, isConnected } = useAppKitAccount();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wotId, setWotId] = useState('');
  const [isHuman, setIsHuman] = useState(true);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const createAttestation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setTxHash('');

    try {
      // Check if ethereum provider exists
      if (!window.ethereum) {
        throw new Error('No wallet detection available. Please use the Reown AppKit to connect your wallet.');
      }

      // Cast window.ethereum to unknown first, then to the correct type
      const provider = new ethers.BrowserProvider(window.ethereum as unknown as ethers.Eip1193Provider);
      const signer = await provider.getSigner();
      
      // Initialize EAS SDK
      const eas = new EAS(EAS_CONTRACT_ADDRESS);
      eas.connect(signer);

      // Schema encoding based on your schema structure
      const schemaEncoder = new SchemaEncoder('string wotid, bool ishuman');
      const encodedData = schemaEncoder.encodeData([
        { name: 'wotid', value: wotId, type: 'string' },
        { name: 'ishuman', value: isHuman, type: 'bool' }
      ]);

      // Create the attestation
      const txResponse = await eas.attest({
        schema: SCHEMA_ID,
        data: {
          recipient: address,
          data: encodedData,
          revocable: true,
        },
      });

      // Use type assertion to work with the transaction
      // This avoids TypeScript errors while allowing us to access properties at runtime
      // eslint-disable-next-line
      const tx = txResponse as LooseObject;
      
      // Extract transaction hash safely
      let extractedHash = '';
      
      try {
        if (typeof tx === 'string') {
          extractedHash = tx;
        } else if (tx && typeof tx === 'object') {
          if (tx.hash) extractedHash = tx.hash;
          else if (tx.transactionHash) extractedHash = tx.transactionHash;
          else if (tx.transaction?.hash) extractedHash = tx.transaction.hash;
          else if (tx.receipt?.transactionHash) extractedHash = tx.receipt.transactionHash;
          
          // Wait for transaction if needed and not yet waited
          if (!extractedHash && typeof tx.wait === 'function') {
            const receipt = await tx.wait();
            if (receipt.transactionHash) {
              extractedHash = receipt.transactionHash;
            }
          }
          
          // Fallback to string representation
          if (!extractedHash) {
            extractedHash = 'Transaction submitted';
          }
        }
      } catch (err) {
        console.error('Error extracting hash:', err);
        extractedHash = 'Transaction submitted';
      }
      
      setTxHash(extractedHash);
      
      // Reset form after successful submission
      setWotId('');
      setIsHuman(true);
    } catch (err) {
      console.error('Error creating attestation:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pages">
      <h2>Give Trust</h2>
      
      {!isConnected && (
        <div className="section">
          <p>Please connect your wallet with Reown AppKit to create an attestation</p>
        </div>
      )}
      
      {isConnected && (
        <section>
          <form onSubmit={createAttestation}>
            <div>
              <label htmlFor="wotId">Web of Trust ID:</label>
              <input
                id="wotId"
                type="text"
                value={wotId}
                onChange={(e) => setWotId(e.target.value)}
                required
                className="form-input"
              />
            </div>
            
            <div>
              <label htmlFor="isHuman">Is Human:</label>
              <select
                id="isHuman"
                value={isHuman.toString()}
                onChange={(e) => setIsHuman(e.target.value === 'true')}
                className="form-select"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Is True'}
            </button>
          </form>
          
          {error && (
            <div className="error">
              <p>{error}</p>
            </div>
          )}
          
          {txHash && (
            <div className="success">
              <p>Attestation created successfully!</p>
              <p>
                Transaction: {txHash.length > 20 ? (
                  <a 
                    href={`https://optimistic.etherscan.io/tx/${txHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
                  </a>
                ) : txHash}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default AttestationForm;
