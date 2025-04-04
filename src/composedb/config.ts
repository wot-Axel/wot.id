/**
 * ComposeDB Configuration
 * This file contains configuration for ComposeDB integration
 */

// Default Ceramic node URL - can be overridden with environment variables
export const DEFAULT_CERAMIC_NODE = 'https://ceramic-clay.3boxlabs.com';

// Environment-specific configuration
export const getCeramicNodeUrl = (): string => {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CERAMIC_NODE) {
    return process.env.NEXT_PUBLIC_CERAMIC_NODE;
  }
  return DEFAULT_CERAMIC_NODE;
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
