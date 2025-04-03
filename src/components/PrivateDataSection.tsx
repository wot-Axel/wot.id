'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useCeramic } from '@/context/CeramicContext';
import { 
  DataType,
  DataRecord
} from '../utils/ceramicUtils';

export const PrivateDataSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const { ceramic, isInitialized, isLoading: ceramicLoading, error: ceramicError, checkCollectionExists, createCollection, getData, insertData, clearData } = useCeramic();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [collectionId, setCollectionId] = useState<string>('');
  const [privateData, setPrivateData] = useState<DataRecord[]>([]);
  const [newKey, setNewKey] = useState<string>('');
  const [newValue, setNewValue] = useState<string>('');

  // Initialize Ceramic when connected
  useEffect(() => {
    if (isConnected && address && isInitialized) {
      initCeramicCollection();
    }
  }, [isConnected, address, isInitialized]);

  // No longer needed as we use cross-chain signing
  // Keeping this commented for reference
  /*
  const handleSwitchToOptimism = () => {
    switchNetwork(optimism);
    setIsOptimismNetwork(true);
  };
  */

  const initCeramicCollection = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if collection exists
      const collectionCheck = await checkCollectionExists(DataType.PRIVATE);
      
      if (collectionCheck.exists) {
        setCollectionId(collectionCheck.collectionId);
        // Load existing data
        const data = await getData(DataType.PRIVATE, collectionCheck.collectionId);
        setPrivateData(data);
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error initializing Ceramic');
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!ceramic || !isInitialized) return;
    
    try {
      setLoading(true);
      setError('');
      
      const result = await createCollection(DataType.PRIVATE);
      setCollectionId(result.collectionId);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error creating collection');
      setLoading(false);
    }
  };

  const handleAddData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ceramic || !collectionId || !newKey || !newValue) return;
    
    try {
      setLoading(true);
      setError('');
      
      await insertData(DataType.PRIVATE, collectionId, { key: newKey, value: newValue });
      
      // Refresh data
      const data = await getData(DataType.PRIVATE, collectionId);
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
    if (!ceramic || !collectionId) return;
    
    try {
      setLoading(true);
      setError('');
      
      await clearData(DataType.PRIVATE, collectionId);
      
      // Refresh data
      const data = await getData(DataType.PRIVATE, collectionId);
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
      <h2>Private Data (Ceramic)</h2>
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
            
            {!collectionId ? (
              <div>
                <p>You don't have a private data collection yet. Create one to store your private data on Ceramic.</p>
                <button 
                  className="button-primary" 
                  onClick={handleCreateCollection}
                  disabled={loading || ceramicLoading}
                >
                  {loading ? 'Creating...' : 'Create Private Collection'}
                </button>
              </div>
            ) : (
              <div>
                <p>Your private data is stored securely on the Ceramic Network.</p>
                
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
                            <td>{new Date().toLocaleString()}</td>
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
