import React from 'react';
import type { Metadata } from "next";
import { headers } from 'next/headers';
import './globals.css';
import { ClientLayout } from '@/components/ClientLayout';

export const metadata: Metadata = {
  title: "wot.id",
  description: "Trusted Identity"};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover'
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
  children}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get cookies from server-side
  const { cookies, isLoggedIn } = await getServerData();

  return (
    <html lang="en">
      <body className={isLoggedIn ? 'logged-in' : ''}>
        <ClientLayout cookies={cookies}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
