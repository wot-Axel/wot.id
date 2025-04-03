'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { optimism } from '@reown/appkit/networks';
import { 
  initTableland, 
  createPrivateTable, 
  insertPrivateData, 
  getPrivateData,
  checkPrivateTableExists,
  type PrivateData
} from '@/utils/tablelandUtils';
import { Database } from '@tableland/sdk';

// Define asset fields
interface AssetField {
  id: string;
  label: string;
  placeholder: string;
}

const assetFields: AssetField[] = [
  { id: 'realEstate', label: 'Real Estate', placeholder: 'Enter property details' },
  { id: 'vehicles', label: 'Vehicles', placeholder: 'Enter vehicle details' },
  { id: 'artwork', label: 'Artwork', placeholder: 'Enter artwork details' },
  { id: 'collectibles', label: 'Collectibles', placeholder: 'Enter collectible details' },
  { id: 'jewelry', label: 'Jewelry', placeholder: 'Enter jewelry details' }
];

export const RealWorldAssetsSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const { switchNetwork } = useAppKitNetwork();
  const [isOptimismNetwork, setIsOptimismNetwork] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [db, setDb] = useState<Database | null>(null);
  const [tableName, setTableName] = useState<string>('');
  const [assetsData, setAssetsData] = useState<PrivateData[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Check network and initialize Tableland
  useEffect(() => {
    if (isConnected && address) {
      // We'll assume we're on Optimism for the mock implementation
      setIsOptimismNetwork(true);
      initTablelandDb();
    }
  }, [isConnected, address]);

  // Function to switch to Optimism network
  const handleSwitchToOptimism = () => {
    switchNetwork(optimism);
    setIsOptimismNetwork(true);
  };

  const initTablelandDb = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Initialize Tableland
      const dbInstance = await initTableland();
      setDb(dbInstance);
      
      // Check if table exists
      const tableCheck = await checkPrivateTableExists(dbInstance, address || '');
      
      if (tableCheck.exists) {
        // Use the table name from the check result
        setTableName(tableCheck.tableName);
        
        // Load existing data
        await loadAssetsData(dbInstance, tableCheck.tableName);
      } else {
        // Create new table
        const newTableName = await createPrivateTable(dbInstance, address || '');
        setTableName(newTableName);
      }
    } catch (err) {
      console.error('Error initializing Tableland:', err);
      setError('Failed to initialize database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAssetsData = async (dbInstance: Database, tableName: string) => {
    try {
      setLoading(true);
      
      // Get all private data
      const allData = await getPrivateData(dbInstance, tableName);
      
      // Filter for asset-related data
      const assetDataItems = allData.filter(item => 
        assetFields.some(field => field.id === item.key)
      );
      
      setAssetsData(assetDataItems);
      
      // Populate form data from existing data
      const initialFormData: Record<string, string> = {};
      assetDataItems.forEach(item => {
        initialFormData[item.key] = item.value;
      });
      
      setFormData(initialFormData);
    } catch (err) {
      console.error('Error loading assets data:', err);
      setError('Failed to load assets data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const saveAssetsData = async () => {
    if (!db || !tableName) {
      setError('Database not initialized. Please try again.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Save each field to the database
      for (const field of assetFields) {
        const value = formData[field.id] || '';
        
        // Check if this field already exists in the data
        const existingItem = assetsData.find(item => item.key === field.id);
        
        // Only save if there's a value or if we're updating an existing value
        if (value || existingItem) {
          await insertPrivateData(db, tableName, field.id, value);
        }
      }
      
      // Reload data to show updated values
      await loadAssetsData(db, tableName);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving assets data:', err);
      setError('Failed to save assets data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="legal-section">
      <h2>My Real World Assets</h2>
      
      {!isConnected ? (
        <div className="legal-content">
          <p>Please connect your wallet to manage your real world assets information.</p>
        </div>
      ) : !isOptimismNetwork ? (
        <div className="legal-content">
          <p>Please switch to the Optimism network to use this feature.</p>
          <button onClick={handleSwitchToOptimism} className="button-primary logged-in-button">
            Switch to Optimism
          </button>
        </div>
      ) : (
        <div className="legal-content">
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={initTablelandDb} className="button-primary logged-in-button">
                Try Again
              </button>
            </div>
          ) : (
            <>
              {isEditing ? (
                <div className="assets-form">
                  {assetFields.map(field => (
                    <div key={field.id} className="form-group">
                      <label htmlFor={field.id}>{field.label}:</label>
                      <textarea
                        id={field.id}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="form-input"
                        rows={3}
                      />
                    </div>
                  ))}
                  
                  <div className="button-group">
                    <button 
                      onClick={saveAssetsData} 
                      className="button-primary logged-in-button"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)} 
                      className="button-secondary logged-in-button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="assets-display">
                  {assetsData.length > 0 ? (
                    <>
                      <div className="assets-fields">
                        {assetFields.map(field => {
                          const dataItem = assetsData.find(item => item.key === field.id);
                          const value = dataItem ? dataItem.value : '';
                          
                          // Only show fields that have values
                          if (!value) return null;
                          
                          return (
                            <div key={field.id} className="asset-field">
                              <span className="field-label">{field.label}:</span>
                              <span className="field-value">{value}</span>
                            </div>
                          );
                        })}
                      </div>
                      <button 
                        onClick={() => setIsEditing(true)} 
                        className="button-primary logged-in-button"
                      >
                        Edit Assets
                      </button>
                    </>
                  ) : (
                    <div className="empty-state">
                      <p>You haven't added any real world assets information yet.</p>
                      <button 
                        onClick={() => setIsEditing(true)} 
                        className="button-primary logged-in-button"
                      >
                        Add Assets Information
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
