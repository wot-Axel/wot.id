'use client';

import React, { useState, useEffect } from 'react';
import { useAppKit } from '@/context';
import { Database } from '@tableland/sdk';
import { 
  initTableland, 
  checkTableExists, 
  createTable, 
  insertData, 
  TableType 
} from '@/utils/tablelandUtils';

export default function TablelandDebugPage() {
  const { account, isConnected } = useAppKit();
  const [db, setDb] = useState<Database | null>(null);
  const [address, setAddress] = useState<string>('');
  const [status, setStatus] = useState<string>('Disconnected');
  const [logs, setLogs] = useState<string[]>([]);
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [testKey, setTestKey] = useState<string>('test_key');
  const [testValue, setTestValue] = useState<string>('test_value');
  const [tableType, setTableType] = useState<TableType>(TableType.PROFILE);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Add a log entry
  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toISOString()}] ${message}`, ...prev]);
  };

  // Initialize when connected
  useEffect(() => {
    if (isConnected && account) {
      setAddress(account.address);
      initDb();
    } else {
      setDb(null);
      setStatus('Disconnected');
    }
  }, [isConnected, account]);

  // Initialize Tableland database
  const initDb = async () => {
    try {
      setStatus('Initializing Tableland...');
      addLog('Initializing Tableland database...');
      setIsLoading(true);
      
      const database = await initTableland();
      setDb(database);
      
      setStatus('Connected to Tableland');
      addLog(`Successfully connected to Tableland with address: ${address}`);
      
      // Check if tables exist
      await checkTables();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setStatus(`Error: ${errorMsg}`);
      addLog(`Error initializing Tableland: ${errorMsg}`);
      console.error('Error initializing Tableland:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if tables exist
  const checkTables = async () => {
    if (!db || !address) {
      addLog('Cannot check tables: Database or address not available');
      return;
    }
    
    try {
      setIsLoading(true);
      addLog(`Checking if tables exist for address: ${address}`);
      
      const tableTypes = Object.values(TableType);
      const tableResults: any = {};
      
      for (const type of tableTypes) {
        addLog(`Checking table type: ${type}`);
        const result = await checkTableExists(db, type as TableType, address);
        tableResults[type] = result;
        addLog(`Table ${type}: ${result.exists ? 'Exists' : 'Does not exist'}, Name: ${result.tableName}`);
      }
      
      setTableInfo(tableResults);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addLog(`Error checking tables: ${errorMsg}`);
      console.error('Error checking tables:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a table
  const handleCreateTable = async () => {
    if (!db || !address) {
      addLog('Cannot create table: Database or address not available');
      return;
    }
    
    try {
      setIsLoading(true);
      addLog(`Creating table for type: ${tableType}`);
      
      const tableName = await createTable(db, tableType, address);
      addLog(`Table created successfully: ${tableName}`);
      
      // Refresh table info
      await checkTables();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addLog(`Error creating table: ${errorMsg}`);
      console.error('Error creating table:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Insert data into a table
  const handleInsertData = async () => {
    if (!db || !address || !tableInfo || !tableInfo[tableType]) {
      addLog('Cannot insert data: Database, address, or table info not available');
      return;
    }
    
    try {
      setIsLoading(true);
      const { tableName } = tableInfo[tableType];
      
      if (!tableName) {
        addLog('Cannot insert data: Table name not found');
        return;
      }
      
      addLog(`Inserting data into table: ${tableName}`);
      addLog(`Key: ${testKey}, Value: ${testValue}`);
      
      await insertData(db, tableType, tableName, testKey, testValue);
      addLog('Data inserted successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addLog(`Error inserting data: ${errorMsg}`);
      console.error('Error inserting data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tableland-debug-container">
      <style jsx>{`
        .tableland-debug-container {
          padding: 20px;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .section {
          margin-bottom: 30px;
          padding: 15px;
          border: 1px solid #eaeaea;
          border-radius: 5px;
          background: #f9f9f9;
        }
        
        .section h2 {
          margin-top: 0;
          border-bottom: 1px solid #eaeaea;
          padding-bottom: 10px;
        }
        
        .info-item {
          margin-bottom: 10px;
        }
        
        .info-item strong {
          display: inline-block;
          width: 120px;
          font-weight: bold;
        }
        
        .button-group {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        button {
          padding: 8px 16px;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        button:hover {
          background: #0051b3;
        }
        
        button:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        input, select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        
        .logs-container {
          background: #000;
          color: #00ff00;
          padding: 10px;
          border-radius: 4px;
          font-family: monospace;
          height: 300px;
          overflow: auto;
        }
        
        .log-entry {
          margin-bottom: 5px;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        .table-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        
        .table-card {
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 10px;
        }
        
        .table-card h3 {
          margin-top: 0;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        
        .loading {
          display: inline-block;
          margin-left: 10px;
          color: #666;
        }
      `}</style>
      
      <h1>Tableland Debug Tool</h1>
      <p>This tool helps diagnose issues with Tableland database operations.</p>
      
      <div className="section">
        <h2>Connection Status</h2>
        <div className="info-item">
          <strong>Status:</strong> {status} {isLoading && <span className="loading">Loading...</span>}
        </div>
        <div className="info-item">
          <strong>Address:</strong> {address || 'Not connected'}
        </div>
        <div className="button-group">
          <button onClick={initDb} disabled={!isConnected || isLoading}>
            Reconnect to Tableland
          </button>
          <button onClick={checkTables} disabled={!db || isLoading}>
            Refresh Table Info
          </button>
        </div>
      </div>
      
      <div className="section">
        <h2>Create Table</h2>
        <div className="form-group">
          <label htmlFor="table-type">Table Type:</label>
          <select
            id="table-type"
            value={tableType}
            onChange={(e) => setTableType(e.target.value as TableType)}
            disabled={isLoading}
          >
            {Object.values(TableType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <button onClick={handleCreateTable} disabled={!db || isLoading}>
          Create Table
        </button>
      </div>
      
      <div className="section">
        <h2>Insert Data</h2>
        <div className="form-group">
          <label htmlFor="test-key">Key:</label>
          <input
            id="test-key"
            type="text"
            value={testKey}
            onChange={(e) => setTestKey(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="test-value">Value:</label>
          <input
            id="test-value"
            type="text"
            value={testValue}
            onChange={(e) => setTestValue(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <button onClick={handleInsertData} disabled={!db || isLoading || !tableInfo}>
          Insert Data
        </button>
      </div>
      
      {tableInfo && (
        <div className="section">
          <h2>Table Information</h2>
          <div className="table-grid">
            {Object.entries(tableInfo).map(([type, info]: [string, any]) => (
              <div key={type} className="table-card">
                <h3>{type}</h3>
                <div><strong>Exists:</strong> {info.exists ? 'Yes' : 'No'}</div>
                <div><strong>Table Name:</strong> {info.tableName}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="section">
        <h2>Debug Logs</h2>
        <div className="logs-container">
          {logs.map((log, index) => (
            <div key={index} className="log-entry">
              {log}
            </div>
          ))}
          {logs.length === 0 && <div className="log-entry">No logs yet...</div>}
        </div>
      </div>
    </div>
  );
}
