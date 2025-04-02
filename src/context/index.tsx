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
  // Prioritize social login options first in the featured wallets list
  featuredWalletIds: [
    // Social login options
    "6f8c7d9d8f1d01fc6751efe7abc389c153f48e86266d9b3e5a0c2e3e49eeae17", // Google
    "a797aa35c0d39f9d5f4ecbe0a9d6e981a703187ef018f3ee6245a0978e5baf55", // Twitter
    "20459438007b75f4f4acb98bf29aa3b800550309646d375da5fd4aac6c2a2c66", // Discord
    "d0b98853f1400d8e392c9a6e35d6c3e68e3b6e3f51fd7f6c7f5209ec388c297",  // GitHub
    "19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927", // Apple
    // Wallet options after social logins
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
    "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Coinbase
    "ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18"  // Email
  ],
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
