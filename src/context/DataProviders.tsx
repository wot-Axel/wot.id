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
  // Enable ComposeDB for all users
  // We're now using the real ComposeDB implementation instead of the original Ceramic context
  return true;
};
