'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useCeramic } from '@/context/CeramicContext';
import { 
  DataType,
  PrivateData,
  checkCollectionExists,
  createCollection,
  getRecords,
  createRecord,
  clearCollection,
  TableData
} from '@/utils/ceramicUtils';

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
  const { ceramic, did, isInitialized, isLoading: ceramicLoading, error: ceramicError } = useCeramic();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [collectionId, setCollectionId] = useState<string>('');
  const [documentsData, setDocumentsData] = useState<TableData[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Define initCeramicCollection with useCallback to avoid dependency issues
  const initCeramicCollection = useCallback(async () => {
    try {
      if (!ceramic || !did) {
        setError('Ceramic not initialized or no DID available.');
        return;
      }

      setLoading(true);
      setError('');
      
      // Check if collection exists
      const collectionCheck = await checkCollectionExists(ceramic, DataType.DOCUMENTS, did);
      
      if (collectionCheck.exists) {
        // Use the collection ID from the check result
        setCollectionId(collectionCheck.collectionId);
        
        // Load existing data
        await loadDocumentsData(collectionCheck.collectionId);
      } else {
        // Create new collection
        const result = await createCollection(ceramic, DataType.DOCUMENTS, did);
        setCollectionId(result.collectionId);
      }
    } catch (err) {
      console.error('Error initializing Ceramic:', err);
      setError('Failed to initialize Ceramic. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [ceramic, did, setError, setLoading, setCollectionId]);
  
  // Initialize Ceramic when connected
  useEffect(() => {
    if (isConnected && address && isInitialized) {
      initCeramicCollection();
    }
  }, [isConnected, address, isInitialized, initCeramicCollection]);



  // Define loadDocumentsData function to load document data from Ceramic
  const loadDocumentsData = useCallback(async (collectionId: string) => {
    try {
      if (!ceramic) {
        setError('Ceramic not initialized.');
        return;
      }
      
      setLoading(true);
      
      // Get all documents data
      const records = await getRecords(ceramic, collectionId);
      
      // Convert records to the format expected by the component
      const formattedData: TableData[] = records.map((record, index) => ({
        id: index,
        key: record.id,
        value: typeof record.content === 'string' ? record.content : JSON.stringify(record.content),
        created_at: new Date().toISOString()
      }));
      
      setDocumentsData(formattedData);
      
      // Populate form data from existing data
      const initialFormData: Record<string, string> = {};
      records.forEach(record => {
        const content = record.content as Record<string, string>;
        if (content) {
          Object.keys(content).forEach(key => {
            initialFormData[key] = content[key];
          });
        }
      });
      
      setFormData(initialFormData);
    } catch (err) {
      console.error('Error loading documents data:', err);
      setError('Failed to load documents data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [ceramic, setLoading, setError, setDocumentsData, setFormData]);

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const saveDocumentsData = async () => {
    if (!ceramic || !collectionId) {
      setError('Ceramic not initialized. Please try again.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Clear existing collection
      await clearCollection(ceramic, collectionId);
      
      // Combine all field values into a single document record
      const documentData: Record<string, string> = {};
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          documentData[key] = formData[key];
        }
      });
      
      // Create a new record with all document data
      if (Object.keys(documentData).length > 0) {
        await createRecord(ceramic, DataType.DOCUMENTS, collectionId, documentData, ['document']);
      }
      
      // Reload data to show updated values
      await loadDocumentsData(collectionId);
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
      ) : (
        <div className="legal-content">
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
                        className="button-primary logged-in-button"
                      >
                        Edit Documents
                      </button>
                    </>
                  ) : (
                    <div className="empty-state">
                      <p>You haven't added any document information yet.</p>
                      <button 
                        onClick={() => setIsEditing(true)} 
                        className="button-primary logged-in-button"
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
