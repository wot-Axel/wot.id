'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { optimism } from '@reown/appkit/networks';
import { formatEther } from 'viem';
import { useBalance } from 'wagmi';
import { 
  initTableland, 
  createCurrenciesTable, 
  insertCurrencyData, 
  getCurrenciesData,
  checkCurrenciesTableExists,
  clearCurrenciesData,
  type PrivateData
} from '@/utils/tablelandUtils';
import { Database } from '@tableland/sdk';

// Define currency icons mapping
const currencyIcons: Record<string, string> = {
  'BTC': '₿',
  'ETH': 'Ξ',
  'OP': 'OP',
  'USDC': '$',
  'USDT': '$',
  'DAI': 'DAI',
  'SOL': 'SOL',
  'DOT': 'DOT',
  'ADA': 'ADA',
  'AVAX': 'AVAX',
  'MATIC': 'MATIC',
  'LINK': 'LINK',
  'UNI': 'UNI',
  'AAVE': 'AAVE',
  'COMP': 'COMP',
  'MKR': 'MKR',
  'SNX': 'SNX',
  'YFI': 'YFI',
  'SUSHI': 'SUSHI',
  'CRV': 'CRV',
  'BAL': 'BAL',
  'GRT': 'GRT',
  'FIL': 'FIL',
  'XLM': 'XLM',
  'XRP': 'XRP',
  'LTC': 'LTC',
  'BCH': 'BCH',
  'EOS': 'EOS',
  'TRX': 'TRX',
  'XTZ': 'XTZ',
  'ATOM': 'ATOM',
  'ALGO': 'ALGO',
  'NEAR': 'NEAR',
  'FTM': 'FTM',
  'ONE': 'ONE',
  'EGLD': 'EGLD',
  'FLOW': 'FLOW',
  'HBAR': 'HBAR',
  'VET': 'VET',
  'THETA': 'THETA',
  'XMR': 'XMR',
  'ZEC': 'ZEC',
  'DASH': 'DASH',
  'ETC': 'ETC',
  'ZRX': 'ZRX',
  'BAT': 'BAT',
  'ENJ': 'ENJ',
  'MANA': 'MANA',
  'SAND': 'SAND',
  'AXS': 'AXS',
  'GALA': 'GALA',
  'ILV': 'ILV',
  'APE': 'APE',
  'DYDX': 'DYDX',
  'IMX': 'IMX',
  'LRC': 'LRC',
  'ENS': 'ENS',
  'RPL': 'RPL',
  'CVX': 'CVX',
  'FXS': 'FXS',
  'LOOKS': 'LOOKS',
  'GMX': 'GMX',
  'ARB': 'ARB',
};

// Define common currency networks
const currencyNetworks: Record<string, string[]> = {
  'BTC': ['Bitcoin'],
  'ETH': ['Ethereum', 'Arbitrum', 'Optimism', 'Base', 'Polygon'],
  'OP': ['Optimism'],
  'USDC': ['Ethereum', 'Arbitrum', 'Optimism', 'Base', 'Polygon', 'Solana'],
  'USDT': ['Ethereum', 'Arbitrum', 'Optimism', 'Tron', 'Polygon', 'Solana'],
  'DAI': ['Ethereum', 'Arbitrum', 'Optimism', 'Base', 'Polygon'],
  'SOL': ['Solana'],
  'MATIC': ['Ethereum', 'Polygon'],
  'AVAX': ['Avalanche'],
  'ARB': ['Arbitrum'],
};

interface CurrencyData {
  symbol: string;
  name: string;
  amount: string;
  network: string;
  address?: string;
  notes?: string;
}

export const CurrenciesSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const { switchNetwork } = useAppKitNetwork();
  const [isOptimismNetwork, setIsOptimismNetwork] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [db, setDb] = useState<Database | null>(null);
  const [tableName, setTableName] = useState<string>('');
  const [currenciesData, setCurrenciesData] = useState<PrivateData[]>([]);
  
  // Fetch the user's ETH balance
  const { data: ethBalanceData } = useBalance({
    address: address as `0x${string}`,
  });
  
  // Form state
  const [symbol, setSymbol] = useState<string>('');
  const [customSymbol, setCustomSymbol] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [network, setNetwork] = useState<string>('');
  const [customNetwork, setCustomNetwork] = useState<string>('');
  const [currencyAddress, setCurrencyAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // UI state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);

  // Check network and initialize Tableland
  useEffect(() => {
    if (isConnected && address) {
      // We'll assume we're on Optimism for the mock implementation
      setIsOptimismNetwork(true);
      initTablelandDb();
    }
  }, [isConnected, address]);

  // Function to switch to Optimism network
  const handleSwitchToOptimism = () => {
    switchNetwork(optimism);
    setIsOptimismNetwork(true);
  };

  const initTablelandDb = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Initialize Tableland
      const tablelandDb = await initTableland();
      setDb(tablelandDb);
      
      // Check if table exists
      const existingTable = await checkCurrenciesTableExists(tablelandDb, address as string);
      
      if (existingTable) {
        setTableName(existingTable);
        // Load existing data
        const data = await getCurrenciesData(tablelandDb, existingTable);
        setCurrenciesData(data);
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error initializing Tableland');
      setLoading(false);
    }
  };

  const handleCreateTable = async () => {
    if (!db || !address) return;
    
    try {
      setLoading(true);
      setError('');
      
      const name = await createCurrenciesTable(db, address);
      setTableName(name);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error creating table');
      setLoading(false);
    }
  };

  const handleAddCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalSymbol = symbol === 'custom' ? customSymbol : symbol;
    const finalNetwork = network === 'custom' ? customNetwork : network;
    
    if (!db || !tableName || !finalSymbol || !name || !amount || !finalNetwork) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Format the data as JSON to store all fields together
      const currencyData: CurrencyData = {
        symbol: finalSymbol,
        name,
        amount,
        network: finalNetwork,
      };
      
      if (currencyAddress) {
        currencyData.address = currencyAddress;
      }
      
      if (notes) {
        currencyData.notes = notes;
      }
      
      const jsonData = JSON.stringify(currencyData);
      
      await insertCurrencyData(db, tableName, finalSymbol, jsonData);
      
      // Refresh data
      const data = await getCurrenciesData(db, tableName);
      setCurrenciesData(data);
      
      // Clear form and hide it
      resetForm();
      setShowAddForm(false);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error adding currency data');
      setLoading(false);
    }
  };

  const handleClearCurrenciesData = async () => {
    if (!db || !tableName) return;
    
    try {
      setLoading(true);
      setError('');
      
      await clearCurrenciesData(db, tableName);
      
      // Refresh data
      const data = await getCurrenciesData(db, tableName);
      setCurrenciesData(data);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error clearing currencies data');
      setLoading(false);
    }
  };

  // Parse the JSON data from the value field
  const parseCurrencyData = (jsonString: string): CurrencyData => {
    try {
      return JSON.parse(jsonString);
    } catch (err) {
      return { 
        symbol: '', 
        name: '', 
        amount: '0', 
        network: '' 
      };
    }
  };

  // Reset form fields
  const resetForm = () => {
    setSymbol('');
    setCustomSymbol('');
    setName('');
    setAmount('');
    setNetwork('');
    setCustomNetwork('');
    setCurrencyAddress('');
    setNotes('');
  };

  // Get available networks for selected symbol
  const getAvailableNetworks = (selectedSymbol: string) => {
    if (selectedSymbol === 'custom') return [];
    return currencyNetworks[selectedSymbol] || [];
  };

  // Handle symbol change
  const handleSymbolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSymbol = e.target.value;
    setSymbol(newSymbol);
    
    // If a known symbol is selected, pre-fill the name
    if (newSymbol !== 'custom' && newSymbol !== '') {
      // Set a default name based on common cryptocurrency names
      const commonNames: Record<string, string> = {
        'BTC': 'Bitcoin',
        'ETH': 'Ethereum',
        'OP': 'Optimism',
        'USDC': 'USD Coin',
        'USDT': 'Tether',
        'DAI': 'Dai',
        'SOL': 'Solana',
        'MATIC': 'Polygon',
        'AVAX': 'Avalanche',
        'ARB': 'Arbitrum',
      };
      
      setName(commonNames[newSymbol] || '');
      
      // Reset network if current selection is not available for the new symbol
      if (network && !currencyNetworks[newSymbol]?.includes(network)) {
        setNetwork('');
      }
    } else {
      setName('');
    }
  };

  // Calculate total portfolio value (mock implementation)
  useEffect(() => {
    // In a real implementation, this would fetch current prices from an API
    let total = 0;
    
    // Add ETH balance value if available
    if (ethBalanceData) {
      const ethAmount = parseFloat(formatEther(ethBalanceData.value));
      total += ethAmount * 3000; // Using the same mock ETH price as elsewhere
    }
    
    // Add values from stored currencies
    currenciesData.forEach(item => {
      const data = parseCurrencyData(item.value);
      // Mock calculation - in reality would use current market prices
      const value = parseFloat(data.amount) * (
        data.symbol === 'BTC' ? 60000 :
        data.symbol === 'ETH' ? 3000 :
        data.symbol === 'USDC' || data.symbol === 'USDT' || data.symbol === 'DAI' ? 1 :
        data.symbol === 'SOL' ? 120 :
        data.symbol === 'MATIC' ? 0.7 :
        data.symbol === 'AVAX' ? 35 :
        data.symbol === 'OP' ? 3.5 :
        data.symbol === 'ARB' ? 1.2 :
        10 // Default value for unknown tokens
      );
      total += value;
    });
    setTotalValue(total);
  }, [currenciesData, ethBalanceData]);

  if (!isConnected) {
    return null;
  }

  return (
    <div className="legal-section">
      <h2>My Currencies</h2>
      <div className="legal-content">
        {!isOptimismNetwork ? (
          <div className="alert alert-warning">
            <p>Please switch to Optimism network to use currency storage.</p>
            <button 
              className="button-primary" 
              onClick={handleSwitchToOptimism}
              disabled={loading}
            >
              Switch to Optimism
            </button>
          </div>
        ) : (
          <>
            {error && <div className="alert alert-error">{error}</div>}
            
            {!tableName ? (
              <div>
                <p>You don't have a currencies table yet. Create one to track your cryptocurrency holdings securely on Tableland.</p>
                <button 
                  className="button-primary" 
                  onClick={handleCreateTable}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Currencies Table'}
                </button>
              </div>
            ) : (
              <div>
                <p>Your cryptocurrency holdings are stored securely on Tableland on the Optimism network.</p>
                
                {/* Portfolio Summary */}
                {currenciesData.length > 0 && (
                  <div className="portfolio-summary" style={{ 
                    marginBottom: '1.5rem', 
                    padding: '1rem', 
                    backgroundColor: '#f9f9f9', 
                    borderRadius: '8px',
                    border: '1px solid #eaeaea'
                  }}>
                    <h3 style={{ marginTop: 0 }}>Portfolio Summary</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>
                          <strong>Total Assets:</strong> {currenciesData.length}
                        </p>
                        <p style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>
                          <strong>Networks:</strong> {
                            Array.from(new Set(
                              currenciesData.map(item => parseCurrencyData(item.value).network)
                            )).join(', ')
                          }
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0' }}>
                          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: '#666', margin: '0' }}>
                          Estimated Value
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Add Currency Button */}
                <div style={{ marginBottom: '1rem' }}>
                  <button 
                    className="button-primary"
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{ marginBottom: '0.5rem' }}
                  >
                    {showAddForm ? 'Cancel' : '+ Add Currency'}
                  </button>
                </div>
                
                {/* Add Currency Form */}
                {showAddForm && (
                  <form onSubmit={handleAddCurrency} className="private-data-form" style={{ 
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '8px',
                    border: '1px solid #eaeaea'
                  }}>
                    <h3 style={{ marginTop: 0 }}>Add New Currency</h3>
                    
                    <div className="form-group">
                      <label htmlFor="symbol">Currency Symbol:</label>
                      <select
                        id="symbol"
                        value={symbol}
                        onChange={handleSymbolChange}
                        required
                      >
                        <option value="">Select a currency</option>
                        <option value="BTC">BTC (Bitcoin)</option>
                        <option value="ETH">ETH (Ethereum)</option>
                        <option value="USDC">USDC (USD Coin)</option>
                        <option value="USDT">USDT (Tether)</option>
                        <option value="DAI">DAI (Dai)</option>
                        <option value="SOL">SOL (Solana)</option>
                        <option value="MATIC">MATIC (Polygon)</option>
                        <option value="AVAX">AVAX (Avalanche)</option>
                        <option value="OP">OP (Optimism)</option>
                        <option value="ARB">ARB (Arbitrum)</option>
                        <option value="custom">Custom Currency</option>
                      </select>
                    </div>
                    
                    {symbol === 'custom' && (
                      <div className="form-group">
                        <label htmlFor="customSymbol">Custom Symbol:</label>
                        <input
                          type="text"
                          id="customSymbol"
                          value={customSymbol}
                          onChange={(e) => setCustomSymbol(e.target.value)}
                          required
                          placeholder="e.g., ATOM"
                          maxLength={10}
                        />
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label htmlFor="name">Currency Name:</label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="e.g., Bitcoin, Ethereum"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="amount">Amount:</label>
                      <input
                        type="text"
                        id="amount"
                        value={amount}
                        onChange={(e) => {
                          // Only allow numbers and decimals
                          const value = e.target.value;
                          if (/^[0-9]*\.?[0-9]*$/.test(value)) {
                            setAmount(value);
                          }
                        }}
                        required
                        placeholder="e.g., 0.5"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="network">Network:</label>
                      <select
                        id="network"
                        value={network}
                        onChange={(e) => setNetwork(e.target.value)}
                        required
                      >
                        <option value="">Select a network</option>
                        {symbol && symbol !== 'custom' && getAvailableNetworks(symbol).map(net => (
                          <option key={net} value={net}>{net}</option>
                        ))}
                        <option value="custom">Custom Network</option>
                      </select>
                    </div>
                    
                    {network === 'custom' && (
                      <div className="form-group">
                        <label htmlFor="customNetwork">Custom Network:</label>
                        <input
                          type="text"
                          id="customNetwork"
                          value={customNetwork}
                          onChange={(e) => setCustomNetwork(e.target.value)}
                          required
                          placeholder="e.g., Cosmos"
                        />
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label htmlFor="address">Wallet Address (Optional):</label>
                      <input
                        type="text"
                        id="address"
                        value={currencyAddress}
                        onChange={(e) => setCurrencyAddress(e.target.value)}
                        placeholder="e.g., 0x123..."
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="notes">Notes (Optional):</label>
                      <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional notes about this holding"
                        rows={2}
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      className="button-primary"
                      disabled={loading || (!symbol) || (symbol === 'custom' && !customSymbol) || !name || !amount || (!network) || (network === 'custom' && !customNetwork)}
                    >
                      {loading ? 'Adding...' : 'Add Currency'}
                    </button>
                  </form>
                )}
                
                {/* Currency List */}
                <div className="private-data-list">
                  <h3>Your Cryptocurrency Holdings</h3>
                  
                  {/* Display connected wallet's ETH balance */}
                  {ethBalanceData && (
                    <div className="currency-cards" style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div 
                        className="currency-card" 
                        style={{ 
                          border: '1px solid #eaeaea',
                          borderRadius: '8px',
                          padding: '1rem',
                          backgroundColor: '#f9f9ff',
                          borderLeft: '4px solid #6366f1'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ 
                              width: '36px', 
                              height: '36px', 
                              borderRadius: '50%', 
                              backgroundColor: '#eef2ff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '0.75rem',
                              fontWeight: 'bold'
                            }}>
                              Ξ
                            </div>
                            <div>
                              <div style={{ fontWeight: 'bold' }}>ETH</div>
                              <div style={{ fontSize: '0.8rem', color: '#666' }}>Ethereum</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 'bold' }}>{parseFloat(formatEther(ethBalanceData.value)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>${(parseFloat(formatEther(ethBalanceData.value)) * 3000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          </div>
                        </div>
                        
                        <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
                          <strong>Network:</strong> Ethereum
                        </div>
                        
                        <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
                          <strong>Address:</strong> 
                          <div style={{ 
                            wordBreak: 'break-all', 
                            backgroundColor: '#f5f5f5', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px',
                            marginTop: '0.25rem',
                            fontSize: '0.8rem'
                          }}>
                            {address}
                          </div>
                        </div>
                        
                        <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                          <span style={{ 
                            backgroundColor: '#eef2ff', 
                            color: '#6366f1', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>
                            Connected Wallet
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Show message if no currencies at all */}
                  {currenciesData.length === 0 && !ethBalanceData && (
                    <p>No currencies added yet. Add some using the form above.</p>
                  )}
                  
                  {/* Show stored currencies if any exist */}
                  {currenciesData.length > 0 && (
                    <div className="currency-cards" style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                      gap: '1rem',
                      marginTop: ethBalanceData ? '1rem' : '0'
                    }}>
                      {/* Stored currencies */}
                      {currenciesData.map((item) => {
                        const currencyInfo = parseCurrencyData(item.value);
                        const icon = currencyIcons[currencyInfo.symbol] || currencyInfo.symbol;
                        
                        // Mock value calculation - in a real app, would use an API
                        const mockPrice = 
                          currencyInfo.symbol === 'BTC' ? 60000 :
                          currencyInfo.symbol === 'ETH' ? 3000 :
                          currencyInfo.symbol === 'USDC' || currencyInfo.symbol === 'USDT' || currencyInfo.symbol === 'DAI' ? 1 :
                          currencyInfo.symbol === 'SOL' ? 120 :
                          currencyInfo.symbol === 'MATIC' ? 0.7 :
                          currencyInfo.symbol === 'AVAX' ? 35 :
                          currencyInfo.symbol === 'OP' ? 3.5 :
                          currencyInfo.symbol === 'ARB' ? 1.2 :
                          10; // Default value for unknown tokens
                        
                        const value = parseFloat(currencyInfo.amount) * mockPrice;
                        
                        return (
                          <div 
                            key={item.id} 
                            className="currency-card" 
                            style={{ 
                              border: '1px solid #eaeaea',
                              borderRadius: '8px',
                              padding: '1rem',
                              backgroundColor: selectedCurrency === item.id.toString() ? '#f0f7ff' : 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => setSelectedCurrency(selectedCurrency === item.id.toString() ? null : item.id.toString())}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ 
                                  width: '36px', 
                                  height: '36px', 
                                  borderRadius: '50%', 
                                  backgroundColor: '#f0f0f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginRight: '0.75rem',
                                  fontWeight: 'bold'
                                }}>
                                  {icon}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 'bold' }}>{currencyInfo.symbol}</div>
                                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{currencyInfo.name}</div>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 'bold' }}>{parseFloat(currencyInfo.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              </div>
                            </div>
                            
                            <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
                              <strong>Network:</strong> {currencyInfo.network}
                            </div>
                            
                            {selectedCurrency === item.id.toString() && (
                              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
                                {currencyInfo.address && (
                                  <div style={{ marginBottom: '0.5rem' }}>
                                    <strong>Address:</strong> 
                                    <div style={{ 
                                      wordBreak: 'break-all', 
                                      backgroundColor: '#f5f5f5', 
                                      padding: '0.25rem 0.5rem', 
                                      borderRadius: '4px',
                                      marginTop: '0.25rem',
                                      fontSize: '0.8rem'
                                    }}>
                                      {currencyInfo.address}
                                    </div>
                                  </div>
                                )}
                                
                                {currencyInfo.notes && (
                                  <div style={{ marginBottom: '0.5rem' }}>
                                    <strong>Notes:</strong> 
                                    <div style={{ marginTop: '0.25rem' }}>{currencyInfo.notes}</div>
                                  </div>
                                )}
                                
                                <div>
                                  <strong>Added:</strong> {new Date(item.created_at).toLocaleString()}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Clear All Button */}
                {currenciesData.length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <button 
                      className="button-primary"
                      onClick={handleClearCurrenciesData}
                      disabled={loading}
                    >
                      {loading ? 'Clearing...' : 'Clear All Currencies'}
                    </button>
                    <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                      This will remove all saved currency data.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
