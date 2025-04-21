import { NextRequest, NextResponse } from 'next/server';
import { CERAMIC_CONFIG, getCeramicConfig, joinPaths, normalizeCeramicUrl } from '@/ceramic/ceramicConfig';

// For URL parsing and joining
import { URL } from 'url';

// Get the Ceramic mainnet URL for direct forwarding (not the proxy URL)
// This is important to avoid circular references where the proxy calls itself
const mainnetUrl = CERAMIC_CONFIG.mainnetUrl;

// Helper function to forward the request to Ceramic network
async function forwardToCeramic(req: NextRequest, path: string) {
  // Construct target URL in a robust way that handles various input formats
  let targetUrl;
  try {
    // Special case handling for collection endpoints which are frequently problematic
    if (path.includes('/collection') || path.includes('/streams')) {
      // These endpoints need special handling
      // Extract the part after any API segments, preserving only the endpoint path
      let endpointPath = path;
      
      // Strip any /api/v0 prefix if present
      if (path.includes('/api/v0/')) {
        endpointPath = path.split('/api/v0/').pop() || '';
      } else if (path.startsWith('/api/v0')) {
        endpointPath = path.substring('/api/v0'.length);
      } else if (path.includes('/api/')) {
        // Handle case where there's just /api/ without v0
        endpointPath = path.split('/api/').pop() || '';
      }
      
      // Ensure we start with a clean slate and consistent format
      if (endpointPath.startsWith('/')) {
        endpointPath = endpointPath.substring(1);
      }
      
      // Construct a clean target URL
      targetUrl = new URL(`/api/v0/${endpointPath}`, mainnetUrl).toString();
    } else {
      // For all other paths, use more general handling
      if (path.startsWith('/api/')) {
        // Path already includes /api/, don't duplicate it
        targetUrl = new URL(path, mainnetUrl).toString();
      } else {
        // Add /api/v0 if needed
        const apiPath = path.startsWith('/') ? path : `/${path}`;
        targetUrl = new URL(`/api/v0${apiPath}`, mainnetUrl).toString();
      }
    }
    
    // Final normalization to catch any remaining issues
    targetUrl = normalizeCeramicUrl(targetUrl);
    
    // Ensure no duplicate slashes in the final URL (except after protocol)
    targetUrl = targetUrl.replace(/([^:])\/{2,}/g, '$1/');
  } catch (e) {
    console.error('[CERAMIC PROXY] Error constructing URL:', e);
    // Simple and reliable fallback for error cases
    targetUrl = `${mainnetUrl}/api/v0/${path.replace(/^\/+/, '')}`;
  }
  
  // Log the request for monitoring and debugging
  console.log(`[CERAMIC PROXY] ${req.method} ${path} → ${targetUrl}`);
  
  // For collection-related requests, add additional debugging
  if (path.includes('collection')) {
    console.log('[CERAMIC PROXY] Collection request details:', {
      originalPath: path,
      targetUrl,
      timestamp: new Date().toISOString()
    });
  }
  const url = targetUrl;
  
  const headers = new Headers();
  // Forward relevant headers
  req.headers.forEach((value, key) => {
    // Skip some headers that shouldn't be forwarded
    if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
      headers.append(key, value);
    }
  });
  
  // Add the Ceramic DID to authenticate as needed
  headers.append('x-ceramic-did', CERAMIC_CONFIG.did);
  
  // Get request body if it's a POST, PUT, or PATCH
  let body;
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try {
      body = await req.json();
    } catch (e) {
      // Request might not have a body
    }
  }
  
  try {
    console.log(`Proxying ${req.method} request to: ${url}`);
    
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const responseData = await response.json().catch(() => ({}));
    
    return NextResponse.json(
      responseData,
      { status: response.status }
    );
  } catch (error) {
    console.error('Ceramic proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request to Ceramic network' },
      { status: 502 }
    );
  }
}

// Simple generic handler function for all HTTP methods
async function handler(req: NextRequest) {
  // Extract the part after /api/ceramic from the URL
  const pathname = req.nextUrl.pathname;
  const ceramicPrefix = '/api/ceramic';
  
  // Determine the Ceramic path by removing the API prefix
  let path;
  if (pathname.startsWith(ceramicPrefix)) {
    path = pathname.substring(ceramicPrefix.length) || '/';
    // Ensure path has a leading slash
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
  } else {
    // Should rarely happen, but handle as gracefully as possible
    path = pathname;
    console.warn(`[CERAMIC PROXY] Unexpected URL format: ${pathname}`);
  }
  
  return forwardToCeramic(req, path);
}

// Export handlers for different HTTP methods
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
