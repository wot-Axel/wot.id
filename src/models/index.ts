// For MVP, we'll use a simplified approach to model definitions
// In a production environment, we would generate proper ComposeDB models
// using the ComposeDB CLI

// Map data types to model names for easier reference
export const DataTypeToModelMap = {
  'private': 'PrivateData',
  'medical': 'MedicalData',
  'digital_assets': 'DigitalAsset'
};

// Simple schema definitions for our data types
export const DigitalAssetSchema = {
  type: 'object',
  properties: {
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
  required: ['name', 'type', 'platform', 'identifier']
};

export const PrivateDataSchema = {
  type: 'object',
  properties: {
    key: { type: 'string', maxLength: 100 },
    value: { type: 'string', maxLength: 5000 },
    description: { type: 'string', maxLength: 500 }
  },
  required: ['key', 'value']
};

export const MedicalDataSchema = {
  type: 'object',
  properties: {
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
    provider: { type: 'string', maxLength: 200 }
  },
  required: ['key', 'value']
};

// For the MVP, we'll use a simplified definition
// This will be replaced with proper ComposeDB models in the future
export const CombinedModel = {
  schemas: {
    DigitalAsset: DigitalAssetSchema,
    PrivateData: PrivateDataSchema,
    MedicalData: MedicalDataSchema
  }
};
