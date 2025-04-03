/**
 * Simple utility for consistent error handling across the application
 */

// Standard error messages for common scenarios
export const ERROR_MESSAGES = {
  WALLET_CONNECTION: 'Unable to connect to wallet. Please try again.',
  NETWORK_SWITCH: 'Unable to switch networks. Please try manually in your wallet.',
  DATA_LOAD: 'Unable to load data. Please refresh and try again.',
  DATA_SAVE: 'Unable to save data. Please try again.',
  GENERAL: 'Something went wrong. Please try again.'
};

/**
 * Simple error handler that logs errors and returns user-friendly messages
 * @param error The error object
 * @param fallbackMessage A user-friendly fallback message
 * @returns A user-friendly error message
 */
export const handleError = (error: unknown, fallbackMessage = ERROR_MESSAGES.GENERAL): string => {
  // Log the full error for debugging
  console.error('Error occurred:', error);
  
  // Return a user-friendly message
  if (error instanceof Error) {
    // For known error types, return the message directly
    return error.message;
  }
  
  // For unknown error types, return the fallback message
  return fallbackMessage;
};

/**
 * Simple wrapper for async operations with consistent error handling
 * @param operation The async operation to perform
 * @param setLoading Optional loading state setter
 * @param setError Optional error state setter
 * @param fallbackMessage Optional fallback error message
 * @returns The result of the operation or undefined if an error occurred
 */
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  setLoading?: (loading: boolean) => void,
  setError?: (error: string) => void,
  fallbackMessage = ERROR_MESSAGES.GENERAL
): Promise<T | undefined> => {
  try {
    // Set loading state if provided
    if (setLoading) {
      setLoading(true);
    }
    
    // Perform the operation
    const result = await operation();
    
    // Clear any previous errors
    if (setError) {
      setError('');
    }
    
    return result;
  } catch (error) {
    // Handle the error
    const message = handleError(error, fallbackMessage);
    
    // Set the error state if provided
    if (setError) {
      setError(message);
    }
    
    return undefined;
  } finally {
    // Clear loading state if provided
    if (setLoading) {
      setLoading(false);
    }
  }
};
