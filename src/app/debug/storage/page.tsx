'use client';

import React, { useState, useEffect } from 'react';
import { useHelia } from '@/context/HeliaContext';

export default function StorageDebugPage() {
  const { isReady, addFile, getFile } = useHelia();
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [lastCid, setLastCid] = useState<string | null>(null);
  const [retrievedContent, setRetrievedContent] = useState<string>('');
  const [testValue, setTestValue] = useState('');

  // Track online status
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleAddFile = async () => {
    if (!isReady || !testValue) return;
    const cid = await addFile(testValue);
    setLastCid(cid || null);
  };

  const handleGetFile = async () => {
    if (!isReady || !lastCid) return;
    const bytes = await getFile(lastCid);
    if (bytes) {
      setRetrievedContent(new TextDecoder().decode(bytes));
    } else {
      setRetrievedContent('');
    }
  };

      console.error('Error storing test item:', error);
      alert(`Error storing item: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Handle refresh of data
  const handleManualRefresh = () => {
    handleRefresh();
    alert('Storage data refreshed');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Helia/IPFS Debug Tools</h1>
      <div className="mb-6 bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-bold mb-2">Helia Status</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="font-semibold">Helia Provider:</div>
          <div>{isReady ? 'Ready' : 'Initializing...'}</div>
          <div className="font-semibold">Network Status:</div>
          <div className={networkStatus ? 'text-green-600' : 'text-red-600'}>
            {networkStatus ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-bold mb-2">Add & Retrieve String from IPFS</h2>
        <div className="flex flex-wrap gap-2 items-end mb-3">
          <input
            type="text"
            value={testValue}
            onChange={(e) => setTestValue(e.target.value)}
            className="p-2 border rounded flex-1"
            placeholder="Enter some text to store on IPFS"
            disabled={!isReady}
          />
          <button
            onClick={handleAddFile}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={!isReady || !testValue}
          >
            Add to IPFS
          </button>
        </div>
        {lastCid && (
          <div className="mb-3">
            <span className="font-mono text-sm">CID: {lastCid}</span>
            <button
              onClick={handleGetFile}
              className="ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={!isReady}
            >
              Retrieve from IPFS
            </button>
          </div>
        )}
        {retrievedContent && (
          <div className="mt-2 p-2 bg-gray-50 border rounded">
            <span className="font-semibold">Retrieved Content:</span>
            <div className="mt-1 font-mono text-sm break-words whitespace-pre-wrap">{retrievedContent}</div>
          </div>
        )}
      </div>
    </div>
  );
}

