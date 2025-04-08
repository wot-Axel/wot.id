'use client'

import React, { useState, useEffect } from 'react'
import AccountDebugger from '@/components/AccountDebugger'
import NetworkSwitcher from '@/components/NetworkSwitcher'
import AccountRecoveryTool from '@/components/AccountRecoveryTool'
import EOARecoveryWizard from '@/components/EOARecoveryWizard'
import { useAppKitAccount } from '@reown/appkit/react'
import { modal } from '@/context'

export default function AccountDebugPage() {
  const { isConnected, address, embeddedWalletInfo } = useAppKitAccount()
  const [expectedAddress, setExpectedAddress] = useState('')
  const [networkOrder, setNetworkOrder] = useState('mainnet-first')
  const [localStorageData, setLocalStorageData] = useState<Record<string, string>>({});

  // Check localStorage for any AppKit related data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('appkit') || key.includes('wallet') || key.includes('w3m'))) {
          try {
            const value = localStorage.getItem(key);
            data[key] = value || '';
          } catch (e) {
            console.error('Error reading localStorage:', e);
          }
        }
      }
      setLocalStorageData(data);
    }
  }, [isConnected]);

  // Function to change network order
  const changeNetworkOrder = async (order: string) => {
    if (order === networkOrder) return;
    
    // Save current selection
    setNetworkOrder(order);
    localStorage.setItem('wot_id_network_order', order);
    
    // Clear AppKit-related localStorage items to force a fresh connection
    if (typeof window !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('appkit') || key.includes('wallet') || key.includes('w3m'))) {
          keysToRemove.push(key);
        }
      }
      
      // Remove keys in a separate loop to avoid index shifting issues
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
    
    // Disconnect current session if connected
    if (isConnected) {
      try {
        await modal.disconnect();
      } catch (e) {
        console.error('Error disconnecting:', e);
      }
    }
    
    // Force page reload to apply new configuration
    window.location.href = '/account-debug?network=' + order;
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Account Debug Page</h1>
      
      <NetworkSwitcher />
      
      {!isConnected ? (
        <div className="mb-6 p-4 bg-white border rounded shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Connect Your Account</h2>
          <button 
            onClick={() => modal.open()}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Connect with Apple
          </button>
          <p className="mt-2 text-sm text-gray-600">
            Connect your Apple account to see if we can restore your original address
          </p>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
          <h2 className="text-lg font-semibold text-green-800">Connected!</h2>
          <p className="text-sm">Your current address: <span className="font-mono">{address}</span></p>
          {embeddedWalletInfo && (
            <p className="text-sm mt-1">
              Account Type: <span className="font-semibold">{embeddedWalletInfo.accountType}</span> | 
              Provider: <span className="font-semibold">{embeddedWalletInfo.authProvider}</span>
            </p>
          )}
          <div className="mt-3">
            <button 
              onClick={() => modal.disconnect()}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
      
      <EOARecoveryWizard />
      
      <AccountDebugger />
      
      <div className="mt-8 p-4 bg-gray-50 border rounded">
        <h2 className="text-lg font-semibold mb-2">LocalStorage Data</h2>
        <p className="text-sm text-gray-600 mb-2">This shows AppKit-related data in your browser's localStorage:</p>
        
        {Object.keys(localStorageData).length > 0 ? (
          <div className="max-h-60 overflow-y-auto">
            {Object.entries(localStorageData).map(([key, value]) => (
              <div key={key} className="mb-2">
                <p className="font-semibold text-sm">{key}:</p>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                  {value.length > 100 ? `${value.substring(0, 100)}...` : value}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm italic">No AppKit related data found in localStorage</p>
        )}
      </div>
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Current Configuration</h2>
        <div className="p-3 bg-gray-100 rounded">
          <ul className="list-disc pl-5 text-sm">
            <li className="mb-1">Networks: {networkOrder === 'mainnet-first' ? 'mainnet, optimism, base' : 
                                networkOrder === 'optimism-first' ? 'optimism, mainnet, base' : 
                                'base, mainnet, optimism'}</li>
            <li className="mb-1">Default Account Type: EOA (forced)</li>
            <li className="mb-1">Social Logins: Apple, Google only</li>
            <li className="mb-1">All Wallets: Hidden</li>
            <li className="mb-1">AppKit Version: 1.7.1</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
