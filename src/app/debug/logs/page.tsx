'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogsDebugPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Fetch logs based on current filter settings
  const fetchLogs = async () => {
    if (!apiKey) {
      setError('API key is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let url = `/api/logs?apiKey=${encodeURIComponent(apiKey)}`;
      
      if (filterType === 'error') {
        url += '&action=byType&type=error';
      } else if (filterType === 'search' && searchText) {
        url += `&action=search&search=${encodeURIComponent(searchText)}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setLogs(data);
    } catch (err) {
      setError(`Failed to fetch logs: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all logs
  const clearLogs = async () => {
    if (!apiKey) {
      setError('API key is required');
      return;
    }

    if (!confirm('Are you sure you want to clear all logs?')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/logs?apiKey=${encodeURIComponent(apiKey)}&action=clear`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setLogs([]);
      alert('Logs cleared successfully');
    } catch (err) {
      setError(`Failed to clear logs: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Format log for display
  const formatLog = (log: any) => {
    const timestamp = new Date(log.timestamp).toLocaleString();
    let className = 'log-item';
    
    if (log.type === 'error') {
      className += ' log-error';
    } else if (log.type === 'warn') {
      className += ' log-warning';
    }
    
    return (
      <div key={log.timestamp + Math.random()} className={className}>
        <div className="log-timestamp">{timestamp}</div>
        <div className="log-type">{log.type.toUpperCase()}</div>
        <div className="log-message">{log.message}</div>
        {log.data && (
          <div className="log-data">
            <pre>{log.data}</pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="logs-debug-container">
      <style jsx>{`
        .logs-debug-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .controls {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 5px;
        }
        
        .control-group {
          display: flex;
          flex-direction: column;
          min-width: 200px;
        }
        
        .control-group label {
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        input, select, button {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        
        button {
          background: #0070f3;
          color: white;
          cursor: pointer;
          border: none;
        }
        
        button:hover {
          background: #0051b3;
        }
        
        button.clear {
          background: #f30000;
        }
        
        button.clear:hover {
          background: #b30000;
        }
        
        .logs-list {
          border: 1px solid #eaeaea;
          border-radius: 5px;
          overflow: auto;
          height: 70vh;
          background: #f9f9f9;
        }
        
        .log-item {
          padding: 10px;
          border-bottom: 1px solid #eaeaea;
          font-family: monospace;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        .log-item:nth-child(odd) {
          background: #f5f5f5;
        }
        
        .log-timestamp {
          color: #666;
          font-size: 0.8em;
          margin-bottom: 5px;
        }
        
        .log-type {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          background: #eee;
          margin-right: 8px;
          font-size: 0.8em;
        }
        
        .log-error {
          background: #ffeeee;
        }
        
        .log-error .log-type {
          background: #f30000;
          color: white;
        }
        
        .log-warning {
          background: #fffaee;
        }
        
        .log-warning .log-type {
          background: #f3a100;
          color: white;
        }
        
        .log-data {
          margin-top: 8px;
          padding: 8px;
          background: #f0f0f0;
          border-radius: 3px;
          max-height: 200px;
          overflow: auto;
        }
        
        .error-message {
          color: red;
          margin-bottom: 10px;
        }
        
        .loading {
          text-align: center;
          padding: 20px;
          color: #666;
        }
        
        .no-logs {
          text-align: center;
          padding: 40px;
          color: #666;
        }
      `}</style>
      
      <h1>Log Viewer</h1>
      <p>View and filter logs captured from the application</p>
      
      <div className="controls">
        <div className="control-group">
          <label htmlFor="api-key">API Key</label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter API key"
          />
        </div>
        
        <div className="control-group">
          <label htmlFor="filter-type">Filter Type</label>
          <select
            id="filter-type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Logs</option>
            <option value="error">Error Logs</option>
            <option value="search">Search</option>
          </select>
        </div>
        
        {filterType === 'search' && (
          <div className="control-group">
            <label htmlFor="search-text">Search Text</label>
            <input
              id="search-text"
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Enter search text"
            />
          </div>
        )}
        
        <div className="control-group">
          <label>&nbsp;</label>
          <button onClick={fetchLogs} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Fetch Logs'}
          </button>
        </div>
        
        <div className="control-group">
          <label>&nbsp;</label>
          <button className="clear" onClick={clearLogs} disabled={isLoading}>
            Clear Logs
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {isLoading ? (
        <div className="loading">Loading logs...</div>
      ) : logs.length > 0 ? (
        <div className="logs-list">
          {logs.map(formatLog)}
        </div>
      ) : (
        <div className="no-logs">No logs found.</div>
      )}
    </div>
  );
}
