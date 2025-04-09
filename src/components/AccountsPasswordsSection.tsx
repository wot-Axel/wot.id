'use client';

import React, { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useDataAccess, DataType } from '@/hooks/useDataAccess';

export const AccountsPasswordsSection = () => {
  const { isConnected } = useAppKitAccount();
  const { 
    data: accountsData, 
    isLoading, 
    createItem,
    refreshData,
    clearItems
  } = useDataAccess(DataType.PROFILE);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // No need for handleCreateTable as the useDataAccess hook handles collection creation

  const handleAddData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!website || !username || !password) {
      setError('Missing required information. Please check all fields.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create a record with the account data
      const content = {
        website,
        username,
        password
      };
      
      await createItem(content, ['accounts']);
      
      // Refresh data
      await refreshData();
      
      // Clear form
      setWebsite('');
      setUsername('');
      setPassword('');
      setLoading(false);
      setIsEditing(false);
    } catch (err) {
      console.error('Error adding account data:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to add account data. Please try again.'
      );
      setLoading(false);
    }
  };

  const handleClearAccountsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Clear all items using the useDataAccess hook
      await clearItems();
      
      // Refresh data
      await refreshData();
      
      setLoading(false);
    } catch (err) {
      console.error('Error clearing accounts data:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to clear accounts data. Please try again.'
      );
      setLoading(false);
    }
  };

  // Parse the JSON data from the value field
  const parseAccountData = (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return { website: '', username: '', password: '' };
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="legal-section">
      <h2>My Accounts and Passwords</h2>
      <div className="section-content">
        <div className="info-box" style={{ marginBottom: '1rem' }}>
          <p>
            <strong>Decentralized Storage:</strong> Your accounts and passwords data is securely stored using Gun.js, 
            a decentralized SQL database for Web3. This provides better reliability, performance, 
            and compatibility with server-side rendering compared to our previous implementation.
          </p>
        </div>
          <>
            {error && <div className="alert alert-error">{error}</div>}
            
            {accountsData.length === 0 && !isLoading ? (
              <div>
                <p>You don't have any saved accounts yet. Add one to store your information securely.</p>
                <button 
                  className="button-primary" 
                  onClick={() => setIsEditing(true)}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Add Account'}
                </button>
              </div>
            ) : (
              <div>
                <p>Your account information is stored securely using Gun.js decentralized storage.</p>
                
                <form onSubmit={handleAddData} className="private-data-form">
                  <div className="form-group">
                    <label htmlFor="website">Website/Service:</label>
                    <input
                      type="text"
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      required
                      placeholder="e.g., Amazon, Netflix, Gmail"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="username">Username/Email:</label>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="Your username or email"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                      type={showPasswords ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Your password"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="button-primary"
                    disabled={loading || !website || !username || !password}
                  >
                    {loading ? 'Adding...' : 'Add Account'}
                  </button>
                </form>
                
                <div style={{ marginTop: '1rem' }}>
                  <button 
                    className="button-primary"
                    onClick={handleClearAccountsData}
                    disabled={loading}
                  >
                    {loading ? 'Clearing...' : 'Clear All Accounts'}
                  </button>
                  <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                    This will remove all saved accounts and passwords.
                  </p>
                </div>
                
                <div className="private-data-list">
                  <h3>Your Saved Accounts</h3>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={showPasswords}
                        onChange={() => setShowPasswords(!showPasswords)}
                      />
                      <span className="checkmark"></span>
                      Show Passwords
                    </label>
                  </div>
                  
                  {accountsData.length === 0 ? (
                    <p>No accounts saved yet. Add some using the form above.</p>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Website/Service</th>
                          <th>Username/Email</th>
                          <th>Password</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accountsData.map((item) => {
                          const accountInfo = parseAccountData(item.value);
                          return (
                            <tr key={item.id}>
                              <td>{accountInfo.website}</td>
                              <td>{accountInfo.username}</td>
                              <td>
                                {showPasswords 
                                  ? accountInfo.password 
                                  : '••••••••'}
                              </td>
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
