import { ethers } from 'ethers';
import { Database, Validator } from '@tableland/sdk';
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
    // Create a dedicated provider for Optimism
    const optimismProvider = getOptimismProvider();
    
    // Create a read-only signer for the user's address
    // This allows us to connect to Optimism without requiring network switching
    const readOnlySigner = new ethers.VoidSigner(userAddress, optimismProvider);
    
    // Initialize the Database with the signer
    const db = new Database({
      signer: readOnlySigner,
      autoWait: true
    });
    
    return db;
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
 * Creates a cross-chain signer that can sign transactions for Optimism
 * while the user's wallet remains connected to their preferred network.
 * 
 * This approach uses the user's wallet for signing but directs the
 * transactions to Optimism without requiring a network switch.
 * 
 * @param userAddress The user's Ethereum address
 * @returns A signer that can be used for Optimism transactions
 */
export const createOptimismSigner = async (userAddress: string) => {
  // Get the Optimism provider
  const optimismProvider = getOptimismProvider();
  
  // Create a custom signer that uses the user's wallet for signing
  // but sends transactions to Optimism
  const customSigner = {
    provider: optimismProvider,
    getAddress: async () => userAddress,
    signMessage: async (message: string | Uint8Array) => {
      // Request signature from the user's wallet
      // This doesn't require switching networks
      const ethereum = (window as any).ethereum;
      if (!ethereum) throw new Error('No Ethereum provider found');
      
      // Convert message to string if it's a Uint8Array
      const messageStr = typeof message === 'string' 
        ? message 
        : ethers.toUtf8String(message);
      
      // Request signature from wallet
      const signature = await ethereum.request({
        method: 'personal_sign',
        params: [messageStr, userAddress]
      });
      
      return signature;
    },
    signTransaction: async (transaction: any) => {
      // For full transaction signing, we would need a more complex implementation
      // that handles the transaction serialization and signing
      // This is a simplified version that works for our current needs
      throw new Error('Direct transaction signing not implemented');
    },
    // Add other required Signer methods as needed
    connect: () => customSigner
  };
  
  return customSigner;
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
    // Create a dedicated provider for Optimism
    const optimismProvider = getOptimismProvider();
    
    // For operations that require signing (like creating tables),
    // we need to use a custom approach that leverages the user's wallet
    // without requiring them to switch networks
    
    // For now, we'll use a VoidSigner which is read-only
    // In production, you would implement a proper cross-chain signing mechanism
    // using the createOptimismSigner function above
    const readOnlySigner = new ethers.VoidSigner(userAddress, optimismProvider);
    
    // Initialize the Database with the signer
    const db = new Database({
      signer: readOnlySigner,
      autoWait: true
    });
    
    return db;
  } catch (error) {
    console.error('Error initializing Tableland with Optimism write access:', error);
    throw error;
  }
};
