'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { 
  Database,
  DataType,
  PrivateData,
  initCeramic,
  checkCollectionExists,
  createCollection,
  getRecords,
  createRecord,
  clearCollection
} from '@/utils/ceramicUtils';
import { useCeramic } from '@/context/CeramicContext';

export const PrivateDataSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const [isOptimismNetwork, setIsOptimismNetwork] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [db, setDb] = useState<Database | null>(null);
  const [tableName, setTableName] = useState<string>('');
  const [privateData, setPrivateData] = useState<PrivateData[]>([]);
  const [newKey, setNewKey] = useState<string>('');
  const [newValue, setNewValue] = useState<string>('');

  // Use the Ceramic context
  const { ceramic, did, isInitialized, isLoading: ceramicLoading, connect } = useCeramic();

  // Initialize Ceramic connection
  useEffect(() => {
    const init = async () => {
      try {
        if (isConnected && address && !isInitialized && !ceramicLoading) {
          setLoading(true);
          setError('');
          
          // Connect to Ceramic network
          await connect();
          
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error initializing Ceramic:', err);
        setError(err.message || 'Failed to initialize Ceramic. Please try again.');
        setLoading(false);
      }
    };
    
    init();
  }, [isConnected, address, isInitialized, ceramicLoading, connect]);
  
  // Load private data when Ceramic is initialized
  useEffect(() => {
    const loadPrivateData = async () => {
      try {
        if (isInitialized && ceramic && did) {
          setLoading(true);
          
          // Check if collection exists
          const { exists, collectionId } = await checkCollectionExists(ceramic, DataType.PROFILE, did);
          
          if (exists) {
            setTableName(collectionId);
            
            // Get existing data
            const records = await getRecords(ceramic, DataType.PROFILE, collectionId);
            
            // Convert records to the format expected by the component
            const formattedData = records.map((record, index) => ({
              id: index,
              key: record.id,
              value: JSON.stringify(record.content),
              created_at: new Date().toISOString()
            }));
            
            setPrivateData(formattedData);
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
  }, [isInitialized, ceramic, did]);

  const handleCreateTable = async () => {
    if (!ceramic || !did) {
      setError('Ceramic not initialized or no DID available.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create a new collection for private data
      const { collectionId } = await createCollection(ceramic, DataType.PROFILE, did);
      setTableName(collectionId);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error creating collection:', err);
      setError(err.message || 'Failed to create collection. Please try again.');
      setLoading(false);
    }
  };

  const handleAddData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ceramic || !tableName || !newKey || !newValue) {
      setError('Missing required information. Please check all fields.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create a record in the collection
      const content = { key: newKey, value: newValue };
      await createRecord(ceramic, DataType.PROFILE, tableName, content, ['private']);
      
      // Refresh data
      const records = await getRecords(ceramic, DataType.PROFILE, tableName);
      
      // Convert records to the format expected by the component
      const formattedData = records.map((record, index) => ({
        id: index,
        key: record.id,
        value: JSON.stringify(record.content),
        created_at: new Date().toISOString()
      }));
      
      setPrivateData(formattedData);
      
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
    if (!ceramic || !tableName) {
      setError('Ceramic not initialized or no collection available.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Clear the collection
      await clearCollection(ceramic, DataType.PROFILE, tableName);
      
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
      <h2>Private Data (Ceramic)</h2>
      <div className="section-content">
        <div className="info-box" style={{ marginBottom: '1rem' }}>
          <p>
            <strong>Ceramic Network Integration:</strong> Your private data is securely stored on the Ceramic Network, 
            a decentralized data network built specifically for Web3 user data. This provides better privacy, security, 
            and user experience compared to our previous implementation.
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
