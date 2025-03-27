'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { optimism } from '@reown/appkit/networks';
import { 
  initTableland, 
  createPrivateTable, 
  insertPrivateData, 
  getPrivateData,
  checkTableExists,
  type PrivateData
} from '@/utils/tablelandUtils';
import { Database } from '@tableland/sdk';

// Define identity fields
interface IdentityField {
  id: string;
  label: string;
  placeholder: string;
}

const identityFields: IdentityField[] = [
  { id: 'firstName', label: 'First Name', placeholder: 'Enter your first name' },
  { id: 'middleName', label: 'Middle Name', placeholder: 'Enter your middle name' },
  { id: 'familyName', label: 'Family Name', placeholder: 'Enter your family name' },
  { id: 'nicknames', label: 'Nicknames', placeholder: 'Enter your nicknames (comma separated)' },
  { id: 'dateOfBirth', label: 'Date of Birth', placeholder: 'YYYY-MM-DD' },
  { id: 'placeOfBirth', label: 'Place of Birth', placeholder: 'Enter your place of birth' },
  { id: 'city', label: 'City', placeholder: 'Enter your city' },
  { id: 'region', label: 'Province/State/Region', placeholder: 'Enter your province, state, or region' },
  { id: 'country', label: 'Country', placeholder: 'Enter your country' }
];

export const IdentitySection = () => {
  const { address, isConnected } = useAppKitAccount();
  const { switchNetwork } = useAppKitNetwork();
  const [isOptimismNetwork, setIsOptimismNetwork] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [db, setDb] = useState<Database | null>(null);
  const [tableName, setTableName] = useState<string>('');
  const [identityData, setIdentityData] = useState<PrivateData[]>([]);
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
      const exists = await checkTableExists(dbInstance, address || '');
      
      if (exists) {
        // Get existing table name
        const existingTableName = `wot_private_${address?.substring(2, 10).toLowerCase()}`;
        setTableName(existingTableName);
        
        // Load existing data
        await loadIdentityData(dbInstance, existingTableName);
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

  const loadIdentityData = async (dbInstance: Database, tableName: string) => {
    try {
      setLoading(true);
      
      // Get all private data
      const allData = await getPrivateData(dbInstance, tableName);
      
      // Filter for identity-related data
      const identityDataItems = allData.filter(item => 
        identityFields.some(field => field.id === item.key)
      );
      
      setIdentityData(identityDataItems);
      
      // Populate form data from existing data
      const initialFormData: Record<string, string> = {};
      identityDataItems.forEach(item => {
        initialFormData[item.key] = item.value;
      });
      
      setFormData(initialFormData);
    } catch (err) {
      console.error('Error loading identity data:', err);
      setError('Failed to load identity data. Please try again.');
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

  const saveIdentityData = async () => {
    if (!db || !tableName) {
      setError('Database not initialized. Please try again.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Save each field to the database
      for (const field of identityFields) {
        const value = formData[field.id] || '';
        
        // Check if this field already exists in the data
        const existingItem = identityData.find(item => item.key === field.id);
        
        // Only save if there's a value or if we're updating an existing value
        if (value || existingItem) {
          await insertPrivateData(db, tableName, field.id, value);
        }
      }
      
      // Reload data to show updated values
      await loadIdentityData(db, tableName);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving identity data:', err);
      setError('Failed to save identity data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="legal-section">
      <h2>My Identity</h2>
      
      {!isConnected ? (
        <div className="legal-content">
          <p>Please connect your wallet to manage your identity information.</p>
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
                <div className="identity-form">
                  {identityFields.map(field => (
                    <div key={field.id} className="form-group">
                      <label htmlFor={field.id}>{field.label}:</label>
                      <input
                        id={field.id}
                        type={field.id === 'dateOfBirth' ? 'date' : 'text'}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="form-input"
                      />
                    </div>
                  ))}
                  
                  <div className="button-group">
                    <button 
                      onClick={saveIdentityData} 
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
                <div className="identity-display">
                  {identityData.length > 0 ? (
                    <>
                      <div className="identity-fields">
                        {identityFields.map(field => {
                          const dataItem = identityData.find(item => item.key === field.id);
                          const value = dataItem ? dataItem.value : '';
                          
                          // Only show fields that have values
                          if (!value) return null;
                          
                          return (
                            <div key={field.id} className="identity-field">
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
                        Edit Identity
                      </button>
                    </>
                  ) : (
                    <div className="empty-state">
                      <p>You haven't added any identity information yet.</p>
                      <button 
                        onClick={() => setIsEditing(true)} 
                        className="button-primary logged-in-button"
                      >
                        Add Identity Information
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
