'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useDataAccess } from '@/hooks/useDataAccess';
import { DataType } from '@/utils/ceramicUtils';

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
  const { 
    data: assetsData, 
    isLoading: dataLoading, 
    error: dataError, 
    createItem, 
    updateItem, 
    refreshData: fetchData,
    clearItems
  } = useDataAccess(DataType.REAL_WORLD_ASSETS);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Initialize data access when needed
  const initDataAccess = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch data using the useDataAccess hook
      await fetchData();
    } catch (err: any) {
      console.error('Error initializing data access:', err);
      setError(err.message || 'Failed to initialize data access. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchData]);
  
  // Initialize data access when connected
  useEffect(() => {
    if (isConnected && address && !loading && !dataLoading) {
      initDataAccess();
    }
  }, [isConnected, address, loading, dataLoading, initDataAccess]);

  // Process assets data when it changes
  useEffect(() => {
    if (assetsData && assetsData.length > 0) {
      try {
        // Extract form data from records
        const extractedData: Record<string, string> = {};
        
        assetsData.forEach(record => {
          try {
            if (record.key && record.value) {
              // For simple key-value pairs
              extractedData[record.key] = record.value;
              
              // Also try to parse JSON values
              try {
                const parsedValue = JSON.parse(record.value);
                if (typeof parsedValue === 'object' && parsedValue !== null) {
                  Object.entries(parsedValue).forEach(([key, value]) => {
                    if (typeof value === 'string') {
                      extractedData[key] = value;
                    }
                  });
                }
              } catch (e) {
                // Not JSON, use as is
              }
            }
          } catch (e) {
            console.error('Error processing record:', e);
          }
        });
        
        setFormData(extractedData);
      } catch (err) {
        console.error('Error processing assets data:', err);
      }
    }
  }, [assetsData]);



  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const saveAssetsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First clear existing items to avoid duplicates
      await clearItems();
      
      // Create or update data for each form field
      for (const [key, value] of Object.entries(formData)) {
        if (value) {
          // Create new item for each field with value
          await createItem({ [key]: value });
        }
      }
      
      // Reload data
      await fetchData();
      
      // Exit edit mode
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error saving assets data:', err);
      setError(err.message || 'Failed to save assets data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAssets = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Clear all items
      await clearItems();
      
      // Reset form data
      setFormData({});
    } catch (err: any) {
      console.error('Error clearing assets data:', err);
      setError(err.message || 'Failed to clear assets data. Please try again.');
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
              <strong>Tableland Integration:</strong> Your real-world assets data is securely stored on Tableland, 
              a decentralized SQL database for Web3. This provides better reliability, performance, 
              and compatibility with server-side rendering compared to our previous implementation.
            </p>
          </div>
          {loading || dataLoading ? (
            <p>Loading...</p>
          ) : error || dataError ? (
            <div className="error-message">
              <p>{error || dataError}</p>
              <button onClick={initDataAccess} className="button-primary logged-in-button">
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
                          // Look for the field in form data
                          const value = formData[field.id] || '';
                          
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
