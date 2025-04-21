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
    // First normalize the path by removing any duplicate /api segments
    // This is a common issue with various clients
    let normalizedPath = path;
    
    // Fix duplicate /api/api/ pattern
    if (normalizedPath.includes('/api/api/')) {
      console.log('[CERAMIC PROXY] Detected and fixing duplicate API segments in:', normalizedPath);
      normalizedPath = normalizedPath.replace('/api/api/', '/api/');
    }
    
    // Catch any unexpected URL patterns and log them
    if (normalizedPath.includes('www.wot.id')) {
      console.error('[CERAMIC PROXY] ERROR: Detected website domain in Ceramic path:', normalizedPath);
      // Strip the domain and everything before it
      normalizedPath = '/' + normalizedPath.split('www.wot.id/')[1] || '';
      console.log('[CERAMIC PROXY] Corrected path:', normalizedPath);
    }
    
    // Extract the endpoint path after stripping any API prefixes
    let endpointPath = '';
    
    // Handle various path patterns to extract the actual endpoint
    if (normalizedPath.includes('/api/v0/')) {
      // Case: .../api/v0/something
      endpointPath = normalizedPath.split('/api/v0/').pop() || '';
    } else if (normalizedPath.startsWith('/api/v0')) {
      // Case: /api/v0/something
      endpointPath = normalizedPath.substring('/api/v0'.length);
    } else if (normalizedPath.includes('/api/')) {
      // Case: .../api/something (without v0)
      endpointPath = normalizedPath.split('/api/').pop() || '';
    } else {
      // Case: direct endpoint without /api prefix
      endpointPath = normalizedPath.startsWith('/') ? 
        normalizedPath.substring(1) : normalizedPath;
    }
    
    // Ensure we have a clean path with no leading slash
    if (endpointPath.startsWith('/')) {
      endpointPath = endpointPath.substring(1);
    }
    
    // Construct the final URL with the Ceramic mainnet and standard API path
    targetUrl = new URL(`/api/v0/${endpointPath}`, mainnetUrl).toString();
    
    // Ensure no duplicate slashes in the final URL (except after protocol)
    targetUrl = targetUrl.replace(/([^:])\/+/g, '$1/');
    
    // Final normalization
    targetUrl = normalizeCeramicUrl(targetUrl);
  } catch (e) {
    console.error('[CERAMIC PROXY] Error constructing URL:', e);
    // Simple and reliable fallback for error cases
    targetUrl = `${mainnetUrl}/api/v0/${path.replace(/^\/+/, '')}`;
  }
  
  // Log the request for monitoring and debugging
  // Enhanced logging for all requests
  console.log(`[CERAMIC PROXY] ${req.method} ${path} → ${targetUrl}`);
  
  // For collection-related requests, add additional debugging
  if (path.includes('collection')) {
    console.log('[CERAMIC PROXY] Collection request details:', {
      originalPath: path,
      targetUrl,
      headers: Object.fromEntries(req.headers.entries()),
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
    console.log(`[CERAMIC PROXY] Sending ${req.method} request to: ${url}`);
    
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    // Log response information
    console.log(`[CERAMIC PROXY] Response status: ${response.status} for ${url}`);
    
    // Handle different response types
    const contentType = response.headers.get('content-type') || '';
    let responseData;
    
    if (contentType.includes('application/json')) {
      // For JSON responses
      responseData = await response.json().catch((e) => {
        console.error('[CERAMIC PROXY] Error parsing JSON response:', e);
        return { error: 'Invalid JSON response from Ceramic network' };
      });
    } else {
      // For non-JSON responses (unlikely but possible)
      const text = await response.text();
      responseData = { data: text };
    }
    
    // Create response with appropriate headers
    const ceramicResponse = NextResponse.json(
      responseData,
      { status: response.status }
    );
    
    // Copy important headers from the Ceramic response
    response.headers.forEach((value, key) => {
      if (['content-type', 'cache-control', 'etag'].includes(key.toLowerCase())) {
        ceramicResponse.headers.set(key, value);
      }
    });
    
    return ceramicResponse;
  } catch (error) {
    console.error('[CERAMIC PROXY] Network or server error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to proxy request to Ceramic network', 
        details: error instanceof Error ? error.message : String(error) 
      },
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
