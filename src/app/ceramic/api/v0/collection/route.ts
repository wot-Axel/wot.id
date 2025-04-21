import { NextRequest, NextResponse } from 'next/server';
import { CERAMIC_CONFIG } from '@/ceramic/ceramicConfig';

// Get the Ceramic mainnet URL for direct forwarding
const mainnetUrl = CERAMIC_CONFIG.mainnetUrl;

/**
 * Route handler specifically for ComposeDB collection queries
 * These always need to be forwarded to the /api/v0/collection endpoint
 */
export async function POST(req: NextRequest) {
  return handleCollectionQuery(req);
}

// For query parameter based requests that might come as GET
export async function GET(req: NextRequest) {
  return handleCollectionQuery(req);
}

// Handler for other HTTP methods
export async function OPTIONS(req: NextRequest) {
  const response = NextResponse.json({}, { status: 200 });
  // Add CORS headers to ensure browser can access the response
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Ceramic-DID');
  
  return response;
}

/**
 * Dedicated handler for collection queries which are critical for ComposeDB
 */
async function handleCollectionQuery(req: NextRequest) {
  console.log('[CERAMIC COLLECTION] Handling collection query');
  
  // Ensure we're targeting the correct Ceramic endpoint
  const targetUrl = new URL('/api/v0/collection', mainnetUrl);
  const url = targetUrl.toString();
  
  console.log(`[CERAMIC COLLECTION] Forwarding to ${url}`);

  // Set up headers
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
      headers.append(key, value);
    }
  });
  
  // Add the Ceramic DID for authentication
  headers.append('x-ceramic-did', CERAMIC_CONFIG.did);
  headers.set('Content-Type', 'application/json');
  
  // Get the body or build from query params
  let body;
  
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
    
    console.log('[CERAMIC COLLECTION] Request body:', body ? 'Present' : 'Missing');
  } catch (e) {
    console.error('[CERAMIC COLLECTION] Error processing request:', e);
  }

  try {
    // Make the request to Ceramic mainnet
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    console.log(`[CERAMIC COLLECTION] Response status: ${response.status}`);
    
    // Handle different response types
    const contentType = response.headers.get('content-type') || '';
    let responseData;
    
    if (contentType.includes('application/json')) {
      // For JSON responses
      responseData = await response.json().catch((e) => {
        console.error('[CERAMIC COLLECTION] Error parsing JSON response:', e);
        return { error: 'Invalid JSON response from Ceramic network' };
      });
      
      // Log response data info for debugging
      console.log('[CERAMIC COLLECTION] Response data:', 
        responseData.data ? 'Has data' : 'No data', 
        responseData.errors ? 'Has errors' : 'No errors');
    } else {
      // For non-JSON responses
      const text = await response.text();
      responseData = { data: text };
      
      console.log('[CERAMIC COLLECTION] Non-JSON response:', text.substring(0, 100) + '...');
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
    console.error('[CERAMIC COLLECTION] Error:', error);
    
    // Create error response
    const errorResponse = NextResponse.json(
      { error: 'Error forwarding request to Ceramic network', details: error.message },
      { status: 500 }
    );
    
    // Add CORS headers even for error responses
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Ceramic-DID');
    
    return errorResponse;
  }
}
