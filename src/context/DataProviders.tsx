'use client';

import React, { ReactNode } from 'react';
import { CeramicProvider } from './CeramicContext';
import { ComposeDBProvider } from './ComposeDBContext';
import { TablelandProvider } from './TablelandContext';

/**
 * Combined data providers for the application
 * This allows us to use multiple data providers during the transition period
 */
export const DataProviders = ({ children }: { children: ReactNode }) => {
  return (
    <CeramicProvider>
      <ComposeDBProvider>
        <TablelandProvider>
          {children}
        </TablelandProvider>
      </ComposeDBProvider>
    </CeramicProvider>
  );
};

/**
 * Hook to determine if we should use ComposeDB
 * This can be controlled by a feature flag, user preference, or environment variable
 */
export const useComposeDBEnabled = (): boolean => {
  // We're transitioning away from ComposeDB back to Tableland
  // This will be set to false once the migration is complete
  return false;
};

/**
 * Hook to determine if we should use Tableland
 * This can be controlled by a feature flag, user preference, or environment variable
 */
export const useTablelandEnabled = (): boolean => {
  // Enable Tableland for all users
  // We're now using Tableland as our primary database
  return true;
};
