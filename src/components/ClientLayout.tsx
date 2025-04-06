'use client';

import React from 'react';
// Import ContextProvider with proper type handling
import ContextProvider from '@/context';
import { XmtpProvider } from '@/context/XmtpContext';
import { DataProviders } from '@/context/DataProviders';
import { TopNavigation } from '@/components/TopNavigation';
import { Footer } from '@/components/Footer';

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
          <DataProviders>
            <TopNavigation />
            <main className="main-content">
              {children}
            </main>
            <Footer />
          </DataProviders>
        </XmtpProvider>
      </ContextProvider>
    </>
  );
}
