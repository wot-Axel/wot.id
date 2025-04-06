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
} from '@/composedb/ceramic';
import { useCeramic } from '@/context/CeramicContext';

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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [db, setDb] = useState<Database | null>(null);
  const [tableName, setTableName] = useState<string>('');
  const [assetsData, setAssetsData] = useState<PrivateData[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState<boolean>(false);

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

    // Load assets data when Ceramic is initialized
  useEffect(() => {
    const loadAssetsData = async () => {
      try {
        if (isInitialized && ceramic && did) {
          setLoading(true);
          
          // Check if collection exists
          const { exists, collectionId } = await checkCollectionExists(ceramic, DataType.REAL_WORLD_ASSETS, did);
          
          if (exists) {
            setTableName(collectionId);
            
            // Get existing data
            const records = await getRecords(ceramic, collectionId);
            
            // Convert records to the format expected by the component
            const formattedData: PrivateData[] = records.map((record, index) => ({
              id: String(index),
              type: DataType.REAL_WORLD_ASSETS,
              content: record.content,
              encrypted: false
            }));
            
            setAssetsData(formattedData);
            
            // Populate form data from existing records
            const initialFormData: Record<string, string> = {};
            records.forEach(record => {
              const content = record.content as Record<string, string>;
              Object.keys(content).forEach(key => {
                initialFormData[key] = content[key];
              });
            });
            
            setFormData(initialFormData);
          } else {
            // Create a new collection if it doesn't exist
            console.log('Creating new collection for real world assets');
            const result = await createCollection(ceramic, DataType.REAL_WORLD_ASSETS, did);
            setTableName(result.collectionId);
          }
          
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error loading real world assets data:', err);
        setError(err.message || 'Failed to load real world assets data. Please try again.');
        setLoading(false);
      }
    };
    
    loadAssetsData();
  }, [isInitialized, ceramic, did]);

  const handleCreateTable = async () => {
    if (!ceramic || !did) {
      setError('Ceramic not initialized or no DID available.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create a new collection for real world assets data
      const { collectionId } = await createCollection(ceramic, DataType.REAL_WORLD_ASSETS, did);
      setTableName(collectionId);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error creating collection:', err);
      setError(err.message || 'Failed to create collection. Please try again.');
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
    if (!ceramic || !did) {
      setError('Ceramic not initialized or no DID available.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Check if we have a table name, if not create a collection
      let currentTableName = tableName;
      if (!currentTableName) {
        console.log('No collection found, creating a new one');
        const result = await createCollection(ceramic, DataType.REAL_WORLD_ASSETS, did);
        currentTableName = result.collectionId;
        setTableName(currentTableName);
      }
      
      // Create a record with all asset data
      const assetData: Record<string, string> = {};
      
      // Only include fields that have values
      assetFields.forEach(field => {
        const value = formData[field.id];
        if (value) {
          assetData[field.id] = value;
        }
      });
      
      // Clear existing collection
      await clearCollection(ceramic, currentTableName);
      
      // Create a new record with all asset data
      if (Object.keys(assetData).length > 0) {
        console.log('Creating record with data:', assetData);
        await createRecord(ceramic, DataType.REAL_WORLD_ASSETS, currentTableName, assetData, ['asset']);
      }
      
      // Refresh data
      const records = await getRecords(ceramic, currentTableName);
      console.log('Retrieved records after save:', records);
      
      // Convert records to the format expected by the component
      const formattedData: PrivateData[] = records.map((record, index) => ({
        id: String(index),
        type: DataType.REAL_WORLD_ASSETS,
        content: record.content,
        encrypted: false
      }));
      
      setAssetsData(formattedData);
      setIsEditing(false);
      setLoading(false);
    } catch (err: any) {
      console.error('Error saving assets data:', err);
      setError(err.message || 'Failed to save assets data. Please try again.');
      setLoading(false);
    }
  };

  const handleClearAssets = async () => {
    if (!ceramic || !tableName) {
      setError('Ceramic not initialized or no collection available.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Clear the collection
      await clearCollection(ceramic, tableName);
      
      // Reset data
      setAssetsData([]);
      setFormData({});
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error clearing assets data:', err);
      setError(err.message || 'Failed to clear assets data. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="legal-section">
      <h2>My Real World Assets</h2>
      
      {!isConnected ? (
        <div className="section-content">
          <p>Please connect your wallet to manage your real world assets information.</p>
        </div>
      ) : (
        <div className="section-content">
          <div className="info-box" style={{ marginBottom: '1rem' }}>
            <p>
              <strong>Tableland Integration:</strong> Your real-world assets data is securely stored on Tableland, 
              a decentralized SQL database for Web3. This provides better reliability, performance, 
              and compatibility with server-side rendering compared to our previous implementation.
            </p>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => connect()} className="button-primary logged-in-button">
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
                          const dataItem = assetsData.find(item => {
                            if (typeof item.content === 'object' && item.content !== null) {
                              return field.id in item.content;
                            }
                            return false;
                          });
                          
                          const value = dataItem && typeof dataItem.content === 'object' && dataItem.content !== null
                            ? dataItem.content[field.id]
                            : '';
                          
                          // Only show fields that have values
                          if (!value) return null;
                          
                          return (
                            <div key={field.id} className="asset-field">
                              <span className="field-label">{field.label}:</span>
                              <span className="field-value">{typeof value === 'string' ? value : JSON.stringify(value)}</span>
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
