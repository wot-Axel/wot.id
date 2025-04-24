/**
 * Hook for using the standard AppKit modal
 */

import { modal } from '@/context';

/**
};

/**
 * Gets the last used wallet ID from localStorage
 */
export const getLastUsedWallet = (): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('lastUsedWallet');
  } catch (error) {
    console.error('Error getting last used wallet:', error);
    return null;
  }
};

/**
 * Hook that provides methods for interacting with the AppKit modal
 */
export const useWalletPreferences = () => {
  // Set up event listener for connections and errors
  modal.subscribeEvents((event: any) => {
    if (event.name === 'CONNECT_SUCCESS' && event.data?.wallet?.id) {
      // Optionally handle wallet connection in session state here
      console.log('Connection successful with wallet:', event.data.wallet.id);
    }
    
    // Log error events for debugging
    if (event.name === 'ERROR') {
      console.error('AppKit modal error:', event.data);
    }
    
    // Log timeout events
    if (event.name === 'TIMEOUT' || (event.data && event.data.error && event.data.error.includes('timeout'))) {
      console.error('AppKit connection timed out:', event.data);
    }
  });

  return {
    openModal: () => {
      try {
        console.log('Opening AppKit modal...');
        modal.open();
      } catch (error) {
        console.error('Error opening AppKit modal:', error);
      }
    },
    closeModal: () => {
      try {
        modal.close();
      } catch (error) {
        console.error('Error closing AppKit modal:', error);
      }
    },
  };
};

export default useWalletPreferences;
