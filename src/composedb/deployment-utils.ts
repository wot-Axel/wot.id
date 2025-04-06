/**
 * ComposeDB Deployment Utilities
 * 
 * This file provides utilities for preparing and verifying deployment readiness
 * for the ComposeDB integration.
 */

import { getProductionConfig, applyProductionConfig } from './production-config';
import { getCeramicNodeUrl, resetFailedNodes, CERAMIC_NODES } from './config';
import { initComposeDB } from './client';
import { DataType } from '@/utils/ceramicUtils';

/**
 * Check if the environment is production
 * @returns Boolean indicating if in production environment
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Verify that the DID persistence is working correctly
 * @returns Promise resolving to verification result
 */
export const verifyDIDPersistence = async (): Promise<{
  success: boolean;
  message: string;
  did?: string;
}> => {
  try {
    // Initialize ComposeDB client
    const client = await initComposeDB();
    
    if (!client || !client.did) {
      return {
        success: false,
        message: 'Failed to initialize ComposeDB client with DID'
      };
    }
    
    // Get the DID
    const did = client.did.id;
    
    // Verify DID format
    if (!did || !did.startsWith('did:')) {
      return {
        success: false,
        message: 'Invalid DID format',
        did
      };
    }
    
    return {
      success: true,
      message: 'DID persistence verified successfully',
      did
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `DID persistence verification failed: ${errorMessage}`
    };
  }
};

/**
 * Verify that the Ceramic node connection is working
 * @returns Promise resolving to verification result
 */
export const verifyCeramicConnection = async (): Promise<{
  success: boolean;
  message: string;
  node?: string;
}> => {
  try {
    // Reset failed nodes to ensure a fresh connection attempt
    resetFailedNodes();
    
    // Get the Ceramic node URL
    const nodeUrl = await getCeramicNodeUrl();
    
    if (!nodeUrl) {
      return {
        success: false,
        message: 'Failed to get Ceramic node URL'
      };
    }
    
    // Check if the node is accessible
    const response = await fetch(`${nodeUrl}/api/v0/node/healthcheck`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      return {
        success: false,
        message: `Node health check failed with status ${response.status}`,
        node: nodeUrl
      };
    }
    
    return {
      success: true,
      message: 'Ceramic node connection verified successfully',
      node: nodeUrl
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Ceramic connection verification failed: ${errorMessage}`
    };
  }
};

/**
 * Verify that CORS is properly configured for the Ceramic node
 * @returns Promise resolving to verification result
 */
export const verifyCORSConfiguration = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    // Get the Ceramic node URL
    const nodeUrl = await getCeramicNodeUrl();
    
    if (!nodeUrl) {
      return {
        success: false,
        message: 'Failed to get Ceramic node URL'
      };
    }
    
    // Make a preflight OPTIONS request to check CORS
    const response = await fetch(`${nodeUrl}/api/v0/node/healthcheck`, {
      method: 'OPTIONS',
      headers: {
        'Origin': typeof window !== 'undefined' ? window.location.origin : 'https://wot.id',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    // Check CORS headers
    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
      'access-control-allow-credentials': response.headers.get('access-control-allow-credentials')
    };
    
    const corsConfigured = corsHeaders['access-control-allow-origin'] !== null;
    
    return {
      success: corsConfigured,
      message: corsConfigured 
        ? 'CORS is properly configured' 
        : 'CORS may not be properly configured for the Ceramic node',
      details: corsHeaders
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `CORS verification failed: ${errorMessage}`
    };
  }
};

/**
 * Prepare the application for production deployment
 * @returns Promise resolving to preparation result
 */
export const prepareForProduction = async (): Promise<{
  success: boolean;
  message: string;
  checks: Record<string, any>;
}> => {
  // Apply production configuration
  const configResult = applyProductionConfig();
  
  // Run verification checks
  const didResult = await verifyDIDPersistence();
  const connectionResult = await verifyCeramicConnection();
  const corsResult = await verifyCORSConfiguration();
  
  // Determine overall success
  const success = didResult.success && connectionResult.success;
  
  return {
    success,
    message: success 
      ? 'Application is ready for production deployment' 
      : 'Some checks failed, review the results before deploying',
    checks: {
      config: configResult,
      did: didResult,
      connection: connectionResult,
      cors: corsResult
    }
  };
};

/**
 * Run a comprehensive deployment readiness check
 * This function should be called before deploying to production
 */
export const checkDeploymentReadiness = async (): Promise<void> => {
  console.log('=== ComposeDB Deployment Readiness Check ===');
  console.log('Date:', new Date().toISOString());
  
  try {
    // Apply production configuration
    console.log('\n--- Applying Production Configuration ---');
    const configResult = applyProductionConfig();
    console.log('Configuration result:', configResult);
    
    // Verify DID persistence
    console.log('\n--- Verifying DID Persistence ---');
    const didResult = await verifyDIDPersistence();
    console.log('DID verification result:', didResult);
    
    // Verify Ceramic connection
    console.log('\n--- Verifying Ceramic Connection ---');
    const connectionResult = await verifyCeramicConnection();
    console.log('Connection verification result:', connectionResult);
    
    // Verify CORS configuration
    console.log('\n--- Verifying CORS Configuration ---');
    const corsResult = await verifyCORSConfiguration();
    console.log('CORS verification result:', corsResult);
    
    // Overall result
    const success = didResult.success && connectionResult.success;
    console.log('\n=== Deployment Readiness Summary ===');
    console.log(`Overall status: ${success ? '✅ READY' : '❌ NOT READY'}`);
    
    if (!success) {
      console.log('\nPlease address the following issues before deploying:');
      if (!didResult.success) {
        console.log(`- DID persistence: ${didResult.message}`);
      }
      if (!connectionResult.success) {
        console.log(`- Ceramic connection: ${connectionResult.message}`);
      }
      if (!corsResult.success) {
        console.log(`- CORS configuration: ${corsResult.message}`);
      }
    }
    
    console.log('\nDeployment readiness check completed at:', new Date().toISOString());
  } catch (error) {
    console.error('\n❌ Deployment readiness check failed:', error);
  }
};
