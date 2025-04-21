// Log capture utility for production debugging
// This utility captures logs and provides an API endpoint to retrieve them

// Store logs in memory (will be cleared on server restart)
const capturedLogs: {
  timestamp: string;
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  data?: any;
}[] = [];

// Maximum number of logs to keep
const MAX_LOGS = 1000;

// Add a log entry
export const captureLog = (type: 'log' | 'error' | 'warn' | 'info', message: string, data?: any) => {
  // Add timestamp and store log
  capturedLogs.unshift({
    timestamp: new Date().toISOString(),
    type,
    message,
    data: data ? JSON.stringify(data, getCircularReplacer()) : undefined
  });
  
  // Keep only the most recent logs
  if (capturedLogs.length > MAX_LOGS) {
    capturedLogs.pop();
  }
};

// Helper to handle circular references in JSON.stringify
const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }
    return value;
  };
};

// Get all captured logs
export const getLogs = () => {
  return capturedLogs;
};

// Clear all logs
export const clearLogs = () => {
  capturedLogs.length = 0;
  return { success: true, message: 'Logs cleared' };
};

// Filter logs by type
export const getLogsByType = (type: 'log' | 'error' | 'warn' | 'info') => {
  return capturedLogs.filter(log => log.type === type);
};

// Filter logs by message content
export const getLogsByContent = (searchText: string) => {
  return capturedLogs.filter(log => 
    log.message.toLowerCase().includes(searchText.toLowerCase()) ||
    (log.data && log.data.toLowerCase().includes(searchText.toLowerCase()))
  );
};



// Override console methods to capture logs
export const setupLogCapture = () => {
  if (typeof window !== 'undefined') {
    // Store original console methods
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };

    // Override console.log
    console.log = function(...args: any[]) {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, getCircularReplacer()) : String(arg)
      ).join(' ');
      captureLog('log', message);
      originalConsole.log.apply(console, args);
    };

    // Override console.error
    console.error = function(...args: any[]) {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, getCircularReplacer()) : String(arg)
      ).join(' ');
      captureLog('error', message);
      originalConsole.error.apply(console, args);
    };

    // Override console.warn
    console.warn = function(...args: any[]) {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, getCircularReplacer()) : String(arg)
      ).join(' ');
      captureLog('warn', message);
      originalConsole.warn.apply(console, args);
    };

    // Override console.info
    console.info = function(...args: any[]) {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, getCircularReplacer()) : String(arg)
      ).join(' ');
      captureLog('info', message);
      originalConsole.info.apply(console, args);
    };

    // Add to window for direct access
    (window as any).getLogs = getLogs;

    (window as any).clearLogs = clearLogs;
  }
};
