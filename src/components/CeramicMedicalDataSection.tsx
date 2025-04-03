'use client';

import React, { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useCeramic } from '../context/CeramicContext';

/**
 * Minimal implementation of the CeramicMedicalDataSection component
 * This is a placeholder version that will build in production without external dependencies
 */
const CeramicMedicalDataSection = () => {
  const { isConnected } = useAppKitAccount();
  const { isInitialized, isLoading: ceramicLoading, error: ceramicError } = useCeramic();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [importedData, setImportedData] = useState<boolean>(false);

  // Display a message about Ceramic Network
  const renderCeramicInfo = () => {
    return (
      <div className="info-box" style={{ marginBottom: '1rem' }}>
        <p>
          <strong>Ceramic Network:</strong> Your medical data is securely stored on the Ceramic Network,
          a decentralized data network built specifically for Web3 applications. Ceramic provides better
          performance, lower costs, and enhanced privacy for your sensitive medical information.
        </p>
      </div>
    );
  };

  // Mock data sections for the medical data table
  const getMedicalDataSections = () => {
    // This would normally fetch data from Ceramic
    // For now, we return an empty array for each section
    return {
      'Basic Blood Tests': [],
      'Kidney Function': [],
      'Electrolytes': [],
      'Lipid Profile': [],
      'Inflammation Markers': [],
      'Thyroid Function': [],
      'Blood Cell Count': [],
      'Immune Proteins': [],
      'COVID-19 Tests': [],
      'Additional Values': [],
      'Urinalysis': []
    };
  };

  // Handle importing medical data
  const handleImportMedicalData = () => {
    setImportedData(true);
  };

  // Handle clearing medical data
  const handleClearMedicalData = () => {
    setImportedData(false);
  };

  // Render the component
  return (
    <div className="legal-section">
      <h2>Medical Data</h2>
      {renderCeramicInfo()}
      
      {ceramicLoading || loading ? (
        <p>Loading medical data...</p>
      ) : ceramicError || error ? (
        <p className="error-message">{ceramicError || error}</p>
      ) : isConnected && isInitialized ? (
        <div>
          {/* Medical data import form */}
          <div className="form-section">
            <h3>Import Medical Data</h3>
            <p>Import your medical data from a CSV file or enter it manually.</p>
            
            {/* Import buttons */}
            <div className="button-group">
              <button 
                className="button-primary"
                onClick={handleImportMedicalData}
                disabled={loading || importedData}
              >
                Import Sample Data
              </button>
              <button className="button-primary" disabled>
                Enter Manually (Coming Soon)
              </button>
            </div>
          </div>
          
          {/* Display medical data */}
          {importedData ? (
            <div className="data-section">
              <h3>Your Medical Data</h3>
              {Object.entries(getMedicalDataSections()).map(([sectionTitle, data]) => (
                <div key={sectionTitle} className="medical-data-section">
                  <div className="section-container">
                    <h4>{sectionTitle}</h4>
                    <div className="section-data">
                      <p>No data available for this section yet.</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No medical data found. Import your data to get started.</p>
          )}
          
          {/* Clear data button */}
          {importedData && (
            <div className="button-group">
              <button 
                className="button-secondary" 
                onClick={handleClearMedicalData}
                disabled={loading}
              >
                Clear Medical Data
              </button>
            </div>
          )}
        </div>
      ) : (
        <p>Connect your wallet to access your medical data.</p>
      )}
    </div>
  );
};

export default CeramicMedicalDataSection;
export { CeramicMedicalDataSection };
