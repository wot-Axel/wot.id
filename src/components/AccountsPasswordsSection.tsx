'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { optimism } from '@reown/appkit/networks';
import { 
  createAccountsTable, 
  insertAccountData, 
  getAccountsData,
  checkAccountsTableExists,
  clearAccountsData,
  type PrivateData
} from '@/utils/tablelandUtils';
import { initTablelandWithOptimismWrite } from '@/utils/optimismProvider';
import { Database } from '@tableland/sdk';

export const AccountsPasswordsSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const { switchNetwork } = useAppKitNetwork();
  const [isOptimismNetwork, setIsOptimismNetwork] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [db, setDb] = useState<Database | null>(null);
  const [tableName, setTableName] = useState<string>('');
  const [accountsData, setAccountsData] = useState<PrivateData[]>([]);
  const [website, setWebsite] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState<boolean>(false);

  // Initialize Tableland when connected
  useEffect(() => {
    if (isConnected && address) {
      // No need to check network - we use cross-chain signing
      initTablelandDb();
    }
  }, [isConnected, address]);

  // No longer needed as we use cross-chain signing
  // Keeping this commented for reference
  /*
  const handleSwitchToOptimism = () => {
    switchNetwork(optimism);
    setIsOptimismNetwork(true);
  };
  */

  const initTablelandDb = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Initialize Tableland with Optimism provider for writing
      const tablelandDb = await initTablelandWithOptimismWrite(address || '');
      setDb(tablelandDb);
      
      // Check if table exists
      const tableCheck = await checkAccountsTableExists(tablelandDb, address as string);
      
      if (tableCheck.exists) {
        setTableName(tableCheck.tableName);
        // Load existing data
        const data = await getAccountsData(tablelandDb, tableCheck.tableName);
        setAccountsData(data);
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error initializing Tableland');
      setLoading(false);
    }
  };

  const handleCreateTable = async () => {
    if (!db || !address) return;
    
    try {
      setLoading(true);
      setError('');
      
      const name = await createAccountsTable(db, address);
      setTableName(name);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error creating table');
      setLoading(false);
    }
  };

  const handleAddData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !tableName || !website || !username || !password) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Format the data as JSON to store all fields together
      const accountData = JSON.stringify({
        website,
        username,
        password
      });
      
      await insertAccountData(db, tableName, website, accountData);
      
      // Refresh data
      const data = await getAccountsData(db, tableName);
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
    if (!db || !tableName) return;
    
    try {
      setLoading(true);
      setError('');
      
      await clearAccountsData(db, tableName);
      
      // Refresh data
      const data = await getAccountsData(db, tableName);
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
            
            {!tableName ? (
              <div>
                <p>You don't have an accounts table yet. Create one to store your account information securely on Tableland.</p>
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
                <p>Your account information is stored securely on Tableland on the Optimism network.</p>
                
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
