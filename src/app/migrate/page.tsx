'use client';

import React from 'react';
import MigrationComplete from '@/components/MigrationComplete';

// Define PageHeader component inline since the import is causing issues
const PageHeader = ({ title, description }: { title: string; description?: string }) => {
  return (
    <div className="page-header mb-8">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      {description && <p className="text-gray-600 dark:text-gray-400">{description}</p>}
    </div>
  );
};

const MigrationPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Database Migration Complete"
        description="Your data has been successfully migrated to Tableland"
      />
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">About This Migration</h2>
          
          <div className="prose dark:prose-invert max-w-none">
            <p>
              We have successfully transitioned from Ceramic Network to Tableland for our database storage. 
              This change improves application stability and server-side rendering compatibility.
            </p>
            
            <p>
              All components have been updated to use Tableland as the primary data storage solution,
              with a consistent interface through the useDataAccess hook.
            </p>
            
            <h3>Benefits of the Migration</h3>
            
            <ul>
              <li>Improved reliability and performance</li>
              <li>Better compatibility with server-side rendering</li>
              <li>Simplified data access through a consistent interface</li>
              <li>Enhanced security and privacy for your data</li>
            </ul>
          </div>
        </div>
        
        <MigrationComplete />
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Why did we change database providers?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We experienced persistent issues with Ceramic integration, particularly with server-side rendering 
                compatibility and connection reliability. Tableland provides a more stable database solution 
                for our application with better performance characteristics.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Was any data lost during the migration?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                No, all your data has been preserved during the migration process. The migration carefully 
                transferred each data type to ensure nothing was lost. If you notice any issues with your data, 
                please contact support.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Do I need to do anything after the migration?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                No action is required from you. The application automatically uses Tableland for all 
                database operations. You can continue using the application as you normally would.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">How can I verify my data was migrated correctly?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                You can check your profile, assets, relationships, and other sections to verify that your data appears correctly.
                If you notice any issues, please contact our support team for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigrationPage;
