'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useCeramic } from '@/context/CeramicContext';
import { 
  DataType,
  DataRecord
} from '@/utils/ceramicUtils';

export const OrganizationalAffiliationsSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const { ceramic, isInitialized, isLoading: ceramicLoading, error: ceramicError, checkCollectionExists, createCollection, getData, insertData, clearData } = useCeramic();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [collectionId, setCollectionId] = useState<string>('');
  const [affiliationsData, setAffiliationsData] = useState<DataRecord[]>([]);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');

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
      const collectionCheck = await checkCollectionExists(DataType.AFFILIATIONS);
      
      if (collectionCheck.exists) {
        setCollectionId(collectionCheck.collectionId);
        // Load existing data
        const data = await getData(DataType.AFFILIATIONS, collectionCheck.collectionId);
        setAffiliationsData(data);
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error initializing Ceramic');
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!ceramic || !isInitialized) return;
    
    try {
      setLoading(true);
      setError('');
      
      const result = await createCollection(DataType.AFFILIATIONS);
      setCollectionId(result.collectionId);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error creating collection');
      setLoading(false);
    }
  };

  const handleAddAffiliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ceramic || !collectionId || !organizationName) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Format the data as JSON to store all fields together
      const affiliationData = JSON.stringify({
        organizationName,
        role,
        startDate,
        endDate,
        description
      });
      
      await insertData(DataType.AFFILIATIONS, collectionId, { key: organizationName, value: affiliationData });
      
      // Refresh data
      const data = await getData(DataType.AFFILIATIONS, collectionId);
      setAffiliationsData(data);
      
      // Clear form
      setOrganizationName('');
      setRole('');
      setStartDate('');
      setEndDate('');
      setDescription('');
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error adding affiliation data');
      setLoading(false);
    }
  };

  const handleClearAffiliationsData = async () => {
    if (!ceramic || !collectionId) return;
    
    try {
      setLoading(true);
      setError('');
      
      await clearData(DataType.AFFILIATIONS, collectionId);
      
      // Refresh data
      const data = await getData(DataType.AFFILIATIONS, collectionId);
      setAffiliationsData(data);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error clearing affiliations data');
      setLoading(false);
    }
  };

  // Parse the JSON data from the value field
  const parseAffiliationData = (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch (err) {
      return { organizationName: '', role: '', startDate: '', endDate: '', description: '' };
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="legal-section">
      <h2>My Organizational Affiliations</h2>
      <div className="section-content">
        <div className="info-box" style={{ marginBottom: '1rem' }}>
          <p>
            <strong>Multi-Chain Support:</strong> Your organizational affiliations data is securely stored on Optimism for cost efficiency, 
            while your wallet remains connected to your preferred network. Our cross-chain technology handles all network 
            interactions behind the scenes - no network switching required.
          </p>
        </div>
          <>
            {error && <div className="alert alert-error">{error}</div>}
            
            {!collectionId ? (
              <div>
                <p>You don't have an affiliations collection yet. Create one to store your organizational affiliations securely on Ceramic.</p>
                <button 
                  className="button-primary" 
                  onClick={handleCreateCollection}
                  disabled={loading || ceramicLoading}
                >
                  {loading ? 'Creating...' : 'Create Affiliations Collection'}
                </button>
              </div>
            ) : (
              <div>
                <p>Your organizational affiliations are stored securely on the Ceramic Network.</p>
                
                <form onSubmit={handleAddAffiliation} className="private-data-form">
                  <div className="form-group">
                    <label htmlFor="organizationName">Organization Name:</label>
                    <input
                      type="text"
                      id="organizationName"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      required
                      placeholder="Company, organization, or group name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="role">Your Role:</label>
                    <input
                      type="text"
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Your position or role (optional)"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="startDate">Start Date:</label>
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="When you joined"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="endDate">End Date:</label>
                    <input
                      type="date"
                      id="endDate"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="When you left (leave blank if current)"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="description">Description:</label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Additional details about your affiliation"
                      rows={3}
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="button-primary"
                    disabled={loading || !organizationName}
                  >
                    {loading ? 'Adding...' : 'Add Affiliation'}
                  </button>
                </form>
                
                <div style={{ marginTop: '1rem' }}>
                  <button 
                    className="button-primary"
                    onClick={handleClearAffiliationsData}
                    disabled={loading}
                  >
                    {loading ? 'Clearing...' : 'Clear All Affiliations'}
                  </button>
                  <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                    This will remove all saved organizational affiliations.
                  </p>
                </div>
                
                <div className="private-data-list">
                  <h3>Your Organizational Affiliations</h3>
                  
                  {affiliationsData.length === 0 ? (
                    <p>No affiliations saved yet. Add some using the form above.</p>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Organization</th>
                          <th>Role</th>
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Description</th>
                          <th>Added</th>
                        </tr>
                      </thead>
                      <tbody>
                        {affiliationsData.map((item) => {
                          const affiliationInfo = parseAffiliationData(item.value);
                          return (
                            <tr key={item.id}>
                              <td>{affiliationInfo.organizationName}</td>
                              <td>{affiliationInfo.role || '-'}</td>
                              <td>{affiliationInfo.startDate || '-'}</td>
                              <td>{affiliationInfo.endDate || 'Current'}</td>
                              <td>{affiliationInfo.description || '-'}</td>
                              <td>{new Date().toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </>
      </div>
    </div>
  );
};
