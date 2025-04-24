'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit-controllers/react';
// (Removed: TableType, listItems, storeItem, deleteItem from storageUtils)

// Define the data structure for medical records
interface MedicalData {
  item_key: string;
  item_value: string;
  created_at?: string;
  updated_at?: string;
}

// Simple table display component for medical data
const MedicalDataTable = ({ data }: { data: MedicalData[] }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Key
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Value
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={item.item_key}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {item.item_key}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.item_value}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  className="text-indigo-600 hover:text-indigo-900"
                  // Delete functionality removed for compliance. Implement EAS-based deletion here if needed.
onClick={() => alert('Delete functionality is not implemented in this demo.')}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const MedicalDataSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [medicalData, setMedicalData] = useState<MedicalData[]>([]);
  const [medicalDataSections, setMedicalDataSections] = useState<Record<string, MedicalData[]>>({});

  // Load medical data from storage
  useEffect(() => {
    // Data loading logic removed for compliance. Implement EAS-based loading here if needed.
  }, [address, isConnected]);

  // (Removed: setLoading, loadMedicalData, deleteItem, TableType, and all local storage logic.)
  // TODO: Replace with EAS-based data management logic.

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Medical Data</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={e => { e.preventDefault(); alert('Add functionality is not implemented in this demo.'); }} className="mb-6">
        <div className="flex flex-col space-y-4">
          <div>
            <label htmlFor="dataType" className="block text-sm font-medium text-gray-700">
              Data Type
            </label>
            <select
              id="dataType"
              name="dataType"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Select a data type</option>
              <option value="allergies">Allergies</option>
              <option value="conditions">Medical Conditions</option>
              <option value="medications">Medications</option>
              <option value="procedures">Procedures</option>
              <option value="vaccinations">Vaccinations</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="dataValue" className="block text-sm font-medium text-gray-700">
              Data Value
            </label>
            <textarea
              id="dataValue"
              name="dataValue"
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter medical data"
              required
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Adding...' : 'Add Medical Data'}
            </button>
          </div>
        </div>
      </form>
      
      {loading && <p>Loading medical data...</p>}
      
      {!loading && Object.keys(medicalDataSections).length === 0 && (
        <div className="text-center p-4 bg-gray-50 rounded-md">
          <p className="text-gray-600">No medical data found. Add some using the form above.</p>
        </div>
      )}
      
      {!loading && Object.keys(medicalDataSections).length > 0 && (
        <div className="space-y-6">
          {Object.entries(medicalDataSections).map(([category, items]) => (
            <div key={category} className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium capitalize mb-2">{category}</h3>
              <MedicalDataTable data={items} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
