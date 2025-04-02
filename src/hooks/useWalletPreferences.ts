/**
 * Hook for using the standard AppKit modal
 */

import { modal } from '@/context';

/**
 * Records a wallet ID as recently used in localStorage
 */
export const recordWalletUsage = (walletId: string): void => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem('lastUsedWallet', walletId);
  } catch (error) {
    console.error('Error recording wallet usage:', error);
  }
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
  // Set up event listener for successful connections
  modal.subscribeEvents((event: any) => {
    if (event.name === 'CONNECT_SUCCESS' && event.data?.wallet?.id) {
      recordWalletUsage(event.data.wallet.id);
    }
  });

  return {
    openModal: () => modal.open(),
    closeModal: () => modal.close(),
  };
};

export default useWalletPreferences;
