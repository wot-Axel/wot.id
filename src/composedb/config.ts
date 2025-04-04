/**
 * ComposeDB Configuration
 * This file contains configuration for ComposeDB integration
 */

// Determine if we're in a production environment
export const isProduction = process.env.NODE_ENV === 'production';

// Default Ceramic node URLs - can be overridden with environment variables
// We provide multiple options for better reliability
export const CERAMIC_NODES = [
  // Local node for development (most reliable, but only in dev)
  ...(isProduction ? [] : ['http://localhost:7007']),
  // Clay testnet nodes - prioritized in production
  'https://ceramic-clay.3boxlabs.com',
  // Alternative endpoints
  'https://gateway.ceramic.network',
  'https://ceramic-clay.glazed.dev',
  'https://ceramic.composedb.com'
];

// Default to the first node in the list
export const DEFAULT_CERAMIC_NODE = CERAMIC_NODES[0];

// Local node URL for checking availability
export const LOCAL_CERAMIC_NODE = 'http://localhost:7007';

// Track failed nodes to implement fallback mechanism
let failedNodes: string[] = [];
let currentNodeIndex = 0;
let localNodeAvailable: boolean | null = null;

/**
 * Check if the local Ceramic node is available
 * @returns Promise resolving to boolean indicating if local node is available
 */
export const checkLocalNodeAvailability = async (): Promise<boolean> => {
  // In production, local node is never available
  if (isProduction) {
    return false;
  }
  
  // Use cached result if available
  if (localNodeAvailable !== null) {
    return localNodeAvailable;
  }
  
  try {
    const response = await fetch(`${LOCAL_CERAMIC_NODE}/api/v0/node/healthcheck`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Short timeout to avoid hanging
      signal: AbortSignal.timeout(2000)
    });
    
    localNodeAvailable = response.ok;
    console.log(`Local Ceramic node is ${localNodeAvailable ? 'available' : 'not available'}`);
    return localNodeAvailable;
  } catch (error) {
    console.warn('Local Ceramic node check failed:', error);
    localNodeAvailable = false;
    return false;
  }
};

/**
 * Get the best Ceramic node URL to use
 * Prioritizes local node in development if available, uses remote nodes in production
 * @returns The URL of the Ceramic node to use
 */
export const getCeramicNodeUrl = async (): Promise<string> => {
  // First check for environment variable override
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CERAMIC_NODE) {
    return process.env.NEXT_PUBLIC_CERAMIC_NODE;
  }
  
  // In development, check if local node is available
  if (!isProduction) {
    const isLocalAvailable = await checkLocalNodeAvailability();
    if (isLocalAvailable) {
      return LOCAL_CERAMIC_NODE;
    }
  }
  
  // If we've tried all nodes and they've all failed, reset and try again
  if (failedNodes.length >= CERAMIC_NODES.length) {
    console.warn('All remote Ceramic nodes have failed, resetting failed nodes list');
    failedNodes = [];
    currentNodeIndex = 0;
  }
  
  // Find the next available node that hasn't failed
  for (let i = 0; i < CERAMIC_NODES.length; i++) {
    const nodeIndex = (currentNodeIndex + i) % CERAMIC_NODES.length;
    const nodeUrl = CERAMIC_NODES[nodeIndex];
    
    if (!failedNodes.includes(nodeUrl)) {
      currentNodeIndex = nodeIndex;
      return nodeUrl;
    }
  }
  
  // If all nodes have failed, just return the first node in the list
  return CERAMIC_NODES[0];
};

/**
 * Mark a node as failed to trigger fallback mechanism
 * @param nodeUrl The URL of the node that failed
 */
export const markNodeAsFailed = (nodeUrl: string): void => {
  if (!failedNodes.includes(nodeUrl)) {
    console.warn(`Marking Ceramic node as failed: ${nodeUrl}`);
    failedNodes.push(nodeUrl);
    
    // If this was the local node, update the availability flag
    if (nodeUrl === LOCAL_CERAMIC_NODE) {
      localNodeAvailable = false;
    }
  }
};

// ComposeDB network configuration
export const getComposeDbConfig = () => {
  return {
    ceramic: {
      nodeUrl: getCeramicNodeUrl(),
    },
    definition: {
      // We'll generate this from our model definitions
      models: {},
    },
  };
};

// DID configuration
export const getDIDConfig = () => {
  return {
    // For now, we'll use the key method
    // In production, this would be more configurable
    method: 'key',
  };
};
