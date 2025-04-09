'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useDataAccess, DataType } from '@/hooks/useDataAccess';

export const HumanRelationshipsSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const { 
    data: contactsData, 
    isLoading: dataLoading, 
    error: dataError, 
    createItem, 
    updateItem, 
    refreshData: fetchData,
    clearItems
  } = useDataAccess(DataType.CONNECTIONS);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Initialize data access when needed
  const initDataAccess = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch data using the useDataAccess hook
      await fetchData();
    } catch (err: any) {
      console.error('Error initializing data access:', err);
      setError(err.message || 'Failed to initialize data access. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchData]);
  
  // Initialize data access when connected
  useEffect(() => {
    if (isConnected && address && !loading && !dataLoading) {
      initDataAccess();
    }
  }, [isConnected, address, loading, dataLoading, initDataAccess]);
  


  const handleCreateTable = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Initialize data access
      await initDataAccess();
    } catch (err: any) {
      console.error('Error creating table:', err);
      setError(err.message || 'Failed to create table. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('Name is required. Please enter a name.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create a contact record
      const content = {
        name,
        email,
        phone,
        notes
      };
      
      await createItem(content, ['contact']);
      
      // Refresh data
      await fetchData();
      
      // Clear form
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
    } catch (err: any) {
      console.error('Error adding contact data:', err);
      setError(err.message || 'Failed to add contact data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearContactsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Clear all items
      await clearItems();
    } catch (err: any) {
      console.error('Error clearing contacts data:', err);
      setError(err.message || 'Failed to clear contacts data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Parse the JSON data from the value field
  const parseContactData = (item: any) => {
    try {
      // If the item has a value field, try to parse it
      if (item.value) {
        return JSON.parse(item.value);
      }
      // If the item has content, use that directly
      if (item.content && typeof item.content === 'object') {
        return item.content;
      }
      // Try to parse the item itself if it's a string
      if (typeof item === 'string') {
        return JSON.parse(item);
      }
      // If item is already an object, return it
      if (typeof item === 'object' && item !== null) {
        return item;
      }
    } catch (err) {
      // If parsing fails, return default object
    }
    return { name: '', email: '', phone: '', notes: '' };
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
            <strong>Decentralized Storage:</strong> Your relationships data is securely stored using Gun.js, 
            a decentralized SQL database for Web3. This provides better reliability, performance, 
            and compatibility with server-side rendering compared to our previous implementation.
          </p>
        </div>
          <>
            {error && <div className="alert alert-error">{error}</div>}
            
            {contactsData.length === 0 ? (
              <div>
                <p>You don't have any relationships saved yet. Add some to store your human relationships securely with Gun.js.</p>
                <button 
                  className="button-primary" 
                  onClick={handleCreateTable}
                  disabled={loading || dataLoading}
                >
                  {loading || dataLoading ? 'Initializing...' : 'Initialize Relationships'}
                </button>
              </div>
            ) : (
              <div>
                <p>Your relationship information is stored securely with Gun.js decentralized storage.</p>
                
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
                    disabled={loading || dataLoading}
                  >
                    {loading || dataLoading ? 'Clearing...' : 'Clear All Relationships'}
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
                          const contactInfo = parseContactData(item);
                          return (
                            <tr key={item.id}>
                              <td>{contactInfo.name}</td>
                              <td>{contactInfo.email || '-'}</td>
                              <td>{contactInfo.phone || '-'}</td>
                              <td>{contactInfo.notes || '-'}</td>
                              <td>{item.created_at ? new Date(item.created_at).toLocaleString() : new Date().toLocaleString()}</td>
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
