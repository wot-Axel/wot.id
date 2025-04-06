/**
 * Performance monitoring utility for the wot.id application
 * This provides simple performance tracking for data operations (Tableland, Ceramic, ComposeDB)
 */

// Define performance metric types
export type PerformanceMetric = {
  operation: string;
  component: string;
  dataSource: 'tableland' | 'ceramic' | 'composedb' | 'other';
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: string;
  dataSize?: number; // Size of data in bytes (if applicable)
};

// In-memory storage for performance metrics
const metrics: PerformanceMetric[] = [];

// Maximum number of metrics to store
const MAX_METRICS = 100;

/**
 * Start tracking a performance metric
 * @param operation The operation being performed (e.g., 'createRecord', 'getRecords')
 * @param component The component performing the operation (e.g., 'DigitalAssetsSection')
 * @param dataSource The data source being used (tableland, ceramic, composedb, other)
 * @returns A unique identifier for the metric
 */
export const startMetric = (operation: string, component: string, dataSource: 'tableland' | 'ceramic' | 'composedb' | 'other' = 'other'): number => {
  const metric: PerformanceMetric = {
    operation,
    component,
    dataSource,
    startTime: performance.now(),
    endTime: 0,
    duration: 0,
    success: false
  };
  
  metrics.push(metric);
  
  // Remove oldest metrics if we exceed the maximum
  if (metrics.length > MAX_METRICS) {
    metrics.shift();
  }
  
  return metrics.length - 1;
};

/**
 * End tracking a performance metric
 * @param id The identifier returned by startMetric
 * @param success Whether the operation was successful
 * @param error Optional error message if the operation failed
 * @param dataSize Optional size of data in bytes
 */
export const endMetric = (id: number, success: boolean, error?: string, dataSize?: number): void => {
  if (id < 0 || id >= metrics.length) {
    console.error(`Invalid metric ID: ${id}`);
    return;
  }
  
  const metric = metrics[id];
  metric.endTime = performance.now();
  metric.duration = metric.endTime - metric.startTime;
  metric.success = success;
  
  if (error) {
    metric.error = error;
  }
  
  if (dataSize !== undefined) {
    metric.dataSize = dataSize;
  }
  
  // Log the metric
  console.log(`[Performance] [${metric.dataSource}] ${metric.component}.${metric.operation}: ${metric.duration.toFixed(2)}ms (${success ? 'Success' : 'Failed'})${metric.dataSize ? ` | ${(metric.dataSize / 1024).toFixed(2)}KB` : ''}`);
  
  // If the operation took longer than 1 second, log a warning
  if (metric.duration > 1000) {
    console.warn(`[Performance Warning] [${metric.dataSource}] ${metric.component}.${metric.operation} took ${(metric.duration / 1000).toFixed(2)}s to complete`);
  }
};

/**
 * Get all performance metrics
 * @param dataSource Optional data source to filter by
 * @returns Array of performance metrics
 */
export const getMetrics = (dataSource?: 'tableland' | 'ceramic' | 'composedb' | 'other'): PerformanceMetric[] => {
  return dataSource 
    ? [...metrics].filter(m => m.dataSource === dataSource)
    : [...metrics];
};

/**
 * Get performance comparison between data sources
 * @param operation The operation to compare
 * @returns Object with average durations for each data source
 */
export const getPerformanceComparison = (operation: string): Record<string, number> => {
  return {
    tableland: getAverageDuration(operation, 'tableland'),
    ceramic: getAverageDuration(operation, 'ceramic'),
    composedb: getAverageDuration(operation, 'composedb'),
    other: getAverageDuration(operation, 'other')
  };
};

/**
 * Get average duration for a specific operation
 * @param operation The operation to get metrics for
 * @param dataSource Optional data source to filter by
 * @returns Average duration in milliseconds
 */
export const getAverageDuration = (operation: string, dataSource?: 'tableland' | 'ceramic' | 'composedb' | 'other'): number => {
  const operationMetrics = metrics.filter(m => {
    const operationMatch = m.operation === operation && m.success;
    return dataSource ? operationMatch && m.dataSource === dataSource : operationMatch;
  });
  
  if (operationMetrics.length === 0) {
    return 0;
  }
  
  const totalDuration = operationMetrics.reduce((sum, metric) => sum + metric.duration, 0);
  return totalDuration / operationMetrics.length;
};

/**
 * Clear all metrics
 */
export const clearMetrics = (): void => {
  metrics.length = 0;
};

/**
 * Performance monitoring wrapper for async functions
 * @param operation The operation being performed
 * @param component The component performing the operation
 * @param dataSource The data source being used
 * @param fn The async function to monitor
 * @returns The result of the async function
 */
export const monitorAsync = async <T>(
  operation: string,
  component: string,
  dataSource: 'tableland' | 'ceramic' | 'composedb' | 'other',
  fn: () => Promise<T>
): Promise<T> => {
  const metricId = startMetric(operation, component, dataSource);
  
  try {
    const result = await fn();
    endMetric(metricId, true);
    return result;
  } catch (error) {
    endMetric(metricId, false, error instanceof Error ? error.message : String(error));
    throw error;
  }
};
