/**
 * Performance monitoring utility for tracking operation times
 * This provides functions to measure and log performance metrics
 */

// Store performance logs
const performanceLogs = [];

// Maximum number of logs to keep
const MAX_LOGS = 100;

/**
 * Log a performance metric
 * @param operation The operation being performed
 * @param component The component performing the operation
 * @param duration The duration of the operation in milliseconds
 * @param metadata Additional metadata about the operation
 */
export const logPerformance = (operation, component, duration, metadata = {}) => {
  const timestamp = new Date().toISOString();
  const log = {
    timestamp,
    operation,
    component,
    duration,
    metadata
  };
  
  // Add to logs
  performanceLogs.unshift(log);
  
  // Trim logs if needed
  if (performanceLogs.length > MAX_LOGS) {
    performanceLogs.pop();
  }
  
  // Log to console
  console.log(`[Performance] ${component}.${operation}: ${duration.toFixed(2)}ms`, metadata);
  
  return log;
};

/**
 * Get all performance logs
 * @returns Array of performance logs
 */
export const getPerformanceLogs = () => {
  return [...performanceLogs];
};

/**
 * Clear all performance logs
 */
export const clearPerformanceLogs = () => {
  performanceLogs.length = 0;
};

/**
 * Get performance statistics
 * @returns Performance statistics
 */
export const getPerformanceStats = () => {
  const stats = {};
  
  // Group by operation and component
  performanceLogs.forEach(log => {
    const key = `${log.component}.${log.operation}`;
    if (!stats[key]) {
      stats[key] = {
        operation: log.operation,
        component: log.component,
        count: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        avgDuration: 0
      };
    }
    
    stats[key].count++;
    stats[key].totalDuration += log.duration;
    stats[key].minDuration = Math.min(stats[key].minDuration, log.duration);
    stats[key].maxDuration = Math.max(stats[key].maxDuration, log.duration);
    stats[key].avgDuration = stats[key].totalDuration / stats[key].count;
  });
  
  return Object.values(stats);
};

/**
 * Monitor an async function and log its performance
 * @param operation The operation being performed
 * @param component The component performing the operation
 * @param fn The async function to monitor
 * @returns The result of the async function
 */
export const monitorAsync = async (operation, component, fn) => {
  const startTime = performance.now();
  try {
    const result = await fn();
    const endTime = performance.now();
    logPerformance(operation, component, endTime - startTime);
    return result;
  } catch (error) {
    const endTime = performance.now();
    logPerformance(operation, component, endTime - startTime, { error: error.message });
    throw error;
  }
};
