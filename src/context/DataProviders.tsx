'use client';

import React, { ReactNode } from 'react';
import { CeramicProvider } from './CeramicContext';
import { ComposeDBProvider } from './ComposeDBContext';

/**
 * Combined data providers for the application
 * This allows us to use both the original Ceramic context and the new ComposeDB context
 * during the transition period
 */
export const DataProviders = ({ children }: { children: ReactNode }) => {
  return (
    <CeramicProvider>
      <ComposeDBProvider>
        {children}
      </ComposeDBProvider>
    </CeramicProvider>
  );
};

/**
 * Hook to determine if we should use ComposeDB
 * This can be controlled by a feature flag, user preference, or environment variable
 */
export const useComposeDBEnabled = (): boolean => {
  // For now, we'll return false to continue using the original Ceramic context
  // This can be updated later to enable ComposeDB for all users or specific users
  return false;
};
