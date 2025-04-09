'use client';

import React, { useState, useEffect } from 'react';
import { useStorage } from '@/context/StorageContext';
import { TableType } from '@/utils/storageUtils';
import * as GunUtils from '@/utils/gunUtils';
import * as SyncUtils from '@/utils/syncUtils';

export default function StorageDebugPage() {
  const storage = useStorage();
  const [isGunReady, setIsGunReady] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [tableData, setTableData] = useState<Record<string, any>>({});
  const [selectedTable, setSelectedTable] = useState<TableType>(TableType.PRIVATE);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [syncStatus, setSyncStatus] = useState<{
    syncInProgress: boolean;
    lastSyncTime: number | null;
    pendingChangesCount: number;
    isOnline: boolean;
  }>({ syncInProgress: false, lastSyncTime: null, pendingChangesCount: 0, isOnline: true });
  const [testKey, setTestKey] = useState('');
  const [testValue, setTestValue] = useState('');

  // Track online status and initialize services
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize Gun explicitly
    GunUtils.initGun();
    setIsGunReady(true);
    
    // Set up sync status monitoring
    const syncStatusInterval = setInterval(() => {
      setSyncStatus(SyncUtils.getSyncStatus());
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncStatusInterval);
    };
  }, []);

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
  
  // Trigger manual sync
  const handleTriggerSync = async () => {
    try {
      const result = await SyncUtils.synchronizePendingChanges();
      alert(`Sync complete. Success: ${result.success}, Failed: ${result.failed}`);
      handleRefresh();
    } catch (error) {
      console.error('Sync error:', error);
      alert(`Sync error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Storage Debug Tools</h1>
      
      <div className="mb-6 bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-bold mb-2">Storage Status</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="font-semibold">Storage Provider:</div>
          <div>{storage.isReady ? 'Ready' : 'Initializing...'}</div>
          
          <div className="font-semibold">Gun.js Status:</div>
          <div>{isGunReady ? 'Initialized' : 'Not Initialized'}</div>
          
          <div className="font-semibold">Network Status:</div>
          <div className={networkStatus ? 'text-green-600' : 'text-red-600'}>
            {networkStatus ? 'Online' : 'Offline'}
          </div>
          
          <div className="font-semibold">Sync Status:</div>
          <div className={syncStatus.syncInProgress ? 'text-blue-600' : ''}>
            {syncStatus.syncInProgress ? 'Synchronizing...' : 'Idle'}
          </div>
          
          <div className="font-semibold">Last Sync:</div>
          <div>
            {syncStatus.lastSyncTime ? new Date(syncStatus.lastSyncTime).toLocaleString() : 'Never'}
          </div>
          
          <div className="font-semibold">Pending Changes:</div>
          <div className={syncStatus.pendingChangesCount > 0 ? 'text-orange-600' : 'text-green-600'}>
            {syncStatus.pendingChangesCount} items
            {syncStatus.pendingChangesCount > 0 && (
              <button 
                onClick={handleTriggerSync} 
                className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Sync Now
              </button>
            )}
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
