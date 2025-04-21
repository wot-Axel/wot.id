import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = process.env.CERAMIC_MAINNET_URL || 'https://gateway.ceramic.network/healthcheck';
  try {
    const response = await fetch(url, { method: 'GET' });
    const text = await response.text();
    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      body: text,
    });
  } catch (error) {
    console.error('[CERAMIC HEALTHCHECK ERROR]', error, error instanceof Error ? error.stack : '');
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
