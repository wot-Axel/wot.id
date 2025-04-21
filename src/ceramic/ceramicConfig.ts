/**
 * Ceramic Network Configuration
 * This file contains the configuration for connecting to the Ceramic mainnet
 */

export const CERAMIC_CONFIG = {
  // Local API proxy URL that avoids CORS issues
  // Important: This URL should NOT include 'api' in the path to avoid duplication
  proxyUrl: '/api/ceramic',
  // Mainnet gateway URL (used for direct connections when possible)
  mainnetUrl: 'https://gateway.ceramic.network',
  // Fallback to local node if needed
  localUrl: 'http://localhost:7007',
  // Default network to use
  network: 'mainnet',
  // Seed for deterministic DID generation
  seed: '34d1f4b5d09fdde93d3a858b7423c42de8105113dcc1300771310a853857d26a',
  // DID registered with Ceramic
  did: 'did:key:z6MkmzcN2bjLjGu8tP99N31XkvDgFskrwUfeVbewtJBNmqBo',
  // API path that Ceramic adds to URLs (important for path normalization)
  apiPath: '/api/v0'
};

// Helper function to properly join URL paths without duplicating segments
// This is used only by the proxy handler and doesn't affect existing code
export function joinPaths(...parts: string[]): string {
  // Filter out empty segments and clean each part
  const cleanParts = parts
    .filter(part => part !== '')
    .map(part => {
      // Remove leading and trailing slashes
      return part.replace(/^\/+|\/+$/g, '');
    });
  
  // Join with a single slash
  return cleanParts.join('/');
}

// Export singleton instance that can be imported elsewhere
export const getCeramicConfig = () => {
  // Use env var if available, otherwise use mainnet
  const environment = process.env.NEXT_PUBLIC_CERAMIC_ENV || 'mainnet';
  
  // In production, always use our API proxy to avoid CORS issues
  // In development, we can use local node if specified
  let baseUrl = process.env.NODE_ENV === 'development' && environment === 'local'
    ? CERAMIC_CONFIG.localUrl
    : CERAMIC_CONFIG.proxyUrl;
    
  // If we're in a browser environment, ensure we use an absolute URL
  if (typeof window !== 'undefined' && window.location && baseUrl === CERAMIC_CONFIG.proxyUrl) {
    baseUrl = `${window.location.origin}${baseUrl}`;
  }
  
  // Preserve original nodeUrl behavior to maintain backward compatibility
  // Only perform minor normalization to avoid breaking existing code
  let nodeUrl = baseUrl;
  
  // Only if the URL explicitly ends with '/api/v0', remove it
  // This is a conservative approach that won't break existing usage patterns
  if (nodeUrl.endsWith('/api/v0')) {
    nodeUrl = nodeUrl.substring(0, nodeUrl.length - 7); // Remove '/api/v0'
  }
  
  return {
    nodeUrl,
    network: environment === 'local' ? 'local' : 'mainnet',
    seed: CERAMIC_CONFIG.seed,
    did: CERAMIC_CONFIG.did,
    // Include the standard API path for reference
    apiPath: CERAMIC_CONFIG.apiPath
  };
};
