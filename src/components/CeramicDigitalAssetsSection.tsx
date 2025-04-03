'use client';

import React, { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { 
  DataType,
  checkCollectionExists,
  createCollection,
  getData,
  insertData,
  clearData,
  DataRecord
} from '../utils/ceramicUtils';
import { useCeramic } from '../context/CeramicContext';

// Ensure window.ethereum is recognized
declare global {
  interface Window {
    ethereum?: Record<string, unknown>;
  }
}

// Types for digital assets (same as in the original component)
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

// Common blockchain networks (same as in the original component)
const CHAINS = {
  ETHEREUM: { id: '0x1', name: 'Ethereum' },
  OPTIMISM: { id: '0xa', name: 'Optimism' },
  POLYGON: { id: '0x89', name: 'Polygon' },
  ARBITRUM: { id: '0xa4b1', name: 'Arbitrum' },
  BASE: { id: '0x2105', name: 'Base' },
  SOLANA: { id: '0x65', name: 'Solana' }, // Using a placeholder ID for non-EVM chains
};

// Mock data for demonstration (same as in the original component)
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
      chainId: '0x0',
      chainName: 'Unknown Chain'
    };
  }
  try {
    return JSON.parse(data) as DigitalAsset;
  } catch (e) {
    console.error('Error parsing asset data:', e);
    return {
      name: 'Error: Invalid Data',
      type: 'other',
      platform: 'Unknown',
      identifier: 'error',
      chainId: '0x0',
      chainName: 'Unknown Chain'
    };
  }
};

export const CeramicDigitalAssetsSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const { ceramic, isInitialized, isLoading: ceramicLoading, error: ceramicError } = useCeramic();
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

  // Display a message about Ceramic Network
  const renderCeramicInfo = () => {
    return (
      <div className="info-box">
        <p>
          <strong>Ceramic Network:</strong> Your digital assets data is securely stored on the Ceramic Network,
          a decentralized data network built specifically for Web3 applications. Ceramic provides better
          performance, lower costs, and native integration with decentralized identities.
        </p>
      </div>
    );
  };

  // Initialize data when Ceramic is ready
  useEffect(() => {
    const init = async () => {
      try {
        if (isConnected && address && isInitialized && ceramic) {
          setLoading(true);
          setError('');
          
          // Check if collection exists
          // Create DID from address
          const did = ceramic?.did?.id || `did:pkh:eip155:1:${address}`;
          const exists = await checkCollectionExists(ceramic, DataType.DIGITAL_ASSETS, did);
          if (exists.exists) {
            setCollectionId(exists.collectionId);
            
            // Get existing data
            const data = await getData(DataType.DIGITAL_ASSETS, exists.collectionId);
            setAssetsData(data);
          }
          
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading digital assets from Ceramic:', err);
        setError('Failed to load digital assets. Please try again.');
        setLoading(false);
      }
    };
    
    init();
  }, [isConnected, address, isInitialized, ceramic]);

  // Handle collection creation
  const handleCreateCollection = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!address) {
        setError('No wallet address.');
        return;
      }
      
      // Extract DID from ceramic client
      const did = ceramic?.did?.id || `did:pkh:eip155:1:${address}`;
      
      // Create collection
      const result = await createCollection(ceramic, DataType.DIGITAL_ASSETS, did);
      const collectionId = result.collectionId;
      setCollectionId(collectionId);
      
      // Add mock data for demonstration
      if (process.env.NODE_ENV === 'development') {
        for (const nft of mockNFTs) {
          await insertData(DataType.DIGITAL_ASSETS, collectionId, JSON.stringify(nft));
        }
        
        const data = await getData(DataType.DIGITAL_ASSETS, collectionId);
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
      
      if (!address || !collectionId) {
        setError('No wallet address or collection.');
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
      
      // Insert into collection
      await insertData(DataType.DIGITAL_ASSETS, collectionId, JSON.stringify(asset));
      
      // Refresh data
      const data = await getData(DataType.DIGITAL_ASSETS, collectionId);
      setAssetsData(data);
      
      // Reset form
      setAssetName('');
      setAssetType('nft');
      setPlatform('');
      setIdentifier('');
      setSelectedChain(CHAINS.ETHEREUM.id);
      setContractAddress('');
      setTokenId('');
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
      
      if (!address || !collectionId) {
        setError('No wallet connected or collection created.');
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
    return assetName && assetType && platform && identifier;
  };

  // Render asset card
  const renderAssetCard = (record: DataRecord) => {
    const asset = parseAssetData(record.value);
    
    return (
      <div 
        key={record.id} 
        className={`asset-card ${selectedAsset === record.id ? 'selected' : ''}`}
        onClick={() => setSelectedAsset(selectedAsset === record.id ? null : record.id)}
      >
        <div className="asset-image">
          {asset.imageUrl ? (
            <img src={asset.imageUrl} alt={asset.name} />
          ) : (
            <div className="placeholder-image">
              {asset.name.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="asset-info">
          <h3>{asset.name}</h3>
          <p><strong>Type:</strong> {asset.type}</p>
          <p><strong>Platform:</strong> {asset.platform}</p>
          <p><strong>Chain:</strong> {asset.chainName}</p>
          
          {selectedAsset === record.id && (
            <div className="asset-details">
              {asset.description && <p><strong>Description:</strong> {asset.description}</p>}
              {asset.contractAddress && <p><strong>Contract:</strong> {asset.contractAddress.substring(0, 8)}...{asset.contractAddress.substring(asset.contractAddress.length - 6)}</p>}
              {asset.tokenId && <p><strong>Token ID:</strong> {asset.tokenId}</p>}
              {asset.acquiredDate && <p><strong>Acquired:</strong> {asset.acquiredDate}</p>}
              
              {asset.attributes && Object.keys(asset.attributes).length > 0 && (
                <div className="attributes">
                  <strong>Attributes:</strong>
                  <ul>
                    {Object.entries(asset.attributes).map(([key, value]) => (
                      <li key={key}><strong>{key}:</strong> {value}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="section">
      <h2>Digital Assets (Ceramic Network)</h2>
      
      {renderCeramicInfo()}
      
      {error && <div className="error">{error}</div>}
      
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          {!collectionId ? (
            <div className="empty-state">
              <p>No digital assets collection found. Create one to get started.</p>
              <button onClick={handleCreateCollection} disabled={loading || !isConnected}>
                Create Collection
              </button>
            </div>
          ) : (
            <div className="assets-container">
              <div className="actions">
                <button onClick={() => setShowAddForm(!showAddForm)}>
                  {showAddForm ? 'Cancel' : 'Add Asset'}
                </button>
                <button onClick={handleClearAssets} className="danger">
                  Clear All
                </button>
              </div>
              
              {showAddForm && (
                <form onSubmit={handleAddAsset} className="add-form">
                  <h3>Add New Digital Asset</h3>
                  
                  <div className="form-group">
                    <label>Name:</label>
                    <input 
                      type="text" 
                      value={assetName} 
                      onChange={(e) => setAssetName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Type:</label>
                    <select 
                      value={assetType} 
                      onChange={(e) => setAssetType(e.target.value as 'nft' | 'gaming' | 'other')}
                      required
                    >
                      <option value="nft">NFT</option>
                      <option value="gaming">Gaming Asset</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Platform:</label>
                    <input 
                      type="text" 
                      value={platform} 
                      onChange={(e) => setPlatform(e.target.value)}
                      required
                      placeholder="e.g., OpenSea, Rarible, Axie Infinity"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Identifier:</label>
                    <input 
                      type="text" 
                      value={identifier} 
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      placeholder="A unique identifier for this asset"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Blockchain:</label>
                    <select 
                      value={selectedChain} 
                      onChange={(e) => setSelectedChain(e.target.value)}
                    >
                      {Object.values(CHAINS).map((chain) => (
                        <option key={chain.id} value={chain.id}>{chain.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Contract Address (optional):</label>
                    <input 
                      type="text" 
                      value={contractAddress} 
                      onChange={(e) => setContractAddress(e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Token ID (optional):</label>
                    <input 
                      type="text" 
                      value={tokenId} 
                      onChange={(e) => setTokenId(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Image URL (optional):</label>
                    <input 
                      type="text" 
                      value={imageUrl} 
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Description (optional):</label>
                    <textarea 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Attributes (optional, JSON format):</label>
                    <textarea 
                      value={attributes} 
                      onChange={(e) => setAttributes(e.target.value)}
                      placeholder='{"trait1": "value1", "trait2": "value2"}'
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Acquired Date (optional):</label>
                    <input 
                      type="date" 
                      value={acquiredDate} 
                      onChange={(e) => setAcquiredDate(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" disabled={!isFormValid()}>
                      Add Asset
                    </button>
                  </div>
                </form>
              )}
              
              <div className="assets-grid">
                {assetsData.length > 0 ? (
                  assetsData.map((record) => renderAssetCard(record))
                ) : (
                  <div className="empty-state">
                    <p>No digital assets found. Add some to get started.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
