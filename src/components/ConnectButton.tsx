'use client'

export const ConnectButton = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '1rem 0' }}>
        {/* @ts-expect-error Add this line while our team fix the upgrade to react 19 for global components */}
        <appkit-button />
    </div>
  )
}
