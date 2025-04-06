/**
 * ComposeDB Configuration
 * This file contains configuration for ComposeDB integration
 * Implements a robust multi-node fallback system with health checks
 */

// Determine if we're in a production environment
export const isProduction = process.env.NODE_ENV === 'production';

// Storage keys for connection tracking
const CONNECTION_STORAGE_KEYS = {
  SUCCESSFUL_NODE: 'wot_successful_ceramic_node',
  FAILED_NODES: 'wot_failed_ceramic_nodes',
  LAST_CONNECTION_TIME: 'wot_last_ceramic_connection_time'
};

// Connection timeout settings
export const CONNECTION_TIMEOUT = 10000; // 10 seconds
export const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

// Default Ceramic node URLs - can be overridden with environment variables
// Updated with multiple fallback options (April 2025)
export const CERAMIC_NODES = [
  // Local node for development (not used in production)
  'http://localhost:7007',
  // Community-run nodes (check status at https://status.ceramic.network)
  'https://ceramic-clay.3boxlabs.com',
  'https://ceramic.composedb.com',
  // IP-based fallbacks (more reliable than DNS in some environments)
  'http://143.198.139.3:7007',  // Direct IP for ceramic-clay
  // Testnet node
  'https://testnet-clay-1.ceramic.network'
];

// Default to the first node in the list
export const DEFAULT_CERAMIC_NODE = CERAMIC_NODES[0];

// Local node URL for checking availability
export const LOCAL_CERAMIC_NODE = 'http://localhost:7007';

// Track connection state
let localNodeAvailable: boolean | null = null;
let lastHealthCheckTime: number = 0;
const HEALTH_CHECK_CACHE_DURATION = 60000; // 1 minute

/**
 * Get the list of failed nodes from localStorage
 * @returns Array of failed node URLs
 */
export const getFailedNodes = (): string[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const failedNodesStr = localStorage.getItem(CONNECTION_STORAGE_KEYS.FAILED_NODES);
    return failedNodesStr ? JSON.parse(failedNodesStr) : [];
  } catch (error) {
    console.error('Error retrieving failed nodes:', error);
    return [];
  }
};

/**
 * Save the list of failed nodes to localStorage
 * @param nodes Array of failed node URLs
 */
export const saveFailedNodes = (nodes: string[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CONNECTION_STORAGE_KEYS.FAILED_NODES, JSON.stringify(nodes));
  } catch (error) {
    console.error('Error saving failed nodes:', error);
  }
};

/**
 * Get the last successful node from localStorage
 * @returns URL of the last successful node, or null if none
 */
export const getLastSuccessfulNode = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CONNECTION_STORAGE_KEYS.SUCCESSFUL_NODE);
};

/**
 * Save the last successful node to localStorage
 * @param nodeUrl URL of the successful node
 */
export const setLastSuccessfulNode = (nodeUrl: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CONNECTION_STORAGE_KEYS.SUCCESSFUL_NODE, nodeUrl);
    localStorage.setItem(CONNECTION_STORAGE_KEYS.LAST_CONNECTION_TIME, Date.now().toString());
    
    // Remove from failed nodes if it was previously failed
    const failedNodes = getFailedNodes();
    if (failedNodes.includes(nodeUrl)) {
      const updatedFailedNodes = failedNodes.filter(node => node !== nodeUrl);
      saveFailedNodes(updatedFailedNodes);
    }
  } catch (error) {
    console.error('Error saving successful node:', error);
  }
};

/**
 * Check if a Ceramic node is healthy and responsive
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
 * Check if the local Ceramic node is available
 * @returns Promise resolving to boolean indicating if local node is available
 */
export const checkLocalNodeAvailability = async (): Promise<boolean> => {
  // In production, local node is never available
  if (isProduction) {
    return false;
  }
  
  // Use cached result if available and recent
  const now = Date.now();
  if (localNodeAvailable !== null && (now - lastHealthCheckTime) < HEALTH_CHECK_CACHE_DURATION) {
    return localNodeAvailable;
  }
  
  // Check node health
  localNodeAvailable = await checkNodeHealth(LOCAL_CERAMIC_NODE);
  lastHealthCheckTime = now;
  
  if (localNodeAvailable) {
    console.log('Local Ceramic node is available');
  } else {
    console.warn('Local Ceramic node is not available');
  }
  
  return localNodeAvailable;
};

/**
 * Get the best Ceramic node URL to use
 * Prioritizes previously successful nodes, then local node in development,
 * then falls back to public nodes
 * @returns The URL of the Ceramic node to use
 */
export const getCeramicNodeUrl = async (): Promise<string> => {
  // First check for environment variable override
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CERAMIC_NODE) {
    return process.env.NEXT_PUBLIC_CERAMIC_NODE;
  }
  
  // Get connection state from storage
  const lastSuccessfulNode = getLastSuccessfulNode();
  const failedNodes = getFailedNodes();
  
  // Priority 1: Last successful node if not in failed list
  if (lastSuccessfulNode && !failedNodes.includes(lastSuccessfulNode)) {
    // Verify it's still healthy
    const isHealthy = await checkNodeHealth(lastSuccessfulNode);
    if (isHealthy) {
      return lastSuccessfulNode;
    } else {
      // Mark as failed if not healthy anymore
      markNodeAsFailed(lastSuccessfulNode);
    }
  }
  
  // Priority 2: Local node in development if available
  if (!isProduction) {
    const isLocalAvailable = await checkLocalNodeAvailability();
    if (isLocalAvailable) {
      return LOCAL_CERAMIC_NODE;
    }
  }
  
  // Priority 3: Try other nodes that haven't failed
  const availableNodes = CERAMIC_NODES.filter(node => !failedNodes.includes(node));
  
  // If we have no available nodes, reset failed nodes list and try again
  if (availableNodes.length === 0) {
    console.warn('All Ceramic nodes have failed, resetting failed nodes list');
    saveFailedNodes([]);
    return CERAMIC_NODES[0]; // Start with the first node again
  }
  
  // Return the first available node
  return availableNodes[0];
};

/**
 * Mark a node as failed to trigger fallback mechanism
 * @param nodeUrl The URL of the node that failed
 */
export const markNodeAsFailed = (nodeUrl: string): void => {
  const failedNodes = getFailedNodes();
  
  if (!failedNodes.includes(nodeUrl)) {
    console.warn(`Marking Ceramic node as failed: ${nodeUrl}`);
    failedNodes.push(nodeUrl);
    saveFailedNodes(failedNodes);
    
    // If this was the local node, update the availability flag
    if (nodeUrl === LOCAL_CERAMIC_NODE) {
      localNodeAvailable = false;
    }
  }
};

/**
 * Reset the failed nodes list
 * This can be called periodically to retry previously failed nodes
 */
export const resetFailedNodes = (): void => {
  saveFailedNodes([]);
  console.log('Reset failed Ceramic nodes list');
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
