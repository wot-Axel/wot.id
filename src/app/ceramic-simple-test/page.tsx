'use client';

import { useState, useEffect } from 'react';
import { useCeramic } from '@/contexts/CeramicContext';
import { DataType } from '@/composedb/ceramic';

export default function CeramicSimpleTestPage() {
  const { 
    client, 
    isConnected, 
    isConnecting, 
    error, 
    connect, 
    disconnect,
    getStatus
  } = useCeramic();
  
  const [connectionStatus, setConnectionStatus] = useState<string>('Not connected');
  const [didId, setDidId] = useState<string>('No DID available');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Connect to Ceramic when the component mounts
  useEffect(() => {
    const connectToCeramic = async () => {
      try {
        await connect();
      } catch (err) {
        console.error('Failed to connect to Ceramic:', err);
        setErrorMessage(err instanceof Error ? err.message : String(err));
      }
    };
    
    connectToCeramic();
  }, [connect]);
  
  // Update status when connection state changes
  useEffect(() => {
    if (isConnected && client) {
      setConnectionStatus('Connected');
      setDidId(client.did?.id || 'No DID available');
      setErrorMessage(null);
    } else if (isConnecting) {
      setConnectionStatus('Connecting...');
    } else if (error) {
      setConnectionStatus('Connection failed');
      setErrorMessage(error.message);
    } else {
      setConnectionStatus('Not connected');
    }
  }, [isConnected, isConnecting, error, client]);
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Ceramic Simple Test</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
        
        <div className="space-y-4">
          <div>
            <p><strong>Status:</strong> {connectionStatus}</p>
            <p><strong>DID:</strong> {didId}</p>
            {isConnected && (
              <p><strong>Connected to:</strong> {getStatus().lastSuccessfulNode || 'Unknown'}</p>
            )}
          </div>
          
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 p-4 rounded">
              <h3 className="font-medium text-red-800">Error</h3>
              <p className="text-red-700">{errorMessage}</p>
            </div>
          )}
          
          <div className="flex space-x-4">
            <button 
              onClick={() => connect()} 
              disabled={isConnecting || isConnected}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
            
            <button 
              onClick={disconnect} 
              disabled={!isConnected}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
