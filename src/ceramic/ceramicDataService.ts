/**
 * CeramicDataService
 * 
 * Service for interacting with Ceramic data storage
 */

import { ComposeClient } from '@composedb/client';
import { DID } from 'dids';
import { encryptData, decryptData, EncryptedData } from './encryptionUtils';
import { DataType } from '@/types/storage';

// Type mapping from our app's DataType to Ceramic model names
const DATA_TYPE_TO_MODEL_MAP: Record<DataType, string> = {
  [DataType.PROFILE]: 'EncryptedProfile',
  [DataType.DOCUMENTS]: 'EncryptedDocument',
  [DataType.DIGITAL_ASSETS]: 'EncryptedAsset',
  [DataType.REAL_WORLD_ASSETS]: 'EncryptedAsset',
  [DataType.MEDICAL]: 'EncryptedDocument',
  [DataType.CONNECTIONS]: 'EncryptedConnection',
  [DataType.ORGANIZATIONS]: 'EncryptedOrganization',
  [DataType.MESSAGES]: 'EncryptedConnection',
  [DataType.PRIVATE]: 'EncryptedDocument',
  [DataType.CONTACTS]: 'EncryptedConnection',
  [DataType.AFFILIATIONS]: 'EncryptedOrganization',
  [DataType.CURRENCIES]: 'EncryptedAsset',
  [DataType.DEFAULT]: 'EncryptedDocument', // Default case added to fix build error
};

export interface StorageItem {
  id: string;
  key: string;
  value: string;
  created_at?: string;
}

export class CeramicDataService {
  private composeClient: ComposeClient;
  private did: DID | null = null;

  constructor(composeClient: ComposeClient, did?: DID) {
    this.composeClient = composeClient;
    this.did = did || null;
  }

  setDID(did: DID) {
    this.did = did;
  }

  /**
   * Store an item in Ceramic
   * 
   * @param dataType - The type of data being stored
   * @param key - Unique key for the item
   * @param value - The value to store
   * @returns StorageItem representation of the stored item
   */
  async storeItem(dataType: DataType, key: string, value: string): Promise<StorageItem> {
    if (!this.did) {
      throw new Error('DID not set - authentication required');
    }

    const modelName = DATA_TYPE_TO_MODEL_MAP[dataType];
    let data: any;

    try {
      // Parse the value if it's JSON
      try {
        data = JSON.parse(value);
      } catch {
        data = value;
      }

      // Encrypt the data
      const encryptedData = await encryptData(data, this.did);
      const now = new Date().toISOString();

      // Prepare GraphQL mutation based on data type
      let query = '';
      let variables: any = {};

      switch (modelName) {
        case 'EncryptedProfile':
          query = `
            mutation CreateProfile($i: CreateEncryptedProfileInput!) {
              createEncryptedProfile(input: $i) {
                document {
                  id
                  encryptedData
                  encryptedKey
                  lastUpdated
                }
              }
            }
          `;
          variables = {
            i: {
              content: {
                encryptedData: encryptedData.encryptedData,
                encryptedKey: encryptedData.encryptedKey,
                displayName: data.displayName || "",
                lastUpdated: now
              }
            }
          };
          break;

        case 'EncryptedDocument':
          query = `
            mutation CreateDocument($i: CreateEncryptedDocumentInput!) {
              createEncryptedDocument(input: $i) {
                document {
                  id
                  documentType
                  documentName
                  ipfsCid
                  encryptedSymmetricKey
                  accessControlConditions
                  uploadDate
                }
              }
            }
          `;
          variables = {
            i: {
              content: {
                documentType: dataType,
                documentName: key,
                ipfsCid: data.ipfsCid || "placeholder",
                encryptedSymmetricKey: encryptedData.encryptedKey,
                accessControlConditions: "{}",
                uploadDate: now
              }
            }
          };
          break;

        case 'EncryptedAsset':
          query = `
            mutation CreateAsset($i: CreateEncryptedAssetInput!) {
              createEncryptedAsset(input: $i) {
                document {
                  id
                  assetType
                  encryptedData
                  encryptedKey
                  addedDate
                }
              }
            }
          `;
          variables = {
            i: {
              content: {
                assetType: dataType === DataType.DIGITAL_ASSETS ? 'digital' : 'real_world',
                encryptedData: encryptedData.encryptedData,
                encryptedKey: encryptedData.encryptedKey,
                addedDate: now
              }
            }
          };
          break;

        case 'EncryptedConnection':
          query = `
            mutation CreateConnection($i: CreateEncryptedConnectionInput!) {
              createEncryptedConnection(input: $i) {
                document {
                  id
                  encryptedData
                  encryptedKey
                  connectionType
                  createdAt
                }
              }
            }
          `;
          variables = {
            i: {
              content: {
                encryptedData: encryptedData.encryptedData,
                encryptedKey: encryptedData.encryptedKey,
                connectionType: dataType === DataType.MESSAGES ? 'message' : 'contact',
                createdAt: now
              }
            }
          };
          break;

        case 'EncryptedOrganization':
          query = `
            mutation CreateOrganization($i: CreateEncryptedOrganizationInput!) {
              createEncryptedOrganization(input: $i) {
                document {
                  id
                  encryptedData
                  encryptedKey
                  orgType
                  status
                }
              }
            }
          `;
          variables = {
            i: {
              content: {
                encryptedData: encryptedData.encryptedData,
                encryptedKey: encryptedData.encryptedKey,
                orgType: dataType === DataType.AFFILIATIONS ? 'affiliation' : 'organization',
                status: 'active'
              }
            }
          };
          break;

        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }

      // Execute the mutation
      const result = await this.composeClient.executeQuery(query, variables);
      
      if (result.errors) {
        throw new Error(`GraphQL error: ${result.errors[0].message}`);
      }

      // Extract ID from the result
      let resultId = '';
      const resultData = result.data || {};
      
      // Type guards for various document types
      const hasCreateProfile = typeof resultData === 'object' && resultData !== null && 'createEncryptedProfile' in resultData;
      const hasCreateDocument = typeof resultData === 'object' && resultData !== null && 'createEncryptedDocument' in resultData;
      const hasCreateAsset = typeof resultData === 'object' && resultData !== null && 'createEncryptedAsset' in resultData;
      const hasCreateConnection = typeof resultData === 'object' && resultData !== null && 'createEncryptedConnection' in resultData;
      const hasCreateOrganization = typeof resultData === 'object' && resultData !== null && 'createEncryptedOrganization' in resultData;
      
      if (hasCreateProfile) {
        const profile = resultData.createEncryptedProfile;
        if (typeof profile === 'object' && profile !== null && 'document' in profile) {
          const doc = profile.document;
          if (typeof doc === 'object' && doc !== null && 'id' in doc && typeof doc.id === 'string') {
            resultId = doc.id;
          }
        }
      } else if (hasCreateDocument) {
        const doc = resultData.createEncryptedDocument;
        if (typeof doc === 'object' && doc !== null && 'document' in doc) {
          const docObj = doc.document;
          if (typeof docObj === 'object' && docObj !== null && 'id' in docObj && typeof docObj.id === 'string') {
            resultId = docObj.id;
          }
        }
      } else if (hasCreateAsset) {
        const asset = resultData.createEncryptedAsset;
        if (typeof asset === 'object' && asset !== null && 'document' in asset) {
          const doc = asset.document;
          if (typeof doc === 'object' && doc !== null && 'id' in doc && typeof doc.id === 'string') {
            resultId = doc.id;
          }
        }
      } else if (hasCreateConnection) {
        const connection = resultData.createEncryptedConnection;
        if (typeof connection === 'object' && connection !== null && 'document' in connection) {
          const doc = connection.document;
          if (typeof doc === 'object' && doc !== null && 'id' in doc && typeof doc.id === 'string') {
            resultId = doc.id;
          }
        }
      } else if (hasCreateOrganization) {
        const org = resultData.createEncryptedOrganization;
        if (typeof org === 'object' && org !== null && 'document' in org) {
          const doc = org.document;
          if (typeof doc === 'object' && doc !== null && 'id' in doc && typeof doc.id === 'string') {
            resultId = doc.id;
          }
        }
      }

      // Return in StorageItem format for compatibility
      return {
        id: resultId,
        key,
        value,
        created_at: now
      };
    } catch (error) {
      console.error(`[CERAMIC] Error storing ${dataType} item:`, error);
      throw error;
    }
  }

  /**
   * Get an item from Ceramic
   * 
   * @param dataType - The type of data to retrieve
   * @param key - Key of the item to retrieve
   * @returns StorageItem or null if not found
   */
  async getItem(dataType: DataType, key: string): Promise<StorageItem | null> {
    if (!this.did) {
      throw new Error('DID not set - authentication required');
    }

    try {
      // Get all items and find by key
      const items = await this.listItems(dataType);
      const item = items.find(item => item.key === key);
      
      return item || null;
    } catch (error) {
      console.error(`[CERAMIC] Error getting ${dataType} item with key ${key}:`, error);
      return null;
    }
  }

  /**
   * List all items of a particular data type
   * 
   * @param dataType - The type of data to list
   * @returns Array of StorageItems
   */
  async listItems(dataType: DataType): Promise<StorageItem[]> {
    if (!this.did) {
      throw new Error('DID not set - authentication required');
    }

    const modelName = DATA_TYPE_TO_MODEL_MAP[dataType];
    let query = '';
    
    try {
      // Build the query based on model name
      switch (modelName) {
        case 'EncryptedProfile':
          query = `
            query GetProfiles {
              encryptedProfileIndex(first: 100) {
                edges {
                  node {
                    id
                    encryptedData
                    encryptedKey
                    displayName
                    lastUpdated
                  }
                }
              }
            }
          `;
          break;

        case 'EncryptedDocument':
          query = `
            query GetDocuments {
              encryptedDocumentIndex(first: 100) {
                edges {
                  node {
                    id
                    documentType
                    documentName
                    encryptedSymmetricKey
                    accessControlConditions
                    uploadDate
                  }
                }
              }
            }
          `;
          break;

        case 'EncryptedAsset':
          query = `
            query GetAssets {
              encryptedAssetIndex(first: 100) {
                edges {
                  node {
                    id
                    assetType
                    encryptedData
                    encryptedKey
                    addedDate
                  }
                }
              }
            }
          `;
          break;

        case 'EncryptedConnection':
          query = `
            query GetConnections {
              encryptedConnectionIndex(first: 100) {
                edges {
                  node {
                    id
                    encryptedData
                    encryptedKey
                    connectionType
                    createdAt
                  }
                }
              }
            }
          `;
          break;

        case 'EncryptedOrganization':
          query = `
            query GetOrganizations {
              encryptedOrganizationIndex(first: 100) {
                edges {
                  node {
                    id
                    encryptedData
                    encryptedKey
                    orgType
                    status
                  }
                }
              }
            }
          `;
          break;

        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }

      // Execute the query
      const result = await this.composeClient.executeQuery(query);
      
      if (result.errors) {
        throw new Error(`GraphQL error: ${result.errors[0].message}`);
      }

      // Process results based on model type
      let items: StorageItem[] = [];
      const resultData = result.data || {};
      
      // Type guards for various index types
      const hasProfileIndex = typeof resultData === 'object' && resultData !== null && 'encryptedProfileIndex' in resultData;
      const hasDocumentIndex = typeof resultData === 'object' && resultData !== null && 'encryptedDocumentIndex' in resultData;
      const hasAssetIndex = typeof resultData === 'object' && resultData !== null && 'encryptedAssetIndex' in resultData;
      const hasConnectionIndex = typeof resultData === 'object' && resultData !== null && 'encryptedConnectionIndex' in resultData;
      const hasOrganizationIndex = typeof resultData === 'object' && resultData !== null && 'encryptedOrganizationIndex' in resultData;
      
      if (hasProfileIndex) {
        const profileIndex = resultData.encryptedProfileIndex;
        if (typeof profileIndex === 'object' && profileIndex !== null && 'edges' in profileIndex && Array.isArray(profileIndex.edges)) {
          items = await this.processProfileResults(profileIndex.edges, dataType);
        }
      } else if (hasDocumentIndex) {
        const documentIndex = resultData.encryptedDocumentIndex;
        if (typeof documentIndex === 'object' && documentIndex !== null && 'edges' in documentIndex && Array.isArray(documentIndex.edges)) {
          items = await this.processDocumentResults(documentIndex.edges, dataType);
        }
      } else if (hasAssetIndex) {
        const assetIndex = resultData.encryptedAssetIndex;
        if (typeof assetIndex === 'object' && assetIndex !== null && 'edges' in assetIndex && Array.isArray(assetIndex.edges)) {
          items = await this.processAssetResults(assetIndex.edges, dataType);
        }
      } else if (hasConnectionIndex) {
        const connectionIndex = resultData.encryptedConnectionIndex;
        if (typeof connectionIndex === 'object' && connectionIndex !== null && 'edges' in connectionIndex && Array.isArray(connectionIndex.edges)) {
          items = await this.processConnectionResults(connectionIndex.edges, dataType);
        }
      } else if (hasOrganizationIndex) {
        const organizationIndex = resultData.encryptedOrganizationIndex;
        if (typeof organizationIndex === 'object' && organizationIndex !== null && 'edges' in organizationIndex && Array.isArray(organizationIndex.edges)) {
          items = await this.processOrganizationResults(organizationIndex.edges, dataType);
        }
      }

      return items;
    } catch (error) {
      console.error(`[CERAMIC] Error listing ${dataType} items:`, error);
      return [];
    }
  }

  /**
   * Delete an item from Ceramic
   * Note: In Ceramic, we don't actually delete but can update to mark as deleted
   * 
   * @param dataType - Type of data to delete
   * @param key - Key of item to delete
   * @returns Success status
   */
  async deleteItem(dataType: DataType, key: string): Promise<boolean> {
    // For simplicity, we'll implement this as a "soft delete"
    try {
      const item = await this.getItem(dataType, key);
      if (!item) {
        return false;
      }

      // Mark as deleted by updating with special value
      const deletedValue = JSON.stringify({
        __deleted: true,
        originalKey: key,
        deletedAt: new Date().toISOString()
      });

      await this.storeItem(dataType, key, deletedValue);
      return true;
    } catch (error) {
      console.error(`[CERAMIC] Error deleting ${dataType} item with key ${key}:`, error);
      return false;
    }
  }

  // Helper methods to process query results by type
  private async processProfileResults(edges: any[], dataType: DataType): Promise<StorageItem[]> {
    if (!this.did) return [];
    
    const items: StorageItem[] = [];
    
    for (const edge of edges) {
      const node = edge.node;
      try {
        // Only process items of the requested data type
        // For profiles, we assume they're all profile type
        if (dataType !== DataType.PROFILE) continue;
        
        const encryptedData: EncryptedData = {
          encryptedData: node.encryptedData,
          encryptedKey: node.encryptedKey
        };
        
        const decrypted = await decryptData(encryptedData, this.did);
        
        items.push({
          id: node.id,
          key: node.displayName || 'profile',
          value: typeof decrypted === 'string' ? decrypted : JSON.stringify(decrypted),
          created_at: node.lastUpdated
        });
      } catch (error) {
        console.error('[CERAMIC] Error processing profile:', error);
      }
    }
    
    return items;
  }

  private async processDocumentResults(edges: any[], dataType: DataType): Promise<StorageItem[]> {
    if (!this.did) return [];
    
    const items: StorageItem[] = [];
    
    for (const edge of edges) {
      const node = edge.node;
      try {
        // Only process items of the requested data type
        if (node.documentType !== dataType) continue;
        
        // For documents, we don't have the actual encrypted data in the query result
        // We'd need to fetch it separately or include it in the query
        // For now, we'll return placeholder data
        items.push({
          id: node.id,
          key: node.documentName,
          value: JSON.stringify({
            documentType: node.documentType,
            accessControlConditions: node.accessControlConditions,
            placeholder: true
          }),
          created_at: node.uploadDate
        });
      } catch (error) {
        console.error('[CERAMIC] Error processing document:', error);
      }
    }
    
    return items;
  }

  private async processAssetResults(edges: any[], dataType: DataType): Promise<StorageItem[]> {
    if (!this.did) return [];
    
    const items: StorageItem[] = [];
    
    for (const edge of edges) {
      const node = edge.node;
      try {
        // Only process items of the requested data type
        const assetDataType = node.assetType === 'digital' 
          ? DataType.DIGITAL_ASSETS 
          : DataType.REAL_WORLD_ASSETS;
          
        if (dataType !== assetDataType && 
            dataType !== DataType.CURRENCIES) continue;
        
        const encryptedData: EncryptedData = {
          encryptedData: node.encryptedData,
          encryptedKey: node.encryptedKey
        };
        
        const decrypted = await decryptData(encryptedData, this.did);
        
        items.push({
          id: node.id,
          key: typeof decrypted === 'object' && decrypted.name ? decrypted.name : `asset-${node.id.substr(-6)}`,
          value: typeof decrypted === 'string' ? decrypted : JSON.stringify(decrypted),
          created_at: node.addedDate
        });
      } catch (error) {
        console.error('[CERAMIC] Error processing asset:', error);
      }
    }
    
    return items;
  }

  private async processConnectionResults(edges: any[], dataType: DataType): Promise<StorageItem[]> {
    if (!this.did) return [];
    
    const items: StorageItem[] = [];
    
    for (const edge of edges) {
      const node = edge.node;
      try {
        // Only process items of the requested data type
        const connectionDataType = node.connectionType === 'message' 
          ? DataType.MESSAGES 
          : (node.connectionType === 'contact' ? DataType.CONTACTS : DataType.CONNECTIONS);
          
        if (dataType !== connectionDataType) continue;
        
        const encryptedData: EncryptedData = {
          encryptedData: node.encryptedData,
          encryptedKey: node.encryptedKey
        };
        
        const decrypted = await decryptData(encryptedData, this.did);
        
        items.push({
          id: node.id,
          key: typeof decrypted === 'object' && decrypted.name ? decrypted.name : `connection-${node.id.substr(-6)}`,
          value: typeof decrypted === 'string' ? decrypted : JSON.stringify(decrypted),
          created_at: node.createdAt
        });
      } catch (error) {
        console.error('[CERAMIC] Error processing connection:', error);
      }
    }
    
    return items;
  }

  private async processOrganizationResults(edges: any[], dataType: DataType): Promise<StorageItem[]> {
    if (!this.did) return [];
    
    const items: StorageItem[] = [];
    
    for (const edge of edges) {
      const node = edge.node;
      try {
        // Only process items of the requested data type
        const orgDataType = node.orgType === 'affiliation' 
          ? DataType.AFFILIATIONS 
          : DataType.ORGANIZATIONS;
          
        if (dataType !== orgDataType) continue;
        
        const encryptedData: EncryptedData = {
          encryptedData: node.encryptedData,
          encryptedKey: node.encryptedKey
        };
        
        const decrypted = await decryptData(encryptedData, this.did);
        
        items.push({
          id: node.id,
          key: typeof decrypted === 'object' && decrypted.name ? decrypted.name : `org-${node.id.substr(-6)}`,
          value: typeof decrypted === 'string' ? decrypted : JSON.stringify(decrypted),
          created_at: node.status
        });
      } catch (error) {
        console.error('[CERAMIC] Error processing organization:', error);
      }
    }
    
    return items;
  }
}
