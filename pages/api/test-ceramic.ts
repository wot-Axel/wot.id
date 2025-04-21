import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Test endpoint to check if the Vercel backend can reach the Ceramic gateway.
 * Returns the status and body of the healthcheck endpoint.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const ceramicUrl = 'https://gateway.ceramic.network/api/v0/node/healthcheck';
    const ceramicRes = await fetch(ceramicUrl);
    const body = await ceramicRes.text();
    res.status(200).json({
      ok: true,
      status: ceramicRes.status,
      body,
    });
  } catch (error: any) {
    res.status(502).json({
      ok: false,
      error: error.message,
      stack: error.stack,
      name: error.name,
      toString: error.toString(),
    });
  }
}
