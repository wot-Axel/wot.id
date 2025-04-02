/**
 * Hook for managing wallet preferences and customizing the AppKit modal
 */

import { useEffect, useState } from 'react';
import { modal } from '@/context';

// List of common wallet IDs
const COMMON_WALLETS = [
  'metamask',
  'coinbase',
  'walletconnect',
  'brave',
  'trust',
  'rainbow'
];

// List of social login options
const SOCIAL_LOGINS = [
  'google',
  'apple',
  'facebook',
  'twitter',
  'discord'
];

/**
 * Detects if MetaMask is installed in the browser
 */
const isMetaMaskInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.ethereum && window.ethereum.isMetaMask ? true : false;
};

/**
 * Detects if Coinbase Wallet is installed in the browser
 */
const isCoinbaseInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.ethereum && window.ethereum.isCoinbaseWallet ? true : false;
};

/**
 * Detects if Brave Wallet is installed in the browser
 */
const isBraveWalletInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.ethereum && window.ethereum.isBraveWallet ? true : false;
};

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
 * Hook that customizes the AppKit modal to show personalized wallet options
 */
export const useWalletPreferences = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    // Function to customize the modal when it opens
    const customizeModal = () => {
      // Use MutationObserver to detect when the modal is rendered
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length) {
            // Check if the modal is in the DOM
            const modalElement = document.querySelector('w3m-modal');
            if (modalElement) {
              setTimeout(() => {
                // Find all wallet option elements
                const walletOptions = document.querySelectorAll('w3m-wallet-image');
                if (walletOptions.length) {
                  customizeWalletOptions(walletOptions);
                }
              }, 100);
            }
          }
        });
      });

      // Start observing the document body for changes
      observer.observe(document.body, { childList: true, subtree: true });
    };

    // Function to customize the wallet options in the modal
    const customizeWalletOptions = (walletOptions: NodeListOf<Element>) => {
      // Get installed wallets
      const installedWallets: string[] = [];
      if (isMetaMaskInstalled()) installedWallets.push('metamask');
      if (isCoinbaseInstalled()) installedWallets.push('coinbase');
      if (isBraveWalletInstalled()) installedWallets.push('brave');

      // Get last used wallet
      const lastUsedWallet = getLastUsedWallet();

      // Process each wallet option
      walletOptions.forEach((option) => {
        const walletId = option.getAttribute('name')?.toLowerCase();
        
        if (walletId) {
          // Add visual indicator for recently used wallet
          if (walletId === lastUsedWallet) {
            const parent = option.parentElement;
            if (parent) {
              parent.style.border = '2px solid #3498db';
              parent.style.borderRadius = '12px';
              
              // Add "Recently Used" label
              const label = document.createElement('div');
              label.textContent = 'Recently Used';
              label.style.fontSize = '10px';
              label.style.color = '#3498db';
              label.style.textAlign = 'center';
              label.style.marginTop = '2px';
              parent.appendChild(label);
              
              // Move this option to the top
              const grandparent = parent.parentElement;
              if (grandparent && grandparent.firstChild) {
                grandparent.insertBefore(parent, grandparent.firstChild);
              }
            }
          }
          
          // Boost installed wallets by moving them up
          if (installedWallets.includes(walletId)) {
            const parent = option.parentElement;
            if (parent) {
              const grandparent = parent.parentElement;
              if (grandparent && grandparent.firstChild) {
                grandparent.insertBefore(parent, grandparent.firstChild);
              }
            }
          }
        }
      });
    };

    // Set up event listener for modal open
    modal.subscribeEvents((event: any) => {
      if (event.name === 'MODAL_OPEN') {
        customizeModal();
      }
      
      if (event.name === 'CONNECT_SUCCESS' && event.data?.wallet?.id) {
        recordWalletUsage(event.data.wallet.id);
      }
    });

    setInitialized(true);
  }, [initialized]);

  const openModal = () => {
    modal.open();
    
    // Apply customization after the modal opens
    setTimeout(() => {
      // Find all wallet option elements
      const walletOptions = document.querySelectorAll('w3m-wallet-image');
      if (walletOptions.length) {
        // Get installed wallets
        const installedWallets: string[] = [];
        if (isMetaMaskInstalled()) installedWallets.push('metamask');
        if (isCoinbaseInstalled()) installedWallets.push('coinbase');
        if (isBraveWalletInstalled()) installedWallets.push('brave');

        // Get last used wallet
        const lastUsedWallet = getLastUsedWallet();

        // Process each wallet option
        walletOptions.forEach((option) => {
          const walletId = option.getAttribute('name')?.toLowerCase();
          
          if (walletId) {
            // Add visual indicator for recently used wallet
            if (walletId === lastUsedWallet) {
              const parent = option.parentElement;
              if (parent) {
                parent.style.border = '2px solid #3498db';
                parent.style.borderRadius = '12px';
                
                // Add "Recently Used" label
                const label = document.createElement('div');
                label.textContent = 'Recently Used';
                label.style.fontSize = '10px';
                label.style.color = '#3498db';
                label.style.textAlign = 'center';
                label.style.marginTop = '2px';
                parent.appendChild(label);
                
                // Move this option to the top
                const grandparent = parent.parentElement;
                if (grandparent && grandparent.firstChild) {
                  grandparent.insertBefore(parent, grandparent.firstChild);
                }
              }
            }
            
            // Boost installed wallets by moving them up
            if (installedWallets.includes(walletId)) {
              const parent = option.parentElement;
              if (parent) {
                const grandparent = parent.parentElement;
                if (grandparent && grandparent.firstChild) {
                  grandparent.insertBefore(parent, grandparent.firstChild);
                }
              }
            }
          }
        });
      }
    }, 300);
  };

  return {
    openModal,
    closeModal: () => modal.close(),
  };
};

export default useWalletPreferences;
