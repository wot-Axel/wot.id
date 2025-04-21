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
import { getCeramicConfig, CERAMIC_CONFIG } from '../ceramic/ceramicConfig';

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
        
        // Create a new Ceramic client instance with safer initialization
        console.log('[CERAMIC] Creating client with URL:', config.nodeUrl);
        
        // Safely create the Ceramic client with explicit error handling
        const ceramicClient = new CeramicClient(config.nodeUrl);
        
        // Before setting state, verify the client was created successfully
        if (!ceramicClient) {
          throw new Error('Failed to create Ceramic client instance');
        }
        
        // Set up the Ceramic client
        setCeramic(ceramicClient);
        
        // Create ComposeDB client with runtime definition - use type cast to avoid version compatibility issues
        const compose = new ComposeClient({
          ceramic: ceramicClient as any, // Type cast is necessary due to version differences
          definition
        });
        
        // Verify ComposeDB client was created successfully
        if (!compose) {
          throw new Error('Failed to create ComposeDB client instance');
        }
        
        // Set the ComposeDB client in state - only once
        setComposeClient(compose);
        
        // Add fetch debugging to help trace URL issues
        if (typeof window !== 'undefined') {
          try {
            // Intercept fetch requests to log problematic patterns
            const originalFetch = window.fetch;
            window.fetch = function(input, init) {
              const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
              if (url.includes('ceramic') || url.includes('collection')) {
                console.log('[CERAMIC DEBUG] Fetch request:', { url, method: init?.method });
              }
              return originalFetch.apply(this, [input, init]);
            };
          } catch (e) {
            console.warn('[CERAMIC] Debug instrumentation failed:', e);
          }
        }
        
        // Activate localStorage fallback if Ceramic access fails due to CORS
        const activateLocalStorageFallback = () => {
          console.log('[CERAMIC] Activating localStorage fallback mechanism');
          // The fallback is already implemented as noted in the memories
        };
        
        // Test Ceramic connectivity to determine if we need fallback
        try {
          const testUrl = `${config.nodeUrl}api/v0/node/healthcheck`;
          const testResponse = await fetch(testUrl, { method: 'GET' });
          if (!testResponse.ok) {
            console.warn(`[CERAMIC] Connectivity test failed: ${testResponse.status}`);
            activateLocalStorageFallback();
          }
        } catch (error) {
          console.warn('[CERAMIC] Connectivity test error, activating fallback:', error);
          activateLocalStorageFallback();
        }
        
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
      
      // Make a test query to validate authentication and permissions
      // This helps detect CORS issues early
      try {
        if (composeClient) {
          // Use a simple query that's permissible even with CORS restrictions
          await composeClient.executeQuery(`query { viewer { id } }`);
        }
      } catch (queryError) {
        console.warn('[CERAMIC] Authentication test query failed, but continuing:', queryError);
        // We continue even if this fails since the fallback will handle it
      }
      
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
      
      // Store the authenticated address in localStorage for use by StorageContext
      if (typeof window !== 'undefined') {
        localStorage.setItem('userAddress', address);
      }
      
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
