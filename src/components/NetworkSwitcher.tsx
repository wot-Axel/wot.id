'use client'

import React, { useEffect, useState } from 'react'
import { networkConfigs } from '@/config'
import { modal } from '@/context'

/**
 * NetworkSwitcher component
 * 
 * This component allows dynamically switching between different network configurations
 * to help recover the original EOA address associated with a social login.
 */
export default function NetworkSwitcher() {
  const [currentOrder, setCurrentOrder] = useState<string>('mainnet-first')
  const [isReady, setIsReady] = useState(false)
  
  // Initialize from localStorage on client-side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedOrder = localStorage.getItem('wot_id_network_order') || 'mainnet-first'
      setCurrentOrder(savedOrder)
      setIsReady(true)
      
      // Check for network parameter in URL
      const params = new URLSearchParams(window.location.search)
      const networkParam = params.get('network')
      if (networkParam && ['mainnet-first', 'optimism-first', 'base-first'].includes(networkParam)) {
        if (networkParam !== savedOrder) {
          localStorage.setItem('wot_id_network_order', networkParam)
          setCurrentOrder(networkParam)
        }
      }
    }
  }, [])
  
  // Function to switch network configuration
  const switchNetwork = async (order: string) => {
    if (!isReady || order === currentOrder) return
    
    try {
      // Store the selection
      localStorage.setItem('wot_id_network_order', order)
      setCurrentOrder(order)
      
      // Clear AppKit connection data
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('appkit') || key.includes('wallet') || key.includes('w3m'))) {
          keysToRemove.push(key)
        }
      }
      
      // Remove keys in a separate loop to avoid index shifting
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Disconnect if connected
      try {
        await modal.disconnect()
      } catch (e) {
        console.error('Error disconnecting:', e)
      }
      
      // Reload the page with the new configuration
      window.location.href = `/account-debug?network=${order}&t=${Date.now()}`
    } catch (error) {
      console.error('Error switching network:', error)
    }
  }
  
  if (!isReady) return null
  
  return (
    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
      <h2 className="text-lg font-semibold mb-2">Network Configuration</h2>
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => switchNetwork('mainnet-first')}
          className={`px-3 py-1 rounded ${currentOrder === 'mainnet-first' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Mainnet First
        </button>
        <button 
          onClick={() => switchNetwork('optimism-first')}
          className={`px-3 py-1 rounded ${currentOrder === 'optimism-first' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Optimism First
        </button>
        <button 
          onClick={() => switchNetwork('base-first')}
          className={`px-3 py-1 rounded ${currentOrder === 'base-first' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Base First
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-600">
        Current network order: <span className="font-semibold">{
          currentOrder === 'mainnet-first' ? 'Mainnet, Optimism, Base' :
          currentOrder === 'optimism-first' ? 'Optimism, Mainnet, Base' :
          'Base, Mainnet, Optimism'
        }</span>
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Changing network order will clear your connection and reload the page.
      </p>
    </div>
  )
}
