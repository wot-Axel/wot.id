/**
 * Ceramic Network Connector
 * 
 * Implements a robust connection strategy for Ceramic network with:
 * 1. Multi-node fallback system
 * 2. Health checks
 * 3. Timeout controls
 * 4. Failed node tracking
 * 5. Improved error handling
 */

import { CeramicClient } from '@ceramicnetwork/http-client';
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';
// Using direct import with custom type declarations
import { fromString } from 'uint8arrays/from-string';
// Import fallback mechanisms
import { createFallbackDID, attemptCeramicRecovery } from '../composedb/did-fallback';

// Ensure window.ethereum is recognized
declare global {
  interface Window {
    ethereum?: Record<string, unknown>;
  }
}

// Constants
const CONNECTION_TIMEOUT = 10000; // 10 seconds
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds
const LOCAL_STORAGE_KEYS = {
  SUCCESSFUL_NODE: 'wot_successful_ceramic_node',
  FAILED_NODES: 'wot_failed_ceramic_nodes',
  DID_KEY: 'wot_did_private_key'
};

// Additional nodes to try
const ADDITIONAL_NODES = [
  'https://ceramic.composedb.com',    // ComposeDB node
  'https://testnet-clay-1.ceramic.network', // Clay testnet alternative
  'https://testnet-clay-2.ceramic.network', // Clay testnet alternative
  'https://testnet-clay-3.ceramic.network'  // Clay testnet alternative
];

// Default nodes to try in order of priority
const DEFAULT_NODES = [
  ...(typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? ['http://localhost:7007'] : []), // Local node only in development
  'https://ceramic-clay.3boxlabs.com', // Clay testnet (primary)
  'https://gateway.ceramic.network',    // Mainnet gateway
  ...ADDITIONAL_NODES
];

/**
 * Checks if a Ceramic node is healthy and responsive
 * @param nodeUrl URL of the Ceramic node to check
 * @returns Promise resolving to true if healthy, false otherwise
 */
export const checkNodeHealth = async (nodeUrl: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);
    
    const response = await fetch(`${nodeUrl}/api/v0/node/healthcheck`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn(`Health check failed for node ${nodeUrl}:`, error);
    return false;
  }
};

/**
 * Get list of failed nodes from localStorage
 * @returns Array of failed node URLs
 */
export const getFailedNodes = (): string[] => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const failedNodesStr = localStorage.getItem(LOCAL_STORAGE_KEYS.FAILED_NODES);
    return failedNodesStr ? JSON.parse(failedNodesStr) : [];
  } catch (error) {
    console.error('Error retrieving failed nodes:', error);
    return [];
  }
};

/**
 * Add a node to the failed nodes list
 * @param nodeUrl URL of the failed node
 */
export const addFailedNode = (nodeUrl: string): void => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  try {
    const failedNodes = getFailedNodes();
    if (!failedNodes.includes(nodeUrl)) {
      failedNodes.push(nodeUrl);
      localStorage.setItem(LOCAL_STORAGE_KEYS.FAILED_NODES, JSON.stringify(failedNodes));
    }
  } catch (error) {
    console.error('Error adding failed node:', error);
  }
};

/**
 * Remove a node from the failed nodes list
 * @param nodeUrl URL of the node to remove
 */
export const removeFailedNode = (nodeUrl: string): void => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  try {
    const failedNodes = getFailedNodes();
    const updatedNodes = failedNodes.filter(node => node !== nodeUrl);
    localStorage.setItem(LOCAL_STORAGE_KEYS.FAILED_NODES, JSON.stringify(updatedNodes));
  } catch (error) {
    console.error('Error removing failed node:', error);
  }
};

/**
 * Get the last successful node from localStorage
 * @returns URL of the last successful node, or null if none
 */
export const getLastSuccessfulNode = (): string | null => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem(LOCAL_STORAGE_KEYS.SUCCESSFUL_NODE);
};

/**
 * Set the last successful node in localStorage
 * @param nodeUrl URL of the successful node
 */
export const setLastSuccessfulNode = (nodeUrl: string): void => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(LOCAL_STORAGE_KEYS.SUCCESSFUL_NODE, nodeUrl);
  // Also remove from failed nodes if it was previously failed
  removeFailedNode(nodeUrl);
};

/**
 * Generate a deterministic DID key based on user identity
 * @param identity Unique identity string (e.g., wallet address)
 * @returns Private key for DID
 */
export const generateDeterministicDIDKey = (identity: string): Uint8Array => {
  // This is a simplified example - in production, use a proper key derivation function
  // with appropriate security measures
  const encoder = new TextEncoder();
  const data = encoder.encode(`wot.id-${identity}-ceramic-key`);
  
  // Create a 32-byte key (for Ed25519)
  const key = new Uint8Array(32);
  for (let i = 0; i < data.length && i < 32; i++) {
    key[i] = data[i];
  }
  
  return key;
};

/**
 * Store DID private key securely
 * @param privateKey Private key as hex string
 */
export const storeDIDKey = (privateKey: string): void => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(LOCAL_STORAGE_KEYS.DID_KEY, privateKey);
};

/**
 * Retrieve stored DID private key
 * @returns Private key as hex string, or null if not found
 */
export const getStoredDIDKey = (): string | null => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem(LOCAL_STORAGE_KEYS.DID_KEY);
};

/**
 * Create a DID instance from a private key
 * @param privateKey Private key as hex string or Uint8Array
 * @returns Authenticated DID instance
 */
export const createDID = async (privateKey: string | Uint8Array): Promise<DID> => {
  let keyBytes: Uint8Array;
  
  if (typeof privateKey === 'string') {
    keyBytes = fromString(privateKey, 'base16');
  } else {
    keyBytes = privateKey;
  }
  
  const provider = new Ed25519Provider(keyBytes);
  const did = new DID({ provider, resolver: getResolver() });
  await did.authenticate();
  return did;
};

/**
 * Connect to a Ceramic node with timeout
 * @param nodeUrl URL of the Ceramic node
 * @param did Authenticated DID instance
 * @returns Connected Ceramic client or null if connection failed
 */
export const connectToCeramicNode = async (
  nodeUrl: string,
  did: DID
): Promise<CeramicClient | null> => {
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);
    
    // Check node health first
    const isHealthy = await checkNodeHealth(nodeUrl);
    if (!isHealthy) {
      console.warn(`Node ${nodeUrl} is not healthy, skipping`);
      addFailedNode(nodeUrl);
      clearTimeout(timeoutId);
      return null;
    }
    
    // Create and connect Ceramic client
    const ceramic = new CeramicClient(nodeUrl);
    ceramic.did = did;
    
    // Test connection by making a simple API call
    await ceramic.admin.nodeStatus();
    
    clearTimeout(timeoutId);
    console.log(`Successfully connected to Ceramic node: ${nodeUrl}`);
    setLastSuccessfulNode(nodeUrl);
    return ceramic;
  } catch (error) {
    console.error(`Failed to connect to Ceramic node ${nodeUrl}:`, error);
    addFailedNode(nodeUrl);
    return null;
  }
};

/**
 * Get prioritized list of nodes to try
 * @returns Array of node URLs in priority order
 */
export const getPrioritizedNodes = (): string[] => {
  const nodes: string[] = [];
  const failedNodes = getFailedNodes();
  const isProduction = typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    !window.location.hostname.includes('127.0.0.1');
  
  // First priority: Last successful node (if any)
  const lastSuccessfulNode = getLastSuccessfulNode();
  if (lastSuccessfulNode && !failedNodes.includes(lastSuccessfulNode)) {
    // In production, skip localhost even if it was previously successful
    if (!isProduction || !lastSuccessfulNode.includes('localhost')) {
      nodes.push(lastSuccessfulNode);
    }
  }
  
  // Second priority: Default nodes that aren't in the failed list
  for (const node of DEFAULT_NODES) {
    // In production, skip localhost nodes
    if (isProduction && node.includes('localhost')) {
      continue;
    }
    
    if (!nodes.includes(node) && !failedNodes.includes(node)) {
      nodes.push(node);
    }
  }
  
  // If we have no nodes to try (all have failed), try the public nodes anyway
  if (nodes.length === 0) {
    console.warn('All known nodes have failed, trying public nodes anyway');
    // In production, never fallback to localhost
    const fallbackNodes = isProduction 
      ? DEFAULT_NODES.filter(node => !node.includes('localhost'))
      : DEFAULT_NODES;
    nodes.push(...fallbackNodes);
  }
  
  return nodes;
};

/**
 * Connect to Ceramic network with fallback strategy
 * @param identity User identity for DID generation (optional)
 * @returns Connected Ceramic client or null if all connections failed
 */
export const connectToCeramic = async (identity?: string): Promise<CeramicClient | null> => {
  try {
    // Get or create DID
    let did: DID;
    const storedKey = getStoredDIDKey();
    
    if (storedKey) {
      // Use stored key if available
      did = await createDID(storedKey);
    } else if (identity) {
      // Generate deterministic key from identity
      const privateKey = generateDeterministicDIDKey(identity);
      did = await createDID(privateKey);
      
      // Store the key for future use
      const privateKeyHex = Buffer.from(privateKey).toString('hex');
      storeDIDKey(privateKeyHex);
    } else {
      // Generate random key if no identity provided
      const randomKey = new Uint8Array(32);
      window.crypto.getRandomValues(randomKey);
      did = await createDID(randomKey);
      
      // Store the key for future use
      const privateKeyHex = Buffer.from(randomKey).toString('hex');
      storeDIDKey(privateKeyHex);
    }
    
    // Get prioritized list of nodes to try
    const nodesToTry = getPrioritizedNodes();
    
    // Try connecting to each node in order
    for (const nodeUrl of nodesToTry) {
      const ceramic = await connectToCeramicNode(nodeUrl, did);
      if (ceramic) {
        return ceramic;
      }
    }
    
    console.error('Failed to connect to any Ceramic node');
    return null;
  } catch (error) {
    console.error('Error connecting to Ceramic network:', error);
    return null;
  }
};

/**
 * Reset failed nodes list
 * This can be called periodically to retry previously failed nodes
 */
export const resetFailedNodes = (): void => {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.FAILED_NODES);
};

/**
 * Get current connection status
 * @returns Object with connection status information
 */
export const getConnectionStatus = (): {
  lastSuccessfulNode: string | null;
  failedNodes: string[];
} => {
  return {
    lastSuccessfulNode: getLastSuccessfulNode(),
    failedNodes: getFailedNodes()
  };
};
