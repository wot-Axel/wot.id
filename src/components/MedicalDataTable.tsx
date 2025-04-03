'use client';

import { useState } from 'react';
import { DataRecord } from '@/utils/ceramicUtils';

interface MedicalDataTableProps {
  sectionTitle: string;
  data: DataRecord[];
}

export const MedicalDataTable: React.FC<MedicalDataTableProps> = ({ sectionTitle, data }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Group data by parameter
  const parameterGroups: Record<string, DataRecord[]> = {};
  data.forEach(item => {
    const parameter = item.key.split('|')[0]; // Format: "Parameter|Date"
    if (!parameterGroups[parameter]) {
      parameterGroups[parameter] = [];
    }
    parameterGroups[parameter].push(item);
  });

  // Get unique dates from all data
  const allDates = new Set<string>();
  data.forEach(item => {
    const datePart = item.key.split('|')[1];
    if (datePart) allDates.add(datePart);
  });
  
  // Sort dates in descending order (newest first)
  const sortedDates = Array.from(allDates).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  // Extract reference ranges and units
  const referenceRanges: Record<string, string> = {};
  const units: Record<string, string> = {};
  
  Object.keys(parameterGroups).forEach(parameter => {
    const items = parameterGroups[parameter];
    if (items.length > 0) {
      const parts = items[0].value.split('|');
      if (parts.length >= 2) {
        units[parameter] = parts[0] || '';
        referenceRanges[parameter] = parts[1] || '';
      }
    }
  });

  return (
    <div className="medical-data-section">
      <h3 
        className="section-title" 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        {sectionTitle} {isExpanded ? '▼' : '▶'}
      </h3>
      
      {isExpanded && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Unit</th>
                <th>Reference Range</th>
                {sortedDates.map(date => (
                  <th key={date}>{date}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(parameterGroups).map(parameter => {
                const items = parameterGroups[parameter];
                const valuesByDate: Record<string, string> = {};
                
                items.forEach(item => {
                  const datePart = item.key.split('|')[1];
                  if (datePart) {
                    const valueParts = item.value.split('|');
                    if (valueParts.length >= 3) {
                      valuesByDate[datePart] = valueParts[2];
                    }
                  }
                });
                
                return (
                  <tr key={parameter}>
                    <td>{parameter}</td>
                    <td>{units[parameter]}</td>
                    <td>{referenceRanges[parameter]}</td>
                    {sortedDates.map(date => (
                      <td key={date}>{valuesByDate[date] || '-'}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
