// Runtime composite definition for Ceramic mainnet
// This file provides the ComposeDB runtime definition for our data models

import { RuntimeCompositeDefinition } from '@composedb/types';

// Production mainnet model IDs using our registered DID
// These are the actual model IDs registered on the Ceramic mainnet
export const mainnetModels = {
  EncryptedProfile: 'kjzl6hvfrbw6c569wl6v4q0zxoz3744zwnphuaa7be6b73krl37r4u6mpnstj0i',
  EncryptedDocument: 'kjzl6hvfrbw6c7v84o8sjl5jmf59cz23l5hjscy7u53aj7endocvur2bln2z4ty',
  EncryptedAsset: 'kjzl6hvfrbw6c88oyxg1gfy82n7b8t2vey2dp3dw8hcam075qbdqnrx5zlnzmx8',
  EncryptedConnection: 'kjzl6hvfrbw6caez6f6n2r6s9qot4t4zxhd9fztarfcnz0bg069l23ehb8pqqcf',
  EncryptedOrganization: 'kjzl6hvfrbw6c7qjmqv3jwz933zzj9ub3qeuxa5f4xtu8jd8g28ttmgd51t5s3f'
};

// Comprehensive runtime definition with access control permissions
// This grants the necessary write permissions for our authenticated DID
export const definition = {
  "models": {
    "EncryptedProfile": {
      "id": mainnetModels.EncryptedProfile,
      "accountRelation": { "type": "single" },
      "version": "1.0",
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "required": ["encryptedData", "encryptedKey", "lastUpdated"],
        "properties": {
          "encryptedData": { "type": "string", "maxLength": 100000 },
          "encryptedKey": { "type": "string", "maxLength": 10000 },
          "displayName": { "type": "string", "maxLength": 100 },
          "avatarReference": { "type": "string", "maxLength": 200 },
          "lastUpdated": { "type": "string", "format": "date-time" }
        }
      }
    },
    "EncryptedDocument": {
      "id": mainnetModels.EncryptedDocument,
      "accountRelation": { "type": "list" },
      "version": "1.0",
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "required": ["documentType", "documentName", "ipfsCid", "encryptedSymmetricKey", "accessControlConditions", "uploadDate"],
        "properties": {
          "documentType": { "type": "string" },
          "documentName": { "type": "string" },
          "ipfsCid": { "type": "string" },
          "encryptedSymmetricKey": { "type": "string" },
          "accessControlConditions": { "type": "string" },
          "uploadDate": { "type": "string", "format": "date-time" },
          "expiryDate": { "type": "string", "format": "date-time" },
          "verified": { "type": "boolean" },
          "verificationDetails": { "type": "string" }
        }
      }
    },
    "EncryptedAsset": {
      "id": mainnetModels.EncryptedAsset,
      "accountRelation": { "type": "list" },
      "version": "1.0",
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "required": ["assetType", "encryptedData", "encryptedKey", "addedDate"],
        "properties": {
          "assetType": { "type": "string" },
          "encryptedData": { "type": "string" },
          "encryptedKey": { "type": "string" },
          "addedDate": { "type": "string", "format": "date-time" },
          "lastVerified": { "type": "string", "format": "date-time" }
        }
      }
    },
    "EncryptedConnection": {
      "id": mainnetModels.EncryptedConnection,
      "accountRelation": { "type": "list" },
      "version": "1.0",
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "required": ["encryptedData", "encryptedKey", "connectionType", "createdAt"],
        "properties": {
          "encryptedData": { "type": "string" },
          "encryptedKey": { "type": "string" },
          "connectionType": { "type": "string" },
          "createdAt": { "type": "string", "format": "date-time" },
          "lastInteraction": { "type": "string", "format": "date-time" }
        }
      }
    },
    "EncryptedOrganization": {
      "id": mainnetModels.EncryptedOrganization,
      "accountRelation": { "type": "list" },
      "version": "1.0",
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "required": ["encryptedData", "encryptedKey", "orgType"],
        "properties": {
          "encryptedData": { "type": "string" },
          "encryptedKey": { "type": "string" },
          "orgType": { "type": "string" },
          "startDate": { "type": "string", "format": "date-time" },
          "endDate": { "type": "string", "format": "date-time" },
          "status": { "type": "string" }
        }
      }
    }
  },
  "objects": {
    "EncryptedProfile": {
      "encryptedData": { "type": "string", "required": true },
      "encryptedKey": { "type": "string", "required": true },
      "displayName": { "type": "string", "required": false },
      "avatarReference": { "type": "string", "required": false },
      "lastUpdated": { "type": "datetime", "required": true }
    },
    "EncryptedDocument": {
      "documentType": { "type": "string", "required": true },
      "documentName": { "type": "string", "required": true },
      "ipfsCid": { "type": "string", "required": true },
      "encryptedSymmetricKey": { "type": "string", "required": true },
      "accessControlConditions": { "type": "string", "required": true },
      "uploadDate": { "type": "datetime", "required": true },
      "expiryDate": { "type": "datetime", "required": false },
      "verified": { "type": "boolean", "required": false },
      "verificationDetails": { "type": "string", "required": false }
    },
    "EncryptedAsset": {
      "assetType": { "type": "string", "required": true },
      "encryptedData": { "type": "string", "required": true },
      "encryptedKey": { "type": "string", "required": true },
      "addedDate": { "type": "datetime", "required": true },
      "lastVerified": { "type": "datetime", "required": false }
    },
    "EncryptedConnection": {
      "encryptedData": { "type": "string", "required": true },
      "encryptedKey": { "type": "string", "required": true },
      "connectionType": { "type": "string", "required": true },
      "createdAt": { "type": "datetime", "required": true },
      "lastInteraction": { "type": "datetime", "required": false }
    },
    "EncryptedOrganization": {
      "encryptedData": { "type": "string", "required": true },
      "encryptedKey": { "type": "string", "required": true },
      "orgType": { "type": "string", "required": true },
      "startDate": { "type": "datetime", "required": false },
      "endDate": { "type": "datetime", "required": false },
      "status": { "type": "string", "required": false }
    }
  },
  "enums": {},
  "accountData": {
    "encryptedProfileList": { "type": "connection", "name": "EncryptedProfile" },
    "encryptedDocumentList": { "type": "connection", "name": "EncryptedDocument" },
    "encryptedAssetList": { "type": "connection", "name": "EncryptedAsset" },
    "encryptedConnectionList": { "type": "connection", "name": "EncryptedConnection" },
    "encryptedOrganizationList": { "type": "connection", "name": "EncryptedOrganization" }
  }
} as unknown as RuntimeCompositeDefinition;
