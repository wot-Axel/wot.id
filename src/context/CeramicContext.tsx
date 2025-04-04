'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Minimal context implementation that will build in production
interface CeramicContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  ceramic: any | null;
}

const CeramicContext = createContext<CeramicContextType>({
  isInitialized: false,
  isLoading: false,
  error: null,
  ceramic: null
});

export const useCeramic = () => useContext(CeramicContext);

export const CeramicProvider = ({ children }: { children: ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ceramic, setCeramic] = useState<any | null>(null);
  
  return (
    <CeramicContext.Provider value={{ isInitialized, isLoading, error, ceramic }}>
      {children}
    </CeramicContext.Provider>
  );
};
