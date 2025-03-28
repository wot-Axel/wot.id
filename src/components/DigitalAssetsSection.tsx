'use client';

import React, { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { optimism } from '@reown/appkit/networks';
import { 
  initTableland, 
  checkDigitalAssetsTableExists,
  createDigitalAssetsTable,
  getDigitalAssetsData,
  insertDigitalAssetData,
  clearDigitalAssetsData,
  PrivateData
} from '../utils/tablelandUtils';
import { Database } from '@tableland/sdk';

// Types for digital assets
interface DigitalAsset {
  name: string;
  type: 'nft' | 'gaming' | 'other';
  platform: string;
  identifier: string;
  imageUrl?: string;
  description?: string;
  attributes?: Record<string, string>;
  acquiredDate?: string;
}

// Mock data for demonstration
const mockNFTs = [
  {
    name: 'Bored Ape #1234',
    type: 'nft',
    platform: 'Ethereum',
    identifier: '0x12345...6789',
    imageUrl: 'https://placehold.co/300x300/3949ab/ffffff?text=BAYC+%231234',
    description: 'A unique Bored Ape Yacht Club NFT',
    attributes: {
      background: 'Blue',
      fur: 'Golden',
      eyes: 'Laser',
      clothes: 'Sailor Hat'
    },
    acquiredDate: '2023-05-15'
  },
  {
    name: 'CryptoPunk #5678',
    type: 'nft',
    platform: 'Ethereum',
    identifier: '0x98765...4321',
    imageUrl: 'https://placehold.co/300x300/1e88e5/ffffff?text=CryptoPunk+%235678',
    description: 'A rare CryptoPunk collectible',
    attributes: {
      type: 'Male',
      accessories: 'Earring, Cigarette',
      background: 'Blue'
    },
    acquiredDate: '2022-11-03'
  }
];

const mockGamingAssets = [
  {
    name: 'Legendary Sword',
    type: 'gaming',
    platform: 'Axie Infinity',
    identifier: 'item_12345',
    imageUrl: 'https://placehold.co/300x300/d32f2f/ffffff?text=Legendary+Sword',
    description: 'A powerful sword that deals extra damage',
    attributes: {
      damage: '150',
      level: '20',
      rarity: 'Legendary'
    },
    acquiredDate: '2024-01-10'
  },
  {
    name: 'Magic Cape',
    type: 'gaming',
    platform: 'Decentraland',
    identifier: 'wearable_54321',
    imageUrl: 'https://placehold.co/300x300/7b1fa2/ffffff?text=Magic+Cape',
    description: 'A rare cape that grants invisibility',
    attributes: {
      effect: 'Invisibility',
      duration: '30 seconds',
      cooldown: '5 minutes'
    },
    acquiredDate: '2023-08-22'
  }
];

// Helper function to parse asset data from string
const parseAssetData = (data: string | undefined): DigitalAsset => {
  if (!data) {
    return {
      name: 'Unknown Asset',
      type: 'other',
      platform: 'Unknown',
      identifier: 'unknown'
    };
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Error parsing asset data:', e);
    return {
      name: 'Unknown Asset',
      type: 'other',
      platform: 'Unknown',
      identifier: 'unknown'
    };
  }
};

export const DigitalAssetsSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const { switchNetwork } = useAppKitNetwork();
  const [isOptimismNetwork, setIsOptimismNetwork] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [db, setDb] = useState<Database | null>(null);
  const [tableName, setTableName] = useState<string>('');
  const [assetsData, setAssetsData] = useState<PrivateData[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  
  // Form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [assetName, setAssetName] = useState<string>('');
  const [assetType, setAssetType] = useState<'nft' | 'gaming' | 'other'>('nft');
  const [platform, setPlatform] = useState<string>('');
  const [identifier, setIdentifier] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [attributes, setAttributes] = useState<string>('');
  const [acquiredDate, setAcquiredDate] = useState<string>('');

  // Initialize Tableland connection and check network
  useEffect(() => {
    const init = async () => {
      try {
        if (isConnected) {
          // @ts-ignore - window.ethereum is injected by browser extension
          const network = await window.ethereum?.request({ method: 'eth_chainId' });
          setIsOptimismNetwork(network === '0xa' || network === '0xa13'); // Optimism or Optimism Goerli
          
          if (isOptimismNetwork) {
            const database = await initTableland();
            setDb(database);
            
            // Check if table exists
            const exists = await checkDigitalAssetsTableExists(database, address || '');
            if (exists.exists) {
              setTableName(exists.tableName);
              
              // Get existing data
              const data = await getDigitalAssetsData(database, exists.tableName);
              setAssetsData(data);
            }
          }
        }
      } catch (err) {
        console.error('Error initializing:', err);
        setError('Failed to initialize. Please try again.');
      }
    };
    
    init();
  }, [isConnected, isOptimismNetwork, address]);

  // Handle switching to Optimism network
  const handleSwitchToOptimism = async () => {
    try {
      setLoading(true);
      await switchNetwork(optimism);
      setIsOptimismNetwork(true);
    } catch (err) {
      console.error('Error switching network:', err);
      setError('Failed to switch network. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle table creation
  const handleCreateTable = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!db || !address) {
        setError('No database connection or wallet address.');
        return;
      }
      
      const result = await createDigitalAssetsTable(db, address);
      setTableName(result.tableName);
      
      // Add mock data for demonstration
      if (process.env.NODE_ENV === 'development') {
        for (const nft of mockNFTs) {
          await insertDigitalAssetData(db, result.tableName, JSON.stringify(nft));
        }
        for (const gamingAsset of mockGamingAssets) {
          await insertDigitalAssetData(db, result.tableName, JSON.stringify(gamingAsset));
        }
        
        const data = await getDigitalAssetsData(db, result.tableName);
        setAssetsData(data);
      }
    } catch (err) {
      console.error('Error creating table:', err);
      setError('Failed to create table. Please try again.');
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
      
      if (!db || !tableName) {
        setError('No database connection or table.');
        return;
      }
      
      // Prepare asset data
      const asset: DigitalAsset = {
        name: assetName,
        type: assetType,
        platform,
        identifier,
        imageUrl: imageUrl || undefined,
        description: description || undefined,
        attributes: attributes ? JSON.parse(attributes) : undefined,
        acquiredDate: acquiredDate || undefined
      };
      
      // Insert into table
      await insertDigitalAssetData(db, tableName, JSON.stringify(asset));
      
      // Refresh data
      const data = await getDigitalAssetsData(db, tableName);
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
      
      if (!db || !tableName) {
        setError('No database connection or table.');
        return;
      }
      
      await clearDigitalAssetsData(db, tableName);
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
      <div className="legal-content">
        {!isOptimismNetwork ? (
          <div className="alert alert-warning">
            <p>Please switch to Optimism network to use digital assets storage.</p>
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
                <p>You don't have a digital assets table yet. Create one to track your NFTs and gaming assets.</p>
                <button 
                  className="button-primary" 
                  onClick={handleCreateTable}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Digital Assets Table'}
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
                  
                  {/* Assets Grid */}
                  {assetsData.length > 0 && (
                    <div className="assets-grid" style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                      gap: '1rem',
                      marginBottom: '1.5rem'
                    }}>
                      {assetsData.map((item) => {
                        const asset = parseAssetData(item.value);
                        
                        return (
                          <div 
                            key={item.id} 
                            className="asset-card" 
                            style={{ 
                              border: '1px solid #eaeaea',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              backgroundColor: selectedAsset === item.id.toString() ? '#f0f7ff' : 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => setSelectedAsset(selectedAsset === item.id.toString() ? null : item.id.toString())}
                          >
                            {/* Asset Image */}
                            <div style={{ 
                              height: '180px', 
                              backgroundColor: '#f5f5f5',
                              backgroundImage: asset.imageUrl ? `url(${asset.imageUrl})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {!asset.imageUrl && (
                                <div style={{ 
                                  fontSize: '3rem', 
                                  color: '#aaa',
                                  textAlign: 'center'
                                }}>
                                  {asset.type === 'nft' ? '🖼️' : asset.type === 'gaming' ? '🎮' : '🏆'}
                                </div>
                              )}
                            </div>
                            
                            {/* Asset Info */}
                            <div style={{ padding: '1rem' }}>
                              <div style={{ 
                                display: 'inline-block',
                                padding: '0.25rem 0.5rem',
                                backgroundColor: asset.type === 'nft' ? '#e3f2fd' : asset.type === 'gaming' ? '#e8f5e9' : '#fff3e0',
                                color: asset.type === 'nft' ? '#1565c0' : asset.type === 'gaming' ? '#2e7d32' : '#e65100',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                marginBottom: '0.5rem'
                              }}>
                                {asset.type === 'nft' ? 'NFT' : asset.type === 'gaming' ? 'GAMING' : 'OTHER'}
                              </div>
                              
                              <h3 style={{ 
                                margin: '0.5rem 0', 
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {asset.name}
                              </h3>
                              
                              <p style={{ 
                                fontSize: '0.85rem',
                                color: '#666',
                                margin: '0.25rem 0'
                              }}>
                                <strong>Platform:</strong> {asset.platform}
                              </p>
                              
                              {/* Expanded Details */}
                              {selectedAsset === item.id.toString() && (
                                <div style={{ 
                                  marginTop: '1rem',
                                  fontSize: '0.85rem'
                                }}>
                                  <p style={{ margin: '0.5rem 0' }}>
                                    <strong>Identifier:</strong> 
                                    <span style={{ 
                                      display: 'block',
                                      wordBreak: 'break-all',
                                      backgroundColor: '#f5f5f5',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '4px',
                                      marginTop: '0.25rem',
                                      fontSize: '0.8rem'
                                    }}>
                                      {asset.identifier}
                                    </span>
                                  </p>
                                  
                                  {asset.description && (
                                    <p style={{ margin: '0.5rem 0' }}>
                                      <strong>Description:</strong> {asset.description}
                                    </p>
                                  )}
                                  
                                  {asset.acquiredDate && (
                                    <p style={{ margin: '0.5rem 0' }}>
                                      <strong>Acquired:</strong> {new Date(asset.acquiredDate).toLocaleDateString()}
                                    </p>
                                  )}
                                  
                                  {asset.attributes && Object.keys(asset.attributes).length > 0 && (
                                    <div style={{ margin: '0.5rem 0' }}>
                                      <strong>Attributes:</strong>
                                      <div style={{ 
                                        display: 'flex', 
                                        flexWrap: 'wrap', 
                                        gap: '0.5rem',
                                        marginTop: '0.25rem'
                                      }}>
                                        {Object.entries(asset.attributes).map(([key, value]) => (
                                          <div key={key} style={{ 
                                            backgroundColor: '#f0f0f0',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem'
                                          }}>
                                            <strong>{key}:</strong> {value}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <p style={{ 
                                    fontSize: '0.8rem', 
                                    color: '#666',
                                    marginTop: '0.75rem'
                                  }}>
                                    Added: {new Date(item.created_at).toLocaleString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
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
                      <label htmlFor="platform">Platform/Collection:</label>
                      <input
                        type="text"
                        id="platform"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        required
                        placeholder="e.g., Ethereum, Axie Infinity, Decentraland"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="identifier">Identifier/Token ID:</label>
                      <input
                        type="text"
                        id="identifier"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        placeholder="e.g., 0x123... or item_12345"
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
