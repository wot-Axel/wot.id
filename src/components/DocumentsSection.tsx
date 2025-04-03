'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useCeramic } from '@/context/CeramicContext';
import { 
  DataType,
  DataRecord
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
  const { ceramic, isInitialized, isLoading: ceramicLoading, error: ceramicError, checkCollectionExists, createCollection, getData, insertData } = useCeramic();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [collectionId, setCollectionId] = useState<string>('');
  const [documentsData, setDocumentsData] = useState<DataRecord[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Initialize Ceramic when connected
  useEffect(() => {
    if (isConnected && address && isInitialized) {
      initCeramicCollection();
    }
  }, [isConnected, address, isInitialized]);

  const initCeramicCollection = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if collection exists
      const collectionCheck = await checkCollectionExists(DataType.DOCUMENTS);
      
      if (collectionCheck.exists) {
        // Use the collection ID from the check result
        setCollectionId(collectionCheck.collectionId);
        
        // Load existing data
        await loadDocumentsData(collectionCheck.collectionId);
      } else {
        // Create new collection
        const result = await createCollection(DataType.DOCUMENTS);
        setCollectionId(result.collectionId);
      }
    } catch (err) {
      console.error('Error initializing Ceramic:', err);
      setError('Failed to initialize Ceramic. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentsData = async (collectionId: string) => {
    try {
      setLoading(true);
      
      // Get all documents data
      const allData = await getData(DataType.DOCUMENTS, collectionId);
      
      // Filter for document-related data
      const documentDataItems = allData.filter((item: DataRecord) => 
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
    if (!ceramic || !collectionId) {
      setError('Ceramic not initialized. Please try again.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Save each field to the Ceramic collection
      for (const field of documentFields) {
        const value = formData[field.id] || '';
        
        // Check if this field already exists in the data
        const existingItem = documentsData.find(item => item.key === field.id);
        
        // Only save if there's a value or if we're updating an existing value
        if (value || existingItem) {
          await insertData(DataType.DOCUMENTS, collectionId, { key: field.id, value });
        }
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
