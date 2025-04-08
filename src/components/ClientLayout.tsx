'use client';

import React from 'react';
// Import ContextProvider with proper type handling
import ContextProvider from '@/context';
import { XmtpProvider } from '@/context/XmtpContext';
import { TablelandProvider } from '@/context/TablelandContext';
import { TopNavigation } from '@/components/TopNavigation';
import { Footer } from '@/components/Footer';
import { LogCaptureInitializer } from '@/components/LogCaptureInitializer';

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
          <TablelandProvider>
            {/* Initialize log capture system */}
            <LogCaptureInitializer />
            <TopNavigation />
            <main className="main-content">
              {children}
            </main>
            <Footer />
          </TablelandProvider>
        </XmtpProvider>
      </ContextProvider>
    </>
  );
}
