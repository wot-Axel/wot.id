import { NextRequest, NextResponse } from 'next/server';

// Helper to forward requests to the Ceramic network
async function forwardToCeramic(req: NextRequest, endpoint: string) {
  try {
    const url = process.env.CERAMIC_MAINNET_URL || 'https://gateway.ceramic.network';
    const targetUrl = `${url}/api/v0/${endpoint}`;
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: req.headers as any,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
    };
    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  } catch (error) {
    console.error('[CERAMIC STREAMS ERROR]', error, error instanceof Error ? error.stack : '');
    return NextResponse.json({
      error: 'Error forwarding request to Ceramic network',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return forwardToCeramic(req, 'streams');
}

export async function POST(req: NextRequest) {
  return forwardToCeramic(req, 'streams');
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
