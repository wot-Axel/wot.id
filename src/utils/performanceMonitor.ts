/**
 * Performance monitoring utility stub for compatibility
 */

// Define performance metric types for compatibility
export type PerformanceMetric = {
  operation: string;
  component: string;
  dataSource: 'tableland' | 'ceramic' | 'composedb' | 'other';
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: string;
  dataSize?: number;
};

// Stub functions that do nothing but maintain API compatibility
export const startMetric = (): number => 0;
export const endMetric = (): void => {};
export const getMetrics = (): PerformanceMetric[] => [];
export const getPerformanceComparison = (): Record<string, number> => ({ tableland: 0, ceramic: 0, composedb: 0, other: 0 });
export const getAverageDuration = (): number => 0;
export const clearMetrics = (): void => {};

/**
 * Performance monitoring wrapper for async functions - now just passes through the function
 * Handles all the different call patterns used throughout the codebase
 */
export const monitorAsync = async <T>(
  _operation: string,
  _component: string,
  fnOrDataSource: (() => Promise<T>) | 'tableland' | 'ceramic' | 'composedb' | 'other',
  fn?: () => Promise<T>
): Promise<T> => {
  // Handle both 3-param and 4-param versions for backward compatibility
  const actualFn = typeof fnOrDataSource === 'function' ? fnOrDataSource : fn;
  
  if (!actualFn) {
    throw new Error('No function provided to monitorAsync');
  }
  
  try {
    return await actualFn();
  } catch (error) {
    throw error;
  }
};
