/**
 * Ceramic Status Panel Component
 * 
 * Displays the current status of the Ceramic connection and provides
 * controls for managing the connection.
 */

import React, { useState, useEffect } from 'react';
import { useCeramic } from '@/contexts/CeramicContext';
import { DataType } from '@/composedb/ceramic';

const CeramicStatusPanel: React.FC = () => {
  const { 
    client, 
    isConnected, 
    isConnecting, 
    error, 
    connect, 
    disconnect, 
    resetNodes, 
    getStatus,
    getRecords,
    ensureCollection,
    getRecordsByType
  } = useCeramic();
  
  const [status, setStatus] = useState<{ lastSuccessfulNode: string | null; failedNodes: string[] }>({ 
    lastSuccessfulNode: null, 
    failedNodes: [] 
  });
  const [identity, setIdentity] = useState<string>('');
  const [profileData, setProfileData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Update status when connection state changes
  useEffect(() => {
    if (isConnected) {
      setStatus(getStatus());
    }
  }, [isConnected, getStatus]);

  // Handle connect button click
  const handleConnect = async () => {
    await connect(identity || undefined);
    setStatus(getStatus());
  };

  // Handle disconnect button click
  const handleDisconnect = () => {
    disconnect();
    setStatus({ lastSuccessfulNode: null, failedNodes: [] });
    setProfileData([]);
  };

  // Handle reset nodes button click
  const handleResetNodes = () => {
    resetNodes();
    setStatus(getStatus());
  };

  // Load profile data
  const loadProfileData = async () => {
    if (!isConnected || !client) return;
    
    try {
      setIsLoading(true);
      const did = client.did ? client.did.id : 'unknown';
      // Get records by type (this handles collection creation internally)
      const records = await getRecordsByType(client, DataType.PROFILE, did);
      setProfileData(records);
    } catch (err) {
      console.error('Error loading profile data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Ceramic Network Status</h2>
      
      {/* Connection Status */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-medium">
            {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm mt-1">
            Error: {error.message}
          </div>
        )}
        
        {isConnected && client && (
          <div className="text-sm text-gray-600 mt-1">
            <div>DID: {client.did?.id || 'Unknown'}</div>
            <div>Connected to: {status.lastSuccessfulNode || 'Unknown'}</div>
            {client.isOffline && (
              <div className="text-amber-600 font-medium">
                Running in offline mode. Some features may be limited.
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Failed Nodes */}
      {status.failedNodes.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Failed Nodes:</h3>
          <ul className="text-xs text-gray-600 list-disc pl-5">
            {status.failedNodes.map((node, index) => (
              <li key={index}>{node}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Connection Controls */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <input
            type="text"
            placeholder="Optional identity (wallet address)"
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            disabled={isConnected}
          />
        </div>
        
        <div className="flex space-x-2">
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="px-3 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
            >
              Disconnect
            </button>
          )}
          
          <button
            onClick={handleResetNodes}
            className="px-3 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700"
          >
            Reset Failed Nodes
          </button>
        </div>
      </div>
      
      {/* Data Testing */}
      {isConnected && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Profile Data</h3>
          
          <button
            onClick={loadProfileData}
            disabled={isLoading}
            className="px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 mb-4"
          >
            {isLoading ? 'Loading...' : 'Load Profile Data'}
          </button>
          
          {profileData.length > 0 ? (
            <div className="border rounded-md p-3 bg-gray-50">
              <pre className="text-xs overflow-auto max-h-40">
                {JSON.stringify(profileData, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              No profile data available. Create a profile to see data here.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CeramicStatusPanel;
