import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

// Define types
export interface DecodedData {
  wotId: string;
  isHuman: boolean;
}

export interface AttestationData {
  id: string;
  attester: string;
  recipient: string;
  data: string; // Hex-encoded data
  timeCreated: string;
}

/**
 * Decodes attestation data based on the schema
 * @param hexData The hex-encoded data string from the attestation
 * @returns An object with the decoded values
 */
export function decodeAttestationData(hexData: string): DecodedData {
  try {
    // Initialize the schema encoder with the schema string
    const schemaEncoder = new SchemaEncoder('string wotid, bool ishuman');
    
    // Decode the data
    const decodedData = schemaEncoder.decodeData(hexData);
    
    // Extract and return the values
    const wotId = decodedData.find(item => item.name === 'wotid')?.value.toString() || '';
    const isHuman = Boolean(decodedData.find(item => item.name === 'ishuman')?.value);
    
    return {
      wotId,
      isHuman
    };
  } catch (error) {
    console.error('Error decoding attestation data:', error);
    return {
      wotId: 'Error decoding',
      isHuman: false
    };
  }
}

/**
 * Formats an Ethereum address for display
 * @param address The full Ethereum address
 * @returns Shortened address with ellipsis
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Formats a timestamp for user-friendly display
 * @param timestamp Unix timestamp in seconds
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}
