/**
 * Simplified pass-through function to replace performance monitoring
 * This maintains API compatibility while removing all monitoring functionality
 */
export const monitorAsync = async <T>(
  _operation: string,
  _component: string,
  fnOrDataSource: (() => Promise<T>) | string,
  fn?: () => Promise<T>
): Promise<T> => {
  const actualFn = typeof fnOrDataSource === 'function' ? fnOrDataSource : fn;
  
  if (!actualFn) {
    throw new Error('No function provided to monitorAsync');
  }
  
  return actualFn();
};
