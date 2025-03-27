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

// Define document fields
interface DocumentField {
  id: string;
  label: string;
  placeholder: string;
}

const documentFields: DocumentField[] = [
  { id: 'birthCertificate', label: 'Birth Certificate', placeholder: 'Enter birth certificate number' },
  { id: 'passport', label: 'Passport', placeholder: 'Enter passport number' },
  { id: 'nationalId', label: 'National ID', placeholder: 'Enter national ID number' },
  { id: 'driversLicence', label: 'Driver\'s License', placeholder: 'Enter driver\'s license number' },
  { id: 'healthInsurance', label: 'Health Insurance', placeholder: 'Enter health insurance number' }
];

export const DocumentsSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const { switchNetwork } = useAppKitNetwork();
  const [isOptimismNetwork, setIsOptimismNetwork] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [db, setDb] = useState<Database | null>(null);
  const [tableName, setTableName] = useState<string>('');
  const [documentsData, setDocumentsData] = useState<PrivateData[]>([]);
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
        await loadDocumentsData(dbInstance, existingTableName);
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

  const loadDocumentsData = async (dbInstance: Database, tableName: string) => {
    try {
      setLoading(true);
      
      // Get all private data
      const allData = await getPrivateData(dbInstance, tableName);
      
      // Filter for document-related data
      const documentDataItems = allData.filter(item => 
        documentFields.some(field => field.id === item.key)
      );
      
      setDocumentsData(documentDataItems);
      
      // Populate form data from existing data
      const initialFormData: Record<string, string> = {};
      documentDataItems.forEach(item => {
        initialFormData[item.key] = item.value;
      });
      
      setFormData(initialFormData);
    } catch (err) {
      console.error('Error loading documents data:', err);
      setError('Failed to load documents data. Please try again.');
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

  const saveDocumentsData = async () => {
    if (!db || !tableName) {
      setError('Database not initialized. Please try again.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Save each field to the database
      for (const field of documentFields) {
        const value = formData[field.id] || '';
        
        // Check if this field already exists in the data
        const existingItem = documentsData.find(item => item.key === field.id);
        
        // Only save if there's a value or if we're updating an existing value
        if (value || existingItem) {
          await insertPrivateData(db, tableName, field.id, value);
        }
      }
      
      // Reload data to show updated values
      await loadDocumentsData(db, tableName);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving documents data:', err);
      setError('Failed to save documents data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="legal-section">
      <h2>My Documents</h2>
      
      {!isConnected ? (
        <div className="legal-content">
          <p>Please connect your wallet to manage your document information.</p>
        </div>
      ) : !isOptimismNetwork ? (
        <div className="legal-content">
          <p>Please switch to the Optimism network to use this feature.</p>
          <button onClick={handleSwitchToOptimism} className="button-primary">
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
              <button onClick={initTablelandDb} className="button-primary">
                Try Again
              </button>
            </div>
          ) : (
            <>
              {isEditing ? (
                <div className="documents-form">
                  {documentFields.map(field => (
                    <div key={field.id} className="form-group">
                      <label htmlFor={field.id}>{field.label}:</label>
                      <input
                        id={field.id}
                        type="text"
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="form-input"
                      />
                    </div>
                  ))}
                  
                  <div className="button-group">
                    <button 
                      onClick={saveDocumentsData} 
                      className="button-primary"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)} 
                      className="button-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="documents-display">
                  {documentsData.length > 0 ? (
                    <>
                      <div className="documents-fields">
                        {documentFields.map(field => {
                          const dataItem = documentsData.find(item => item.key === field.id);
                          const value = dataItem ? dataItem.value : '';
                          
                          // Only show fields that have values
                          if (!value) return null;
                          
                          return (
                            <div key={field.id} className="document-field">
                              <span className="field-label">{field.label}:</span>
                              <span className="field-value">{value}</span>
                            </div>
                          );
                        })}
                      </div>
                      <button 
                        onClick={() => setIsEditing(true)} 
                        className="button-primary"
                      >
                        Edit Documents
                      </button>
                    </>
                  ) : (
                    <div className="empty-state">
                      <p>You haven't added any document information yet.</p>
                      <button 
                        onClick={() => setIsEditing(true)} 
                        className="button-primary"
                      >
                        Add Document Information
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
