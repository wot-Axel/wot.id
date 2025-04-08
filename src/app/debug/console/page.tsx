'use client';

import React, { useEffect, useState } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { useAppKitAccount } from '@reown/appkit-controllers/react';

export default function ConsoleDebugPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const { address, isConnected } = useAppKitAccount();
  const kit = useAppKit();
  
  useEffect(() => {
    const originalConsoleError = console.error;
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    
    const captureLog = (type: string, args: any[]) => {
      setLogs(prev => [...prev, { type, message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' '), timestamp: new Date().toISOString() }]);
    };
    
    console.error = (...args: any[]) => {
      originalConsoleError.apply(console, args);
      captureLog('error', args);
    };
    
    console.log = (...args: any[]) => {
      originalConsoleLog.apply(console, args);
      captureLog('log', args);
    };
    
    console.warn = (...args: any[]) => {
      originalConsoleWarn.apply(console, args);
      captureLog('warn', args);
    };
    
    // Try to import AppKit hooks to see if there are any errors
    try {
      const testImport = async () => {
        try {
          const { useAppKit, useDisconnect } = await import('@reown/appkit/react');
          const { useAppKitAccount } = await import('@reown/appkit-controllers/react');
          console.log('AppKit hooks imported successfully');
        } catch (error) {
          console.error('Error importing AppKit hooks:', error);
        }
      };
      
      testImport();
    } catch (error) {
      console.error('Error in import test:', error);
    }
    
    return () => {
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
    };
  }, []);
  
  return (
    <div className="console-debug-container">
      <div className="connection-status">
        <h2>Connection Status</h2>
        <p><strong>Connected:</strong> {isConnected ? 'Yes' : 'No'}</p>
        {address && <p><strong>Address:</strong> {address}</p>}
        <p><strong>AppKit Available:</strong> {kit ? 'Yes' : 'No'}</p>
      </div>
      <style jsx>{`
        .console-debug-container {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .log-entry {
          margin-bottom: 10px;
          padding: 10px;
          border-radius: 4px;
        }
        
        .log-entry.error {
          background-color: #ffebee;
          border-left: 4px solid #f44336;
        }
        
        .log-entry.warn {
          background-color: #fff8e1;
          border-left: 4px solid #ffc107;
        }
        
        .log-entry.log {
          background-color: #e8f5e9;
          border-left: 4px solid #4caf50;
        }
        
        .timestamp {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }
      `}</style>
      
      <h1>Console Debug</h1>
      <p>This page captures console output to help diagnose issues.</p>
      
      <div>
        <h2>Console Output</h2>
        {logs.length === 0 ? (
          <p>No logs captured yet...</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`log-entry ${log.type}`}>
              <div className="timestamp">{log.timestamp}</div>
              <div>{log.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
