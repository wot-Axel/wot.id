// Utility functions for managing Ethereum addresses consistently across the app

/**
 * Stores the correct address in localStorage for cross-page consistency
 * @param address The address to store
 */
export const storeCorrectAddress = (address: string): void => {
  if (typeof window === 'undefined' || !address) return;
  
  console.log(`[ADDRESS] Storing correct address: ${address}`);
  localStorage.setItem('wot_id_correct_address', address);
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
export const ensureCorrectAddress = (currentAddress: string | undefined): string | undefined => {
  if (typeof window === 'undefined' || !currentAddress) return currentAddress;
  
  const storedAddress = getStoredCorrectAddress();
  
  if (storedAddress && currentAddress && storedAddress.toLowerCase() !== currentAddress.toLowerCase()) {
    console.warn(`[ADDRESS] Address mismatch! Current: ${currentAddress}, Stored: ${storedAddress}`);
    // Return the stored address as it's the one we want to use
    return storedAddress;
  }
  
  return currentAddress;
};
