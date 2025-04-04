/**
 * ComposeDB Model Definitions
 * These models define the structure of our data in ComposeDB
 */

import { DataType } from '@/utils/ceramicUtils';

// Base model for all content
export const BaseContentModel = {
  name: 'BaseContent',
  schema: {
    type: 'object',
    properties: {
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      tags: { 
        type: 'array',
        items: { type: 'string' },
        default: []
      }
    },
    required: ['createdAt']
  }
};

// Profile data model
export const ProfileModel = {
  name: 'Profile',
  schema: {
    type: 'object',
    properties: {
      ...BaseContentModel.schema.properties,
      name: { type: 'string', maxLength: 150 },
      email: { type: 'string', maxLength: 150 },
      bio: { type: 'string', maxLength: 1000 },
      avatar: { type: 'string', maxLength: 500 },
      socialLinks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            platform: { type: 'string', maxLength: 50 },
            url: { type: 'string', maxLength: 250 }
          }
        }
      }
    }
  }
};

// Digital Asset model
export const DigitalAssetModel = {
  name: 'DigitalAsset',
  schema: {
    type: 'object',
    properties: {
      ...BaseContentModel.schema.properties,
      name: { type: 'string', maxLength: 100 },
      type: { 
        type: 'string', 
        enum: ['nft', 'gaming', 'other'],
        default: 'other'
      },
      platform: { type: 'string', maxLength: 100 },
      identifier: { type: 'string', maxLength: 100 },
      chainId: { type: 'string', maxLength: 20 },
      chainName: { type: 'string', maxLength: 50 },
      contractAddress: { type: 'string', maxLength: 100 },
      tokenId: { type: 'string', maxLength: 100 },
      imageUrl: { type: 'string', maxLength: 500 },
      description: { type: 'string', maxLength: 1000 }
    },
    required: ['name', 'type', 'createdAt']
  }
};

// Private Data model
export const PrivateDataModel = {
  name: 'PrivateData',
  schema: {
    type: 'object',
    properties: {
      ...BaseContentModel.schema.properties,
      key: { type: 'string', maxLength: 100 },
      value: { type: 'string', maxLength: 5000 },
      description: { type: 'string', maxLength: 500 },
      isEncrypted: { type: 'boolean', default: false }
    },
    required: ['key', 'value', 'createdAt']
  }
};

// Medical Data model
export const MedicalDataModel = {
  name: 'MedicalData',
  schema: {
    type: 'object',
    properties: {
      ...BaseContentModel.schema.properties,
      key: { type: 'string', maxLength: 100 },
      value: { type: 'string', maxLength: 5000 },
      category: {
        type: 'string',
        enum: [
          'allergy', 
          'condition', 
          'medication', 
          'procedure', 
          'immunization', 
          'vitalSign',
          'labResult',
          'other'
        ],
        default: 'other'
      },
      provider: { type: 'string', maxLength: 200 },
      date: { type: 'string', format: 'date' },
      isEncrypted: { type: 'boolean', default: true }
    },
    required: ['key', 'value', 'createdAt']
  }
};

// Document model
export const DocumentModel = {
  name: 'Document',
  schema: {
    type: 'object',
    properties: {
      ...BaseContentModel.schema.properties,
      title: { type: 'string', maxLength: 200 },
      type: { 
        type: 'string',
        enum: ['passport', 'id_card', 'driver_license', 'birth_certificate', 'other'],
        default: 'other'
      },
      issuer: { type: 'string', maxLength: 200 },
      issuedDate: { type: 'string', format: 'date' },
      expiryDate: { type: 'string', format: 'date' },
      documentNumber: { type: 'string', maxLength: 100 },
      content: { type: 'string', maxLength: 10000 },
      isEncrypted: { type: 'boolean', default: true }
    },
    required: ['title', 'type', 'createdAt']
  }
};

// Human Relationship model
export const RelationshipModel = {
  name: 'Relationship',
  schema: {
    type: 'object',
    properties: {
      ...BaseContentModel.schema.properties,
      name: { type: 'string', maxLength: 150 },
      relationship: { type: 'string', maxLength: 100 },
      email: { type: 'string', maxLength: 150 },
      phone: { type: 'string', maxLength: 50 },
      notes: { type: 'string', maxLength: 1000 },
      did: { type: 'string', maxLength: 200 }
    },
    required: ['name', 'relationship', 'createdAt']
  }
};

// Organization model
export const OrganizationModel = {
  name: 'Organization',
  schema: {
    type: 'object',
    properties: {
      ...BaseContentModel.schema.properties,
      name: { type: 'string', maxLength: 200 },
      role: { type: 'string', maxLength: 150 },
      startDate: { type: 'string', format: 'date' },
      endDate: { type: 'string', format: 'date' },
      current: { type: 'boolean', default: false },
      website: { type: 'string', maxLength: 250 },
      notes: { type: 'string', maxLength: 1000 }
    },
    required: ['name', 'role', 'createdAt']
  }
};

// Real World Asset model
export const RealWorldAssetModel = {
  name: 'RealWorldAsset',
  schema: {
    type: 'object',
    properties: {
      ...BaseContentModel.schema.properties,
      name: { type: 'string', maxLength: 200 },
      type: { type: 'string', maxLength: 100 },
      value: { type: 'string', maxLength: 100 },
      location: { type: 'string', maxLength: 500 },
      description: { type: 'string', maxLength: 1000 },
      purchaseDate: { type: 'string', format: 'date' },
      documents: {
        type: 'array',
        items: { type: 'string', maxLength: 200 }
      }
    },
    required: ['name', 'type', 'createdAt']
  }
};

// Map data types to model definitions
export const DataTypeToModelMap = {
  [DataType.PROFILE]: ProfileModel,
  [DataType.DOCUMENTS]: DocumentModel,
  [DataType.MEDICAL]: MedicalDataModel,
  [DataType.DIGITAL_ASSETS]: DigitalAssetModel,
  [DataType.REAL_WORLD_ASSETS]: RealWorldAssetModel,
  [DataType.CONNECTIONS]: RelationshipModel,
  [DataType.ORGANIZATIONS]: OrganizationModel,
  [DataType.PRIVATE]: PrivateDataModel,
  [DataType.MESSAGES]: {} // We'll implement this later
};

// Combined model definition for ComposeDB
export const CombinedModelDefinition = {
  models: {
    BaseContent: BaseContentModel,
    Profile: ProfileModel,
    DigitalAsset: DigitalAssetModel,
    PrivateData: PrivateDataModel,
    MedicalData: MedicalDataModel,
    Document: DocumentModel,
    Relationship: RelationshipModel,
    Organization: OrganizationModel,
    RealWorldAsset: RealWorldAssetModel
  }
};
