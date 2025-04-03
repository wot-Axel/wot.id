'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useCeramic } from '@/context/CeramicContext';
import { 
  DataType,
  DataRecord
} from '@/utils/ceramicUtils';

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
  const { ceramic, isInitialized, isLoading: ceramicLoading, error: ceramicError, checkCollectionExists, createCollection, getData, insertData } = useCeramic();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [collectionId, setCollectionId] = useState<string>('');
  const [assetsData, setAssetsData] = useState<DataRecord[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState<boolean>(false);

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
      const collectionCheck = await checkCollectionExists(DataType.REAL_WORLD_ASSETS);
      
      if (collectionCheck.exists) {
        // Use the collection ID from the check result
        setCollectionId(collectionCheck.collectionId);
        
        // Load existing data
        await loadAssetsData(collectionCheck.collectionId);
      } else {
        // Create new collection
        const result = await createCollection(DataType.REAL_WORLD_ASSETS);
        setCollectionId(result.collectionId);
      }
    } catch (err) {
      console.error('Error initializing Ceramic:', err);
      setError('Failed to initialize Ceramic. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAssetsData = async (collectionId: string) => {
    try {
      setLoading(true);
      
      // Get all assets data
      const allData = await getData(DataType.REAL_WORLD_ASSETS, collectionId);
      
      // Filter for asset-related data
      const assetDataItems = allData.filter((item: DataRecord) => 
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
    if (!ceramic || !collectionId) {
      setError('Ceramic not initialized. Please try again.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Save each field to the Ceramic collection
      for (const field of assetFields) {
        const value = formData[field.id] || '';
        
        // Check if this field already exists in the data
        const existingItem = assetsData.find(item => item.key === field.id);
        
        // Only save if there's a value or if we're updating an existing value
        if (value || existingItem) {
          await insertData(DataType.REAL_WORLD_ASSETS, collectionId, { key: field.id, value });
        }
      }
      
      // Reload data to show updated values
      await loadAssetsData(collectionId);
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
        <div className="section-content">
          <p>Please connect your wallet to manage your real world assets information.</p>
        </div>
      ) : (
        <div className="section-content">
          <div className="info-box" style={{ marginBottom: '1rem' }}>
            <p>
              <strong>Ceramic Network:</strong> Your real world assets data is securely stored on the Ceramic Network, 
              a decentralized data network built specifically for Web3 applications. Ceramic provides better 
              performance, lower costs, and enhanced privacy for your asset information.
            </p>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={initCeramicCollection} className="button-primary logged-in-button">
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
