'use client';

import React, { ReactNode } from 'react';
import { TablelandProvider } from './TablelandContext';

/**
 * Combined data providers for the application
 * This allows us to use multiple data providers during the transition period
 */
export const DataProviders = ({ children }: { children: ReactNode }) => {
  return (
    <TablelandProvider>
      {children}
    </TablelandProvider>
  );
};

/**
 * Hook to determine if we should use ComposeDB
 * This is kept for backward compatibility but always returns false
 */
export const useComposeDBEnabled = (): boolean => {
  // Migration complete - ComposeDB is no longer used
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
