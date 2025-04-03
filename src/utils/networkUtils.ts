/**
 * Simple utilities for network detection and switching
 */
import { optimism } from '@reown/appkit/networks';
import { ERROR_MESSAGES } from './errorUtils';

// Network chain IDs
export const NETWORK_IDS = {
  ETHEREUM_MAINNET: '0x1',
  OPTIMISM: '0xa',
  OPTIMISM_GOERLI: '0xa13'
};

// Network names for display
export const NETWORK_NAMES = {
  [NETWORK_IDS.ETHEREUM_MAINNET]: 'Ethereum Mainnet',
  [NETWORK_IDS.OPTIMISM]: 'Optimism',
  [NETWORK_IDS.OPTIMISM_GOERLI]: 'Optimism Goerli'
};

/**
 * Check if the current network is Optimism or Optimism Goerli
 * @param chainId The current chain ID
 * @returns Whether the network is Optimism
 */
export const isOptimismNetwork = (chainId: string | null): boolean => {
  return chainId === NETWORK_IDS.OPTIMISM || chainId === NETWORK_IDS.OPTIMISM_GOERLI;
};

/**
 * Get the current network chain ID
 * @returns The current chain ID or null if not available
 */
export const getCurrentChainId = async (): Promise<string | null> => {
  try {
    // Check if window.ethereum exists 
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      return null;
    }
    
    // Request the chain ID
    return await ethereum.request({ method: 'eth_chainId' });
  } catch (error) {
    console.error('Error getting chain ID:', error);
    return null;
  }
};

/**
 * Simple wrapper for switching networks with proper error handling
 * @param switchNetwork The switchNetwork function from AppKit
 * @param setLoading Optional loading state setter
 * @param setError Optional error state setter
 * @returns Whether the switch was successful
 */
export const safeNetworkSwitch = async (
  switchNetwork: (network: any) => Promise<void>,
  setLoading?: (loading: boolean) => void,
  setError?: (error: string) => void
): Promise<boolean> => {
  try {
    if (setLoading) {
      setLoading(true);
    }
    
    await switchNetwork(optimism);
    
    if (setError) {
      setError('');
    }
    
    return true;
  } catch (error) {
    console.error('Error switching network:', error);
    
    if (setError) {
      setError(ERROR_MESSAGES.NETWORK_SWITCH);
    }
    
    return false;
  } finally {
    if (setLoading) {
      setLoading(false);
    }
  }
};
