import { NextRequest, NextResponse } from 'next/server';
import { CERAMIC_CONFIG } from '@/ceramic/ceramicConfig';

// Get the Ceramic mainnet URL for direct forwarding
const mainnetUrl = CERAMIC_CONFIG.mainnetUrl;

/**
 * Forward requests to the Ceramic network
 * This route handles /ceramic/* paths and ensures proper API path construction
 */
async function forwardToCeramic(req: NextRequest, path: string = '') {
  // Special handling for collection endpoint which is critical for ComposeDB
  let targetUrl: URL;
  let url: string;
  
  // Check if this is a collection query (ComposeDB specific)
  const isCollectionQuery = path.includes('collection') || req.nextUrl.searchParams.has('query');
  
  if (isCollectionQuery) {
    // ComposeDB collection queries need special handling
    // They always need to go to /api/v0/collection endpoint
    targetUrl = new URL('/api/v0/collection', mainnetUrl);
    url = targetUrl.toString();
    console.log(`[CERAMIC PROXY] ComposeDB collection query → ${url}`);
  } else {
    // For standard Ceramic API requests
    const apiPath = '/api/v0';
    const endpointPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Ensure we don't have double slashes
    const cleanEndpointPath = endpointPath.replace(/\/+/g, '/');
    
    // Build the final URL
    targetUrl = new URL(`${apiPath}/${cleanEndpointPath}`.replace(/\/+/g, '/'), mainnetUrl);
    url = targetUrl.toString();
    console.log(`[CERAMIC PROXY] ${req.method} request → ${url}`);
  }

  // Set up headers
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
      headers.append(key, value);
    }
  });
  
  // Add the Ceramic DID for authentication
  headers.append('x-ceramic-did', CERAMIC_CONFIG.did);
  
  // For ComposeDB queries, ensure content-type is set correctly
  if (isCollectionQuery) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Get request body if it's a write operation or GraphQL query
  let body;
  
  if (isCollectionQuery) {
    // For collection queries, always try to get the request body or query params
    try {
      // First try to get the body directly
      body = await req.json().catch(() => null);
      
      // If no body but we have query params, create a body from them
      if (!body && req.nextUrl.searchParams.has('query')) {
        body = {
          query: req.nextUrl.searchParams.get('query'),
          variables: req.nextUrl.searchParams.get('variables') 
            ? JSON.parse(req.nextUrl.searchParams.get('variables') || '{}') 
            : {}
        };
      }
      
      console.log('[CERAMIC PROXY] Collection query body:', body ? 'Present' : 'Missing');
    } catch (e) {
      console.error('[CERAMIC PROXY] Error processing collection query:', e);
    }
  } else if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    // Standard body handling for other requests
    try {
      body = await req.json();
    } catch (e) {
      // Request might not have a body
    }
  }
  
  try {
    console.log(`[CERAMIC PROXY] Sending ${req.method} to ${url}`, isCollectionQuery ? 'Collection Query' : '');

    // Make the request to Ceramic mainnet
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    console.log(`[CERAMIC PROXY] Response status: ${response.status} for ${url}`);
    
    // Add debug output for collection queries
    if (isCollectionQuery) {
      console.log(`[CERAMIC PROXY] Collection query response status: ${response.status}`);
    }
    
    // Handle different response types
    const contentType = response.headers.get('content-type') || '';
    let responseData;
    
    if (contentType.includes('application/json')) {
      // For JSON responses
      responseData = await response.json().catch((e) => {
        console.error('[CERAMIC PROXY] Error parsing JSON response:', e);
        return { error: 'Invalid JSON response from Ceramic network' };
      });
      
      // Debug logging for collection queries
      if (isCollectionQuery) {
        console.log('[CERAMIC PROXY] Collection response data:', 
          responseData.data ? 'Has data' : 'No data', 
          responseData.errors ? 'Has errors' : 'No errors');
      }
    } else {
      // For non-JSON responses (unlikely but possible)
      const text = await response.text();
      responseData = { data: text };
      
      if (isCollectionQuery) {
        console.log('[CERAMIC PROXY] Collection response is not JSON:', text.substring(0, 100) + '...');
      }
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
    
    // Add CORS headers to ensure browser can access the response
    ceramicResponse.headers.set('Access-Control-Allow-Origin', '*');
    ceramicResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    ceramicResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Ceramic-DID');
    
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

// Handle route segments after /ceramic/*
async function handler(req: NextRequest) {
  // Get the path after /ceramic
  const pathname = req.nextUrl.pathname;
  const ceramicPrefix = '/ceramic';
  
  // Extract the part after /ceramic
  let path = '';
  if (pathname.startsWith(ceramicPrefix)) {
    path = pathname.substring(ceramicPrefix.length);
  }
  
  // Forward the request to Ceramic
  return forwardToCeramic(req, path);
}

// Export handlers for different HTTP methods
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;

// Handle preflight OPTIONS requests for CORS
export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}
