// Utility functions for managing Ethereum addresses consistently across the app

/**
 * Stores the correct address in localStorage for cross-page consistency
 * This will only store the address if no address has been stored before,
 * ensuring we always use the first-ever address a user connects with
 * @param address The address to store
 */
export const storeCorrectAddress = (address: string): void => {
  if (typeof window === 'undefined' || !address) return;
  
  // Only store if we don't already have a stored address
  // This ensures we always use the first-ever address a user connects with
  const existingAddress = localStorage.getItem('wot_id_correct_address');
  if (!existingAddress) {
    console.log(`[ADDRESS] Storing first-ever correct address: ${address}`);
    localStorage.setItem('wot_id_correct_address', address);
  } else {
    console.log(`[ADDRESS] Not overwriting existing stored address: ${existingAddress} with new address: ${address}`);
  }
};

/**
 * Retrieves the stored correct address from localStorage
 * @returns The stored address or null if not found
 */
export const getStoredCorrectAddress = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const address = localStorage.getItem('wot_id_correct_address');
  if (address) {
    console.log(`[ADDRESS] Retrieved stored correct address: ${address}`);
  }
  return address;
};

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
 * Clears the stored address from localStorage
 * This should only be used in exceptional cases or for testing
 */
export const clearStoredAddress = (): void => {
  if (typeof window === 'undefined') return;
  
  console.log('[ADDRESS] Clearing stored address');
  localStorage.removeItem('wot_id_correct_address');
};

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
  
  const storedAddress = getStoredCorrectAddress();
  
  // If this is a first-time user (no stored address), store their address
  if (!storedAddress && currentAddress) {
    console.log(`[ADDRESS] First-time user detected. Storing initial address: ${currentAddress}`);
    storeCorrectAddress(currentAddress);
    return currentAddress;
  }
  
  // If we have both addresses and they don't match, use the stored one
  if (storedAddress && currentAddress && storedAddress.toLowerCase() !== currentAddress.toLowerCase()) {
    console.warn(`[ADDRESS] Address mismatch! Current: ${currentAddress}, Stored: ${storedAddress}`);
    // Return the stored address as it's the one we want to use
    return storedAddress;
  }
  
  return currentAddress;
};
