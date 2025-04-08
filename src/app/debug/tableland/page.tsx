'use client';

import React, { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit-controllers/react';
import { useDisconnect } from '@reown/appkit/react';
import { ensureCorrectAddress, getStoredCorrectAddress } from '@/utils/addressUtils';
import { Database } from '@tableland/sdk';
import { 
  initTableland, 
  checkTableExists, 
  createTable, 
  insertData, 
  getData,
  TableType 
} from '@/utils/tablelandUtils';
import { useChainId, useChains } from 'wagmi';

// Interface for transaction tracking
interface Transaction {
  id: string;
  type: 'create_table' | 'insert_data' | 'query_data';
  status: 'pending' | 'confirmed' | 'failed';
  hash?: string;
  timestamp: number;
  details: any;
  error?: string;
}

export default function TablelandDebugPage() {
  const { address: accountAddress, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const chains = useChains();
  const chain = chains.find(c => c.id === chainId);
  const [db, setDb] = useState<Database | null>(null);
  const [address, setAddress] = useState<string>('');
  const [status, setStatus] = useState<string>('Disconnected');
  const [logs, setLogs] = useState<string[]>([]);
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [testKey, setTestKey] = useState<string>('test_key');
  const [testValue, setTestValue] = useState<string>('test_value');
  const [tableType, setTableType] = useState<TableType>(TableType.PRIVATE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');

  // Add a log entry
  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toISOString()}] ${message}`, ...prev]);
  };
  
  // Add a transaction to track
  const addTransaction = (type: Transaction['type'], details: any) => {
    const id = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newTransaction: Transaction = {
      id,
      type,
      status: 'pending',
      timestamp: Date.now(),
      details
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    addLog(`New transaction created: ${type} (ID: ${id})`);
    return id;
  };
  
  // Update a transaction's status
  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => 
      prev.map(tx => 
        tx.id === id ? { ...tx, ...updates } : tx
      )
    );
    
    if (updates.status) {
      addLog(`Transaction ${id} status updated to: ${updates.status}`);
    }
    
    if (updates.hash) {
      addLog(`Transaction ${id} hash: ${updates.hash}`);
    }
    
    if (updates.error) {
      addLog(`Transaction ${id} error: ${updates.error}`);
    }
  };

  // Initialize when connected
  useEffect(() => {
    // Log the current account address whenever it changes
    addLog(`Account address changed: ${accountAddress || 'Not connected'}`);
    console.log('Account address in Tableland debug:', accountAddress);
    
    if (isConnected && accountAddress) {
      // Get the correct address (either stored or current)
      const correctAddress = ensureCorrectAddress(accountAddress);
      console.log('Using address for Tableland:', correctAddress);
      
      // If we have a stored address that's different, use that instead
      if (correctAddress && correctAddress !== accountAddress) {
        addLog(`Using stored correct address instead of current: ${correctAddress}`);
        console.warn(`Address mismatch in Tableland! Using stored: ${correctAddress} instead of current: ${accountAddress}`);
      }
      
      setAddress(correctAddress || accountAddress);
      initDb();
    } else {
      setDb(null);
      setStatus('Disconnected');
    }
  }, [isConnected, accountAddress]);

  // Initialize Tableland database
  const initDb = async () => {
    try {
      // Get the stored correct address if available
      const storedAddress = getStoredCorrectAddress();
      
      // Always use the stored address if available
      const addressToUse = storedAddress || address;
      
      // Log the address being used
      if (storedAddress && address !== storedAddress) {
        addLog(`Using stored address: ${storedAddress} instead of current address: ${address}`);
      } else {
        addLog(`Using address: ${addressToUse}`);
      }
      
      // Update the state with the correct address
      setAddress(addressToUse);
      
      setStatus('Initializing Tableland...');
      addLog('Initializing Tableland database...');
      setIsLoading(true);
      
      // Pass the correct address to initTableland
      const database = await initTableland(addressToUse);
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
  
  // Fetch data from a specific table
  const fetchTableData = async (tableName: string) => {
    if (!db) {
      addLog('Cannot fetch table data: Database not available');
      return;
    }
    
    const txId = addTransaction('query_data', { tableName });
    
    try {
      setIsLoading(true);
      addLog(`Fetching data from table: ${tableName}`);
      
      // Capture the start time for performance tracking
      const startTime = Date.now();
      
      // Query the table data
      const data = await getData(db, tableType, tableName);
      
      // Calculate execution time
      const executionTime = Date.now() - startTime;
      
      // Update the transaction with success details
      updateTransaction(txId, {
        status: 'confirmed',
        details: {
          tableName,
          rowCount: data.length,
          executionTime: `${executionTime}ms`
        }
      });
      
      setTableData(data);
      addLog(`Retrieved ${data.length} rows from table ${tableName}`);
      addLog(`Execution time: ${executionTime}ms`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addLog(`Error fetching table data: ${errorMsg}`);
      console.error('Error fetching table data:', error);
      
      // Update the transaction with error details
      updateTransaction(txId, {
        status: 'failed',
        error: errorMsg
      });
      
      setTableData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a table with transaction tracking
  const handleCreateTable = async () => {
    if (!db || !address) {
      addLog('Cannot create table: Database or address not available');
      return;
    }
    
    const txId = addTransaction('create_table', { tableType, address });
    
    try {
      setIsLoading(true);
      addLog(`Creating table for type: ${tableType}`);
      
      // Capture the start time for performance tracking
      const startTime = Date.now();
      
      // Create the table and capture any transaction hash
      const result = await createTable(db, tableType, address);
      
      // Define the expected return type structure
      interface TableResult {
        tableName: string;
        txHash?: string;
      }
      
      // Handle different return types (string or object with txHash)
      let tableName: string;
      let txHash: string | undefined;
      
      if (typeof result === 'object' && result !== null && 'tableName' in result) {
        const tableResult = result as TableResult;
        tableName = tableResult.tableName;
        txHash = tableResult.txHash;
      } else {
        tableName = result as string;
        txHash = undefined;
      }
      
      // Calculate execution time
      const executionTime = Date.now() - startTime;
      
      // Update the transaction with success details
      updateTransaction(txId, {
        status: 'confirmed',
        hash: txHash,
        details: {
          ...{ tableType, address },
          tableName,
          executionTime: `${executionTime}ms`
        }
      });
      
      addLog(`Table created successfully: ${tableName}${txHash ? ` (TX: ${txHash})` : ''}`);
      addLog(`Execution time: ${executionTime}ms`);
      
      // Refresh table info
      await checkTables();
      
      // Set this as the selected table
      setSelectedTable(tableName);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addLog(`Error creating table: ${errorMsg}`);
      console.error('Error creating table:', error);
      
      // Update the transaction with error details
      updateTransaction(txId, {
        status: 'failed',
        error: errorMsg
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Insert data into a table with transaction tracking
  const handleInsertData = async () => {
    if (!db || !address || !tableInfo || !tableInfo[tableType]) {
      addLog('Cannot insert data: Database, address, or table info not available');
      return;
    }
    
    const tableName = tableInfo[tableType]?.tableName;
    
    if (!tableInfo[tableType]) {
      addLog(`Table information for ${tableType} not found`);
      return;
    }
    
    if (!tableName) {
      addLog('Cannot insert data: Table name not found');
      return;
    }
    
    const txId = addTransaction('insert_data', { tableType, tableName, key: testKey, value: testValue });
    
    try {
      setIsLoading(true);
      addLog(`Inserting data into table: ${tableName}`);
      addLog(`Key: ${testKey}, Value: ${testValue}`);
      
      // Capture the start time for performance tracking
      const startTime = Date.now();
      
      // Insert the data and capture any transaction hash
      const result = await insertData(db, tableType, tableName, testKey, testValue);
      
      // Define the expected return type structure
      interface InsertResult {
        txHash?: string;
      }
      
      // Handle different return types
      let txHash: string | undefined;
      
      if (typeof result === 'object' && result !== null && 'txHash' in result) {
        const insertResult = result as InsertResult;
        txHash = insertResult.txHash;
      } else {
        txHash = undefined;
      }
      
      // Calculate execution time
      const executionTime = Date.now() - startTime;
      
      // Update the transaction with success details
      updateTransaction(txId, {
        status: 'confirmed',
        hash: txHash,
        details: {
          ...{ tableType, tableName, key: testKey, value: testValue },
          executionTime: `${executionTime}ms`
        }
      });
      
      addLog(`Data inserted successfully${txHash ? ` (TX: ${txHash})` : ''}`);
      addLog(`Execution time: ${executionTime}ms`);
      
      // Refresh the table data
      if (tableName) {
        await fetchTableData(tableName);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addLog(`Error inserting data: ${errorMsg}`);
      console.error('Error inserting data:', error);
      
      // Update the transaction with error details
      updateTransaction(txId, {
        status: 'failed',
        error: errorMsg
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tableland-debug-container">
      <style jsx>{`
        .tableland-debug-container {
          padding: 20px;
          max-width: 1200px;
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
          flex-wrap: wrap;
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
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        
        .data-table th, .data-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        .data-table th {
          background-color: #f2f2f2;
        }
        
        .data-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        .network-info {
          display: inline-block;
          margin-left: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.8em;
          background: #f0f0f0;
        }
      `}</style>
      
      <h1>Tableland Debug Tool</h1>
      <p>This tool helps diagnose issues with Tableland database operations.</p>
      
      <div className="section">
        <h2>Connection Status</h2>
        <div className="info-item">
          <strong>Status:</strong> {status} {isLoading && <span className="loading">Loading...</span>}
          {chain && (
            <span className="network-info">
              Network: {chain.name} (ID: {chain.id})
            </span>
          )}
        </div>
        <div className="info-item">
          <strong>Address:</strong> {address || 'Not connected'}
          {address && getStoredCorrectAddress() && (
            <span style={{ marginLeft: '10px', fontSize: '0.9em' }}>
              {address.toLowerCase() === getStoredCorrectAddress()?.toLowerCase() 
                ? '✅ Matches stored address' 
                : '⚠️ Does not match stored address: ' + getStoredCorrectAddress()}
            </span>
          )}
        </div>
        <div className="button-group">
          <button onClick={initDb} disabled={!isConnected || isLoading}>
            Reconnect to Tableland
          </button>
          <button onClick={checkTables} disabled={!db || isLoading}>
            Refresh Table Info
          </button>
          <button 
            onClick={async () => {
              addLog('Force disconnecting...');
              try {
                await disconnect();
                addLog('Disconnected successfully');
                setDb(null);
                setStatus('Disconnected');
                setAddress('');
                // Clear localStorage
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('wot_id_correct_address');
                  addLog('Cleared stored address');
                }
              } catch (error) {
                addLog(`Error disconnecting: ${error instanceof Error ? error.message : String(error)}`);
              }
            }} 
            style={{ background: '#ff4040' }}
          >
            Force Disconnect
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
      
      {/* Table Data Display */}
      {tableData.length > 0 && (
        <div className="section">
          <h2>Table Data</h2>
          <p>Showing data for selected table</p>
          
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Key</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((item, index) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{item.key}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Transaction Monitoring */}
      {transactions.length > 0 && (
        <div className="section">
          <h2>Transaction Monitor</h2>
          <p>Showing {transactions.length} recent transactions</p>
          
          {transactions.map((tx) => (
            <div key={tx.id} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
              <div>
                <strong>{tx.type.replace('_', ' ').toUpperCase()}</strong>
                <span style={{ 
                  marginLeft: '10px', 
                  color: tx.status === 'pending' ? '#f59e0b' : tx.status === 'confirmed' ? '#10b981' : '#ef4444'
                }}>
                  {tx.status.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.8em', color: '#666' }}>
                  {new Date(tx.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              {tx.hash && (
                <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.9em' }}>
                  <strong>TX:</strong> {tx.hash}
                  {chain && (
                    <a 
                      href={`${chain.blockExplorers?.default.url}/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginLeft: '10px', fontSize: '0.9em' }}
                    >
                      View on Explorer
                    </a>
                  )}
                </div>
              )}
              
              {tx.error && (
                <div style={{ color: '#ef4444', marginTop: '5px' }}>
                  <strong>Error:</strong> {tx.error}
                </div>
              )}
              
              <div style={{ 
                background: '#f0f0f0', 
                padding: '8px', 
                borderRadius: '4px', 
                marginTop: '5px', 
                fontFamily: 'monospace', 
                fontSize: '0.9em', 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-all' 
              }}>
                {JSON.stringify(tx.details, null, 2)}
              </div>
            </div>
          ))}
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
