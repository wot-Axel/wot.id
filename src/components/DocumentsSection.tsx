'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useDataAccess, DataType } from '@/hooks/useDataAccess';
import { TableData } from '@/utils/tablelandUtils';

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
  const { 
    data: documentsData, 
    isLoading, 
    error: dataError,
    createItem,
    updateItem,
    deleteItem,
    refreshData
  } = useDataAccess(DataType.DOCUMENTS);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Initialize form data from documents data when it changes
  useEffect(() => {
    if (documentsData && documentsData.length > 0) {
      const initialFormData: Record<string, string> = {};
      
      documentsData.forEach(record => {
        if (record.content) {
          Object.keys(record.content).forEach(key => {
            initialFormData[key] = record.content[key];
          });
        }
      });
      
      setFormData(initialFormData);
    }
  }, [documentsData]);
  


  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const saveDocumentsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Combine all field values into a single document record
      const documentData: Record<string, string> = {};
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          documentData[key] = formData[key];
        }
      });
      
      // Check if we have existing data to update or need to create new
      if (documentsData && documentsData.length > 0) {
        // Update existing record
        await updateItem(documentsData[0].id, documentData, ['document']);
      } else if (Object.keys(documentData).length > 0) {
        // Create a new record with all document data
        await createItem(documentData, ['document']);
      }
      
      // Refresh data
      await refreshData();
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
        <div className="section-content">
          <p>Please connect your wallet to manage your document information.</p>
        </div>
      ) : (
        <div className="section-content">
          {loading || isLoading ? (
            <p>Loading...</p>
          ) : error || dataError ? (
            <div className="error-message">
              <p>{error || dataError}</p>
              <button onClick={refreshData} className="button-primary logged-in-button">
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
