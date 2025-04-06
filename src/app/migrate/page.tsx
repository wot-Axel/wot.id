'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import DatabaseMigrationTool from '@/components/DatabaseMigrationTool';
import { ComposeDBProvider } from '@/context/ComposeDBContext';
import { TablelandProvider } from '@/context/TablelandContext';

const MigrationPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Database Migration"
        description="Migrate your data from Ceramic to Tableland"
      />
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">About This Migration</h2>
          
          <div className="prose dark:prose-invert max-w-none">
            <p>
              We're transitioning from Ceramic Network back to Tableland for our database storage. 
              This change will improve application stability and server-side rendering compatibility.
            </p>
            
            <p>
              This page allows you to migrate your existing data from Ceramic to Tableland. 
              The migration process is simple and preserves all your existing data.
            </p>
            
            <h3>What You Need to Know</h3>
            
            <ul>
              <li>Your data will remain private and secure throughout the migration</li>
              <li>The migration only needs to be performed once</li>
              <li>You can migrate all data at once or select specific data types</li>
              <li>If you encounter any issues, please contact support</li>
            </ul>
          </div>
        </div>
        
        <ComposeDBProvider>
          <TablelandProvider>
            <DatabaseMigrationTool />
          </TablelandProvider>
        </ComposeDBProvider>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Why are we changing database providers?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We've experienced persistent issues with Ceramic integration, particularly with server-side rendering 
                compatibility and connection reliability. Tableland previously provided a stable database solution 
                for our application.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Will I lose any data during migration?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                No, the migration tool is designed to preserve all your data. It reads from Ceramic and writes to 
                Tableland without data loss. If you encounter any issues during migration, please contact support.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Do I need to do anything after migration?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                No, once the migration is complete, the application will automatically use Tableland for all 
                database operations. You can continue using the application as normal.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">What if I don't migrate my data?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                If you don't migrate your data, you may experience issues with data persistence as we transition 
                away from Ceramic. We recommend migrating as soon as possible to ensure a smooth experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigrationPage;
