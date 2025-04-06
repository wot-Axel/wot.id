/**
 * Database Status Indicator
 * 
 * A component that displays the current status of database connections (Ceramic/Tableland).
 * Shows a visual indicator for connection status and implementation details.
 */

import React from 'react';
import { Box, Badge, Text } from '@chakra-ui/react';

// Simple icon components since we might not have Chakra UI icons
const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
  </svg>
);

const WarningIcon = ({ color }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={color || 'currentColor'}>
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
  </svg>
);

interface DatabaseStatusIndicatorProps {
  ceramicClient?: any;
  tablelandClient?: any;
  isCeramicConnected?: boolean;
  isTablelandConnected?: boolean;
  useTableland?: boolean;
}

/**
 * Determine if the client is using the mock implementation
 */
const isUsingMockImplementation = (client: any): boolean => {
  if (!client) return false;
  return !!client.isMockImplementation;
};

/**
 * Determine if the client is offline
 */
const isClientOffline = (client: any): boolean => {
  if (!client) return true;
  return client.isOffline === true;
};

/**
 * Component that displays the current status of database connections
 */
const DatabaseStatusIndicator: React.FC<DatabaseStatusIndicatorProps> = ({ 
  ceramicClient, 
  tablelandClient,
  isCeramicConnected = false,
  isTablelandConnected = false,
  useTableland = true
}) => {
  const isCeramicMock = isUsingMockImplementation(ceramicClient);
  const isCeramicOffline = isClientOffline(ceramicClient);
  const isTablelandOffline = !tablelandClient || !isTablelandConnected;
  
  // Determine which database is active
  const activeDatabase = useTableland ? 'Tableland' : 'Ceramic';
  
  // Determine status color and message
  let statusColor = 'gray.400';
  let statusMessage = `${activeDatabase}: Disconnected`;
  let icon = <InfoIcon />;
  
  if (isConnected) {
    if (isMock) {
      statusColor = 'orange.400';
      statusMessage = 'Ceramic: Using Local Storage (Mock Implementation)';
      icon = <WarningIcon color="orange.400" />;
    } else if (isOffline) {
      statusColor = 'yellow.400';
      statusMessage = 'Ceramic: Offline Mode';
      icon = <WarningIcon color="yellow.400" />;
    } else {
      statusColor = 'green.400';
      statusMessage = 'Ceramic: Connected';
    }
  }
  
  return (
    <div title={statusMessage}>
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: isMock ? '#FED7AA' : isOffline ? '#FEEBC8' : isConnected ? '#C6F6D5' : '#E2E8F0',
          color: isMock ? '#9C4221' : isOffline ? '#975A16' : isConnected ? '#276749' : '#4A5568',
          fontSize: '12px',
          fontWeight: 500
        }}
      >
        <span style={{ marginRight: '4px' }}>{icon}</span>
        <span>
          {isMock ? 'Local Storage' : isConnected ? 'Ceramic' : 'Disconnected'}
        </span>
      </div>
    </div>
  );
};

export default DatabaseStatusIndicator;
