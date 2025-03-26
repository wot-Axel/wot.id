'use client'

import { useAppKitAccount, useAppKit } from '@reown/appkit/react'

export const ConnectButton = () => {
  const { isConnected } = useAppKitAccount()
  const { open } = useAppKit()

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
