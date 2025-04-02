'use client'

import { useAppKitAccount } from '@reown/appkit/react'
import { useWalletPreferences } from '@/hooks/useWalletPreferences'

export const ConnectButton = () => {
  const { isConnected } = useAppKitAccount()
  const { openModal } = useWalletPreferences()

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '1rem 0' }}>
      {!isConnected ? (
        <button 
          onClick={() => openModal()}
          className="connect-button"
        >
          Connect
        </button>
      ) : (
        // @ts-expect-error Add this line while our team fix the upgrade to react 19 for global components
        <appkit-button />
      )}
    </div>
  )
}
