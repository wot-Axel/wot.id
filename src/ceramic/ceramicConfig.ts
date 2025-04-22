/**
 * Ceramic Network Configuration
 * This file contains the configuration for connecting to the Ceramic network
 */

export const CERAMIC_CONFIG = {
  // Local API proxy URL that avoids CORS issues
  proxyUrl: '/api/ceramic',
  // Mainnet gateway URL (used for direct connections when possible)
  mainnetUrl: 'https://gateway.ceramic.network',
  // Local rust-ceramic node API (for local development)
  localUrl: 'http://127.0.0.1:5101',
  // Default network to use
  network: 'mainnet',
  // Seed for deterministic DID generation
  seed: '34d1f4b5d09fdde93d3a858b7423c42de8105113dcc1300771310a853857d26a',
  // DID registered with Ceramic
  did: 'did:key:z6MkmzcN2bjLjGu8tP99N31XkvDgFskrwUfeVbewtJBNmqBo',
  // API path that Ceramic adds to URLs (important for path normalization)
  apiPath: '/api/v0',
  // Always use the proxy for local development and production
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
  
  // Get a simplified URL structure that works reliably with Ceramic client
  let nodeUrl = '';
  
  if (useProxy) {
    // For in-browser requests, use a simple origin-based URL
    if (typeof window !== 'undefined') {
      // In browser environments, use our proxy route
      const origin = window.location.origin;
      nodeUrl = `${origin}/api/ceramic/`; // Must end with / for Ceramic client
    } else {
      // In server-side context, use mainnet directly
      nodeUrl = 'https://gateway.ceramic.network/';
    }
  } else if (environment === 'local') {
    // For local development without proxy
    nodeUrl = 'http://localhost:7007/';
  } else {
    // Fallback to mainnet
    nodeUrl = 'https://gateway.ceramic.network/';
  }
  
  // Clean the URL one last time to avoid any issues
  const finalUrl = normalizeCeramicUrl(nodeUrl);
  
  // Log the configuration for debugging
  console.log('[CERAMIC CONFIG] Using URL:', {
    nodeUrl: finalUrl,
    network: environment === 'local' ? 'local' : 'mainnet',
    useProxy,
    inBrowser: typeof window !== 'undefined'
  });
  
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
