import { NextRequest, NextResponse } from 'next/server';
import { CERAMIC_CONFIG, getCeramicConfig, joinPaths } from '@/ceramic/ceramicConfig';

// For URL parsing and joining
import { URL } from 'url';

// Get the Ceramic node URL from configuration
const { nodeUrl } = getCeramicConfig();

// Helper function to forward the request to Ceramic network
async function forwardToCeramic(req: NextRequest, path: string) {
    // Use the original nodeUrl from configuration for consistency
  const mainnetUrl = CERAMIC_CONFIG.mainnetUrl;
  
  // Normalize the path to avoid duplicate segments while maintaining compatibility
  let targetUrl;
  try {
    // Use a conservative approach to handle API path segments
    // Only fix the specific issue with duplicate /api/v0 segments
    if (path.includes('/api/v0/')) {
      // Path already has /api/v0/, extract the endpoint after it
      // This handles cases like /api/ceramic/api/v0/collection
      const [_, ...endpointParts] = path.split('/api/v0/');
      const endpointPath = endpointParts.join('/'); // In case there are multiple splits
      
      // Make sure we don't end up with // in the URL
      targetUrl = `${mainnetUrl}/api/v0/${endpointPath}`.replace(/([^:]\/)\/+/g, '$1');
    } else if (path.startsWith('/api/v0')) {
      // Handle paths that start with /api/v0 but don't have a trailing slash
      const endpointPath = path.substring('/api/v0'.length);
      targetUrl = `${mainnetUrl}/api/v0${endpointPath}`;
    } else {
      // For all other paths, just join them normally
      // This maintains backward compatibility with existing code
      const baseUrl = new URL(mainnetUrl);
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      targetUrl = new URL(normalizedPath, baseUrl).toString();
    }
  } catch (e) {
    console.error('[CERAMIC PROXY] Error constructing URL:', e);
    // Use a simpler, more reliable fallback for production stability
    targetUrl = path.includes('/api/v0') 
      ? `${mainnetUrl}${path.startsWith('/') ? path : `/${path}`}` 
      : `${mainnetUrl}/api/v0${path.startsWith('/') ? path : `/${path}`}`;
  }
  
  // Add detailed logging for debugging and monitoring
  console.log(`[CERAMIC PROXY] Forwarding to: ${targetUrl} (original path: ${path})`, {
    timestamp: new Date().toISOString(),
    originalPath: path,
    targetUrl
  });
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

// Generic handler function for all HTTP methods
async function handler(req: NextRequest) {
  // Get the part of the URL after /api/ceramic
  const pathname = req.nextUrl.pathname;
  
  // Preserve the simplest possible extraction logic for maximum stability
  // Just strip the /api/ceramic prefix from the pathname
  const ceramicPrefix = '/api/ceramic';
  let path = '';
  
  if (pathname.startsWith(ceramicPrefix)) {
    // Standard prefix removal, preserving original behavior where possible
    path = pathname.substring(ceramicPrefix.length) || '/';
    
    // Only add leading slash if missing
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
  } else {
    // Fallback, should rarely happen in production
    path = pathname;
    console.warn(`[CERAMIC PROXY] Unexpected path format: ${pathname}`);
  }
  
  // Structured logging for easier debugging in production
  console.log(`[CERAMIC PROXY] Request: ${pathname} → ${path}`, {
    originalUrl: pathname,
    extractedPath: path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  return forwardToCeramic(req, path);
}

// Export handlers for different HTTP methods
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
