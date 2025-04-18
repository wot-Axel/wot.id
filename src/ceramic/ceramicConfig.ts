/**
 * Ceramic Network Configuration
 * This file contains the configuration for connecting to the Ceramic mainnet
 */

export const CERAMIC_CONFIG = {
  // Mainnet gateway URL
  mainnetUrl: 'https://gateway.ceramic.network',
  // Fallback to local node if needed
  localUrl: 'http://localhost:7007',
  // Default network to use
  network: 'mainnet',
  // Seed for deterministic DID generation
  seed: '34d1f4b5d09fdde93d3a858b7423c42de8105113dcc1300771310a853857d26a',
  // DID registered with Ceramic
  did: 'did:key:z6MkmzcN2bjLjGu8tP99N31XkvDgFskrwUfeVbewtJBNmqBo'
};

// Export singleton instance that can be imported elsewhere
export const getCeramicConfig = () => {
  // Use env var if available, otherwise use mainnet
  const environment = process.env.NEXT_PUBLIC_CERAMIC_ENV || 'mainnet';
  
  // Select appropriate URL based on environment
  const nodeUrl = environment === 'local' 
    ? CERAMIC_CONFIG.localUrl 
    : CERAMIC_CONFIG.mainnetUrl;
  
  return {
    nodeUrl,
    network: environment === 'local' ? 'local' : 'mainnet',
    seed: CERAMIC_CONFIG.seed,
    did: CERAMIC_CONFIG.did,
  };
};
