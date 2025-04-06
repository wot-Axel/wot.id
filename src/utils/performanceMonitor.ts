/**
 * EMPTY PERFORMANCE MONITOR
 * 
 * This file is intentionally minimal to eliminate all performance monitoring
 * functionality while maintaining API compatibility with existing imports.
 */

// Simple pass-through function that just executes the provided function
export const monitorAsync = async <T>(
  _operation: string,
  _component: string,
  fnOrDataSource: any,
  fn?: () => Promise<T>
): Promise<T> => {
  try {
    // Handle both 3-param and 4-param versions
    const actualFn = typeof fnOrDataSource === 'function' ? fnOrDataSource : fn;
    return actualFn ? await actualFn() : Promise.resolve({} as T);
  } catch (error) {
    // Re-throw any errors
    throw error;
  }
};

// Empty exports to maintain API compatibility
export type PerformanceMetric = any;
export const startMetric = () => 0;
export const endMetric = () => {};
export const getMetrics = () => [];
export const getPerformanceComparison = () => ({});
export const getAverageDuration = () => 0;
export const clearMetrics = () => {};
