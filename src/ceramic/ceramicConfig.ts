/**
 * Ceramic Network Configuration
 * This file contains the configuration for connecting to the Ceramic network
 */

export const CERAMIC_CONFIG = {
  // Local API proxy URL that avoids CORS issues
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
  apiPath: '/api/v0',
  // Flag to control whether we're using a direct ceramic connection or proxy
  useProxy: true
};

/**
 * Helper function to properly join URL paths without duplicating segments
 * This is a core utility used for proper URL construction
 */
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

/**
 * Removes duplicate path segments in a URL
 * Specifically handles cases like '/api/api/v0' → '/api/v0'
 */
export function normalizeCeramicUrl(url: string): string {
  // If URL contains duplicate /api/api/, normalize it
  if (url.includes('/api/api/')) {
    return url.replace('/api/api/', '/api/');
  }
  return url;
}

// Export singleton instance that can be imported elsewhere
export const getCeramicConfig = () => {
  // Use env var if available, otherwise use mainnet
  const environment = process.env.NEXT_PUBLIC_CERAMIC_ENV || 'mainnet';
  
  // Determine if we should use the proxy
  const useProxy = CERAMIC_CONFIG.useProxy || process.env.NODE_ENV === 'production';
  
  // Pick the right base URL depending on configuration
  let baseUrl;
  if (useProxy) {
    // Use proxy URL (this avoids CORS issues in browser)
    baseUrl = CERAMIC_CONFIG.proxyUrl;
  } else if (process.env.NODE_ENV === 'development' && environment === 'local') {
    // In development with 'local' flag, use local node
    baseUrl = CERAMIC_CONFIG.localUrl;
  } else {
    // Otherwise use mainnet directly (note: won't work in browser due to CORS)
    baseUrl = CERAMIC_CONFIG.mainnetUrl;
  }
  
  // For proxy mode with browser, ensure absolute URL
  if (useProxy && typeof window !== 'undefined' && window.location) {
    // URL is relative, make it absolute
    if (baseUrl.startsWith('/')) {
      baseUrl = `${window.location.origin}${baseUrl}`;
    }
  }
  
  // When using the proxy, we need to ensure the node URL doesn't have /api/v0
  // Because the ComposeDB client will append this, causing duplicated segments
  let nodeUrl = baseUrl;
  
  // Special handling for proxy URLs to prevent duplicate /api/ segments
  if (useProxy && baseUrl.includes('/api/')) {
    // We need a clean URL without /api/v0 or we'll get duplicate /api/api/v0/
    // The proxy will handle adding the proper segments
    if (nodeUrl.endsWith('/api/v0')) {
      nodeUrl = nodeUrl.substring(0, nodeUrl.length - 7); // Remove '/api/v0'
    }
    
    // If URL ends with /api/ceramic, make sure it doesn't have trailing slash
    if (nodeUrl.endsWith('/')) {
      nodeUrl = nodeUrl.substring(0, nodeUrl.length - 1);
    }
  }
  
  // Clean the URL one last time to avoid any issues
  const finalUrl = normalizeCeramicUrl(nodeUrl);
  
  return {
    // Return cleaned URL
    nodeUrl: finalUrl,
    // Network and other settings
    network: environment === 'local' ? 'local' : 'mainnet',
    seed: CERAMIC_CONFIG.seed,
    did: CERAMIC_CONFIG.did,
    // Include API paths and other useful info for clients
    apiPath: CERAMIC_CONFIG.apiPath,
    useProxy: useProxy
  };
};
