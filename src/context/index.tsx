'use client'

import { wagmiAdapter, projectId, networks } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import React, { type ReactNode } from 'react'
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
  // Specific order of wallets as requested: 4 socials, 3 wallets, email
  featuredWalletIds: [
    // 1. Four social login options in this order: Apple, Google, GitHub, X (Twitter)
    "19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927", // Apple
    "6f8c7d9d8f1d01fc6751efe7abc389c153f48e86266d9b3e5a0c2e3e49eeae17", // Google
    "d0b98853f1400d8e392c9a6e35d6c3e68e3b6e3f51fd7f6c7f5209ec388c297", // GitHub
    "a797aa35c0d39f9d5f4ecbe0a9d6e981a703187ef018f3ee6245a0978e5baf55", // X (Twitter)
    
    // 2. Three wallet options: WalletConnect, MetaMask, Brave
    "ef333840daf915aafdc4a004525502d6d49d77bd9c65e0642dbaefb3c2893bef", // WalletConnect
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
    "f5b4eeb6015d66d8ed2132dd42ffb97865f2873f5f7d2592cb99d5b9fbc2b6d4", // Brave
    
    // 3. Finally email
    "ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18"  // Email
  ],
  // Disable explorer to only show our featured wallets
  enableExplorer: false,
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  },
  themeVariables: {
    '--w3m-accent': '#000000',
  }
})

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider
