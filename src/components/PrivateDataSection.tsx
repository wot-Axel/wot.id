'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { 
  TableType,
  TableData
} from '@/utils/storageUtils';
import { useStorage } from '@/context/StorageContext';

export const PrivateDataSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [privateData, setPrivateData] = useState<TableData[]>([]);
  const [newKey, setNewKey] = useState<string>('');
  const [newValue, setNewValue] = useState<string>('');

  // Use the Storage context
  const storage = useStorage();
  
  // Load private data when connected
  useEffect(() => {
    const loadPrivateData = async () => {
      try {
        if (isConnected && address && storage.isReady) {
          setLoading(true);
          setError('');
          
          // Get existing data
          const records = await storage.listItems(TableType.PRIVATE);
          setPrivateData(records);
          
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error loading private data:', err);
        setError(err.message || 'Failed to load private data. Please try again.');
        setLoading(false);
      }
    };
    
    loadPrivateData();
  }, [isConnected, address, storage.isReady]);

  const handleAddData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storage.isReady || !newKey || !newValue) {
      setError('Missing required information. Please check all fields.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Store data using the storage system
      await storage.storeItem(TableType.PRIVATE, newKey, newValue);
      
      // Refresh data
      const records = await storage.listItems(TableType.PRIVATE);
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
    if (!storage.isReady) {
      setError('Storage system not initialized.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Our simple implementation doesn't support bulk delete
      // Just clear the local state for now
      setPrivateData([]);
      localStorage.removeItem(`${TableType.PRIVATE}_items`);
      
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
      <h2>Private Data</h2>
      <div className="section-content">
        <div className="info-box" style={{ marginBottom: '1rem' }}>
          <p>
            <strong>Secure Storage:</strong> Your private data is securely stored using encrypted local storage.
            In a future update, this will be integrated with a more robust decentralized storage solution.
          </p>
        </div>
          <>
            {error && <div className="alert alert-error">{error}</div>}
            
            {storage.isReady ? (
              <div>
                <p>Your private data is securely stored.</p>
                
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
                            <td>{item.item_key}</td>
                            <td>{item.item_value}</td>
                            <td>{item.created_at ? new Date(item.created_at).toLocaleString() : new Date().toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p>Storage system is initializing. Please wait a moment...</p>
              </div>
            )}
          </>
      </div>
    </div>
  );
};
