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
        <appkit-button />
      )}
    </div>
  )
}
