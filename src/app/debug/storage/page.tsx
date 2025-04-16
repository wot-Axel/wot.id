'use client';

import React, { useState, useEffect } from 'react';
import { useStorage } from '@/context/StorageContext';
import { TableType } from '@/utils/storageUtils';

export default function StorageDebugPage() {
  const storage = useStorage();
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [tableData, setTableData] = useState<Record<string, any>>({});
  const [selectedTable, setSelectedTable] = useState<TableType>(TableType.PRIVATE);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [storageStats, setStorageStats] = useState<string[]>([]);
  const [testKey, setTestKey] = useState('');
  const [testValue, setTestValue] = useState('');

  // Track online status and initialize services
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize storage
    setIsStorageReady(storage.isReady);
    
    // Simple system logs for debugging
    setStorageStats(['Local storage initialized', 'Using browser localStorage provider']);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [storage.isReady]);

  // Load data when table changes or refresh is triggered
  useEffect(() => {
    if (storage.isReady) {
      loadTableData();
    }
  }, [storage.isReady, selectedTable, refreshTrigger]);

  const loadTableData = async () => {
    try {
      const items = await storage.listItems(selectedTable);
      setTableData({
        [selectedTable]: items
      });
    } catch (error) {
      console.error('Error loading table data:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleClearTable = async () => {
    if (!confirm(`Are you sure you want to clear all data in the ${selectedTable} table?`)) {
      return;
    }

    try {
      const items = await storage.listItems(selectedTable);
      for (const item of items) {
        await storage.deleteItem(selectedTable, item.item_key);
      }
      handleRefresh();
    } catch (error) {
      console.error('Error clearing table:', error);
    }
  };
  
  // Test store functionality
  const handleTestStore = async () => {
    if (!testKey || !testValue) {
      alert('Please enter both key and value');
      return;
    }
    
    try {
      await storage.storeItem(selectedTable, testKey, testValue);
      setTestKey('');
      setTestValue('');
      handleRefresh();
    } catch (error) {
      console.error('Error storing test item:', error);
      alert(`Error storing item: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Handle refresh of data
  const handleManualRefresh = () => {
    handleRefresh();
    alert('Storage data refreshed');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Storage Debug Tools</h1>
           <div className="mb-6 bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-bold mb-2">Storage Status</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="font-semibold">Storage Provider:</div>
          <div>{storage.isReady ? 'Ready' : 'Initializing...'}</div>
          
          <div className="font-semibold">localStorage Status:</div>
          <div>{isStorageReady ? 'Initialized' : 'Not Initialized'}</div>
          
          <div className="font-semibold">Network Status:</div>
          <div className={networkStatus ? 'text-green-600' : 'text-red-600'}>
            {networkStatus ? 'Online' : 'Offline'}
          </div>
          
          <div className="font-semibold">Storage Stats:</div>
          <div className="col-span-2 mt-2 text-sm bg-gray-50 p-2 rounded border border-gray-200 max-h-28 overflow-y-auto">
            {storageStats.map((stat, index) => (
              <div key={index} className="mb-1">{stat}</div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-2">Table Inspector</h2>
        <div className="flex items-center space-x-2 mb-4">
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value as TableType)}
            className="p-2 border rounded"
          >
            {Object.values(TableType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
          <button 
            onClick={handleClearTable}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Table
          </button>
        </div>
        
        <div className="mb-4 p-3 border rounded">
          <h3 className="text-md font-bold mb-2">Add Test Item</h3>
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">Key</label>
              <input 
                type="text" 
                value={testKey}
                onChange={(e) => setTestKey(e.target.value)}
                className="p-2 border rounded"
                placeholder="item-key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Value</label>
              <input 
                type="text"
                value={testValue}
                onChange={(e) => setTestValue(e.target.value)}
                className="p-2 border rounded"
                placeholder="item-value"
              />
            </div>
            <button
              onClick={handleTestStore}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Store
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="border px-4 py-2">Key</th>
                <th className="border px-4 py-2">Value</th>
                <th className="border px-4 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {tableData[selectedTable]?.length > 0 ? (
                tableData[selectedTable].map((item: any) => (
                  <tr key={item.id}>
                    <td className="border px-4 py-2">{item.item_key}</td>
                    <td className="border px-4 py-2 whitespace-pre-wrap break-words max-w-md">
                      {typeof item.item_value === 'object' 
                        ? JSON.stringify(item.item_value, null, 2) 
                        : item.item_value
                      }
                    </td>
                    <td className="border px-4 py-2">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="border px-4 py-2 text-center">
                    No data in this table
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
