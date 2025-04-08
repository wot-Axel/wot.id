'use client';

import { useEffect } from 'react';
import { setupLogCapture } from '@/utils/logCapture';

export function LogCaptureInitializer() {
  useEffect(() => {
    // Initialize log capture on client side
    setupLogCapture();
    console.log('[LOG SYSTEM] Log capture system initialized');
  }, []);

  // This component doesn't render anything
  return null;
}
