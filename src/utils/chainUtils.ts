// Utility functions for managing cross-chain operations
import { optimism } from '@reown/appkit/networks';

// Debug logging
const DEBUG_MODE = true;
const debugLog = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    const timestamp = new Date().toISOString();
    const logPrefix = `[CHAIN UTILS ${timestamp}]`;
    if (data) {
      console.log(logPrefix, message, data);
    } else {
      console.log(logPrefix, message);
    }
  }
};

/**
 * Check if the current chain ID matches Optimism
 * @param chainId The chain ID to check
 * @returns True if the chain ID matches Optimism, false otherwise
 */
export const isOptimismChain = (chainId?: number): boolean => {
  if (!chainId) return false;
  const isOptimism = chainId === optimism.id;
  debugLog(`Chain ID ${chainId} ${isOptimism ? 'is' : 'is not'} Optimism`);
  return isOptimism;
};

/**
 * Get the network requirements for Tableland
 * @returns Requirements information for Tableland operations
 */
export const getTablelandNetworkRequirements = () => {
  return {
    chainName: optimism.name,
    chainId: optimism.id,
    // Helpful message for users
    helpMessage: `Tableland operations require connecting to the ${optimism.name} network (Chain ID: ${optimism.id}).
    Your identity will still use your Ethereum mainnet address.`
  };
};

/**
 * Determines if an error is related to blockchain provider issues
 * @param error The error to check
 * @returns True if the error is related to provider issues
 */
export const isProviderError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    errorMessage.includes('eth_') || 
    errorMessage.includes('provider') || 
    errorMessage.includes('network') ||
    errorMessage.includes('chain') ||
    errorMessage.includes('connection')
  );
};
