'use client';

import React from 'react';
import Link from 'next/link';

const DebugPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Tools</h1>
      
      <div className="p-4 border rounded mb-4">
        <h2 className="text-xl font-bold mb-2">Debug Pages</h2>
        <p className="mb-4">Access specialized debug tools.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Link href="/debug/storage" className="block p-2 bg-gray-100 hover:bg-gray-200 rounded">
            Storage Debug
          </Link>
          <Link href="/debug/address" className="block p-2 bg-gray-100 hover:bg-gray-200 rounded">
            Address Tools
          </Link>
          <Link href="/debug/logs" className="block p-2 bg-gray-100 hover:bg-gray-200 rounded">
            Server Logs
          </Link>
          <Link href="/debug/console" className="block p-2 bg-gray-100 hover:bg-gray-200 rounded">
            Debug Console
          </Link>
        </div>
      </div>
      
      <div className="p-4 border rounded">
        <h2 className="text-xl font-bold mb-2">System Information</h2>
        <p>Browser environment: {typeof window !== 'undefined' ? navigator.userAgent : 'Server-side rendering'}</p>
        <p>Time: {new Date().toISOString()}</p>
      </div>
    </div>
  );
};

export default DebugPage;
