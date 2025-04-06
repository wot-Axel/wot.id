'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { 
  TableType,
  TableData,
  initTableland,
  checkTableExists,
  createTable,
  getData,
  insertData,
  clearData
} from '@/utils/tablelandUtils';
import { useTableland } from '@/context/TablelandContext';
import { useComposeDBEnabled, useTablelandEnabled } from '@/context/DataProviders';

export const PrivateDataSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const [isOptimismNetwork, setIsOptimismNetwork] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [tableName, setTableName] = useState<string>('');
  const [privateData, setPrivateData] = useState<TableData[]>([]);
  const [newKey, setNewKey] = useState<string>('');
  const [newValue, setNewValue] = useState<string>('');

  // Use the Tableland context
  const { client, isInitialized, isLoading: tablelandLoading, connect } = useTableland();
  
  // Check if we should use Tableland
  const tablelandEnabled = useTablelandEnabled();

  // Initialize Tableland connection
  useEffect(() => {
    const init = async () => {
      try {
        if (isConnected && address && !isInitialized && !tablelandLoading && tablelandEnabled) {
          setLoading(true);
          setError('');
          
          // Connect to Tableland
          await connect();
          
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error initializing Tableland:', err);
        setError(err.message || 'Failed to initialize Tableland. Please try again.');
        setLoading(false);
      }
    };
    
    init();
  }, [isConnected, address, isInitialized, tablelandLoading, connect, tablelandEnabled]);
  
  // Load private data when Tableland is initialized
  useEffect(() => {
    const loadPrivateData = async () => {
      try {
        if (isInitialized && client && address && tablelandEnabled) {
          setLoading(true);
          
          // Check if table exists
          const { exists, tableName: existingTable } = await checkTableExists(client, TableType.PRIVATE, address);
          
          if (exists && existingTable) {
            setTableName(existingTable);
            
            // Get existing data
            const records = await getData(client, TableType.PRIVATE, existingTable);
            
            setPrivateData(records);
          }
          
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error loading private data:', err);
        setError(err.message || 'Failed to load private data. Please try again.');
        setLoading(false);
      }
    };
    
    loadPrivateData();
  }, [isInitialized, client, address, tablelandEnabled]);

  const handleCreateTable = async () => {
    if (!client || !address) {
      setError('Tableland not initialized or no address available.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create a new table for private data
      const newTableName = await createTable(client, TableType.PRIVATE, address);
      setTableName(newTableName);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error creating table:', err);
      setError(err.message || 'Failed to create table. Please try again.');
      setLoading(false);
    }
  };

  const handleAddData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !tableName || !newKey || !newValue) {
      setError('Missing required information. Please check all fields.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Insert data into the table
      await insertData(client, TableType.PRIVATE, tableName, newKey, newValue);
      
      // Refresh data
      const records = await getData(client, TableType.PRIVATE, tableName);
      
      setPrivateData(records);
      
      // Clear form
      setNewKey('');
      setNewValue('');
      setLoading(false);
    } catch (err: any) {
      console.error('Error adding data:', err);
      setError(err.message || 'Failed to add data. Please try again.');
      setLoading(false);
    }
  };

  const handleClearPrivateData = async () => {
    if (!client || !tableName) {
      setError('Tableland not initialized or no table available.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Clear the table
      await clearData(client, TableType.PRIVATE, tableName);
      
      // Reset data
      setPrivateData([]);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error clearing private data:', err);
      setError(err.message || 'Failed to clear private data. Please try again.');
      setLoading(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="legal-section">
      <h2>Private Data (Tableland)</h2>
      <div className="section-content">
        <div className="info-box" style={{ marginBottom: '1rem' }}>
          <p>
            <strong>Tableland Integration:</strong> Your private data is securely stored on Tableland, 
            a decentralized SQL database for Web3. This provides better reliability, performance, 
            and compatibility with server-side rendering compared to Ceramic.
          </p>
        </div>
          <>
            {error && <div className="alert alert-error">{error}</div>}
            
            {!tableName ? (
              <div>
                <p>You don't have a private data table yet. Create one to store your private data on Tableland.</p>
                <button 
                  className="button-primary" 
                  onClick={handleCreateTable}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Private Table'}
                </button>
              </div>
            ) : (
              <div>
                <p>Your private data is securely stored on Tableland.</p>
                
                <form onSubmit={handleAddData} className="private-data-form">
                  <div className="form-group">
                    <label htmlFor="dataKey">Key:</label>
                    <input
                      type="text"
                      id="dataKey"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      required
                      placeholder="Enter key"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="dataValue">Value:</label>
                    <input
                      type="text"
                      id="dataValue"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      required
                      placeholder="Enter value"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="button-primary"
                    disabled={loading || !newKey || !newValue}
                  >
                    {loading ? 'Adding...' : 'Add Data'}
                  </button>
                </form>
                
                <div style={{ marginTop: '1rem' }}>
                  <button 
                    className="button-primary"
                    onClick={handleClearPrivateData}
                    disabled={loading}
                  >
                    {loading ? 'Clearing...' : 'Clear All Private Data'}
                  </button>
                  <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                    This will remove all data from the private data section.
                  </p>
                </div>
                
                <div className="private-data-list">
                  <h3>Your Private Data</h3>
                  {privateData.length === 0 ? (
                    <p>No private data yet. Add some using the form above.</p>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Key</th>
                          <th>Value</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {privateData.map((item) => (
                          <tr key={item.id || item.key}>
                            <td>{item.key}</td>
                            <td>{item.value}</td>
                            <td>{item.created_at ? new Date(item.created_at).toLocaleString() : new Date().toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </>
      </div>
    </div>
  );
};
