'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import { modal } from '@/context'

type ConfigOption = {
  id: string
  name: string
  description: string
  networkOrder: string[]
  accountType: 'eoa' | 'smartAccount'
}

const CONFIG_OPTIONS: ConfigOption[] = [
  {
    id: 'mainnet-smart',
    name: 'Mainnet First (Smart Account)',
    description: 'Mainnet as primary network with Smart Accounts',
    networkOrder: ['mainnet', 'optimism'],
    accountType: 'smartAccount'
  },
  {
    id: 'optimism-smart',
    name: 'Optimism First (Smart Account)',
    description: 'Optimism as primary network with Smart Accounts',
    networkOrder: ['optimism', 'mainnet'],
    accountType: 'smartAccount'
  },
  {
    id: 'mainnet-eoa',
    name: 'Mainnet First (EOA)',
    description: 'Mainnet as primary network with EOA accounts',
    networkOrder: ['mainnet', 'optimism'],
    accountType: 'eoa'
  },
  {
    id: 'optimism-eoa',
    name: 'Optimism First (EOA)',
    description: 'Optimism as primary network with EOA accounts',
    networkOrder: ['optimism', 'mainnet'],
    accountType: 'eoa'
  }
]

// Define types for transaction history
type Transaction = {
  hash: string
  from: string
  to: string
  timeStamp: string
  value: string
}

type AddressHistory = {
  address: string
  firstTx?: Transaction
  lastTx?: Transaction
  txCount: number
}

export default function EOARecoveryWizard() {
  const { address, embeddedWalletInfo, isConnected } = useAppKitAccount()
  const [originalAddress, setOriginalAddress] = useState('')
  const [addressMap, setAddressMap] = useState<Record<string, string>>({})
  const [currentConfig, setCurrentConfig] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  
  // State for development mode detection
  const [isDevelopment, setIsDevelopment] = useState(false)
  
  // Check if we're in development environment - client-side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDevelopment(
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1'
      )
    }
  }, [])
  
  const [manualMode, setManualMode] = useState(false)
  
  // Update manual mode when development status is determined
  useEffect(() => {
    setManualMode(isDevelopment)
  }, [isDevelopment])
  const [manualAddress, setManualAddress] = useState('')
  const [searchAddress, setSearchAddress] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<AddressHistory[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  
  // Use refs to track previous values to avoid infinite updates
  const addressRef = useRef<string | undefined>(undefined)
  const configRef = useRef<string>('')
  const initialLoadDoneRef = useRef(false)
  
  // Load saved data on mount - only once
  useEffect(() => {
    if (initialLoadDoneRef.current) return
    
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
      
      initialLoadDoneRef.current = true
    } catch (error) {
      console.error('Error loading saved data:', error)
    }
  }, [])
  
  // Set current config when wallet info changes
  useEffect(() => {
    if (!embeddedWalletInfo && !manualMode) {
      // Clear any previous connection errors after 5 seconds
      const timer = setTimeout(() => {
        if (!embeddedWalletInfo && !isConnected) {
          setConnectionError('Unable to connect to wallet. You can use manual mode instead.')
        }
      }, 5000)
      
      return () => clearTimeout(timer)
    }
    
    setConnectionError(null)
    
    if (!embeddedWalletInfo && !manualMode) return
    
    try {
      const networkOrder = localStorage.getItem('wot_id_network_order') || 'mainnet-first'
      const accountType = manualMode ? 'eoa' : (embeddedWalletInfo?.accountType || 'eoa')
      
      let configId = ''
      if (networkOrder === 'mainnet-first') {
        configId = accountType === 'eoa' ? 'mainnet-eoa' : 'mainnet-smart'
      } else if (networkOrder === 'optimism-first') {
        configId = accountType === 'eoa' ? 'optimism-eoa' : 'optimism-smart'
      } else if (networkOrder === 'base-first') {
        configId = accountType === 'eoa' ? 'base-eoa' : 'base-smart'
      }
      
      if (configId && configId !== configRef.current) {
        configRef.current = configId
        setCurrentConfig(configId)
      }
    } catch (error) {
      console.error('Error determining configuration:', error)
      setConnectionError('Error determining configuration. Please try again.')
    }
  }, [embeddedWalletInfo, isConnected, manualMode])
  
  // Update address map when address changes - using refs to prevent infinite loops
  useEffect(() => {
    // Handle both connected wallet and manual mode
    const currentAddress = manualMode ? manualAddress : address
    
    if ((!currentAddress || (!isConnected && !manualMode) || !currentConfig)) return
    if (currentAddress === addressRef.current && currentConfig === configRef.current) return
    
    addressRef.current = currentAddress
    configRef.current = currentConfig
    
    // Only update if needed - compare with existing value
    if (addressMap[currentConfig] !== currentAddress) {
      // Create new map and update localStorage
      const newMap = { ...addressMap, [currentConfig]: currentAddress }
      
      try {
        localStorage.setItem('wot_id_address_map', JSON.stringify(newMap))
      } catch (e) {
        console.error('Error saving address map:', e)
        setConnectionError('Error saving address map. Please try again.')
      }
      
      // Update state
      setAddressMap(newMap)
    }
  }, [address, isConnected, currentConfig, addressMap, manualMode, manualAddress])
  
  // Function to save original address
  const saveOriginalAddress = useCallback(() => {
    if (originalAddress) {
      localStorage.setItem('wot_id_original_address', originalAddress)
    }
  }, [originalAddress])
  
  // Function to switch configuration
  const switchConfig = useCallback(async (configId: string) => {
    if (isLoading) return
    
    const config = CONFIG_OPTIONS.find(c => c.id === configId)
    if (!config) return
    
    setIsLoading(true)
    setConnectionError(null)
    
    try {
      // Disconnect current session if connected
      if (isConnected && !manualMode) {
        try {
          await modal.disconnect()
        } catch (e) {
          console.error('Error disconnecting:', e)
          // Continue even if disconnect fails
        }
      }
      
      // Clear AppKit-related localStorage items
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('appkit') || key.includes('wallet') || key.includes('w3m'))) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Set network order based on configuration
      let networkOrder = 'mainnet-first'
      if (config.networkOrder[0] === 'optimism') {
        networkOrder = 'optimism-first'
      } else if (config.networkOrder[0] === 'base') {
        networkOrder = 'base-first'
      }
      
      localStorage.setItem('wot_id_network_order', networkOrder)
      localStorage.setItem('wot_id_account_type', config.accountType)
      
      // In manual mode, just update the configuration without reloading
      if (manualMode) {
        setCurrentConfig(configId)
        configRef.current = configId
        setIsLoading(false)
      } else {
        // Force page reload to apply new configuration
        window.location.href = `/account-debug?config=${configId}&t=${Date.now()}`
      }
    } catch (error) {
      console.error('Error switching configuration:', error)
      setConnectionError('Error switching configuration. Please try again.')
      setIsLoading(false)
    }
  }, [isLoading, isConnected, manualMode])
  
  // Find matching config
  const [matchingConfig, setMatchingConfig] = useState<ConfigOption | null>(null)
  
  // Update matching config when dependencies change
  useEffect(() => {
    if (!originalAddress) {
      setMatchingConfig(null)
      return
    }
    
    const match = CONFIG_OPTIONS.find(config => {
      const addr = addressMap[config.id]
      return addr && addr.toLowerCase() === originalAddress.toLowerCase()
    })
    
    setMatchingConfig(match || null)
  }, [originalAddress, addressMap])
  
  // Toggle manual mode
  const toggleManualMode = useCallback(() => {
    setManualMode(prev => !prev)
    setConnectionError(null)
  }, [])
  
  // Helper function to get a sample address for the current config
  const getSampleAddressForConfig = useCallback((configId: string) => {
    // These are sample addresses for development testing only
    const sampleAddresses: Record<string, string> = {
      'mainnet-eoa': '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      'optimism-eoa': '0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF',
      'base-eoa': '0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69',
      'mainnet-smart': '0x1Db3439a222C519ab44bb1144fC28167b4Fa6EE6',
      'optimism-smart': '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db'
    }
    return sampleAddresses[configId] || ''
  }, [])
  
  // Function to search transaction history
  const searchTransactionHistory = useCallback(async () => {
    if (!searchAddress || isSearching) return
    
    setIsSearching(true)
    setSearchError(null)
    setSearchResults([])
    
    try {
      // Format the address to ensure it's valid
      const formattedAddress = searchAddress.trim().toLowerCase()
      
      // Create a history object for the current address
      const historyResult: AddressHistory = {
        address: formattedAddress,
        txCount: 0
      }
      
      // Fetch transactions from Etherscan API for Mainnet
      // Using a free API key with rate limiting - this is fine for demo purposes
      const mainnetResponse = await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${formattedAddress}&startblock=0&endblock=99999999&sort=asc&apikey=NSZCD6S4TKVJ3WNWH66UKE69QFTBYGKBFY`)
      const mainnetData = await mainnetResponse.json()
      
      if (mainnetData.status === '1' && mainnetData.result.length > 0) {
        const transactions = mainnetData.result
        historyResult.txCount = transactions.length
        historyResult.firstTx = transactions[0]
        historyResult.lastTx = transactions[transactions.length - 1]
      }
      
      // Add more networks here if needed (Optimism, Base, etc.)
      
      setSearchResults([historyResult])
    } catch (error) {
      console.error('Error searching transaction history:', error)
      setSearchError('Failed to search transaction history. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }, [searchAddress, isSearching])

  return (
    <div className="p-4 bg-white border rounded shadow mb-6">
      <h2 className="text-xl font-bold mb-4">EOA Recovery Wizard</h2>
      
      {connectionError && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded">
          <p className="font-semibold">⚠️ {connectionError}</p>
          <button 
            onClick={toggleManualMode}
            className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            {manualMode ? 'Use Wallet Connection' : 'Switch to Manual Mode'}
          </button>
        </div>
      )}
      
      {!connectionError && (
        <div className="mb-4">
          <button 
            onClick={toggleManualMode}
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            {manualMode ? 'Use Wallet Connection' : 'Switch to Manual Mode'}
          </button>
        </div>
      )}
      
      {manualMode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold mb-2">Manual Mode {isDevelopment && '(Development Environment)'}</h3>
          <p className="text-sm mb-2">Enter your current wallet address for the selected configuration:</p>
          <input
            type="text"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            placeholder="Enter current wallet address"
            className="w-full p-2 border rounded mb-2"
          />
          {isDevelopment && currentConfig && (
            <div className="mt-2">
              <button
                onClick={() => setManualAddress(getSampleAddressForConfig(currentConfig))}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
              >
                Use Sample Address for {currentConfig}
              </button>
              <p className="text-xs mt-1 text-gray-500">This option is only available in development mode.</p>
            </div>
          )}
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Search Transaction History</h3>
        <p className="text-sm mb-2">Search for an address to view its transaction history and help identify your original address:</p>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            placeholder="Enter an ETH address to search"
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={searchTransactionHistory}
            disabled={isSearching}
            className={`px-3 py-1 ${isSearching ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded`}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        {searchError && (
          <div className="mb-3 p-2 bg-red-100 text-red-800 rounded">
            {searchError}
          </div>
        )}
        
        {searchResults.length > 0 && (
          <div className="mb-3 p-3 bg-gray-50 border rounded">
            <h4 className="font-semibold">Results for {searchResults[0].address}</h4>
            <p className="text-sm">Total Transactions: {searchResults[0].txCount}</p>
            {searchResults[0].firstTx && (
              <div className="mt-2">
                <p className="text-sm font-semibold">First Transaction:</p>
                <p className="text-xs">Hash: {searchResults[0].firstTx.hash}</p>
                <p className="text-xs">Date: {new Date(parseInt(searchResults[0].firstTx.timeStamp) * 1000).toLocaleString()}</p>
                <button 
                  onClick={() => setOriginalAddress(searchResults[0].address)}
                  className="mt-2 px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Use as Original Address
                </button>
              </div>
            )}
          </div>
        )}
        
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
            onClick={saveOriginalAddress}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
        
        {originalAddress && (manualMode ? manualAddress : address) && (
          <div className={`mt-2 p-2 rounded ${originalAddress.toLowerCase() === (manualMode ? manualAddress : address)?.toLowerCase() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {originalAddress.toLowerCase() === (manualMode ? manualAddress : address)?.toLowerCase() 
              ? '✅ Current address matches your original address!' 
              : '❌ Current address does not match your original address'}
          </div>
        )}
        
        {matchingConfig && (
          <div className="mt-2 p-3 bg-green-100 text-green-800 rounded">
            <p className="font-semibold">✅ Found a matching configuration!</p>
            <p>Your original address was found with: {matchingConfig.name}</p>
            <p className="text-sm mt-1">Network Order: {matchingConfig.networkOrder.join(', ')}</p>
            <p className="text-sm">Account Type: {matchingConfig.accountType}</p>
            <button
              onClick={() => switchConfig(matchingConfig.id)}
              className="mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Use This Configuration
            </button>
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Try Different Configurations</h3>
        <p className="text-sm text-gray-600 mb-3">
          Click on each configuration to connect with it and see if it produces your original address.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CONFIG_OPTIONS.map(config => {
            const hasTestedConfig = Boolean(addressMap[config.id])
            const isMatch = originalAddress && hasTestedConfig && 
                           addressMap[config.id]?.toLowerCase() === originalAddress.toLowerCase()
            
            return (
              <div 
                key={config.id} 
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  currentConfig === config.id 
                    ? 'bg-blue-50 border-blue-300' 
                    : isMatch 
                      ? 'bg-green-50 border-green-300' 
                      : hasTestedConfig 
                        ? 'bg-gray-50 border-gray-300' 
                        : 'hover:bg-gray-50'
                }`}
                onClick={() => switchConfig(config.id)}
              >
                <h4 className="font-semibold">{config.name}</h4>
                <p className="text-sm text-gray-600">{config.description}</p>
                
                {hasTestedConfig && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Generated Address:</p>
                    <p className="font-mono text-xs break-all">{addressMap[config.id]}</p>
                    
                    {isMatch && (
                      <div className="mt-1 text-green-600 text-sm font-semibold">
                        ✅ Matches original!
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Current Configuration</h3>
        {currentConfig ? (
          <div className="p-3 bg-gray-100 rounded">
            {CONFIG_OPTIONS.find(c => c.id === currentConfig)?.name || 'Unknown'}
            {isConnected && (
              <div className="mt-2">
                <p className="text-sm"><strong>Connected Address:</strong></p>
                <p className="font-mono text-xs break-all">{address}</p>
                {embeddedWalletInfo && (
                  <div className="mt-1 text-xs">
                    <p><strong>Account Type:</strong> {embeddedWalletInfo.accountType}</p>
                    <p><strong>Auth Provider:</strong> {embeddedWalletInfo.authProvider}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 italic">No configuration selected</p>
        )}
      </div>
      
      <div className="mt-6 text-sm text-gray-600">
        <p><strong>How this works:</strong> This wizard tries different network orders and account types to find which configuration produces your original EOA address.</p>
        <p className="mt-1">Once found, you can use that configuration in your app to restore access to your original account.</p>
      </div>
    </div>
  )
}
