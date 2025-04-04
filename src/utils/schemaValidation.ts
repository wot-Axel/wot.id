/**
 * Schema validation utility for Ceramic data
 * This provides validation for different data types to ensure data integrity
 */

import { DataType } from './ceramicUtils';

// Define validation error type
export type ValidationError = {
  field: string;
  message: string;
};

// Define schema validation result
export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
};

/**
 * Validate data against a schema for a specific data type
 * @param dataType The type of data being validated
 * @param data The data to validate
 * @returns Validation result
 */
export const validateData = (dataType: DataType, data: any): ValidationResult => {
  switch (dataType) {
    case DataType.PROFILE:
      return validateProfileData(data);
    case DataType.DOCUMENTS:
      return validateDocumentsData(data);
    case DataType.MEDICAL:
      return validateMedicalData(data);
    case DataType.DIGITAL_ASSETS:
      return validateDigitalAssetsData(data);
    case DataType.REAL_WORLD_ASSETS:
      return validateRealWorldAssetsData(data);
    case DataType.CONNECTIONS:
      return validateConnectionsData(data);
    case DataType.MESSAGES:
      return validateMessagesData(data);
    default:
      // For unknown data types, perform basic validation
      return validateGenericData(data);
  }
};

/**
 * Validate profile data
 * @param data The profile data to validate
 * @returns Validation result
 */
const validateProfileData = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];
  
  // Check if data is an object
  if (typeof data !== 'object' || data === null) {
    errors.push({
      field: 'data',
      message: 'Profile data must be an object'
    });
    return { valid: false, errors };
  }
  
  // Validate name fields if present
  if (data.firstName !== undefined && typeof data.firstName !== 'string') {
    errors.push({
      field: 'firstName',
      message: 'First name must be a string'
    });
  }
  
  if (data.middleName !== undefined && typeof data.middleName !== 'string') {
    errors.push({
      field: 'middleName',
      message: 'Middle name must be a string'
    });
  }
  
  if (data.familyName !== undefined && typeof data.familyName !== 'string') {
    errors.push({
      field: 'familyName',
      message: 'Family name must be a string'
    });
  }
  
  // Validate date of birth if present
  if (data.dateOfBirth !== undefined) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (typeof data.dateOfBirth !== 'string' || !dateRegex.test(data.dateOfBirth)) {
      errors.push({
        field: 'dateOfBirth',
        message: 'Date of birth must be in YYYY-MM-DD format'
      });
    }
  }
  
  return { valid: errors.length === 0, errors };
};

/**
 * Validate documents data
 * @param data The documents data to validate
 * @returns Validation result
 */
const validateDocumentsData = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];
  
  // Check if data is an object
  if (typeof data !== 'object' || data === null) {
    errors.push({
      field: 'data',
      message: 'Documents data must be an object'
    });
    return { valid: false, errors };
  }
  
  // Validate document fields if present
  const documentFields = [
    'birthCertificate',
    'passport',
    'nationalId',
    'driversLicence',
    'healthInsurance'
  ];
  
  documentFields.forEach(field => {
    if (data[field] !== undefined && typeof data[field] !== 'string') {
      errors.push({
        field,
        message: `${field} must be a string`
      });
    }
  });
  
  return { valid: errors.length === 0, errors };
};

/**
 * Validate medical data
 * @param data The medical data to validate
 * @returns Validation result
 */
const validateMedicalData = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];
  
  // Check if data is an object
  if (typeof data !== 'object' || data === null) {
    errors.push({
      field: 'data',
      message: 'Medical data must be an object'
    });
    return { valid: false, errors };
  }
  
  // Validate medical data fields
  if (data.key === undefined || typeof data.key !== 'string') {
    errors.push({
      field: 'key',
      message: 'Medical data key must be a string'
    });
  }
  
  if (data.unit !== undefined && typeof data.unit !== 'string') {
    errors.push({
      field: 'unit',
      message: 'Unit must be a string'
    });
  }
  
  if (data.referenceRange !== undefined && typeof data.referenceRange !== 'string') {
    errors.push({
      field: 'referenceRange',
      message: 'Reference range must be a string'
    });
  }
  
  if (data.value === undefined || typeof data.value !== 'string') {
    errors.push({
      field: 'value',
      message: 'Value must be a string'
    });
  }
  
  return { valid: errors.length === 0, errors };
};

/**
 * Validate digital assets data
 * @param data The digital assets data to validate
 * @returns Validation result
 */
const validateDigitalAssetsData = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];
  
  // Check if data is an object
  if (typeof data !== 'object' || data === null) {
    errors.push({
      field: 'data',
      message: 'Digital assets data must be an object'
    });
    return { valid: false, errors };
  }
  
  // Validate required fields
  if (data.name === undefined || typeof data.name !== 'string') {
    errors.push({
      field: 'name',
      message: 'Name is required and must be a string'
    });
  }
  
  if (data.type === undefined || !['nft', 'gaming', 'other'].includes(data.type)) {
    errors.push({
      field: 'type',
      message: 'Type is required and must be one of: nft, gaming, other'
    });
  }
  
  if (data.platform === undefined || typeof data.platform !== 'string') {
    errors.push({
      field: 'platform',
      message: 'Platform is required and must be a string'
    });
  }
  
  if (data.identifier === undefined || typeof data.identifier !== 'string') {
    errors.push({
      field: 'identifier',
      message: 'Identifier is required and must be a string'
    });
  }
  
  if (data.chainId === undefined || typeof data.chainId !== 'string') {
    errors.push({
      field: 'chainId',
      message: 'Chain ID is required and must be a string'
    });
  }
  
  if (data.chainName === undefined || typeof data.chainName !== 'string') {
    errors.push({
      field: 'chainName',
      message: 'Chain name is required and must be a string'
    });
  }
  
  // Validate optional fields if present
  if (data.contractAddress !== undefined && typeof data.contractAddress !== 'string') {
    errors.push({
      field: 'contractAddress',
      message: 'Contract address must be a string'
    });
  }
  
  if (data.tokenId !== undefined && typeof data.tokenId !== 'string') {
    errors.push({
      field: 'tokenId',
      message: 'Token ID must be a string'
    });
  }
  
  if (data.imageUrl !== undefined && typeof data.imageUrl !== 'string') {
    errors.push({
      field: 'imageUrl',
      message: 'Image URL must be a string'
    });
  }
  
  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push({
      field: 'description',
      message: 'Description must be a string'
    });
  }
  
  if (data.attributes !== undefined && (typeof data.attributes !== 'object' || data.attributes === null)) {
    errors.push({
      field: 'attributes',
      message: 'Attributes must be an object'
    });
  }
  
  return { valid: errors.length === 0, errors };
};

/**
 * Validate real world assets data
 * @param data The real world assets data to validate
 * @returns Validation result
 */
const validateRealWorldAssetsData = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];
  
  // Check if data is an object
  if (typeof data !== 'object' || data === null) {
    errors.push({
      field: 'data',
      message: 'Real world assets data must be an object'
    });
    return { valid: false, errors };
  }
  
  // Validate required fields
  if (data.name === undefined || typeof data.name !== 'string') {
    errors.push({
      field: 'name',
      message: 'Name is required and must be a string'
    });
  }
  
  if (data.type === undefined || typeof data.type !== 'string') {
    errors.push({
      field: 'type',
      message: 'Type is required and must be a string'
    });
  }
  
  if (data.value !== undefined && typeof data.value !== 'string') {
    errors.push({
      field: 'value',
      message: 'Value must be a string'
    });
  }
  
  if (data.location !== undefined && typeof data.location !== 'string') {
    errors.push({
      field: 'location',
      message: 'Location must be a string'
    });
  }
  
  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push({
      field: 'description',
      message: 'Description must be a string'
    });
  }
  
  return { valid: errors.length === 0, errors };
};

/**
 * Validate connections data
 * @param data The connections data to validate
 * @returns Validation result
 */
const validateConnectionsData = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];
  
  // Check if data is an object
  if (typeof data !== 'object' || data === null) {
    errors.push({
      field: 'data',
      message: 'Connections data must be an object'
    });
    return { valid: false, errors };
  }
  
  // Validate required fields
  if (data.name === undefined || typeof data.name !== 'string') {
    errors.push({
      field: 'name',
      message: 'Name is required and must be a string'
    });
  }
  
  if (data.relationship === undefined || typeof data.relationship !== 'string') {
    errors.push({
      field: 'relationship',
      message: 'Relationship is required and must be a string'
    });
  }
  
  // Validate optional fields if present
  if (data.email !== undefined && typeof data.email !== 'string') {
    errors.push({
      field: 'email',
      message: 'Email must be a string'
    });
  }
  
  if (data.phone !== undefined && typeof data.phone !== 'string') {
    errors.push({
      field: 'phone',
      message: 'Phone must be a string'
    });
  }
  
  if (data.address !== undefined && typeof data.address !== 'string') {
    errors.push({
      field: 'address',
      message: 'Address must be a string'
    });
  }
  
  if (data.notes !== undefined && typeof data.notes !== 'string') {
    errors.push({
      field: 'notes',
      message: 'Notes must be a string'
    });
  }
  
  return { valid: errors.length === 0, errors };
};

/**
 * Validate messages data
 * @param data The messages data to validate
 * @returns Validation result
 */
const validateMessagesData = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];
  
  // Check if data is an object
  if (typeof data !== 'object' || data === null) {
    errors.push({
      field: 'data',
      message: 'Messages data must be an object'
    });
    return { valid: false, errors };
  }
  
  // Validate required fields
  if (data.sender === undefined || typeof data.sender !== 'string') {
    errors.push({
      field: 'sender',
      message: 'Sender is required and must be a string'
    });
  }
  
  if (data.recipient === undefined || typeof data.recipient !== 'string') {
    errors.push({
      field: 'recipient',
      message: 'Recipient is required and must be a string'
    });
  }
  
  if (data.content === undefined || typeof data.content !== 'string') {
    errors.push({
      field: 'content',
      message: 'Content is required and must be a string'
    });
  }
  
  if (data.timestamp === undefined || typeof data.timestamp !== 'string') {
    errors.push({
      field: 'timestamp',
      message: 'Timestamp is required and must be a string'
    });
  }
  
  return { valid: errors.length === 0, errors };
};

/**
 * Validate generic data
 * @param data The data to validate
 * @returns Validation result
 */
const validateGenericData = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];
  
  // Check if data is an object
  if (typeof data !== 'object' || data === null) {
    errors.push({
      field: 'data',
      message: 'Data must be an object'
    });
    return { valid: false, errors };
  }
  
  // Ensure all values are of supported types
  Object.entries(data).forEach(([key, value]) => {
    const valueType = typeof value;
    if (!['string', 'number', 'boolean', 'object'].includes(valueType) || value === null) {
      errors.push({
        field: key,
        message: `Field ${key} has unsupported type: ${valueType}`
      });
    }
    
    // If value is an object, ensure it's not too deeply nested
    if (valueType === 'object' && value !== null) {
      const jsonString = JSON.stringify(value);
      if (jsonString.length > 10000) {
        errors.push({
          field: key,
          message: `Field ${key} is too large (${jsonString.length} characters)`
        });
      }
    }
  });
  
  return { valid: errors.length === 0, errors };
};
