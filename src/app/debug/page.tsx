'use client';

import React, { useState, useEffect } from 'react';
import { useStorage } from '@/context/StorageContext';
import { getTablelandDebugLogs, exportTablelandLogs } from '@/utils/storageUtils';
import { TableType } from '@/utils/storageUtils';

// Interface for parsed server logs
interface ServerLog {
  timeUTC: string;
  timestampInMs: string;
  requestPath: string;
  requestMethod: string;
  responseStatusCode: string;
  requestId: string;
  requestUserAgent: string;
  level: string;
  environment: string;
  host: string;
  deploymentDomain: string;
  message?: string;
}

const DebugPage = () => {
  const [logs, setLogs] = useState<any>({ utils: [], context: [] });
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [tableNames, setTableNames] = useState<Record<string, string | null>>({});
  const [serverLogs, setServerLogs] = useState<ServerLog[]>([]);
  const [serverLogsInput, setServerLogsInput] = useState('');
  const [filterPath, setFilterPath] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const storage = useStorage();

  useEffect(() => {
    // Get logs from localStorage
    const storedLogs = getTablelandDebugLogs();
    setLogs(storedLogs);

    // Set simple connection status
    setConnectionStatus({
      connected: storage.isReady,
      message: storage.isReady ? 'Storage is ready' : 'Storage not initialized'
    });
  }, [storage.isReady]);

  const refreshLogs = () => {
    const storedLogs = getTablelandDebugLogs();
    setLogs(storedLogs);
    
    // Update connection status
    setConnectionStatus({
      connected: storage.isReady,
      message: storage.isReady ? 'Storage is ready' : 'Storage not initialized'
    });
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
        // In our localStorage implementation, we don't have actual table names
        // Just use a placeholder value showing the storage type
        names[type] = `local_storage_${type}`;
      } catch (error) {
        console.error(`Error getting storage info for ${type}:`, error);
        names[type] = null;
      }
    }
    
    setTableNames(names);
  };

  const checkStorageStatus = () => {
    setConnectionStatus({
      connected: storage.isReady,
      message: storage.isReady ? 'Storage is ready' : 'Storage not initialized'
    });
    refreshLogs();
  };

  // Parse server logs from CSV format
  const parseServerLogs = () => {
    if (!serverLogsInput) return;
    
    try {
      // Split by newlines to get rows
      const rows = serverLogsInput.trim().split('\n');
      
      // Get headers from first row
      const headers = rows[0].split(',').map(h => h.replace(/"/g, ''));
      
      // Parse data rows
      const parsedLogs: ServerLog[] = [];
      
      for (let i = 1; i < rows.length; i++) {
        // Handle CSV properly (respect quoted values)
        const row = rows[i];
        const values: string[] = [];
        let insideQuote = false;
        let currentValue = '';
        
        for (let j = 0; j < row.length; j++) {
          const char = row[j];
          
          if (char === '"') {
            insideQuote = !insideQuote;
          } else if (char === ',' && !insideQuote) {
            values.push(currentValue);
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        
        // Add the last value
        values.push(currentValue);
        
        // Create log object
        const logEntry: any = {};
        headers.forEach((header, index) => {
          if (index < values.length) {
            logEntry[header] = values[index].replace(/"/g, '');
          }
        });
        
        parsedLogs.push(logEntry as ServerLog);
      }
      
      setServerLogs(parsedLogs);
    } catch (error) {
      console.error('Error parsing server logs:', error);
      alert('Error parsing logs. Please check the format.');
    }
  };
  
  // Filter logs based on criteria
  const getFilteredLogs = () => {
    return serverLogs.filter(log => {
      const pathMatch = !filterPath || log.requestPath?.includes(filterPath);
      const methodMatch = !filterMethod || log.requestMethod === filterMethod;
      const statusMatch = !filterStatus || log.responseStatusCode === filterStatus;
      return pathMatch && methodMatch && statusMatch;
    });
  };
  
  // Clear filters
  const clearFilters = () => {
    setFilterPath('');
    setFilterMethod('');
    setFilterStatus('');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Storage Debug</h1>
      
      <div className="mb-6 flex flex-wrap gap-4">
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
          onClick={checkStorageStatus}
          className="px-4 py-2 bg-orange-500 text-white rounded"
        >
          Check Storage Status
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
      
      {/* Server Logs Parser */}
      <div className="mt-8 border-t pt-6">
        <h2 className="text-2xl font-bold mb-4">Server Logs Parser</h2>
        
        <div className="mb-4">
          <label className="block mb-2 font-medium">Paste Server Logs (CSV format)</label>
          <textarea
            className="w-full h-40 p-2 border rounded"
            value={serverLogsInput}
            onChange={(e) => setServerLogsInput(e.target.value)}
            placeholder="Paste CSV logs here..."
          />
          <div className="mt-2 flex gap-2">
            <button 
              onClick={parseServerLogs}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Parse Logs
            </button>
            <button 
              onClick={() => setServerLogsInput('')}
              className="px-4 py-2 bg-gray-500 text-white rounded"
            >
              Clear
            </button>
          </div>
        </div>
        
        {serverLogs.length > 0 && (
          <>
            <div className="mb-4 flex flex-wrap gap-4">
              <div>
                <label className="block text-sm mb-1">Filter by Path</label>
                <input
                  type="text"
                  className="border rounded p-2"
                  value={filterPath}
                  onChange={(e) => setFilterPath(e.target.value)}
                  placeholder="/path"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Filter by Method</label>
                <select
                  className="border rounded p-2"
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="HEAD">HEAD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Filter by Status</label>
                <select
                  className="border rounded p-2"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="200">200</option>
                  <option value="404">404</option>
                  <option value="500">500</option>
                </select>
              </div>
              <div className="self-end">
                <button 
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-500 text-white rounded"
                >
                  Clear Filters
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-2 border">Time (UTC)</th>
                    <th className="p-2 border">Path</th>
                    <th className="p-2 border">Method</th>
                    <th className="p-2 border">Status</th>
                    <th className="p-2 border">User Agent</th>
                    <th className="p-2 border">Host</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredLogs().map((log, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="p-2 border">{log.timeUTC}</td>
                      <td className="p-2 border">{log.requestPath}</td>
                      <td className="p-2 border">{log.requestMethod}</td>
                      <td className="p-2 border">
                        <span className={`px-2 py-1 rounded ${log.responseStatusCode === '200' ? 'bg-green-100' : log.responseStatusCode === '404' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                          {log.responseStatusCode}
                        </span>
                      </td>
                      <td className="p-2 border text-xs">{log.requestUserAgent}</td>
                      <td className="p-2 border">{log.host}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4">
              <p className="text-sm">Showing {getFilteredLogs().length} of {serverLogs.length} logs</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DebugPage;
