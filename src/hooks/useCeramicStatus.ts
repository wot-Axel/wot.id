/**
 * Hook for accessing Ceramic connection status
 * 
 * This hook provides information about the current Ceramic connection status,
 * including whether it's using the mock implementation or is connected to a real node.
 */

import { useState, useEffect } from 'react';
import { initCeramic } from '../composedb/ceramic';
import { initComposeDB } from '../composedb/client';
import { shouldUseMockImplementation } from '../composedb/ceramic-mock';

interface CeramicStatus {
  isConnected: boolean;
  isOffline: boolean;
  isMock: boolean;
  client: any;
  composeClient: any;
}

/**
 * Hook to access the current Ceramic connection status
 */
export const useCeramicStatus = (): CeramicStatus => {
  const [status, setStatus] = useState<CeramicStatus>({
    isConnected: false,
    isOffline: false,
    isMock: false,
    client: null,
    composeClient: null
  });

  useEffect(() => {
    let isMounted = true;

    const initializeClients = async () => {
      try {
        // Initialize Ceramic client
        const ceramicClient = await initCeramic();
        
        // Initialize ComposeDB client
        const composeClient = await initComposeDB();
        
        if (isMounted) {
          setStatus({
            isConnected: !!ceramicClient,
            isOffline: !!ceramicClient?.isOffline,
            isMock: shouldUseMockImplementation() || !!composeClient?.isMockImplementation,
            client: ceramicClient,
            composeClient
          });
        }
      } catch (error) {
        console.error('Error initializing Ceramic clients:', error);
        if (isMounted) {
          setStatus({
            isConnected: false,
            isOffline: true,
            isMock: shouldUseMockImplementation(),
            client: null,
            composeClient: null
          });
        }
      }
    };

    initializeClients();

    return () => {
      isMounted = false;
    };
  }, []);

  return status;
};

export default useCeramicStatus;
