'use client';

import React, { useState, useEffect } from 'react';
import { useTableland } from '@/context/TablelandContext';
import { getTablelandDebugLogs, exportTablelandLogs } from '@/utils/tablelandUtils';
import { TableType } from '@/utils/tablelandUtils';

const DebugPage = () => {
  const [logs, setLogs] = useState<any>({ utils: [], context: [] });
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [tableNames, setTableNames] = useState<Record<string, string | null>>({});
  const tableland = useTableland();

  useEffect(() => {
    // Get logs from localStorage
    const storedLogs = getTablelandDebugLogs();
    setLogs(storedLogs);

    // Get connection status
    if (typeof window !== 'undefined' && (window as any).checkTablelandState) {
      setConnectionStatus((window as any).checkTablelandState());
    }
  }, []);

  const refreshLogs = () => {
    const storedLogs = getTablelandDebugLogs();
    setLogs(storedLogs);
    
    // Update connection status
    if (typeof window !== 'undefined' && (window as any).checkTablelandState) {
      setConnectionStatus((window as any).checkTablelandState());
    }
  };

  const exportLogs = () => {
    if (typeof window !== 'undefined') {
      const logsJson = JSON.stringify(logs, null, 2);
      const blob = new Blob([logsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tableland-debug-logs.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const checkTableNames = async () => {
    const tableTypes = Object.values(TableType);
    const names: Record<string, string | null> = {};
    
    for (const type of tableTypes) {
      try {
        const name = await tableland.getTableName(type as TableType);
        names[type] = name;
      } catch (error) {
        console.error(`Error getting table name for ${type}:`, error);
        names[type] = null;
      }
    }
    
    setTableNames(names);
  };

  const connectTableland = async () => {
    try {
      await tableland.connect();
      refreshLogs();
    } catch (error) {
      console.error('Error connecting to Tableland:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Tableland Debug</h1>
      
      <div className="mb-6 flex gap-4">
        <button 
          onClick={refreshLogs}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Refresh Logs
        </button>
        <button 
          onClick={exportLogs}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Export Logs
        </button>
        <button 
          onClick={checkTableNames}
          className="px-4 py-2 bg-purple-500 text-white rounded"
        >
          Check Table Names
        </button>
        <button 
          onClick={connectTableland}
          className="px-4 py-2 bg-orange-500 text-white rounded"
        >
          Connect Tableland
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Status */}
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
          {connectionStatus ? (
            <div>
              <p><strong>Initialized:</strong> {connectionStatus.isInitialized ? 'Yes' : 'No'}</p>
              <p><strong>Loading:</strong> {connectionStatus.isLoading ? 'Yes' : 'No'}</p>
              <p><strong>Error:</strong> {connectionStatus.error || 'None'}</p>
              <p><strong>Client Exists:</strong> {connectionStatus.clientExists ? 'Yes' : 'No'}</p>
              <p><strong>Address:</strong> {connectionStatus.address || 'Not connected'}</p>
            </div>
          ) : (
            <p>No connection status available</p>
          )}
        </div>

        {/* Table Names */}
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Table Names</h2>
          {Object.keys(tableNames).length > 0 ? (
            <ul>
              {Object.entries(tableNames).map(([type, name]) => (
                <li key={type} className="mb-1">
                  <strong>{type}:</strong> {name || 'Not created'}
                </li>
              ))}
            </ul>
          ) : (
            <p>Click "Check Table Names" to view table names</p>
          )}
        </div>

        {/* Context Logs */}
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Context Logs ({logs.context.length})</h2>
          <div className="max-h-96 overflow-y-auto">
            {logs.context.length > 0 ? (
              logs.context.map((log: any, index: number) => (
                <div key={index} className="mb-2 p-2 bg-gray-100 rounded text-sm">
                  <div><strong>{log.timestamp}</strong></div>
                  <div>{log.message}</div>
                  {log.data && <pre className="mt-1 text-xs overflow-x-auto">{log.data}</pre>}
                </div>
              ))
            ) : (
              <p>No context logs available</p>
            )}
          </div>
        </div>

        {/* Utils Logs */}
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Utils Logs ({logs.utils.length})</h2>
          <div className="max-h-96 overflow-y-auto">
            {logs.utils.length > 0 ? (
              logs.utils.map((log: any, index: number) => (
                <div key={index} className="mb-2 p-2 bg-gray-100 rounded text-sm">
                  <div><strong>{log.timestamp}</strong></div>
                  <div>{log.message}</div>
                  {log.data && <pre className="mt-1 text-xs overflow-x-auto">{log.data}</pre>}
                </div>
              ))
            ) : (
              <p>No utils logs available</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Debug Console Commands</h2>
        <div className="bg-gray-100 p-4 rounded">
          <pre className="text-sm">
{`// Get all Tableland logs
window.getTablelandLogs()

// Check Tableland database state
window.checkTablelandState()

// Check Tableland database details
window.checkTablelandDb()

// Access the Tableland database instance directly
window.tablelandDb`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
