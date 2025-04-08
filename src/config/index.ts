import { cookieStorage, createStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, optimism } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "b56e18d47c72ab683b10814fe9495694" // this is a public projectId only to use on localhost

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// For server-side rendering, we need to use a fixed network order
// The account-debug page will handle dynamic network ordering on the client side

// Default to Ethereum mainnet first for consistent address generation
export const networks = [mainnet, optimism] as [AppKitNetwork, ...AppKitNetwork[]];

// Export individual network configurations for client-side use
export const networkConfigs = {
  'mainnet-first': [mainnet, optimism] as [AppKitNetwork, ...AppKitNetwork[]],
  'optimism-first': [optimism, mainnet] as [AppKitNetwork, ...AppKitNetwork[]]
};

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  // Use type assertion to fix the storage type error
  storage: createStorage({
    storage: cookieStorage
  }) as any,
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig