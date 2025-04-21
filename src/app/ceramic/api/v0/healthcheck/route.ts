import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const ceramicUrl = process.env.CERAMIC_MAINNET_URL || 'https://gateway.ceramic.network/healthcheck';
  const publicTestUrl = 'https://jsonplaceholder.typicode.com/todos/1';
  const results: any = {};
  // Test Ceramic Gateway
  try {
    const response = await fetch(ceramicUrl, { method: 'GET' });
    const text = await response.text();
    results.ceramic = {
      ok: response.ok,
      status: response.status,
      body: text,
    };
  } catch (error) {
    results.ceramic = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
  }
  // Test a public endpoint
  try {
    const response = await fetch(publicTestUrl, { method: 'GET' });
    const text = await response.text();
    results.public = {
      ok: response.ok,
      status: response.status,
      body: text,
    };
  } catch (error) {
    results.public = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
  }
  return NextResponse.json(results);
}

