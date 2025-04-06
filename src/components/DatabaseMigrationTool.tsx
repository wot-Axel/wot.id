'use client';

import React, { useState } from 'react';
import { useComposeDB } from '@/context/ComposeDBContext';
import { useTableland } from '@/context/TablelandContext';
import { useMigration, hasCeramicData } from '@/utils/migrationUtils';
import { DataType } from '@/composedb/ceramic-utils';

const DatabaseMigrationTool = () => {
  const ceramic = useComposeDB();
  const tableland = useTableland();
  const { migrateDataType, migrateAllData } = useMigration();
  
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle');
  const [migrationResults, setMigrationResults] = useState<Record<DataType, boolean>>({} as Record<DataType, boolean>);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handleMigrateAll = async () => {
    try {
      setMigrationStatus('migrating');
      setErrorMessage(null);
      
      // Ensure both databases are initialized
      if (!ceramic.isInitialized) {
        await ceramic.connect();
      }
      
      if (!tableland.isInitialized) {
        await tableland.connect();
      }
      
      // Perform migration
      const { success, results } = await migrateAllData();
      
      setMigrationResults(results);
      setMigrationStatus(success ? 'success' : 'error');
      
      if (!success) {
        setErrorMessage('Some data types failed to migrate. Check the results for details.');
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error during migration');
    }
  };
  
  const handleMigrateDataType = async (dataType: DataType) => {
    try {
      setMigrationStatus('migrating');
      setErrorMessage(null);
      
      // Ensure both databases are initialized
      if (!ceramic.isInitialized) {
        await ceramic.connect();
      }
      
      if (!tableland.isInitialized) {
        await tableland.connect();
      }
      
      // Perform migration for specific data type
      const success = await migrateDataType(dataType);
      
      setMigrationResults(prev => ({
        ...prev,
        [dataType]: success
      }));
      
      setMigrationStatus(success ? 'success' : 'error');
      
      if (!success) {
        setErrorMessage(`Failed to migrate ${dataType}. Check the console for details.`);
      }
    } catch (error) {
      console.error(`Migration error for ${dataType}:`, error);
      setMigrationStatus('error');
      setErrorMessage(error instanceof Error ? error.message : `Unknown error during migration of ${dataType}`);
    }
  };
  
  const hasCeramicDataAvailable = hasCeramicData();
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Database Migration Tool</h2>
      
      <div className="mb-6">
        <p className="mb-2">
          This tool helps you migrate your data from Ceramic to Tableland.
        </p>
        
        {!hasCeramicDataAvailable && (
          <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-yellow-700 dark:text-yellow-200">
              No Ceramic data detected in local storage. There may be no data to migrate.
            </p>
          </div>
        )}
        
        <div className="flex flex-col space-y-2 mb-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${ceramic.isInitialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>Ceramic Status: {ceramic.isInitialized ? 'Connected' : 'Disconnected'}</span>
          </div>
          
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${tableland.isInitialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>Tableland Status: {tableland.isInitialized ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Migration Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleMigrateAll}
            disabled={migrationStatus === 'migrating'}
            className="button-primary w-full"
          >
            {migrationStatus === 'migrating' ? 'Migrating All Data...' : 'Migrate All Data'}
          </button>
          
          <div className="space-y-2">
            {Object.values(DataType).map((dataType) => (
              <button
                key={dataType}
                onClick={() => handleMigrateDataType(dataType as DataType)}
                disabled={migrationStatus === 'migrating'}
                className="button-secondary w-full text-sm py-1"
              >
                Migrate {dataType}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {migrationStatus === 'migrating' && (
        <div className="mb-6">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Migration in progress, please wait...</p>
        </div>
      )}
      
      {migrationStatus === 'success' && (
        <div className="mb-6 bg-green-50 dark:bg-green-900 border-l-4 border-green-500 p-4">
          <p className="text-green-700 dark:text-green-200">Migration completed successfully!</p>
        </div>
      )}
      
      {migrationStatus === 'error' && (
        <div className="mb-6 bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4">
          <p className="text-red-700 dark:text-red-200">
            {errorMessage || 'An error occurred during migration.'}
          </p>
        </div>
      )}
      
      {Object.keys(migrationResults).length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Migration Results</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Data Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {Object.entries(migrationResults).map(([dataType, success]) => (
                  <tr key={dataType}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {dataType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        success 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseMigrationTool;
