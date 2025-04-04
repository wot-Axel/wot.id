'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { 
  Database,
  DataType,
  PrivateData,
  initCeramic,
  checkCollectionExists,
  createCollection,
  getRecords,
  createRecord,
  clearCollection
} from '@/utils/ceramicUtils';
import { useCeramic } from '@/context/CeramicContext';

export const OrganizationalAffiliationsSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [db, setDb] = useState<Database | null>(null);
  const [tableName, setTableName] = useState<string>('');
  const [affiliationsData, setAffiliationsData] = useState<PrivateData[]>([]);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Use the Ceramic context
  const { ceramic, did, isInitialized, isLoading: ceramicLoading, connect } = useCeramic();

  // Initialize Ceramic connection
  useEffect(() => {
    const init = async () => {
      try {
        if (isConnected && address && !isInitialized && !ceramicLoading) {
          setLoading(true);
          setError('');
          
          // Connect to Ceramic network
          await connect();
          
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error initializing Ceramic:', err);
        setError(err.message || 'Failed to initialize Ceramic. Please try again.');
        setLoading(false);
      }
    };
    
    init();
  }, [isConnected, address, isInitialized, ceramicLoading, connect]);
  
  // Load affiliations data when Ceramic is initialized
  useEffect(() => {
    const loadAffiliationsData = async () => {
      try {
        if (isInitialized && ceramic && did) {
          setLoading(true);
          
          // Check if collection exists
          const { exists, collectionId } = await checkCollectionExists(ceramic, DataType.ORGANIZATIONS, did);
          
          if (exists) {
            setTableName(collectionId);
            
            // Get existing data
            const records = await getRecords(ceramic, collectionId);
            
            // Convert records to the format expected by the component
            const formattedData = records.map((record, index) => ({
              id: index,
              key: record.id,
              value: JSON.stringify(record.content),
              created_at: new Date().toISOString()
            }));
            
            setAffiliationsData(formattedData);
          }
          
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error loading affiliations data:', err);
        setError(err.message || 'Failed to load affiliations data. Please try again.');
        setLoading(false);
      }
    };
    
    loadAffiliationsData();
  }, [isInitialized, ceramic, did]);

  const handleCreateTable = async () => {
    if (!ceramic || !did) {
      setError('Ceramic not initialized or no DID available.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create a new collection for affiliations data
      const { collectionId } = await createCollection(ceramic, DataType.ORGANIZATIONS, did);
      setTableName(collectionId);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error creating collection:', err);
      setError(err.message || 'Failed to create collection. Please try again.');
      setLoading(false);
    }
  };

  const handleAddAffiliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ceramic || !tableName || !organizationName) {
      setError('Missing required information. Please check all fields.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create a record in the collection
      const content = {
        organizationName,
        role,
        startDate,
        endDate,
        description
      };
      
      await createRecord(ceramic, DataType.ORGANIZATIONS, tableName, content, ['affiliation']);
      
      // Refresh data
      const records = await getRecords(ceramic, tableName);
      
      // Convert records to the format expected by the component
      const formattedData = records.map((record, index) => ({
        id: index,
        key: record.id,
        value: JSON.stringify(record.content),
        created_at: new Date().toISOString()
      }));
      
      setAffiliationsData(formattedData);
      
      // Clear form
      setOrganizationName('');
      setRole('');
      setStartDate('');
      setEndDate('');
      setDescription('');
      setLoading(false);
    } catch (err: any) {
      console.error('Error adding affiliation data:', err);
      setError(err.message || 'Failed to add affiliation data. Please try again.');
      setLoading(false);
    }
  };

  const handleClearAffiliationsData = async () => {
    if (!ceramic || !tableName) {
      setError('Ceramic not initialized or no collection available.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Clear the collection
      await clearCollection(ceramic, tableName);
      
      // Reset data
      setAffiliationsData([]);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error clearing affiliations data:', err);
      setError(err.message || 'Failed to clear affiliations data. Please try again.');
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
            <strong>Ceramic Network Integration:</strong> Your organizational affiliations data is securely stored on the Ceramic Network, 
            a decentralized data network built specifically for Web3 user data. This provides better privacy, security, 
            and user experience compared to our previous implementation.
          </p>
        </div>
          <>
            {error && <div className="alert alert-error">{error}</div>}
            
            {!tableName ? (
              <div>
                <p>You don't have an affiliations collection yet. Create one to store your organizational affiliations securely on Ceramic Network.</p>
                <button 
                  className="button-primary" 
                  onClick={handleCreateTable}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Affiliations Table'}
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
                              <td>{new Date(item.created_at).toLocaleString()}</td>
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
