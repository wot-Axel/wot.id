'use client'

import React, { useState, useEffect } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import { modal } from '@/context'

export default function AccountRecoveryTool() {
  const { address, embeddedWalletInfo, isConnected } = useAppKitAccount()
  const [originalAddress, setOriginalAddress] = useState('')
  const [addressHistory, setAddressHistory] = useState<{address: string, config: string, time: string}[]>([])
  const [appkitVersion, setAppkitVersion] = useState('')
  
  // Load address history from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('wot_id_address_history')
      if (savedHistory) {
        setAddressHistory(JSON.parse(savedHistory))
      }
      
      // Set AppKit version (we know it's 1.7.1 from package.json)
      setAppkitVersion('1.7.1')
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }, [])
  
  // Save new address to history when connected
  useEffect(() => {
    if (address && isConnected && embeddedWalletInfo) {
      // Get current network configuration
      const networkOrder = localStorage.getItem('wot_id_network_order') || 'mainnet-first'
      
      // Create new history entry
      const newEntry = {
        address,
        config: `${networkOrder} | ${embeddedWalletInfo.accountType} | ${embeddedWalletInfo.authProvider}`,
        time: new Date().toISOString()
      }
      
      // Update history
      setAddressHistory(prev => {
        // Check if this exact address is already in history
        const exists = prev.some(entry => entry.address === address)
        if (!exists) {
          const newHistory = [...prev, newEntry]
          try {
            localStorage.setItem('wot_id_address_history', JSON.stringify(newHistory))
          } catch (error) {
            console.error('Error saving address history:', error)
          }
          return newHistory
        }
        return prev
      })
    }
  }, [address, isConnected, embeddedWalletInfo])
  
  // Function to clear address history
  const clearHistory = () => {
    localStorage.removeItem('wot_id_address_history')
    setAddressHistory([])
  }
  
  // Function to mark an address as the original
  const markAsOriginal = (addr: string) => {
    setOriginalAddress(addr)
    localStorage.setItem('wot_id_original_address', addr)
  }
  
  return (
    <div className="p-4 bg-white border rounded shadow mb-6">
      <h2 className="text-xl font-bold mb-4">Account Recovery Tool</h2>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Your Original Address</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={originalAddress}
            onChange={(e) => setOriginalAddress(e.target.value)}
            placeholder="Enter your original EOA address"
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={() => localStorage.setItem('wot_id_original_address', originalAddress)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
        
        {originalAddress && address && (
          <div className={`mt-2 p-2 rounded ${originalAddress.toLowerCase() === address?.toLowerCase() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {originalAddress.toLowerCase() === address?.toLowerCase() 
              ? '✅ Current address matches your original address!' 
              : '❌ Current address does not match your original address'}
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Current Configuration</h3>
        <div className="p-3 bg-gray-100 rounded">
          <p><strong>AppKit Version:</strong> {appkitVersion}</p>
          <p><strong>Network Order:</strong> {localStorage.getItem('wot_id_network_order') || 'mainnet-first'}</p>
          {embeddedWalletInfo && (
            <>
              <p><strong>Account Type:</strong> {embeddedWalletInfo.accountType}</p>
              <p><strong>Auth Provider:</strong> {embeddedWalletInfo.authProvider}</p>
            </>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Address History</h3>
        {addressHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Address</th>
                  <th className="border p-2 text-left">Configuration</th>
                  <th className="border p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {addressHistory.map((entry, index) => (
                  <tr key={index} className={originalAddress && originalAddress.toLowerCase() === entry.address.toLowerCase() ? 'bg-green-50' : ''}>
                    <td className="border p-2 font-mono text-sm">{entry.address}</td>
                    <td className="border p-2 text-sm">{entry.config}</td>
                    <td className="border p-2">
                      <button
                        onClick={() => markAsOriginal(entry.address)}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        Mark as Original
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 italic">No address history yet. Connect with different configurations to build history.</p>
        )}
        
        {addressHistory.length > 0 && (
          <button
            onClick={clearHistory}
            className="mt-3 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
          >
            Clear History
          </button>
        )}
      </div>
      
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Recovery Steps</h3>
        <ol className="list-decimal pl-5 text-sm">
          <li className="mb-1">Enter your original address in the field above</li>
          <li className="mb-1">Try connecting with different network configurations</li>
          <li className="mb-1">When you find a configuration that produces your original address, use that configuration in your app</li>
        </ol>
      </div>
    </div>
  )
}
