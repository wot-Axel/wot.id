import type { Metadata } from "next";
import { headers } from 'next/headers';
import './globals.css';
import ContextProvider from '@/context';
import { XmtpProvider } from '@/context/XmtpContext';
import { TopNavigation } from '@/components/TopNavigation';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: "wot.id",
  description: "Trusted Identity",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersData = await headers();
  const cookies = headersData.get('cookie');
  
  // Check if user is logged in based on cookies
  const isLoggedIn = cookies?.includes('appkit.auth.token=');

  return (
    <html lang="en">
      <body className={isLoggedIn ? 'logged-in' : ''}>
        <ContextProvider cookies={cookies}>
          <XmtpProvider>
            <TopNavigation />
            <div className="content-wrapper">
              <main className="main-content">
                {children}
              </main>
            </div>
            <Footer />
          </XmtpProvider>
        </ContextProvider>
      </body>
    </html>
  );
}
