'use client';

import React, { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useCeramic } from '../context/CeramicContext';
import { 
  DataType,
  DataRecord
} from '../utils/ceramicUtils';

// Types for digital assets
interface DigitalAsset {
  name: string;
  type: 'nft' | 'gaming' | 'other';
  platform: string;
  identifier: string;
  chainId: string;  // Chain ID (e.g., '0x1' for Ethereum Mainnet)
  chainName: string; // Human-readable chain name (e.g., 'Ethereum')
  contractAddress?: string; // Contract address if applicable
  tokenId?: string; // Token ID if applicable
  imageUrl?: string;
  description?: string;
  attributes?: Record<string, string>;
  acquiredDate?: string;
  lastUpdated?: string; // When the asset data was last updated
}

// Common blockchain networks
const CHAINS = {
  ETHEREUM: { id: '0x1', name: 'Ethereum' },
  OPTIMISM: { id: '0xa', name: 'Optimism' },
  POLYGON: { id: '0x89', name: 'Polygon' },
  ARBITRUM: { id: '0xa4b1', name: 'Arbitrum' },
  BASE: { id: '0x2105', name: 'Base' },
  SOLANA: { id: '0x65', name: 'Solana' }, // Using a placeholder ID for non-EVM chains
};

// Mock data for demonstration with multi-chain support
const mockNFTs: DigitalAsset[] = [
  {
    name: 'Bored Ape #1234',
    type: 'nft',
    platform: 'OpenSea',
    identifier: 'BAYC-1234',
    chainId: CHAINS.ETHEREUM.id,
    chainName: CHAINS.ETHEREUM.name,
    contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
    tokenId: '1234',
    imageUrl: 'https://placehold.co/300x300/3949ab/ffffff?text=BAYC+%231234',
    description: 'A unique Bored Ape Yacht Club NFT',
    attributes: {
      background: 'Blue',
      fur: 'Golden',
      eyes: 'Laser',
      clothes: 'Sailor Hat'
    },
    acquiredDate: '2023-05-15',
    lastUpdated: '2024-03-15'
  },
  {
    name: 'CryptoPunk #5678',
    type: 'nft',
    platform: 'OpenSea',
    identifier: 'PUNK-5678',
    chainId: CHAINS.ETHEREUM.id,
    chainName: CHAINS.ETHEREUM.name,
    contractAddress: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
    tokenId: '5678',
    imageUrl: 'https://placehold.co/300x300/1e88e5/ffffff?text=CryptoPunk+%235678',
    description: 'A rare CryptoPunk collectible',
    attributes: {
      type: 'Male',
      accessories: 'Earring, Cigarette',
      background: 'Blue'
    },
    acquiredDate: '2022-11-03',
    lastUpdated: '2024-02-20'
  },
  {
    name: 'Optimism Collective Badge',
    type: 'nft',
    platform: 'Quix',
    identifier: 'OPT-BADGE-123',
    chainId: CHAINS.OPTIMISM.id,
    chainName: CHAINS.OPTIMISM.name,
    contractAddress: '0x3b01c72cecc164a2e1111b6d6b6d6e774e1c3cbe',
    tokenId: '123',
    imageUrl: 'https://placehold.co/300x300/ff0000/ffffff?text=Optimism+Badge',
    description: 'A badge for Optimism Collective contributors',
    attributes: {
      tier: 'Gold',
      edition: 'First',
      contribution: 'Governance'
    },
    acquiredDate: '2023-10-15',
    lastUpdated: '2024-01-05'
  },
  {
    name: 'Base Penguin',
    type: 'nft',
    platform: 'Base Market',
    identifier: 'BASE-PENG-456',
    chainId: CHAINS.BASE.id,
    chainName: CHAINS.BASE.name,
    contractAddress: '0x4622a2b2d6af1c9844944291e5e7351a6aa24cd7',
    tokenId: '456',
    imageUrl: 'https://placehold.co/300x300/0000ff/ffffff?text=Base+Penguin',
    description: 'A cute penguin NFT on Base',
    attributes: {
      color: 'Blue',
      hat: 'Top Hat',
      background: 'Arctic'
    },
    acquiredDate: '2024-02-10',
    lastUpdated: '2024-03-01'
  }
];

const mockGamingAssets: DigitalAsset[] = [
  {
    name: 'Legendary Sword',
    type: 'gaming',
    platform: 'Axie Infinity',
    identifier: 'AXIE-ITEM-12345',
    chainId: CHAINS.POLYGON.id,
    chainName: CHAINS.POLYGON.name,
    contractAddress: '0x86f5ed4b88162d3f7c3b59f491c7c633aa35e953',
    tokenId: '12345',
    imageUrl: 'https://placehold.co/300x300/d32f2f/ffffff?text=Legendary+Sword',
    description: 'A powerful sword that deals extra damage',
    attributes: {
      damage: '150',
      level: '20',
      rarity: 'Legendary'
    },
    acquiredDate: '2024-01-10',
    lastUpdated: '2024-03-20'
  },
  {
    name: 'Magic Cape',
    type: 'gaming',
    platform: 'Decentraland',
    identifier: 'DCL-WEAR-54321',
    chainId: CHAINS.ETHEREUM.id,
    chainName: CHAINS.ETHEREUM.name,
    contractAddress: '0xf5b4eeb6015d66d8ed9a072fb6c9b70cafe0f926',
    tokenId: '54321',
    imageUrl: 'https://placehold.co/300x300/7b1fa2/ffffff?text=Magic+Cape',
    description: 'A rare cape that grants invisibility',
    attributes: {
      effect: 'Invisibility',
      duration: '30 seconds',
      cooldown: '5 minutes'
    },
    acquiredDate: '2023-08-22',
    lastUpdated: '2024-02-15'
  },
  {
    name: 'Arbitrum Spaceship',
    type: 'gaming',
    platform: 'Star Atlas',
    identifier: 'ARB-SHIP-789',
    chainId: CHAINS.ARBITRUM.id,
    chainName: CHAINS.ARBITRUM.name,
    contractAddress: '0xd01c7758d741b363e637a817a09bcf579feae4db',
    tokenId: '789',
    imageUrl: 'https://placehold.co/300x300/673ab7/ffffff?text=Arbitrum+Spaceship',
    description: 'A spaceship for exploring the Arbitrum galaxy',
    attributes: {
      speed: '500',
      armor: '300',
      weapons: '4',
      class: 'Explorer'
    },
    acquiredDate: '2023-12-05',
    lastUpdated: '2024-03-10'
  }
];

// Helper function to parse asset data from string
const parseAssetData = (data: string | undefined): DigitalAsset => {
  if (!data) {
    return {
      name: 'Unknown Asset',
      type: 'other',
      platform: 'Unknown',
      identifier: 'unknown',
      chainId: '0x0',  // Default chain ID
      chainName: 'Unknown Chain'  // Default chain name
    };
  }
  try {
    const parsed = JSON.parse(data);
    // Ensure the parsed data has the required fields
    if (!parsed.chainId || !parsed.chainName) {
      // Try to infer chain from platform if possible
      if (parsed.platform?.toLowerCase().includes('ethereum')) {
        parsed.chainId = CHAINS.ETHEREUM.id;
        parsed.chainName = CHAINS.ETHEREUM.name;
      } else if (parsed.platform?.toLowerCase().includes('optimism')) {
        parsed.chainId = CHAINS.OPTIMISM.id;
        parsed.chainName = CHAINS.OPTIMISM.name;
      } else if (parsed.platform?.toLowerCase().includes('polygon')) {
        parsed.chainId = CHAINS.POLYGON.id;
        parsed.chainName = CHAINS.POLYGON.name;
      } else {
        // Default values if we can't infer
        parsed.chainId = '0x0';
        parsed.chainName = 'Unknown Chain';
      }
    }
    return parsed as DigitalAsset;
  } catch (e) {
    console.error('Error parsing asset data:', e);
    return {
      name: 'Unknown Asset',
      type: 'other',
      platform: 'Unknown',
      identifier: 'unknown',
      chainId: '0x0',  // Default chain ID
      chainName: 'Unknown Chain'  // Default chain name
    };
  }
};

export const DigitalAssetsSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const { ceramic, isInitialized, isLoading: ceramicLoading, error: ceramicError, checkCollectionExists, createCollection, getData, insertData, clearData } = useCeramic();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [collectionId, setCollectionId] = useState<string>('');
  const [assetsData, setAssetsData] = useState<DataRecord[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  
  // Form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [assetName, setAssetName] = useState<string>('');
  const [assetType, setAssetType] = useState<'nft' | 'gaming' | 'other'>('nft');
  const [platform, setPlatform] = useState<string>('');
  const [identifier, setIdentifier] = useState<string>('');
  const [selectedChain, setSelectedChain] = useState<string>(CHAINS.ETHEREUM.id);
  const [contractAddress, setContractAddress] = useState<string>('');
  const [tokenId, setTokenId] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [attributes, setAttributes] = useState<string>('');
  const [acquiredDate, setAcquiredDate] = useState<string>('');

  // Display a message about Ceramic Network support
  const renderCeramicInfo = () => {
    return (
      <div className="info-box">
        <p>
          <strong>Ceramic Network:</strong> Your digital assets data is securely stored on the Ceramic Network,
          a decentralized data network built specifically for Web3 applications. Ceramic provides better 
          performance, lower costs, and enhanced privacy for your digital assets information.
        </p>
      </div>
    );
  };

  // Initialize Ceramic connection
  useEffect(() => {
    const init = async () => {
      try {
        if (isConnected && address && isInitialized && !loading && !ceramicLoading) {
          setLoading(true);
          setError('');
          
          // Check if collection exists
          const collectionCheck = await checkCollectionExists(DataType.DIGITAL_ASSETS);
          if (collectionCheck.exists) {
            setCollectionId(collectionCheck.collectionId);
            
            // Get existing data
            const data = await getData(DataType.DIGITAL_ASSETS, collectionCheck.collectionId);
            setAssetsData(data);
          }
          
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing:', err);
        setError('Failed to initialize. Please try again.');
        setLoading(false);
      }
    };
    
    init();
  }, [isConnected, address, isInitialized, loading, ceramicLoading]);

  // We no longer need to switch networks as we're using a dedicated Optimism provider
  // Instead, we provide information about which network is being used for data storage

  // Handle collection creation
  const handleCreateCollection = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!address || !isInitialized) {
        setError('No wallet address or Ceramic not initialized.');
        return;
      }
      
      // Create a new collection for digital assets
      const result = await createCollection(DataType.DIGITAL_ASSETS);
      setCollectionId(result.collectionId);
      
      // Add mock data for demonstration
      if (process.env.NODE_ENV === 'development') {
        for (const nft of mockNFTs) {
          await insertData(DataType.DIGITAL_ASSETS, result.collectionId, { key: nft.identifier, value: JSON.stringify(nft) });
        }
        for (const gamingAsset of mockGamingAssets) {
          await insertData(DataType.DIGITAL_ASSETS, result.collectionId, { key: gamingAsset.identifier, value: JSON.stringify(gamingAsset) });
        }
        
        // Get the updated data
        const data = await getData(DataType.DIGITAL_ASSETS, result.collectionId);
        setAssetsData(data);
      }
    } catch (err) {
      console.error('Error creating collection:', err);
      setError('Failed to create collection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new digital asset
  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      if (!address || !collectionId || !ceramic) {
        setError('No wallet address or Ceramic collection.');
        return;
      }
      
      // Prepare asset data
      // Get chain name from the selected chain ID
      const chainName = Object.values(CHAINS).find(chain => chain.id === selectedChain)?.name || 'Unknown Chain';
      
      const asset: DigitalAsset = {
        name: assetName,
        type: assetType,
        platform,
        identifier,
        chainId: selectedChain,
        chainName,
        contractAddress: contractAddress || undefined,
        tokenId: tokenId || undefined,
        imageUrl: imageUrl || undefined,
        description: description || undefined,
        attributes: attributes ? JSON.parse(attributes) : undefined,
        acquiredDate: acquiredDate || undefined,
        lastUpdated: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
      };
      
      // Insert into Ceramic collection
      await insertData(DataType.DIGITAL_ASSETS, collectionId, { key: identifier, value: JSON.stringify(asset) });
      
      // Refresh data
      const data = await getData(DataType.DIGITAL_ASSETS, collectionId);
      setAssetsData(data);
      
      // Reset form
      setAssetName('');
      setAssetType('nft');
      setPlatform('');
      setIdentifier('');
      setImageUrl('');
      setDescription('');
      setAttributes('');
      setAcquiredDate('');
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding asset:', err);
      setError('Failed to add asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle clearing all assets
  const handleClearAssets = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!address || !collectionId || !ceramic) {
        setError('No wallet connected or Ceramic collection created.');
        return;
      }
      
      await clearData(DataType.DIGITAL_ASSETS, collectionId);
      setAssetsData([]);
    } catch (err) {
      console.error('Error clearing assets:', err);
      setError('Failed to clear assets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    return assetName && platform && identifier;
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="legal-section">
      <h2>My Digital Assets</h2>
      <p className="section-description" style={{ marginBottom: '1rem' }}>
        Securely store and manage your digital assets from multiple blockchains including Ethereum, Optimism, Polygon, and more.
        <span className="network-info" style={{ display: 'block', fontSize: '0.9rem', marginTop: '0.5rem', color: '#666' }}>
          Data is stored on Ceramic Network for better performance and privacy while keeping your main wallet connection unchanged.
        </span>
      </p>
      <div className="section-content">
        {loading ? (
          <div className="loading-indicator">Loading digital assets...</div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : (
          <>
            
            {!collectionId ? (
              <div>
                <p>You don't have a digital assets collection yet. Create one to track your NFTs and gaming assets.</p>
                <button 
                  className="button-primary" 
                  onClick={handleCreateCollection}
                  disabled={loading || ceramicLoading}
                >
                  {loading ? 'Creating...' : 'Create Digital Assets Collection'}
                </button>
              </div>
            ) : (
              <div>
                {/* Assets List */}
                <div className="private-data-list">
                  {/* Show message if no assets */}
                  {assetsData.length === 0 && (
                    <p>No digital assets added yet. Add some using the form below.</p>
                  )}
                  
                  {/* Assets Table */}
                  {assetsData.length > 0 && (
                    <div className="table-container">
                      <table className="data-table assets-table">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Name</th>
                            <th>Blockchain</th>
                            <th>Identifier</th>
                            <th>Acquired Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assetsData.map((item) => {
                            const asset = parseAssetData(item.value);
                            return (
                              <tr 
                                key={item.id}
                                className={selectedAsset === item.id.toString() ? 'selected-row' : ''}
                              >
                                <td>
                                  <span className={`asset-type-badge ${asset.type}`}>
                                    {asset.type === 'nft' ? '🖼️ NFT' : asset.type === 'gaming' ? '🎮 GAMING' : '🏆 OTHER'}
                                  </span>
                                </td>
                                <td>{asset.name}</td>
                                <td>{asset.platform}</td>
                                <td>
                                  <span className="identifier" title={asset.identifier}>
                                    {asset.identifier.length > 10 ? `${asset.identifier.substring(0, 6)}...${asset.identifier.substring(asset.identifier.length - 4)}` : asset.identifier}
                                  </span>
                                </td>
                                <td>{asset.acquiredDate || 'N/A'}</td>
                                <td>
                                  <button 
                                    className="table-action-button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAsset(selectedAsset === item.id.toString() ? null : item.id.toString());
                                    }}
                                  >
                                    {selectedAsset === item.id.toString() ? 'Hide Details' : 'View Details'}
                                  </button>
                                </td>
                              </tr>
                            );
                      })}
                        </tbody>
                      </table>
                      
                      {/* Selected Asset Details Panel */}
                      {selectedAsset && assetsData.map(item => {
                        if (item.id.toString() === selectedAsset) {
                          const asset = parseAssetData(item.value);
                          return (
                            <div key={`details-${item.id}`} className="asset-details-panel">
                              <div className="asset-details-header">
                                <h3>Asset Details</h3>
                                <button 
                                  className="close-details-button"
                                  onClick={() => setSelectedAsset(null)}
                                >
                                  ×
                                </button>
                              </div>
                              
                              <div className="asset-details-content">
                                <div className="asset-details-main">
                                  {asset.imageUrl && (
                                    <div className="asset-image">
                                      <img src={asset.imageUrl} alt={asset.name} />
                                    </div>
                                  )}
                                  
                                  <div className="asset-info">
                                    <div className="asset-name-type">
                                      <span className={`asset-type-badge ${asset.type}`}>
                                        {asset.type === 'nft' ? '🖼️ NFT' : asset.type === 'gaming' ? '🎮 GAMING' : '🏆 OTHER'}
                                      </span>
                                      <h4>{asset.name}</h4>
                                    </div>
                                    
                                    <div className="asset-metadata">
                                      <p><strong>Blockchain:</strong> {asset.chainName}</p>
                                      <p><strong>Platform:</strong> {asset.platform}</p>
                                      <p>
                                        <strong>Identifier:</strong>
                                        <span className="identifier-full">{asset.identifier}</span>
                                      </p>
                                      {asset.contractAddress && (
                                        <p>
                                          <strong>Contract:</strong>
                                          <span className="contract-address" title={asset.contractAddress}>
                                            {asset.contractAddress.substring(0, 6)}...{asset.contractAddress.substring(asset.contractAddress.length - 4)}
                                          </span>
                                        </p>
                                      )}
                                      {asset.tokenId && (
                                        <p><strong>Token ID:</strong> {asset.tokenId}</p>
                                      )}
                                      {asset.description && (
                                        <p><strong>Description:</strong> {asset.description}</p>
                                      )}
                                      {asset.acquiredDate && (
                                        <p><strong>Acquired:</strong> {new Date(asset.acquiredDate).toLocaleDateString()}</p>
                                      )}
                                      {asset.lastUpdated && (
                                        <p><strong>Last Updated:</strong> {new Date(asset.lastUpdated).toLocaleDateString()}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {asset.attributes && Object.keys(asset.attributes).length > 0 && (
                                  <div className="asset-attributes">
                                    <h4>Attributes</h4>
                                    <div className="attributes-grid">
                                      {Object.entries(asset.attributes).map(([key, value]) => (
                                        <div key={key} className="attribute-item">
                                          <span className="attribute-key">{key}</span>
                                          <span className="attribute-value">{value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                <p className="asset-timestamp">
                                  Added: {new Date().toLocaleString()}
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                </div>
                
                {/* Add and Clear Buttons */}
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button 
                    className="button-primary"
                    onClick={() => setShowAddForm(!showAddForm)}
                  >
                    {showAddForm ? 'Cancel' : '+ Add Digital Asset'}
                  </button>
                  
                  {assetsData.length > 0 && (
                    <button 
                      className="button-primary"
                      onClick={handleClearAssets}
                      disabled={loading}
                    >
                      {loading ? 'Clearing...' : 'Clear All Assets'}
                    </button>
                  )}
                </div>
                
                {/* Add Asset Form */}
                {showAddForm && (
                  <form onSubmit={handleAddAsset} className="private-data-form" style={{ 
                    marginTop: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '8px',
                    border: '1px solid #eaeaea'
                  }}>
                    <h3 style={{ marginTop: 0 }}>Add New Digital Asset</h3>
                    
                    <div className="form-group">
                      <label htmlFor="assetType">Asset Type:</label>
                      <select
                        id="assetType"
                        value={assetType}
                        onChange={(e) => setAssetType(e.target.value as 'nft' | 'gaming' | 'other')}
                        required
                      >
                        <option value="nft">NFT</option>
                        <option value="gaming">Gaming Asset</option>
                        <option value="other">Other Digital Asset</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="assetName">Asset Name:</label>
                      <input
                        type="text"
                        id="assetName"
                        value={assetName}
                        onChange={(e) => setAssetName(e.target.value)}
                        required
                        placeholder="e.g., Bored Ape #1234, Magic Sword"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="blockchain">Blockchain:</label>
                      <select
                        id="blockchain"
                        value={selectedChain}
                        onChange={(e) => setSelectedChain(e.target.value)}
                        required
                      >
                        <option value={CHAINS.ETHEREUM.id}>Ethereum</option>
                        <option value={CHAINS.OPTIMISM.id}>Optimism</option>
                        <option value={CHAINS.POLYGON.id}>Polygon</option>
                        <option value={CHAINS.ARBITRUM.id}>Arbitrum</option>
                        <option value={CHAINS.BASE.id}>Base</option>
                        <option value={CHAINS.SOLANA.id}>Solana</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="platform">Platform/Collection:</label>
                      <input
                        type="text"
                        id="platform"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        required
                        placeholder="e.g., OpenSea, Axie Infinity, Decentraland"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="identifier">Identifier:</label>
                      <input
                        type="text"
                        id="identifier"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        placeholder="e.g., BAYC #1234 or item_12345"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="contractAddress">Contract Address (Optional):</label>
                      <input
                        type="text"
                        id="contractAddress"
                        value={contractAddress}
                        onChange={(e) => setContractAddress(e.target.value)}
                        placeholder="0x..."
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="tokenId">Token ID (Optional):</label>
                      <input
                        type="text"
                        id="tokenId"
                        value={tokenId}
                        onChange={(e) => setTokenId(e.target.value)}
                        placeholder="e.g., 1234"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="imageUrl">Image URL (Optional):</label>
                      <input
                        type="text"
                        id="imageUrl"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="description">Description (Optional):</label>
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief description of your digital asset"
                        rows={2}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="attributes">Attributes (Optional, JSON format):</label>
                      <textarea
                        id="attributes"
                        value={attributes}
                        onChange={(e) => setAttributes(e.target.value)}
                        placeholder='{"trait": "value", "background": "blue"}'
                        rows={2}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="acquiredDate">Date Acquired (Optional):</label>
                      <input
                        type="date"
                        id="acquiredDate"
                        value={acquiredDate}
                        onChange={(e) => setAcquiredDate(e.target.value)}
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      className="button-primary"
                      disabled={loading || !isFormValid()}
                    >
                      {loading ? 'Adding...' : 'Add Asset'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
