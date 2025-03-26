'use client'

import { useAppKit } from '@reown/appkit/react'
import { useAppKitAccount } from '@reown/appkit/react'

export const ConnectButton = () => {
  const { open } = useAppKit()
  const { isConnected } = useAppKitAccount()

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '1rem 0' }}>
      {!isConnected ? (
        <button 
          onClick={() => open()}
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
