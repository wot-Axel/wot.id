'use client';

import React from 'react';
import PerformanceDashboard from '@/components/PerformanceDashboard';

const PageHeader = ({ title, description }: { title: string; description?: string }) => {
  return (
    <div className="page-header mb-8">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      {description && <p className="text-gray-600 dark:text-gray-400">{description}</p>}
    </div>
  );
};

const PerformancePage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Performance Monitoring"
        description="Monitor the performance of data operations with Tableland"
      />
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">About Performance Monitoring</h2>
          
          <div className="prose dark:prose-invert max-w-none">
            <p>
              This page provides real-time performance metrics for data operations in the WOT.ID application.
              The dashboard shows performance comparisons between different data storage solutions:
            </p>
            
            <ul>
              <li><strong>Tableland</strong>: Our primary data storage solution</li>
              <li><strong>ComposeDB</strong>: Previous data storage solution</li>
              <li><strong>Ceramic</strong>: Original data storage solution</li>
            </ul>
            
            <p>
              Performance metrics are collected for various operations including data fetching, creation,
              updates, and deletion. The dashboard updates automatically every 5 seconds.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mt-4">
              <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200">Performance Benefits</h3>
              <p className="text-blue-700 dark:text-blue-300">
                The migration to Tableland has resulted in significant performance improvements,
                particularly for data fetching and writing operations. You can see these improvements
                reflected in the metrics below.
              </p>
            </div>
          </div>
        </div>
        
        <PerformanceDashboard />
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">How to Use This Dashboard</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Select an Operation</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Use the operation buttons to filter metrics for specific types of data operations.
                This allows you to compare performance across different operation types.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium">Performance Comparison</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                The comparison table shows average durations for each data source, helping you
                understand the performance differences between Tableland, ComposeDB, and Ceramic.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium">Recent Operations</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                The recent operations table shows the most recent data operations that have been
                performed, including their duration and success status.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformancePage;
