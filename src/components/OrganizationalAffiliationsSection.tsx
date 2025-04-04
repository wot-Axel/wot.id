'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { DataType, PrivateData } from '@/utils/ceramicUtils';
import { useDataAccess } from '@/hooks/useDataAccess';

export const OrganizationalAffiliationsSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const { 
    data: affiliationsData, 
    isLoading, 
    error: dataError,
    createItem,
    updateItem,
    deleteItem,
    refreshData,
    clearItems
  } = useDataAccess(DataType.ORGANIZATIONS);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');



  // No need for handleCreateTable as the useDataAccess hook handles collection creation

  const handleAddAffiliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName) {
      setError('Organization name is required.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create a record with the affiliation data
      const content = {
        organizationName,
        role,
        startDate,
        endDate,
        description
      };
      
      await createItem(content, ['affiliation']);
      
      // Refresh data
      await refreshData();
      
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
    try {
      setLoading(true);
      setError('');
      
      // Clear all items using the useDataAccess hook
      await clearItems();
      
      // Refresh data
      await refreshData();
      
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
            
            {affiliationsData.length === 0 && !isLoading ? (
              <div>
                <p>You don't have any organizational affiliations yet. Add one to store your information securely.</p>
                <button 
                  className="button-primary" 
                  onClick={() => setIsEditing(true)}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Add Affiliation'}
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
