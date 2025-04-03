import { ethers } from 'ethers';
import { Database } from '@tableland/sdk';
import { optimism } from '@reown/appkit/networks';

// Constants
const OPTIMISM_RPC_URL = 'https://mainnet.optimism.io';
const OPTIMISM_CHAIN_ID = '0xa'; // 10 in decimal

/**
 * Creates a dedicated provider for Optimism that doesn't require wallet switching.
 * This allows the application to interact with Optimism while the user remains on their preferred network.
 */
export const getOptimismProvider = () => {
  // In production, you should use a more reliable RPC provider
  return new ethers.JsonRpcProvider(OPTIMISM_RPC_URL);
};

/**
 * Initializes a Tableland connection using a dedicated Optimism provider.
 * This follows the same pattern used for attestations - using Optimism for specific features
 * while keeping the user's primary identity on Ethereum L1.
 * 
 * @param userAddress The user's Ethereum address
 * @returns A Database instance connected to Optimism
 */
export const initTablelandWithOptimism = async (userAddress: string): Promise<Database> => {
  try {
    // For development purposes, we'll return the same mock database
    // that the original initTableland function returns
    // In a real implementation, we would connect to Tableland on Optimism
    
    // This is a placeholder that matches the interface of the original initTableland function
    // In production, this would use the Optimism provider to connect to Tableland
    return {} as Database;
  } catch (error) {
    console.error('Error initializing Tableland with Optimism provider:', error);
    throw error;
  }
};

/**
 * Checks if the user is currently connected to the Optimism network.
 * This is used for informational purposes only, not to force network switching.
 * 
 * @returns A boolean indicating whether the user is on Optimism
 */
export const isUserOnOptimism = async (): Promise<boolean> => {
  try {
    // Check if window.ethereum exists and define its type
    const ethereum = (window as any).ethereum;
    if (!ethereum) return false;
    
    const chainId = await ethereum.request({ method: 'eth_chainId' });
    return chainId === OPTIMISM_CHAIN_ID;
  } catch (error) {
    console.error('Error checking if user is on Optimism:', error);
    return false;
  }
};

/**
 * Gets the user's address on Optimism, which may be different from their address on other networks.
 * In most cases, it will be the same address, but this function provides flexibility for future changes.
 * 
 * @param mainnetAddress The user's address on their current network
 * @returns The user's address to use for Optimism operations
 */
export const getOptimismAddress = (mainnetAddress: string): string => {
  // For now, we use the same address across networks
  // This could be extended in the future if needed
  return mainnetAddress;
};

/**
 * Initializes Tableland with write capabilities using a dedicated Optimism provider.
 * This function provides the same interface as the original initTableland
 * but doesn't require the user to switch networks.
 * 
 * @param userAddress The user's Ethereum address
 * @returns A Database instance connected to Optimism with write capabilities
 */
export const initTablelandWithOptimismWrite = async (userAddress: string): Promise<Database> => {
  try {
    // For development purposes, we'll return the same mock database
    // In a real implementation, we would connect to Tableland on Optimism
    // with proper signing capabilities
    
    // This is a placeholder that matches the interface of the original initTableland function
    // In production, this would use the Optimism provider to connect to Tableland
    return {} as Database;
  } catch (error) {
    console.error('Error initializing Tableland with Optimism write access:', error);
    throw error;
  }
};
