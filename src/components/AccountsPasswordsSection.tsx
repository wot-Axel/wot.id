'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useCeramic } from '@/context/CeramicContext';
import { 
  DataType,
  DataRecord
} from '@/utils/ceramicUtils';

export const AccountsPasswordsSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const { ceramic, isInitialized, isLoading: ceramicLoading, error: ceramicError, checkCollectionExists, createCollection, getData, insertData, clearData } = useCeramic();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [collectionId, setCollectionId] = useState<string>('');
  const [accountsData, setAccountsData] = useState<DataRecord[]>([]);
  const [website, setWebsite] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState<boolean>(false);

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
      const collectionCheck = await checkCollectionExists(DataType.ACCOUNTS);
      
      if (collectionCheck.exists) {
        setCollectionId(collectionCheck.collectionId);
        // Load existing data
        const data = await getData(DataType.ACCOUNTS, collectionCheck.collectionId);
        setAccountsData(data);
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
      
      const result = await createCollection(DataType.ACCOUNTS);
      setCollectionId(result.collectionId);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error creating collection');
      setLoading(false);
    }
  };

  const handleAddData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ceramic || !collectionId || !website || !username || !password) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Format the data as JSON to store all fields together
      const accountData = JSON.stringify({
        website,
        username,
        password
      });
      
      await insertData(DataType.ACCOUNTS, collectionId, { key: website, value: accountData });
      
      // Refresh data
      const data = await getData(DataType.ACCOUNTS, collectionId);
      setAccountsData(data);
      
      // Clear form
      setWebsite('');
      setUsername('');
      setPassword('');
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error adding account data');
      setLoading(false);
    }
  };

  const handleClearAccountsData = async () => {
    if (!ceramic || !collectionId) return;
    
    try {
      setLoading(true);
      setError('');
      
      await clearData(DataType.ACCOUNTS, collectionId);
      
      // Refresh data
      const data = await getData(DataType.ACCOUNTS, collectionId);
      setAccountsData(data);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error clearing accounts data');
      setLoading(false);
    }
  };

  // Parse the JSON data from the value field
  const parseAccountData = (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch (err) {
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
            <strong>Multi-Chain Support:</strong> Your accounts and passwords data is securely stored on Optimism for cost efficiency, 
            while your wallet remains connected to your preferred network. Our cross-chain technology handles all network 
            interactions behind the scenes - no network switching required.
          </p>
        </div>
          <>
            {error && <div className="alert alert-error">{error}</div>}
            
            {!collectionId ? (
              <div>
                <p>You don't have an accounts table yet. Create one to store your account information securely on Tableland.</p>
                <button 
                  className="button-primary" 
                  onClick={handleCreateCollection}
                  disabled={loading || ceramicLoading}
                >
                  {loading ? 'Creating...' : 'Create Accounts Collection'}
                </button>
              </div>
            ) : (
              <div>
                <p>Your account information is stored securely on the Ceramic Network.</p>
                
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
