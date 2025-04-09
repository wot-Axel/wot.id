'use client';

import React from 'react';
// Import ContextProvider with proper type handling
import ContextProvider from '@/context';
import { XmtpProvider } from '@/context/XmtpContext';
import { StorageProvider } from '@/context/StorageContext';
import { TopNavigation } from '@/components/TopNavigation';
import { Footer } from '@/components/Footer';
import { LogCaptureInitializer } from '@/components/LogCaptureInitializer';
// Storage migration no longer needed with Gun.js implementation

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
            {/* Gun.js storage implementation now fully integrated */}
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
