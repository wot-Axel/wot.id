'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit-controllers/react';
import dynamic from 'next/dynamic';
import { useDataAccess, DataType } from '@/hooks/useDataAccess';

// Define a common interface for data records
interface DataRecord {
  id: string;
  key?: string;
  value?: string;
  created_at?: string;
}

// Dynamically import the ScannerModal component with no SSR
const ScannerModal = dynamic(() => import('./ScannerModal'), {
  ssr: false,
  loading: () => <div className="loading-scanner">Loading scanner...</div>
});

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
  const { 
    data: identityData, 
    isLoading: dataLoading, 
    error: dataError, 
    createItem, 
    updateItem, 
    refreshData: fetchData 
  } = useDataAccess(DataType.PROFILE);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  // Initialize data access when needed
  const initDataAccess = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch data using the useDataAccess hook
      await fetchData();
    } catch (err) {
      console.error('Error initializing data access:', err);
      setError('Failed to initialize data access. Please try again.');
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



  // Process identity data when it changes
  useEffect(() => {
    if (identityData && identityData.length > 0) {
      try {
        // Extract form data from records
        const extractedData: Record<string, string> = {};
        
        identityData.forEach(record => {
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
        console.error('Error processing identity data:', err);
      }
    }
  }, [identityData]);

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Handle opening the scanner
  const handleOpenScanner = () => {
    setIsScannerOpen(true);
  };

  // Handle scanner close
  const handleCloseScanner = () => {
    setIsScannerOpen(false);
  };

  // Process scanned ID document data
  const handleScanSuccess = (data: string, type: 'qrcode' | 'document') => {
    if (type === 'document') {
      // Parse the scanned document text to extract identity information
      const extractedData = parseIdDocumentText(data);
      
      // Update form data with extracted information
      setFormData(prev => ({
        ...prev,
        ...extractedData
      }));
      
      // Close scanner and open edit form
      setIsScannerOpen(false);
      setIsEditing(true);
    } else {
      // For QR codes, we might handle differently or show an error
      setError('Please scan an ID document instead of a QR code');
      setIsScannerOpen(false);
    }
  };

  // Parse scanned text to extract identity information
  const parseIdDocumentText = (text: string): Record<string, string> => {
    const extractedData: Record<string, string> = {};
    
    // Try to extract name (usually in format: LAST, FIRST MIDDLE)
    const nameMatch = text.match(/([A-Z]+),\s*([A-Z]+)\s*([A-Z]*)/i);
    if (nameMatch) {
      extractedData.familyName = nameMatch[1].trim();
      extractedData.firstName = nameMatch[2].trim();
      if (nameMatch[3]) extractedData.middleName = nameMatch[3].trim();
    }
    
    // Try to extract date of birth (format: DD.MM.YYYY or similar)
    const dobMatch = text.match(/(\d{2}[.-/]\d{2}[.-/]\d{4})/i);
    if (dobMatch) {
      // Convert to YYYY-MM-DD format
      const dobParts = dobMatch[1].split(/[.-/]/);
      if (dobParts.length === 3) {
        // Assuming DD.MM.YYYY format
        extractedData.dateOfBirth = `${dobParts[2]}-${dobParts[1]}-${dobParts[0]}`;
      }
    }
    
    // Try to extract country
    const countryMatch = text.match(/(?:country|nationality|nation)\s*[:\s]\s*([A-Za-z\s]+)/i);
    if (countryMatch) {
      extractedData.country = countryMatch[1].trim();
    }
    
    // Try to extract city/place of birth
    const pobMatch = text.match(/(?:place\s*of\s*birth|born\s*in)\s*[:\s]\s*([A-Za-z\s]+)/i);
    if (pobMatch) {
      extractedData.placeOfBirth = pobMatch[1].trim();
    }
    
    return extractedData;
  };

  const saveIdentityData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Create or update data for each form field
      for (const [key, value] of Object.entries(formData)) {
        if (value) {
          // Find if this key already exists
          const existingItem = identityData.find(item => item.key === key);
          
          if (existingItem) {
            // Update existing item
            await updateItem(existingItem.id, { [key]: value });
          } else {
            // Create new item
            await createItem({ [key]: value });
          }
        }
      }
      
      // Reload data
      await fetchData();
      
      // Exit edit mode
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
        <div className="section-content">
          <p>Please connect your wallet to manage your identity information.</p>
        </div>
      ) : (
        <div className="section-content">
          <div className="info-box" style={{ marginBottom: '1rem' }}>
            <p>
              <strong>Decentralized Storage:</strong> Your identity data is securely stored using Gun.js, 
              a decentralized SQL database for Web3. This provides better reliability, performance, 
              and compatibility with server-side rendering for your sensitive identity information.
            </p>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={initDataAccess} className="button-primary logged-in-button">
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
                          const dataItem = identityData.find(item => item.name === field.id);
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
                      <div className="button-group">
                        <button 
                          onClick={() => setIsEditing(true)} 
                          className="button-primary logged-in-button"
                        >
                          Edit Identity
                        </button>
                        <button 
                          onClick={handleOpenScanner} 
                          className="button-secondary logged-in-button"
                        >
                          Scan ID
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="empty-state">
                      <p>You haven't added any identity information yet.</p>
                      <div className="button-group">
                        <button 
                          onClick={() => setIsEditing(true)} 
                          className="button-primary logged-in-button"
                        >
                          Add Identity Information
                        </button>
                        <button 
                          onClick={handleOpenScanner} 
                          className="button-secondary logged-in-button"
                        >
                          Scan ID
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Scanner Modal */}
              <ScannerModal 
                isOpen={isScannerOpen} 
                onClose={handleCloseScanner} 
                onScanSuccess={handleScanSuccess}
                scannerType="document"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};
