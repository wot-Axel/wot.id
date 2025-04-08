// API endpoint for retrieving logs
import { NextApiRequest, NextApiResponse } from 'next';
import { getLogs, getLogsByType, getLogsByContent, getTablelandLogs, clearLogs } from '../../utils/logCapture';

// Simple API key for basic protection
// In production, you should use a more secure authentication method
const API_KEY = 'wot-id-logs-access';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check for API key
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Handle different actions based on the query parameter
    const { action, type, search } = req.query;

    switch (action) {
      case 'clear':
        return res.status(200).json(clearLogs());
      
      case 'byType':
        if (typeof type !== 'string') {
          return res.status(400).json({ error: 'Type parameter must be a string' });
        }
        if (!['log', 'error', 'warn', 'info'].includes(type)) {
          return res.status(400).json({ error: 'Invalid log type' });
        }
        return res.status(200).json(getLogsByType(type as 'log' | 'error' | 'warn' | 'info'));
      
      case 'search':
        if (typeof search !== 'string') {
          return res.status(400).json({ error: 'Search parameter must be a string' });
        }
        return res.status(200).json(getLogsByContent(search));
      
      case 'tableland':
        return res.status(200).json(getTablelandLogs());
      
      default:
        // Default action is to get all logs
        return res.status(200).json(getLogs());
    }
  } catch (error) {
    console.error('Error in logs API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
