'use client';

import React, { useState, useEffect } from 'react';
import { getMetrics, getPerformanceComparison, PerformanceMetric } from '@/utils/performanceMonitor';

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [comparisons, setComparisons] = useState<Record<string, Record<string, number>>>({});
  const [selectedOperation, setSelectedOperation] = useState<string>('fetchData');
  const operations = ['fetchData', 'createItem', 'updateItem', 'deleteItem', 'clearItems'];

  // Refresh metrics every 5 seconds
  useEffect(() => {
    const fetchMetrics = () => {
      setMetrics(getMetrics());
      
      // Get comparisons for all operations
      const newComparisons: Record<string, Record<string, number>> = {};
      operations.forEach(op => {
        newComparisons[op] = getPerformanceComparison(op);
      });
      setComparisons(newComparisons);
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Filter metrics by selected operation
  const filteredMetrics = metrics.filter(m => m.operation === selectedOperation);
  
  // Calculate average durations by data source for the selected operation
  const averagesBySource: Record<string, { count: number, total: number, average: number }> = {};
  filteredMetrics.forEach(metric => {
    if (!averagesBySource[metric.dataSource]) {
      averagesBySource[metric.dataSource] = { count: 0, total: 0, average: 0 };
    }
    
    averagesBySource[metric.dataSource].count += 1;
    averagesBySource[metric.dataSource].total += metric.duration;
  });
  
  // Calculate averages
  Object.keys(averagesBySource).forEach(source => {
    const data = averagesBySource[source];
    data.average = data.count > 0 ? data.total / data.count : 0;
  });
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Performance Dashboard</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Operation</h3>
        <div className="flex flex-wrap gap-2">
          {operations.map(op => (
            <button
              key={op}
              className={`px-3 py-1 rounded-md text-sm ${
                selectedOperation === op
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
              onClick={() => setSelectedOperation(op)}
            >
              {op}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Performance Comparison</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Data Source
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Average Duration (ms)
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Count
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {Object.keys(averagesBySource).map(source => (
                <tr key={source}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                    {source}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    {averagesBySource[source].average.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    {averagesBySource[source].count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-2">Recent Operations</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Component
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Data Source
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Duration (ms)
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMetrics.slice(0, 10).map((metric, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                    {metric.component}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    {metric.dataSource}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    {metric.duration.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        metric.success
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                      }`}
                    >
                      {metric.success ? 'Success' : 'Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
