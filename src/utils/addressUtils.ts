// Utility functions for managing Ethereum addresses consistently across the app

/**
 * No longer stores the correct address in localStorage. Use context or ephemeral state if needed.
 */

/**
 * No longer retrieves the stored correct address from localStorage.
 */


/**
 * Ensures that the current address matches the stored correct address
 * @param currentAddress The current address to check
 * @returns The correct address to use (either stored or current)
 */
/**
 * Validates if a string is a valid Ethereum address
 * @param address The address to validate
 * @returns True if the address is valid, false otherwise
 */
export const isValidEthereumAddress = (address: string | undefined): boolean => {
  if (!address) return false;
  
  // Basic validation: check if it's a 42-character string starting with 0x
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * No longer clears the stored address from localStorage.
 */


/**
 * Ensures that the current address matches the stored correct address
 * For new users, it stores their first address as the correct one
 * @param currentAddress The current address to check
 * @returns The correct address to use (either stored or current)
 */
export const ensureCorrectAddress = (currentAddress: string | undefined): string | undefined => {
  if (typeof window === 'undefined' || !currentAddress) return currentAddress;
  
  // Validate the current address
  if (!isValidEthereumAddress(currentAddress)) {
    console.error(`[ADDRESS] Invalid Ethereum address: ${currentAddress}`);
    return undefined;
  }
  
  // Only validate and return the current address.
  return currentAddress;
};
