/**
 * Wallet detection and preference utilities
 */

/**
 * Detects if MetaMask is installed in the browser
 */
export const isMetaMaskInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.ethereum && window.ethereum.isMetaMask ? true : false;
};

/**
 * Detects if Coinbase Wallet is installed in the browser
 */
export const isCoinbaseInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.ethereum && window.ethereum.isCoinbaseWallet ? true : false;
};

/**
 * Detects if Brave Wallet is installed in the browser
 */
export const isBraveWalletInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.ethereum && window.ethereum.isBraveWallet ? true : false;
};

/**
 * Records a wallet ID as recently used (session only, no persistent storage)
 */
let lastUsedWallet: string | null = null;
export const recordWalletUsage = (walletId: string): void => {
  lastUsedWallet = walletId;
};

/**
 * Gets the last used wallet ID (session only)
 */
export const getLastUsedWallet = (): string | null => {
  return lastUsedWallet;
};

/**
 * Gets a list of recommended wallet IDs based on user preferences and installed wallets
 */
export const getRecommendedWallets = (): string[] => {
  const installedWallets: string[] = [];
  const recommendedWallets: string[] = [];
  
  // Check for installed wallets
  if (isMetaMaskInstalled()) installedWallets.push('metamask');
  if (isCoinbaseInstalled()) installedWallets.push('coinbase');
  if (isBraveWalletInstalled()) installedWallets.push('brave');
  
  // Get last used wallet
  const lastUsedWallet = getLastUsedWallet();
  
  // Prioritize last used wallet
  if (lastUsedWallet) {
    recommendedWallets.push(lastUsedWallet);
  }
  
  // Add installed wallets that aren't already included
  installedWallets.forEach(wallet => {
    if (!recommendedWallets.includes(wallet)) {
      recommendedWallets.push(wallet);
    }
  });
  
  // Add common wallets if we don't have enough recommendations
  const commonWallets = ['metamask', 'coinbase', 'walletconnect', 'trust', 'rainbow'];
  commonWallets.forEach(wallet => {
    if (!recommendedWallets.includes(wallet)) {
      recommendedWallets.push(wallet);
    }
  });
  
  return recommendedWallets;
};

/**
 * Gets a list of wallet IDs to exclude
 */
export const getExcludedWallets = (): string[] => {
  // This could be expanded based on user preferences or device compatibility
  return [];
};

// Add a global type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: Record<string, unknown>;
  }
}
