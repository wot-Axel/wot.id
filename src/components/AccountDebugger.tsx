'use client'

import React, { useEffect, useState } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'

/**
 * AccountDebugger component
 * 
 * This component displays detailed information about the currently connected account
 * to help debug account derivation issues.
 */
export default function AccountDebugger() {
  const { address, embeddedWalletInfo, isConnected, allAccounts } = useAppKitAccount()
  const [previousAddresses, setPreviousAddresses] = useState<string[]>([])
  
  useEffect(() => {
    // Load previously seen addresses from localStorage
    try {
      const savedAddresses = localStorage.getItem('wot_id_seen_addresses')
      if (savedAddresses) {
        setPreviousAddresses(JSON.parse(savedAddresses))
      }
    } catch (error) {
      console.error('Error loading previous addresses:', error)
    }
  }, [])
  
  useEffect(() => {
    // Save the current address to localStorage if it's new
    if (address && isConnected) {
      setPreviousAddresses(prev => {
        if (!prev.includes(address)) {
          const newAddresses = [...prev, address]
          try {
            localStorage.setItem('wot_id_seen_addresses', JSON.stringify(newAddresses))
          } catch (error) {
            console.error('Error saving addresses:', error)
          }
          return newAddresses
        }
        return prev
      })
    }
  }, [address, isConnected])
  
  if (!isConnected) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-bold mb-2">Account Debugger</h2>
        <p>Not connected. Please connect your account first.</p>
        {previousAddresses.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold">Previously seen addresses:</h3>
            <ul className="mt-2">
              {previousAddresses.map((addr, i) => (
                <li key={i} className="font-mono text-sm">{addr}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-lg font-bold mb-2">Account Debugger</h2>
      
      <div className="mb-4">
        <h3 className="font-semibold">Current Address:</h3>
        <p className="font-mono text-sm break-all">{address}</p>
      </div>
      
      {embeddedWalletInfo && (
        <div className="mb-4">
          <h3 className="font-semibold">Embedded Wallet Info:</h3>
          <ul className="mt-2">
            <li><strong>Account Type:</strong> {embeddedWalletInfo.accountType}</li>
            <li><strong>Auth Provider:</strong> {embeddedWalletInfo.authProvider}</li>
            {embeddedWalletInfo.user && (
              <>
                <li><strong>Username:</strong> {embeddedWalletInfo.user.username || 'N/A'}</li>
                <li><strong>Email:</strong> {embeddedWalletInfo.user.email || 'N/A'}</li>
              </>
            )}
            <li><strong>Smart Account Deployed:</strong> {embeddedWalletInfo.isSmartAccountDeployed ? 'Yes' : 'No'}</li>
          </ul>
        </div>
      )}
      
      {allAccounts && allAccounts.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold">All Connected Accounts:</h3>
          <ul className="mt-2">
            {allAccounts.map((account, index) => (
              <li key={index} className="font-mono text-sm break-all">
                {account.address} ({account.type})
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {previousAddresses.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold">Previously Seen Addresses:</h3>
          <ul className="mt-2">
            {previousAddresses.map((addr, i) => (
              <li key={i} className="font-mono text-sm break-all">{addr}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-4">
        <button 
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={() => {
            localStorage.removeItem('wot_id_seen_addresses')
            setPreviousAddresses([])
          }}
        >
          Clear Address History
        </button>
      </div>
    </div>
  )
}
