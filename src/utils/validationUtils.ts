/**
 * Simple validation utilities for the application
 */

// Basic validation functions
export const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isNonEmptyString = (value: string | undefined | null): boolean => {
  return typeof value === 'string' && value.trim().length > 0;
};

export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// Simple validation for common data types
export const validateAssetData = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!isNonEmptyString(data.name)) {
    errors.push('Name is required');
  }
  
  if (!isNonEmptyString(data.type)) {
    errors.push('Type is required');
  }
  
  if (!isNonEmptyString(data.platform)) {
    errors.push('Platform is required');
  }
  
  if (!isNonEmptyString(data.identifier)) {
    errors.push('Identifier is required');
  }
  
  if (data.imageUrl && !isValidUrl(data.imageUrl)) {
    errors.push('Image URL is not valid');
  }
  
  if (data.acquiredDate && !isValidDate(data.acquiredDate)) {
    errors.push('Acquired date is not valid');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Simple sanitization for storing data
export const sanitizeForStorage = (data: any): any => {
  // Create a deep copy to avoid modifying the original
  const sanitized = JSON.parse(JSON.stringify(data));
  
  // Basic sanitization for common fields
  if (typeof sanitized.name === 'string') {
    sanitized.name = sanitized.name.trim();
  }
  
  if (typeof sanitized.description === 'string') {
    sanitized.description = sanitized.description.trim();
  }
  
  // Remove any undefined or null values
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined || sanitized[key] === null) {
      delete sanitized[key];
    }
  });
  
  return sanitized;
};
