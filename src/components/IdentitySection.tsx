'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { optimism } from '@reown/appkit/networks';
import dynamic from 'next/dynamic';
import { 
  initTableland, 
  createPrivateTable, 
  insertPrivateData, 
  getPrivateData,
  checkPrivateTableExists,
  type PrivateData
} from '@/utils/tablelandUtils';
import { Database } from '@tableland/sdk';

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
  const { switchNetwork } = useAppKitNetwork();
  const [isOptimismNetwork, setIsOptimismNetwork] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [db, setDb] = useState<Database | null>(null);
  const [tableName, setTableName] = useState<string>('');
  const [identityData, setIdentityData] = useState<PrivateData[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

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
        await loadIdentityData(dbInstance, tableCheck.tableName);
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
        <div className="section-content">
          <p>Please connect your wallet to manage your identity information.</p>
        </div>
      ) : (
        <div className="section-content">
          <div className="info-box" style={{ marginBottom: '1rem' }}>
            <p>
              <strong>Multi-Chain Support:</strong> Your identity data is securely stored on Optimism for cost efficiency, 
              while your wallet remains connected to your preferred network. Our cross-chain technology handles all network 
              interactions behind the scenes - no network switching required.
            </p>
          </div>
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
