import { NextRequest, NextResponse } from 'next/server';
import { CERAMIC_CONFIG, getCeramicConfig } from '@/ceramic/ceramicConfig';

// For URL parsing and joining
import { URL } from 'url';

// Get the Ceramic node URL from configuration
const { nodeUrl } = getCeramicConfig();

// Helper function to forward the request to Ceramic network
async function forwardToCeramic(req: NextRequest, path: string) {
  // Properly join nodeUrl with path to avoid duplicate path segments
  let targetUrl;
  try {
    // Use URL constructor for proper path joining
    const baseUrl = new URL(nodeUrl);
    // Remove any potential duplicate 'api' segments
    const apiPath = path.startsWith('/') ? path : `/${path}`;
    targetUrl = new URL(apiPath, baseUrl).toString();
  } catch (e) {
    // Fallback to simple string concatenation if URL parsing fails
    targetUrl = `${nodeUrl}${path.startsWith('/') ? path : `/${path}`}`;
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

// Generic handler function for all HTTP methods
async function handler(req: NextRequest) {
  // Get the part of the URL after /api/ceramic
  const pathname = req.nextUrl.pathname;
  // Ensure path starts with a slash but doesn't create duplicate 'api' segments
  const path = pathname.replace(/^\/api\/ceramic/, '');
  
  // For debugging purposes
  console.log(`Original URL: ${pathname}, Path for Ceramic: ${path}, Target URL: ${nodeUrl}${path}`);
  
  return forwardToCeramic(req, path);
}

// Export handlers for different HTTP methods
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
