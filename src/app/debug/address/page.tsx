'use client';

import React, { useEffect, useState } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { useAppKitAccount } from '@reown/appkit-controllers/react';
import { useDisconnect } from '@reown/appkit/react';
import { storeCorrectAddress, getStoredCorrectAddress } from '@/utils/addressUtils';

export default function AddressDebugPage() {
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const kit = useAppKit();
  const [addressInfo, setAddressInfo] = useState<any>(null);
  const [kitConfig, setKitConfig] = useState<any>(null);

  useEffect(() => {
    // Get the current configuration
    if (kit) {
      try {
        // Extract configuration details
        const config = {
          defaultAccountTypes: (kit as any)._options?.defaultAccountTypes,
          networks: (kit as any)._options?.networks,
          features: (kit as any)._options?.features,
          // Add other relevant configuration
        };
        setKitConfig(config);
      } catch (error) {
        console.error('Error extracting kit configuration:', error);
      }
    }
  }, [kit]);

  useEffect(() => {
    if (address && isConnected) {
      // Get detailed account information
      const info = {
        address,
        isConnected,
        // Try to get more details about the account
        details: JSON.stringify({ address, isConnected }, null, 2)
      };
      setAddressInfo(info);
      
      // Store this address as the correct one
      console.log('Storing correct address from address debug page:', address);
      storeCorrectAddress(address);
      
      // Log if this matches the previously stored address
      const storedAddress = getStoredCorrectAddress();
      if (storedAddress && storedAddress.toLowerCase() !== address.toLowerCase()) {
        console.warn(`Address changed! Previous: ${storedAddress}, Current: ${address}`);
      }
    } else {
      setAddressInfo(null);
    }
  }, [address, isConnected]);

  const handleForceDisconnect = async () => {
    try {
      await disconnect();
      // Also try to clear any stored data
      if (typeof window !== 'undefined') {
        // Clear localStorage items related to AppKit
        Object.keys(localStorage).forEach(key => {
          if (key.includes('appkit') || key.includes('wallet') || key.includes('auth')) {
            localStorage.removeItem(key);
          }
        });
        // Clear cookies related to authentication
        document.cookie.split(';').forEach(c => {
          const cookie = c.trim();
          if (cookie.startsWith('appkit') || cookie.startsWith('auth')) {
            const name = cookie.split('=')[0];
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });
        alert('Disconnected and cleared stored data. Please refresh the page.');
      }
    } catch (error) {
      console.error('Error during disconnect:', error);
      alert(`Error during disconnect: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleConnect = () => {
    try {
      // Open the AppKit modal
      kit.open();
    } catch (error) {
      console.error('Error opening connect modal:', error);
      alert(`Error opening connect modal: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="address-debug-container">
      <style jsx>{`
        .address-debug-container {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .section {
          margin-bottom: 30px;
          padding: 15px;
          border: 1px solid #eaeaea;
          border-radius: 5px;
          background: #f9f9f9;
        }
        
        .section h2 {
          margin-top: 0;
          border-bottom: 1px solid #eaeaea;
          padding-bottom: 10px;
        }
        
        .info-item {
          margin-bottom: 10px;
        }
        
        .info-item strong {
          display: inline-block;
          width: 120px;
          font-weight: bold;
        }
        
        .button-group {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        button {
          padding: 8px 16px;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        button:hover {
          background: #0051b3;
        }
        
        button.disconnect {
          background: #f30000;
        }
        
        button.disconnect:hover {
          background: #b30000;
        }
        
        pre {
          background: #f0f0f0;
          padding: 10px;
          border-radius: 4px;
          overflow: auto;
          max-height: 300px;
        }
      `}</style>
      
      <h1>Address Debug Tool</h1>
      <p>This tool helps diagnose issues with Ethereum address generation and connection.</p>
      
      <div className="button-group">
        {!isConnected ? (
          <button onClick={handleConnect}>Connect Wallet</button>
        ) : (
          <button className="disconnect" onClick={handleForceDisconnect}>Force Disconnect & Clear Data</button>
        )}
      </div>
      
      <div className="section">
        <h2>Connection Status</h2>
        <div className="info-item">
          <strong>Connected:</strong> {isConnected ? 'Yes' : 'No'}
        </div>
      </div>
      
      {addressInfo && (
        <div className="section">
          <h2>Account Information</h2>
          <div className="info-item">
            <strong>Address:</strong> {addressInfo.address}
          </div>
          <div className="info-item">
            <strong>Chain ID:</strong> {addressInfo.chainId}
          </div>
          <div className="info-item">
            <strong>Account Type:</strong> {addressInfo.type}
          </div>
          <div className="info-item">
            <strong>Connector:</strong> {addressInfo.connector || 'N/A'}
          </div>
          <div className="info-item">
            <strong>Full Details:</strong>
            <pre>{addressInfo.details}</pre>
          </div>
        </div>
      )}
      
      {kitConfig && (
        <div className="section">
          <h2>AppKit Configuration</h2>
          <pre>{JSON.stringify(kitConfig, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
