import { keccak256, toUtf8Bytes, getAddress } from 'ethers';

/**
 * Normalize a credential for deterministic mapping
 * @param type Credential type (e.g., 'password', 'google')
 * @param value Credential value (e.g., email)
 * @returns Normalized credential string
 */
export function normalizeCredential(type: string, value: string): string {
  return `${type}:${value.trim().toLowerCase()}`;
}

/**
 * Hash the normalized credential using keccak256
 * @param normalized Normalized credential string
 * @returns 0x-prefixed keccak256 hash
 */
export function hashCredential(normalized: string): string {
  try {
    return keccak256(toUtf8Bytes(normalized));
  } catch (err) {
    console.error('Error hashing credential:', err);
    return '';
  }
}

/**
 * Derive a deterministic Ethereum address from a keccak256 hash (last 20 bytes)
 * @param hash 0x-prefixed keccak256 hash
 * @returns Ethereum address (EIP-55 checksummed)
 */
export function deriveEthereumAddress(hash: string): string {
  try {
    if (!hash || hash.length !== 66) return '';
    const addressHex = '0x' + hash.slice(-40);
    return getAddress(addressHex);
  } catch (err) {
    console.error('Error deriving Ethereum address:', err);
    return '';
  }
}
