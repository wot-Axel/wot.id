'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { ComposeClient } from '@composedb/client';
import { definition } from '@/ceramic/definition';
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver as getKeyResolver } from 'key-did-resolver';
import { fromString } from 'uint8arrays/from-string';
import { useAppKitAccount } from '@reown/appkit-controllers/react';
import { getCeramicConfig } from '../ceramic/ceramicConfig';

// Interface for the Ceramic context
interface CeramicContextType {
  ceramic: CeramicClient | null;
  composeClient: ComposeClient | null;
  isReady: boolean;
  isAuthenticated: boolean;
  error: string | null;
  authenticateWithDID: (address: string) => Promise<boolean>;
}

// Create context with default values
const CeramicContext = createContext<CeramicContextType>({
  ceramic: null,
  composeClient: null,
  isReady: false,
  isAuthenticated: false,
  error: null,
  authenticateWithDID: async () => false,
});

export const CeramicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ceramic, setCeramic] = useState<CeramicClient | null>(null);
  const [composeClient, setComposeClient] = useState<ComposeClient | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAppKitAccount();

  // Initialize Ceramic client when the provider mounts
  useEffect(() => {
    const initCeramic = async () => {
      try {
        // Get the Ceramic configuration (defaults to mainnet)
        const config = getCeramicConfig();
        console.log(`[CERAMIC] Initializing Ceramic client on ${config.network}...`);
        
        // Create a new Ceramic client instance using the configured URL
        const ceramicClient = new CeramicClient(config.nodeUrl);
        setCeramic(ceramicClient);
        
        // Create ComposeDB client with runtime definition
        const compose = new ComposeClient({
          ceramic: ceramicClient as any, // Type cast to avoid version compatibility issues
          definition
        });
        setComposeClient(compose);
        
        console.log('[CERAMIC] Ceramic client initialized successfully');
        setIsReady(true);
      } catch (err) {
        console.error('[CERAMIC] Failed to initialize Ceramic client:', err);
        setError('Failed to initialize Ceramic client');
      }
    };

    initCeramic();
    
    // Cleanup function
    return () => {
      console.log('[CERAMIC] Cleaning up Ceramic client');
      setCeramic(null);
      setComposeClient(null);
      setIsReady(false);
      setIsAuthenticated(false);
    };
  }, []);

  // Function to authenticate with a DID 
  // For production, this would use the wallet's signing capabilities
  // Here we're creating  // Authenticate with DID using the private key
  const authenticateWithDID = async (address: string): Promise<boolean> => {
    try {
      if (!ceramic) {
        setError('Ceramic client not initialized');
        return false;
      }

      console.log('[CERAMIC] Authenticating with DID...');
      
      // Get the Ceramic configuration with our registered seed
      const config = getCeramicConfig();
      
      // Create a seed from the configured seed
      const seed = fromString(config.seed, 'base16');
      
      // Create a DID instance with Ed25519 provider
      const provider = new Ed25519Provider(seed);
      const did = new DID({ provider, resolver: getKeyResolver() });
      
      // Authenticate the DID
      await did.authenticate();
      
      // Set the DID on the Ceramic client
      ceramic.did = did;
      
      console.log(`[CERAMIC] Authenticated with DID: ${did.id}`);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error('[CERAMIC] Authentication error:', err);
      setError('Failed to authenticate with Ceramic');
      return false;
    }
  };

  // Auto-authenticate when address changes and Ceramic is ready
  useEffect(() => {
    if (isReady && address && !isAuthenticated) {
      console.log('[CERAMIC] Auto-authenticating with address:', address);
      authenticateWithDID(address).catch(err => {
        console.error('[CERAMIC] Auto-authentication failed:', err);
      });
    }
  }, [isReady, address, isAuthenticated]);

  return (
    <CeramicContext.Provider
      value={{
        ceramic,
        composeClient,
        isReady,
        isAuthenticated,
        error,
        authenticateWithDID
      }}
    >
      {children}
    </CeramicContext.Provider>
  );
};

// Custom hook for using the Ceramic context
export const useCeramic = () => useContext(CeramicContext);
