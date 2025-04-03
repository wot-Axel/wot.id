import type { Metadata } from "next";
import { headers } from 'next/headers';
import './globals.css';
import ContextProvider from '@/context';
import { XmtpProvider } from '@/context/XmtpContext';
import { CeramicProvider } from '@/context/CeramicContext';
import { TopNavigation } from '@/components/TopNavigation';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: "wot.id",
  description: "Trusted Identity",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

// Get server-side data
async function getServerData() {
  const headersData = await headers();
  const cookies = headersData.get('cookie');
  
  // Check if user is logged in based on cookies
  const isLoggedIn = cookies?.includes('appkit.auth.token=');
  
  return { cookies, isLoggedIn };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { cookies, isLoggedIn } = await getServerData();

  return (
    <html lang="en">
      <body className={isLoggedIn ? 'logged-in' : ''}>
        <ContextProvider cookies={cookies}>
          <XmtpProvider>
            <CeramicProvider>
              <TopNavigation />
              <main className="main-content">
                {children}
              </main>
              <Footer />
            </CeramicProvider>
          </XmtpProvider>
        </ContextProvider>
      </body>
    </html>
  );
}
