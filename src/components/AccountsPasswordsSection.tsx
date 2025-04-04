'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { 
  CeramicClient,
  DataType,
  TableData,
  initCeramic,
  checkCollectionExists,
  createCollection,
  getRecords,
  createRecord,
  clearCollection
} from '@/utils/ceramicUtils';
import { useCeramic } from '@/context/CeramicContext';

export const AccountsPasswordsSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [db, setDb] = useState<CeramicClient | null>(null);
  const [tableName, setTableName] = useState<string>('');
  const [accountsData, setAccountsData] = useState<TableData[]>([]);
  const [website, setWebsite] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState<boolean>(false);

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
  
  // Load accounts data when Ceramic is initialized
  useEffect(() => {
    const loadAccountsData = async () => {
      try {
        if (isInitialized && ceramic && did) {
          setLoading(true);
          
          // Check if collection exists
          const { exists, collectionId } = await checkCollectionExists(ceramic, DataType.PROFILE, did);
          
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
            
            setAccountsData(formattedData);
          }
          
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error loading accounts data:', err);
        setError(err.message || 'Failed to load accounts data. Please try again.');
        setLoading(false);
      }
    };
    
    loadAccountsData();
  }, [isInitialized, ceramic, did]);

  const handleCreateTable = async () => {
    if (!ceramic || !did) {
      setError('Ceramic not initialized or no DID available.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create a new collection for accounts data
      const { collectionId } = await createCollection(ceramic, DataType.PROFILE, did);
      setTableName(collectionId);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error creating collection:', err);
      setError(err.message || 'Failed to create collection. Please try again.');
      setLoading(false);
    }
  };

  const handleAddData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ceramic || !tableName || !website || !username || !password) {
      setError('Missing required information. Please check all fields.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create a record in the collection
      const content = {
        website,
        username,
        password
      };
      
      await createRecord(ceramic, DataType.PROFILE, tableName, content, ['accounts']);
      
      // Refresh data
      const records = await getRecords(ceramic, tableName);
      
      // Convert records to the format expected by the component
      const formattedData = records.map((record, index) => ({
        id: index,
        key: record.id,
        value: JSON.stringify(record.content),
        created_at: new Date().toISOString()
      }));
      
      setAccountsData(formattedData);
      
      // Clear form
      setWebsite('');
      setUsername('');
      setPassword('');
      setLoading(false);
    } catch (err: any) {
      console.error('Error adding account data:', err);
      setError(err.message || 'Failed to add account data. Please try again.');
      setLoading(false);
    }
  };

  const handleClearAccountsData = async () => {
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
      setAccountsData([]);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error clearing accounts data:', err);
      setError(err.message || 'Failed to clear accounts data. Please try again.');
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
            <strong>Ceramic Network Integration:</strong> Your accounts and passwords data is securely stored on the Ceramic Network, 
            a decentralized data network built specifically for Web3 user data. This provides better privacy, security, 
            and user experience compared to our previous implementation.
          </p>
        </div>
          <>
            {error && <div className="alert alert-error">{error}</div>}
            
            {!tableName ? (
              <div>
                <p>You don't have an accounts collection yet. Create one to store your account information securely on Ceramic Network.</p>
                <button 
                  className="button-primary" 
                  onClick={handleCreateTable}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Accounts Table'}
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
