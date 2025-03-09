import type { Metadata } from "next";
import { headers } from 'next/headers';
import './globals.css';
import ContextProvider from '@/context';
import { TopNavigation } from '@/components/TopNavigation';

export const metadata: Metadata = {
  title: "wot.id",
  description: "Trusted Identity",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersData = await headers();
  const cookies = headersData.get('cookie');

  return (
    <html lang="en">
      <body>
        <ContextProvider cookies={cookies}>
          <TopNavigation />
          <main className="main-content">
            {children}
          </main>
        </ContextProvider>
      </body>
    </html>
  );
}
