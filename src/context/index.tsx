'use client'

// Use relative import to avoid path alias issues
import { wagmiAdapter, projectId, networks } from '../config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
// Import React properly for Next.js
import * as React from 'react'
import type { ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

// Set up queryClient
const queryClient = new QueryClient()

// Set up metadata
const metadata = {
  name: 'wot.id',
  description: 'Trusted Identity',
  url: 'https://www.wot.id', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Create the modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  metadata,
  themeMode: 'light',
  // Using correct documented properties for maximum compatibility
  includeWalletIds: [
    // Social logins first
    "0b01c72cecc164a2e1111b6d6b6d6e774e1c3cbe0d4b6d6c3b6e3d6c3b6e3d6c", // Apple
    "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Google
    "19177a98252e07ddfc9af2e929a3c533d6c0a794e0e2a854b7c3320e1ab0124c", // GitHub
    "86f5ed4b88162d3f7c3b59f491c7c633aa35e953c352625d98c1b740174c9edf", // X/Twitter
    // Wallet options second
    "ef333840daf915aafdc4a004525502d6d49d77bd9c65e0642dbaefb3c2893bef", // WalletConnect
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
    "f5b4eeb6015d66d8ed9a072fb6c9b70cafe0f926c67c1b6532ea3ccdaa6602aa", // Brave
    // Email option last
    "d01c7758d741b363e637a817a09bcf579feae4db9f5bb16f599fdd1f66e2f974"  // Email
  ],
  // Default account types
  defaultAccountTypes: { 
    eip155: "smartAccount" // Use Smart Accounts by default for EVM chains
  },
  // Standard features
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    connectMethodsOrder: ["social", "wallet", "email"], // Control the order of connection methods
    // Focus on Apple and Google for social logins
    socials: ["apple", "google"],
    // Show all wallet options directly on the initial screen
    emailShowWallets: true
  },
  // Enable the "All Wallets" list
  allWallets: "SHOW", // Show the "All Wallets" button to provide access to all available wallet options
  themeVariables: {
    '--w3m-accent': '#000000',
  }
})

// Explicitly type the props for better type checking
interface ContextProviderProps {
  children: ReactNode;
  cookies: string | null;
}

function ContextProvider({ children, cookies }: ContextProviderProps) {
  // Use a more specific type assertion if possible
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider
