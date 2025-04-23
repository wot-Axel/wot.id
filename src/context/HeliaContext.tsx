import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createHelia, Helia } from 'helia';
import { unixfs } from '@helia/unixfs';

interface HeliaContextType {
  isReady: boolean;
  addFile: (content: Uint8Array | string) => Promise<string | null>;
  getFile: (cid: string) => Promise<Uint8Array | null>;
}

const HeliaContext = createContext<HeliaContextType | undefined>(undefined);

export const HeliaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [helia, setHelia] = useState<Helia | null>(null);
  const [fs, setFs] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function setup() {
      try {
        const node = await createHelia();
        const fsApi = unixfs(node);
        if (!cancelled) {
          setHelia(node);
          setFs(fsApi);
          setIsReady(true);
        }
      } catch (err) {
        console.error('Helia setup error:', err);
      }
    }
    setup();
    return () => { cancelled = true; };
  }, []);

  const addFile = useCallback(async (content: Uint8Array | string) => {
    if (!fs) return null;
    let fileContent = content;
    if (typeof content === 'string') {
      fileContent = new TextEncoder().encode(content);
    }
    const cid = await fs.addBytes(fileContent);
    return cid.toString();
  }, [fs]);

  const getFile = useCallback(async (cid: string) => {
    if (!fs) return null;
    try {
      const bytes = [];
      for await (const chunk of fs.cat(cid)) {
        bytes.push(...chunk);
      }
      return new Uint8Array(bytes);
    } catch (err) {
      console.error('Helia getFile error:', err);
      return null;
    }
  }, [fs]);

  return (
    <HeliaContext.Provider value={{ isReady, addFile, getFile }}>
      {children}
    </HeliaContext.Provider>
  );
};

export function useHelia() {
  const ctx = useContext(HeliaContext);
  if (!ctx) throw new Error('useHelia must be used within HeliaProvider');
  return ctx;
}
