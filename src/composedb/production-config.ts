/**
 * Production-specific ComposeDB Configuration
 * 
 * This file contains optimized settings for production deployment
 * with a focus on reliability, performance, and error handling.
 */

// Production-optimized timeouts
export const PRODUCTION_TIMEOUTS = {
  // Increased connection timeout for more reliable connections
  CONNECTION_TIMEOUT: 15000, // 15 seconds
  
  // Shorter health check timeout to avoid hanging on unresponsive nodes
  HEALTH_CHECK_TIMEOUT: 7500, // 7.5 seconds
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 seconds
  
  // Cache duration for node health status
  HEALTH_CHECK_CACHE_DURATION: 300000, // 5 minutes
};

// Production-optimized Ceramic nodes
// Prioritizes reliable public nodes and includes multiple fallbacks
export const PRODUCTION_CERAMIC_NODES = [
  // Primary nodes (most reliable)
  'https://ceramic-clay.3boxlabs.com',
  'https://ceramic.composedb.com',
  
  // Secondary nodes (fallbacks)
  'https://gateway.ceramic.network',
  'https://ceramic-private.3boxlabs.com',
  
  // IP-based fallbacks (more reliable than DNS in some environments)
  'http://143.198.139.3:7007',
  
  // Testnet nodes (last resort)
  'https://testnet-clay-1.ceramic.network',
  'https://testnet-clay-2.ceramic.network'
];

// Error messages for better debugging in production
export const ERROR_MESSAGES = {
  CONNECTION_FAILED: 'Failed to connect to any Ceramic node. Please check your internet connection and try again.',
  DID_CREATION_FAILED: 'Failed to create or authenticate DID. Please try refreshing the page.',
  RECORD_CREATION_FAILED: 'Failed to create record. Your data has been saved locally and will sync when connectivity is restored.',
  RECORD_UPDATE_FAILED: 'Failed to update record. Changes have been saved locally and will sync when connectivity is restored.',
  RECORD_DELETION_FAILED: 'Failed to delete record. Please try again later.',
  COLLECTION_CREATION_FAILED: 'Failed to create collection. Please try again later.',
};

// CORS settings for production
export const CORS_SETTINGS = {
  // Allow requests from the production domain
  allowedOrigins: [
    'https://wot.id', 
    'https://*.wot.id', 
    'https://*.vercel.app'
  ],
  
  // Allow all necessary methods
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  // Allow necessary headers
  allowedHeaders: ['Content-Type', 'Authorization'],
  
  // Allow credentials
  allowCredentials: true,
  
  // Max age for preflight requests
  maxAge: 86400 // 24 hours
};

/**
 * Get production-optimized configuration
 * @returns Production configuration
 */
export function getProductionConfig() {
  return {
    timeouts: PRODUCTION_TIMEOUTS,
    nodes: PRODUCTION_CERAMIC_NODES,
    errors: ERROR_MESSAGES,
    cors: CORS_SETTINGS
  };
}

/**
 * Apply production configuration to the current environment
 * This should be called during application initialization in production
 */
export function applyProductionConfig() {
  // Only apply in production environment
  if (process.env.NODE_ENV !== 'production') {
    console.log('Not in production environment, skipping production configuration');
    return;
  }
  
  console.log('Applying production-optimized ComposeDB configuration');
  
  // Apply production timeouts
  if (typeof window !== 'undefined') {
    // Store in localStorage for persistence
    localStorage.setItem('wot_ceramic_connection_timeout', PRODUCTION_TIMEOUTS.CONNECTION_TIMEOUT.toString());
    localStorage.setItem('wot_ceramic_health_check_timeout', PRODUCTION_TIMEOUTS.HEALTH_CHECK_TIMEOUT.toString());
  }
  
  // Override environment variables if they exist
  if (typeof process !== 'undefined') {
    if (!process.env.NEXT_PUBLIC_CERAMIC_TIMEOUT) {
      process.env.NEXT_PUBLIC_CERAMIC_TIMEOUT = PRODUCTION_TIMEOUTS.CONNECTION_TIMEOUT.toString();
    }
    
    if (!process.env.NEXT_PUBLIC_CERAMIC_HEALTH_CHECK_TIMEOUT) {
      process.env.NEXT_PUBLIC_CERAMIC_HEALTH_CHECK_TIMEOUT = PRODUCTION_TIMEOUTS.HEALTH_CHECK_TIMEOUT.toString();
    }
  }
  
  // Return success status
  return {
    success: true,
    message: 'Production configuration applied successfully'
  };
}
