// pages/api/ceramic/[...path].ts
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Ceramic API Proxy Endpoint
 * This proxy forwards requests from the frontend to the Ceramic mainnet gateway,
 * avoiding CORS issues in production. It supports all HTTP methods and arbitrary paths.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Extract the dynamic path after /api/ceramic/
  const { path = [] } = req.query;
  // Build the target Ceramic URL
  const ceramicUrl = `https://gateway.ceramic.network/api/v0/${Array.isArray(path) ? path.join('/') : path}`;

  // Prepare fetch options, copying method, headers, and body
  const fetchOptions: RequestInit = {
    method: req.method,
    headers: { ...req.headers, host: undefined }, // Remove host header for cross-origin
    body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
  };

  // Forward the request to the Ceramic gateway
  try {
    const ceramicRes = await fetch(ceramicUrl, fetchOptions as any);
    // Copy status
    res.status(ceramicRes.status);
    // Copy headers (except some restricted ones)
    ceramicRes.headers.forEach((value, key) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(key)) {
        res.setHeader(key, value);
      }
    });
    // Pipe the response body
    const data = await ceramicRes.arrayBuffer();
    res.send(Buffer.from(data));
  } catch (error: any) {
    res.status(502).json({ error: 'Failed to proxy request to Ceramic gateway', detail: error.message });
  }
}
