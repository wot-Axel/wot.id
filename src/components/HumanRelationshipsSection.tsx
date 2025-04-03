'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { optimism } from '@reown/appkit/networks';
import { 
  createContactsTable, 
  insertContactData, 
  getContactsData,
  checkContactsTableExists,
  clearContactsData,
  type PrivateData
} from '@/utils/tablelandUtils';
import { initTablelandWithOptimismWrite } from '@/utils/optimismProvider';
import { Database } from '@tableland/sdk';

export const HumanRelationshipsSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const { switchNetwork } = useAppKitNetwork();
  const [isOptimismNetwork, setIsOptimismNetwork] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [db, setDb] = useState<Database | null>(null);
  const [tableName, setTableName] = useState<string>('');
  const [contactsData, setContactsData] = useState<PrivateData[]>([]);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

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
      const tableCheck = await checkContactsTableExists(tablelandDb, address as string);
      
      if (tableCheck.exists) {
        setTableName(tableCheck.tableName);
        // Load existing data
        const data = await getContactsData(tablelandDb, tableCheck.tableName);
        setContactsData(data);
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
      
      const name = await createContactsTable(db, address);
      setTableName(name);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error creating table');
      setLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !tableName || !name) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Format the data as JSON to store all fields together
      const contactData = JSON.stringify({
        name,
        email,
        phone,
        notes
      });
      
      await insertContactData(db, tableName, name, contactData);
      
      // Refresh data
      const data = await getContactsData(db, tableName);
      setContactsData(data);
      
      // Clear form
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error adding contact data');
      setLoading(false);
    }
  };

  const handleClearContactsData = async () => {
    if (!db || !tableName) return;
    
    try {
      setLoading(true);
      setError('');
      
      await clearContactsData(db, tableName);
      
      // Refresh data
      const data = await getContactsData(db, tableName);
      setContactsData(data);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error clearing contacts data');
      setLoading(false);
    }
  };

  // Parse the JSON data from the value field
  const parseContactData = (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch (err) {
      return { name: '', email: '', phone: '', notes: '' };
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="legal-section">
      <h2>My Human Relationships</h2>
      <div className="section-content">
        <div className="info-box" style={{ marginBottom: '1rem' }}>
          <p>
            <strong>Multi-Chain Support:</strong> Your relationships data is securely stored on Optimism for cost efficiency, 
            while your wallet remains connected to your preferred network. Our cross-chain technology handles all network 
            interactions behind the scenes - no network switching required.
          </p>
        </div>
          <>
            {error && <div className="alert alert-error">{error}</div>}
            
            {!tableName ? (
              <div>
                <p>You don't have a relationships table yet. Create one to store your human relationships securely on Tableland.</p>
                <button 
                  className="button-primary" 
                  onClick={handleCreateTable}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Relationships Table'}
                </button>
              </div>
            ) : (
              <div>
                <p>Your relationship information is stored securely on Tableland on the Optimism network.</p>
                
                <form onSubmit={handleAddContact} className="private-data-form">
                  <div className="form-group">
                    <label htmlFor="name">Name:</label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Person's name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="phone">Phone:</label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="notes">Notes:</label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Relationship details and additional notes"
                      rows={3}
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="button-primary"
                    disabled={loading || !name}
                  >
                    {loading ? 'Adding...' : 'Add Relationship'}
                  </button>
                </form>
                
                <div style={{ marginTop: '1rem' }}>
                  <button 
                    className="button-primary"
                    onClick={handleClearContactsData}
                    disabled={loading}
                  >
                    {loading ? 'Clearing...' : 'Clear All Relationships'}
                  </button>
                  <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                    This will remove all saved relationships.
                  </p>
                </div>
                
                <div className="private-data-list">
                  <h3>Your Human Relationships</h3>
                  
                  {contactsData.length === 0 ? (
                    <p>No relationships saved yet. Add some using the form above.</p>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Notes</th>
                          <th>Added</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contactsData.map((item) => {
                          const contactInfo = parseContactData(item.value);
                          return (
                            <tr key={item.id}>
                              <td>{contactInfo.name}</td>
                              <td>{contactInfo.email || '-'}</td>
                              <td>{contactInfo.phone || '-'}</td>
                              <td>{contactInfo.notes || '-'}</td>
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
