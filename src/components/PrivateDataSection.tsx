'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { optimism } from '@reown/appkit/networks';
import { 
  createPrivateTable, 
  insertPrivateData, 
  getPrivateData,
  checkPrivateTableExists,
  clearPrivateData,
  type PrivateData
} from '@/utils/tablelandUtils';
import { initTablelandWithOptimismWrite } from '@/utils/optimismProvider';
import { Database } from '@tableland/sdk';

export const PrivateDataSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const { switchNetwork } = useAppKitNetwork();
  const [isOptimismNetwork, setIsOptimismNetwork] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [db, setDb] = useState<Database | null>(null);
  const [tableName, setTableName] = useState<string>('');
  const [privateData, setPrivateData] = useState<PrivateData[]>([]);
  const [newKey, setNewKey] = useState<string>('');
  const [newValue, setNewValue] = useState<string>('');

  // Initialize Tableland when connected
  useEffect(() => {
    if (isConnected && address) {
      // No need to check network - we use cross-chain signing
      initTablelandDb();
    }
  }, [isConnected, address]);

  // No longer needed as we use cross-chain signing
  // Keeping this commented for reference
  /*
  const handleSwitchToOptimism = () => {
    switchNetwork(optimism);
    setIsOptimismNetwork(true);
  };
  */

  const initTablelandDb = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Initialize Tableland with Optimism provider for writing
      const tablelandDb = await initTablelandWithOptimismWrite(address || '');
      setDb(tablelandDb);
      
      // Check if table exists
      const tableCheck = await checkPrivateTableExists(tablelandDb, address as string);
      
      if (tableCheck.exists) {
        setTableName(tableCheck.tableName);
        // Load existing data
        const data = await getPrivateData(tablelandDb, tableCheck.tableName);
        setPrivateData(data);
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error initializing Tableland');
      setLoading(false);
    }
  };

  const handleCreateTable = async () => {
    if (!db || !address) return;
    
    try {
      setLoading(true);
      setError('');
      
      const name = await createPrivateTable(db, address);
      setTableName(name);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error creating table');
      setLoading(false);
    }
  };

  const handleAddData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !tableName || !newKey || !newValue) return;
    
    try {
      setLoading(true);
      setError('');
      
      await insertPrivateData(db, tableName, newKey, newValue);
      
      // Refresh data
      const data = await getPrivateData(db, tableName);
      setPrivateData(data);
      
      // Clear form
      setNewKey('');
      setNewValue('');
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error adding data');
      setLoading(false);
    }
  };

  const handleClearPrivateData = async () => {
    if (!db || !tableName) return;
    
    try {
      setLoading(true);
      setError('');
      
      await clearPrivateData(db, tableName);
      
      // Refresh data
      const data = await getPrivateData(db, tableName);
      setPrivateData(data);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error clearing private data');
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
            <strong>Multi-Chain Support:</strong> Your private data is securely stored on Optimism for cost efficiency, 
            while your wallet remains connected to your preferred network. Our cross-chain technology handles all network 
            interactions behind the scenes - no network switching required.
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
                <p>Your private data is stored on Tableland on the Optimism network.</p>
                
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
                          <tr key={item.id}>
                            <td>{item.key}</td>
                            <td>{item.value}</td>
                            <td>{new Date(item.created_at).toLocaleString()}</td>
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
