import { NextRequest, NextResponse } from 'next/server';
import { CERAMIC_CONFIG, getCeramicConfig } from '@/ceramic/ceramicConfig';

// Get the Ceramic node URL from configuration
const { nodeUrl } = getCeramicConfig();

// Helper function to forward the request to Ceramic network
async function forwardToCeramic(req: NextRequest, path: string) {
  const url = `${nodeUrl}${path}`;
  
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
  const path = pathname.replace(/^\/api\/ceramic/, '');
  
  return forwardToCeramic(req, path);
}

// Export handlers for different HTTP methods
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
