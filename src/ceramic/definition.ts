// Runtime composite definition that combines all our GraphQL models
// This would normally be generated from our GraphQL schemas using ComposeDB CLI
// For this implementation, we're including a minimal definition directly

import { RuntimeCompositeDefinition } from '@composedb/types';

// Cast the definition to the correct type to avoid errors
export const definition = {
  "models": {
    "EncryptedProfile": {
      "id": "kjzl6hvfrbw6c569wl6v4q0zxoz3744zwnphuaa7be6b73krl37r4u6mpnstj0i",
      "accountRelation": { "type": "single" },
      "version": "1.0"
    },
    "EncryptedDocument": {
      "id": "kjzl6hvfrbw6c7v84o8sjl5jmf59cz23l5hjscy7u53aj7endocvur2bln2z4ty",
      "accountRelation": { "type": "list" },
      "version": "1.0"
    },
    "EncryptedAsset": {
      "id": "kjzl6hvfrbw6c88oyxg1gfy82n7b8t2vey2dp3dw8hcam075qbdqnrx5zlnzmx8",
      "accountRelation": { "type": "list" },
      "version": "1.0"
    },
    "EncryptedConnection": {
      "id": "kjzl6hvfrbw6caez6f6n2r6s9qot4t4zxhd9fztarfcnz0bg069l23ehb8pqqcf",
      "accountRelation": { "type": "list" },
      "version": "1.0"
    },
    "EncryptedOrganization": {
      "id": "kjzl6hvfrbw6c7qjmqv3jwz933zzj9ub3qeuxa5f4xtu8jd8g28ttmgd51t5s3f",
      "accountRelation": { "type": "list" },
      "version": "1.0"
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
