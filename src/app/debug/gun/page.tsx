'use client';

import React, { useState, useEffect } from 'react';
import { useStorage } from '@/context/StorageContext';
import { TableType } from '@/utils/storageUtils';

export default function GunDebugPage() {
  const storage = useStorage();
  const [items, setItems] = useState<any[]>([]);
  const [newKey, setNewKey] = useState<string>('');
  const [newValue, setNewValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (storage.isReady) {
      loadData();
    }
  }, [storage.isReady]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get test data from Gun via the main StorageContext
      const result = await storage.listItems(TableType.PRIVATE);
      setItems(result);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newKey || !newValue) {
      setError('Both key and value are required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Store data using the main StorageContext
      await storage.storeItem(TableType.PRIVATE, newKey, newValue);
      
      // Reload the data
      await loadData();
      
      // Clear form
      setNewKey('');
      setNewValue('');
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error storing data:', err);
      setError(err.message || 'Failed to store data');
      setLoading(false);
    }
  };

  const handleDelete = async (key: string) => {
    try {
      setLoading(true);
      setError('');
      
      // Delete using the main StorageContext
      await storage.deleteItem(TableType.PRIVATE, key);
      
      // Reload the data
      await loadData();
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error deleting data:', err);
      setError(err.message || 'Failed to delete data');
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gun.js Storage Integration Test</h1>
      <p className="mb-4">
        This page demonstrates the full integration of Gun.js as a replacement for localStorage.
        All components now use Gun.js for decentralized storage through the StorageContext.
      </p>
      
      <div className="mt-8">
        {!storage.isReady ? (
          <div>Initializing storage system...</div>
        ) : (
          <div className="gun-storage-test">
            {error && (
              <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSave} style={{ marginBottom: '2rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="key" style={{ display: 'block', marginBottom: '0.5rem' }}>Key:</label>
                <input
                  id="key"
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  style={{ padding: '0.5rem', width: '100%' }}
                  disabled={loading}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="value" style={{ display: 'block', marginBottom: '0.5rem' }}>Value:</label>
                <input
                  id="value"
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  style={{ padding: '0.5rem', width: '100%' }}
                  disabled={loading}
                />
              </div>
              
              <button 
                type="submit" 
                style={{ 
                  padding: '0.5rem 1rem', 
                  backgroundColor: '#0070f3', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Item'}
              </button>
            </form>
            
            <div>
              <h3>Stored Data</h3>
              {loading ? (
                <p>Loading...</p>
              ) : items.length === 0 ? (
                <p>No data found. Add some using the form above.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Key</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Value</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Created</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>{item.item_key}</td>
                        <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>{item.item_value}</td>
                        <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
                          {new Date(item.created_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
                          <button
                            onClick={() => handleDelete(item.item_key)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#ff4040',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer'
                            }}
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
