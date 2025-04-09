'use client';

import React from 'react';
// Import ContextProvider with proper type handling
import ContextProvider from '@/context';
import { XmtpProvider } from '@/context/XmtpContext';
import { StorageProvider } from '@/context/StorageContext';
import { TopNavigation } from '@/components/TopNavigation';
import { Footer } from '@/components/Footer';
import { LogCaptureInitializer } from '@/components/LogCaptureInitializer';
import { StorageMigration } from '@/components/StorageMigration';

export function ClientLayout({ 
  children,
  cookies 
}: { 
  children: React.ReactNode;
  cookies?: string | null;
}) {
  return (
    <>
      <ContextProvider cookies={cookies || null}>
        <XmtpProvider>
          <StorageProvider>
            {/* Initialize log capture system */}
            <LogCaptureInitializer />
            {/* Handle data migration from localStorage to Gun.js */}
            <StorageMigration />
            <TopNavigation />
            <main className="main-content">
              {children}
            </main>
            <Footer />
          </StorageProvider>
        </XmtpProvider>
      </ContextProvider>
    </>
  );
}
