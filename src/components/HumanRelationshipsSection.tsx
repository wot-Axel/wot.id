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

export const HumanRelationshipsSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [db, setDb] = useState<Database | null>(null);
  const [tableName, setTableName] = useState<string>('');
  const [contactsData, setContactsData] = useState<PrivateData[]>([]);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

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
  
  // Load contacts data when Ceramic is initialized
  useEffect(() => {
    const loadContactsData = async () => {
      try {
        if (isInitialized && ceramic && did) {
          setLoading(true);
          
          // Check if collection exists
          const { exists, collectionId } = await checkCollectionExists(ceramic, DataType.CONNECTIONS, did);
          
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
            
            setContactsData(formattedData);
          }
          
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error loading contacts data:', err);
        setError(err.message || 'Failed to load contacts data. Please try again.');
        setLoading(false);
      }
    };
    
    loadContactsData();
  }, [isInitialized, ceramic, did]);

  const handleCreateTable = async () => {
    if (!ceramic || !did) {
      setError('Ceramic not initialized or no DID available.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create a new collection for contacts data
      const { collectionId } = await createCollection(ceramic, DataType.CONNECTIONS, did);
      setTableName(collectionId);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error creating collection:', err);
      setError(err.message || 'Failed to create collection. Please try again.');
      setLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ceramic || !tableName || !name) {
      setError('Missing required information. Please check all fields.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create a record in the collection
      const content = {
        name,
        email,
        phone,
        notes
      };
      
      await createRecord(ceramic, DataType.CONNECTIONS, tableName, content, ['contact']);
      
      // Refresh data
      const records = await getRecords(ceramic, tableName);
      
      // Convert records to the format expected by the component
      const formattedData = records.map((record, index) => ({
        id: index,
        key: record.id,
        value: JSON.stringify(record.content),
        created_at: new Date().toISOString()
      }));
      
      setContactsData(formattedData);
      
      // Clear form
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
      setLoading(false);
    } catch (err: any) {
      console.error('Error adding contact data:', err);
      setError(err.message || 'Failed to add contact data. Please try again.');
      setLoading(false);
    }
  };

  const handleClearContactsData = async () => {
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
      setContactsData([]);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error clearing contacts data:', err);
      setError(err.message || 'Failed to clear contacts data. Please try again.');
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
            <strong>Ceramic Network Integration:</strong> Your relationships data is securely stored on the Ceramic Network, 
            a decentralized data network built specifically for Web3 user data. This provides better privacy, security, 
            and user experience compared to our previous implementation.
          </p>
        </div>
          <>
            {error && <div className="alert alert-error">{error}</div>}
            
            {!tableName ? (
              <div>
                <p>You don't have a relationships collection yet. Create one to store your human relationships securely on Ceramic Network.</p>
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
                <p>Your relationship information is stored securely on the Ceramic Network.</p>
                
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
