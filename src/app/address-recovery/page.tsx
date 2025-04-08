'use client'

import React, { useState, useEffect } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import { modal } from '@/context'

export default function AddressRecoveryPage() {
  const { isConnected, address } = useAppKitAccount()
  const [originalAddress, setOriginalAddress] = useState('')
  const [addressMap, setAddressMap] = useState<Record<string, string>>({})
  const [manualAddress, setManualAddress] = useState('')
  const [message, setMessage] = useState('')
  const [allLocalStorageData, setAllLocalStorageData] = useState<Record<string, string>>({})

  // Load all data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Load original address
        const savedOriginal = localStorage.getItem('wot_id_original_address')
        if (savedOriginal) {
          setOriginalAddress(savedOriginal)
        }
        
        // Load address map
        const savedMap = localStorage.getItem('wot_id_address_map')
        if (savedMap) {
          setAddressMap(JSON.parse(savedMap))
        }

        // Load all localStorage data
        const data: Record<string, string> = {}
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key) {
            try {
              const value = localStorage.getItem(key)
              data[key] = value || ''
            } catch (e) {
              console.error('Error reading localStorage:', e)
            }
          }
        }
        setAllLocalStorageData(data)
      } catch (error) {
        console.error('Error loading saved data:', error)
        setMessage('Error loading saved data: ' + (error instanceof Error ? error.message : String(error)))
      }
    }
  }, [])

  // Function to set original address
  const saveOriginalAddress = (address: string) => {
    try {
      localStorage.setItem('wot_id_original_address', address)
      setOriginalAddress(address)
      setMessage(`Successfully set ${address.substring(0, 8)}...${address.substring(address.length - 6)} as original address!`)
    } catch (error) {
      console.error('Error saving original address:', error)
      setMessage('Error saving original address: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  // Function to save manual address
  const saveManualAddress = () => {
    if (!manualAddress || !manualAddress.startsWith('0x') || manualAddress.length !== 42) {
      setMessage('Please enter a valid Ethereum address (0x...)')
      return
    }
    saveOriginalAddress(manualAddress)
  }

  // Function to clear all AppKit data
  const clearAllAppKitData = () => {
    try {
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('appkit') || key.includes('wallet') || key.includes('w3m'))) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      setMessage('Successfully cleared all AppKit data. You may need to reload the page.')
      
      // Update the local storage data display
      const data: Record<string, string> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          try {
            const value = localStorage.getItem(key)
            data[key] = value || ''
          } catch (e) {
            console.error('Error reading localStorage:', e)
          }
        }
      }
      setAllLocalStorageData(data)
    } catch (error) {
      console.error('Error clearing AppKit data:', error)
      setMessage('Error clearing AppKit data: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Address Recovery Tool</h1>
      
      {!isConnected ? (
        <div className="mb-6 p-4 bg-white border rounded shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Connect Your Account</h2>
          <button 
            onClick={() => modal.open()}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Connect Wallet
          </button>
          <p className="mt-2 text-sm text-gray-600">
            Connect your wallet to see your current address
          </p>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
          <h2 className="text-lg font-semibold text-green-800">Connected!</h2>
          <p className="text-sm">Your current address: <span className="font-mono">{address}</span></p>
          <div className="mt-3">
            <button 
              onClick={() => saveOriginalAddress(address || '')}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 mr-2"
              disabled={!address}
            >
              Set as Original Address
            </button>
            <button 
              onClick={() => modal.disconnect()}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
      
      {message && (
        <div className={`mb-6 p-4 rounded ${message.includes('Error') ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
          {message}
        </div>
      )}
      
      <div className="mb-6 p-4 bg-white border rounded shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Current Original Address</h2>
        {originalAddress ? (
          <div>
            <p className="font-mono bg-gray-100 p-2 rounded">{originalAddress}</p>
            <p className="mt-2 text-sm text-gray-600">This is your currently saved original address</p>
          </div>
        ) : (
          <p className="text-sm text-gray-600">No original address is currently set</p>
        )}
      </div>
      
      <div className="mb-6 p-4 bg-white border rounded shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Your Saved Addresses</h2>
        {Object.keys(addressMap).length > 0 ? (
          <div>
            <p className="mb-2 text-sm text-gray-600">Click on any address to set it as your original address:</p>
            {Object.entries(addressMap).map(([configId, addr]) => (
              <div key={configId} className="mb-2 p-2 bg-gray-50 rounded">
                <p className="text-sm font-semibold">{configId}:</p>
                <div className="flex items-center">
                  <p className="font-mono text-xs truncate flex-grow">{addr}</p>
                  <button 
                    onClick={() => saveOriginalAddress(addr)}
                    className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    Use This
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No saved addresses found</p>
        )}
      </div>
      
      <div className="mb-6 p-4 bg-white border rounded shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Enter Address Manually</h2>
        <div className="flex">
          <input
            type="text"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            placeholder="0x..."
            className="flex-grow p-2 border rounded mr-2"
          />
          <button 
            onClick={saveManualAddress}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Enter your original Ethereum address if you know it
        </p>
      </div>
      
      <div className="mb-6 p-4 bg-white border rounded shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Reset AppKit Data</h2>
        <button 
          onClick={clearAllAppKitData}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear All AppKit Data
        </button>
        <p className="mt-2 text-sm text-gray-600">
          This will clear all AppKit-related data from your browser's localStorage.
          Use this if you're experiencing persistent login issues.
        </p>
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 border rounded">
        <h2 className="text-lg font-semibold mb-2">All LocalStorage Data</h2>
        <p className="text-sm text-gray-600 mb-2">This shows all data in your browser's localStorage:</p>
        
        {Object.keys(allLocalStorageData).length > 0 ? (
          <div className="max-h-60 overflow-y-auto">
            {Object.entries(allLocalStorageData).map(([key, value]) => (
              <div key={key} className="mb-2">
                <p className="font-semibold text-sm">{key}:</p>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                  {value.length > 100 ? `${value.substring(0, 100)}...` : value}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm italic">No data found in localStorage</p>
        )}
      </div>
    </div>
  )
}
