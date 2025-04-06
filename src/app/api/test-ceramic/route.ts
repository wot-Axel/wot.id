import { NextResponse } from 'next/server';
import { initCeramic } from '@/composedb/ceramic';
import { DataType } from '@/composedb/ceramic';

export async function GET() {
  try {
    // Initialize the Ceramic client
    const client = await initCeramic();
    
    if (!client) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to initialize Ceramic client' 
      }, { status: 500 });
    }

    // Return basic connection info
    return NextResponse.json({
      success: true,
      status: {
        connected: !!client,
        did: client.did?.id || 'No DID available',
        isOffline: client.isOffline || false
      }
    });
  } catch (error) {
    console.error('Ceramic test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
