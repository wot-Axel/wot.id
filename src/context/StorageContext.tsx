import React from 'react';

export function useStorage() {
  throw new Error('StorageContext is deprecated. Please use HeliaContext and useHelia instead.');
}

export function StorageProvider({ children }: { children: React.ReactNode }) {
  throw new Error('StorageProvider is deprecated. Please use HeliaProvider instead.');
}
