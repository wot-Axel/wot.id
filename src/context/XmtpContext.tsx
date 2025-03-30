'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, Suspense } from 'react';
// Import Client type only for type checking, not the actual implementation
import type { Client } from '@xmtp/xmtp-js';
import { useAccount, useWalletClient } from 'wagmi';
import { useAppKitAccount } from '@reown/appkit/react';
import { Database } from '@tableland/sdk';
import { checkChatTableExists, createChatTable, insertChatData, getChatData } from '@/utils/tablelandUtils';

// Use dynamic import to prevent server-side rendering of XMTP client
// which uses WebAssembly and can cause issues on the server
let XmtpClientModule: any = null;

// Dynamic import function that will be called only on the client side
const getXmtpClient = async () => {
  if (!XmtpClientModule) {
    XmtpClientModule = await import('@xmtp/xmtp-js');
  }
  return XmtpClientModule;
};

// Create a global utility to add a mock Ethereum provider to the window object
// This is needed because XMTP internally checks for window.ethereum even when using a custom signer
const setupMockEthereumProvider = (walletClient: any, address: string) => {
  // Only run in browser
  if (typeof window === 'undefined') return;
  
  console.log('Setting up mock ethereum provider with address:', address);
  
  // Create a mock ethereum provider that mimics the minimum interface needed by XMTP
  const mockProvider = {
    isMetaMask: true,
    request: async ({ method, params }: any) => {
      console.log('Mock ethereum provider request:', method, params);
      
      // Implement the necessary JSON-RPC methods that XMTP might call
      if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
        return [address];
      }
      
      if (method === 'eth_chainId') {
        // Return the current chain ID from walletClient
        return walletClient?.chain?.id ? `0x${walletClient.chain.id.toString(16)}` : '0x1';
      }
      
      if (method === 'personal_sign' || method === 'eth_sign') {
        try {
          const message = params[0];
          console.log('Signing message in mock provider:', method);
          console.log('Message (first 50 chars):', typeof message === 'string' ? message.substring(0, 50) : '(binary data)');
          
          const signature = await walletClient.signMessage({ message });
          console.log('Raw signature received from wallet:', signature.substring(0, 10) + '...');
          
          // XMTP expects a hex string with a specific format
          // The signature from walletClient might already be properly formatted, but let's ensure it
          // is a properly formatted hex string with the '0x' prefix
          const formattedSignature = signature.startsWith('0x') ? signature : `0x${signature}`;
          console.log('Formatted signature:', formattedSignature.substring(0, 10) + '...');
          
          return formattedSignature;
        } catch (error) {
          console.error('Error in mock provider while signing:', error);
          throw error;
        }
      }
      
      // Add other methods as needed
      throw new Error(`Method ${method} not implemented in mock provider`);
    },
    on: (event: string, callback: any) => {
      console.log('Mock ethereum provider registered event:', event);
      // We could implement event handling here if needed
      return mockProvider;
    },
    removeListener: (event: string, callback: any) => {
      console.log('Mock ethereum provider removed listener for event:', event);
      return mockProvider;
    }
  };
  
  // Assign the mock provider to window.ethereum if it doesn't exist
  if (!window.ethereum) {
    console.log('Installing mock ethereum provider to window.ethereum');
    // @ts-ignore - TypeScript doesn't know about window.ethereum
    window.ethereum = mockProvider;
  }
  
  return mockProvider;
};

// Add global type definition for window.ethereum
declare global {
  interface Window {
    ethereum?: Record<string, unknown>;
  }
}

interface XmtpContextType {
  client: Client | null;
  isLoading: boolean;
  error: Error | null;
  conversations: any[];
  loadingConversations: boolean;
  initClient: () => Promise<void>;
  createIdentity: (useDevelopmentKey?: boolean) => Promise<boolean>;
  disconnect: () => void;
  sendMessage: (peerAddress: string, content: string) => Promise<void>;
  createNewConversation: (peerAddress: string) => Promise<void>;
}

const XmtpContext = createContext<XmtpContextType | undefined>(undefined);

export const useXmtp = () => {
  const context = useContext(XmtpContext);
  if (context === undefined) {
    throw new Error('useXmtp must be used within an XmtpProvider');
  }
  return context;
};

export const XmtpProvider = ({ children }: { children: ReactNode }) => {
  const { address } = useAccount();
  const { isConnected } = useAppKitAccount();
  const { data: walletClient } = useWalletClient();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConversations, setLoadingConversations] = useState<boolean>(false);
  const [db, setDb] = useState<Database | null>(null);
  const [tableName, setTableName] = useState<string>('');

  // Initialize Tableland database and setup mock ethereum provider
  useEffect(() => {
    const initDb = async () => {
      try {
        // In a real implementation, we would connect to Tableland here
        // For now, we'll use a mock database
        setDb({} as Database);
      } catch (error) {
        console.error('Error initializing Tableland:', error);
      }
    };

    // Setup mock ethereum provider when wallet is connected
    if (isConnected && address && walletClient) {
      // Initialize the mock ethereum provider
      setupMockEthereumProvider(walletClient, address);
      initDb();
    }
  }, [isConnected, address, walletClient]);

  // Check if chat table exists or create one
  useEffect(() => {
    const setupChatTable = async () => {
      if (!db || !address) return;

      try {
        // Check if table exists
        const existingTable = await checkChatTableExists(db, address);
        
        if (existingTable) {
          setTableName(existingTable);
        } else {
          // Create new table
          const newTableName = await createChatTable(db, address);
          setTableName(newTableName);
        }
      } catch (error) {
        console.error('Error setting up chat table:', error);
      }
    };

    if (db && address) {
      setupChatTable();
    }
  }, [db, address]);

  // Create XMTP identity with more detailed logging and error handling
  // Added option to use a development key for testing
  const createIdentity = async (useDevelopmentKey: boolean = false): Promise<boolean> => {
    console.log('------- CREATE IDENTITY DEBUGGING -------');
    console.log('Checking wallet connection status...');
    console.log('AppKit isConnected:', isConnected);
    console.log('Address available:', !!address);
    console.log('Wallet client available:', !!walletClient);
    
    if (!isConnected) {
      console.error('AppKit reports wallet is not connected');
      setError(new Error('Browser wallet not detected. Please make sure your wallet is connected.'));
      return false;
    }
    
    if (!address) {
      console.error('No wallet address available');
      setError(new Error('Wallet connected but address not available. Please refresh and try again.'));
      return false;
    }
    
    if (!walletClient) {
      console.error('No wallet client available from wagmi');
      setError(new Error('Wallet connected but signing capabilities not available. Please refresh and try again.'));
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting message identity creation process...');
      console.log('Wallet address:', address);
      console.log('Using development key?', useDevelopmentKey);
      
      try {
        // Dynamically import the XMTP Client
        const xmtpModule = await getXmtpClient();
        
        let xmtp;
        
        if (useDevelopmentKey) {
          // Use development keys for testing - this bypasses the need for wallet signatures
          console.log('Using development key instead of wallet signature...');
          
          // Generate random bytes for a development private key (don't use this in production!)
          const getRandomBytesHex = (n: number) => {
            return Array.from({ length: n }, () => 
              Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
            ).join('');
          };
          
          // Create a 32-byte private key
          const privateKeyHex = `0x${getRandomBytesHex(32)}`;
          console.log('Generated development private key (first 6 chars):', privateKeyHex.substring(0, 8) + '...');
          
          // Create a client with this key
          xmtp = await xmtpModule.Client.createFromKeys(privateKeyHex, {
            env: 'dev',
            codecs: [xmtpModule.ContentTypeText]
          });
          console.log('Created XMTP client with development key');
        } else {
          // Standard flow with wallet signature
          // Ensure we have a mock ethereum provider setup
          setupMockEthereumProvider(walletClient, address);
          
          // Debug walletClient capabilities
          console.log('WalletClient details:');
          console.log('- account:', walletClient.account);
          console.log('- chain:', walletClient.chain);
          console.log('- transport type:', walletClient.transport.type);
          
          console.log('Creating custom signer from walletClient...');
          
          // Create a proper XMTP-compatible signer from wagmi's walletClient
          const signer = {
            getAddress: async () => {
              console.log('Signer.getAddress called, returning:', address);
              return address as string;
            },
            signMessage: async (message: Uint8Array | string) => {
              console.log('Signer.signMessage called');
              console.log('Message type:', typeof message);
              
              try {
                const messageString = typeof message === 'string' ? message : new TextDecoder().decode(message);
                console.log('Message to sign (first 50 chars):', messageString.substring(0, 50) + '...');
                
                console.log('Requesting signature from wallet...');
                const signature = await walletClient.signMessage({ message: messageString });
                console.log('Signature received:', signature.substring(0, 10) + '...');
                
                // Ensure the signature is properly formatted for XMTP
                const formattedSignature = signature.startsWith('0x') ? signature : `0x${signature}`;
                console.log('Formatted signature for XMTP:', formattedSignature.substring(0, 10) + '...');
                
                return formattedSignature;
              } catch (signError: any) {
                console.error('Error during signMessage:', signError);
                throw new Error(`Signing failed: ${signError.message}`);
              }
            }
          };
          
          console.log('Creating XMTP client with custom signer...');
          // Create the client using our custom signer
          console.log('Creating client with options: env=dev and explicit codec configuration');
          xmtp = await xmtpModule.Client.create(signer, { 
            env: 'dev',  // Use development environment for simpler testing
            codecs: [xmtpModule.ContentTypeText] // Explicitly include text codec for better message handling
          });
        }
        
        console.log('Message client created successfully!');
        setClient(xmtp);
        setError(null);
        
        // Load conversations
        console.log('Loading conversations...');
        await loadConversations(xmtp);
        
        return true;
      } catch (e: any) {
        console.error('Error creating XMTP client:', e);
        
        if (e.message?.includes('declined') || e.message?.includes('rejected')) {
          setError(new Error('You declined the signature request. Please try again and approve the signature.'));
        } else if (e.message?.includes('timeout')) {
          setError(new Error('The signature request timed out. Please try again.'));
        } else if (e.message?.includes('not a function')) {
          setError(new Error('Your wallet appears to be incompatible with this messaging system. Please try a different wallet.'));
        } else if (e.message?.includes('ethereum provider')) {
          setError(new Error('XMTP requires an ethereum provider. We have created a mock provider, please try again.'));
        } else {
          setError(new Error(`Failed to create message identity: ${e.message || 'Unknown error'}`));
        }
        return false;
      }
    } catch (e: any) {
      console.error('Unexpected error in identity creation:', e);
      setError(new Error(`Error creating message identity: ${e.message || 'Unknown error'}`));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize XMTP client with improved debugging and error handling
  const initClient = async () => {
    console.log('------- INIT CLIENT DEBUGGING -------');
    console.log('Checking wallet connection status...');
    console.log('AppKit isConnected:', isConnected);
    console.log('Address available:', !!address);
    console.log('Wallet client available:', !!walletClient);
    
    if (!isConnected) {
      console.error('AppKit reports wallet is not connected');
      setError(new Error('Browser wallet not detected. Please make sure your wallet is connected.'));
      return;
    }
    
    if (!address) {
      console.error('No wallet address available');
      setError(new Error('Wallet connected but address not available. Please refresh and try again.'));
      return;
    }
    
    if (!walletClient) {
      console.error('No wallet client available from wagmi');
      setError(new Error('Wallet connected but signing capabilities not available. Please refresh and try again.'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('Initializing message client...');

      // Check if we already have a client before creating a new one
      if (client) {
        console.log('Client already exists, using existing client');
        setIsLoading(false);
        return;
      }
      
      // Ensure we have a mock ethereum provider setup
      console.log('Ensuring mock ethereum provider is setup...');
      setupMockEthereumProvider(walletClient, address);
      
      // Create our custom signer for all XMTP interactions
      console.log('Creating custom signer for XMTP...');
      const signer = {
        getAddress: async () => {
          console.log('Signer.getAddress called, returning:', address);
          return address as string;
        },
        signMessage: async (message: Uint8Array | string) => {
          console.log('Signer.signMessage called');
          console.log('Message type:', typeof message);
          
          try {
            const messageString = typeof message === 'string' ? message : new TextDecoder().decode(message);
            console.log('Message to sign (first 50 chars):', messageString.substring(0, 50) + '...');
            
            console.log('Requesting signature from wallet...');
            const signature = await walletClient.signMessage({ message: messageString });
            console.log('Signature received:', signature.substring(0, 10) + '...');
            
            // Ensure the signature is properly formatted for XMTP
            // XMTP expects a hex string with a specific format
            const formattedSignature = signature.startsWith('0x') ? signature : `0x${signature}`;
            console.log('Formatted signature for XMTP:', formattedSignature.substring(0, 10) + '...');
            
            return formattedSignature;
          } catch (signError: any) {
            console.error('Error during signMessage:', signError);
            throw new Error(`Signing failed: ${signError.message}`);
          }
        }
      };
      
      try {
        // Dynamically import the XMTP Client
        const xmtpModule = await getXmtpClient();
        
        // Check if this address can message using our custom signer
        console.log('Checking if user can message...');
        try {
          // Try to use canMessage with our custom signer (wrapped in try/catch for better error handling)
          const canMessage = await xmtpModule.Client.canMessage(address, { env: 'dev' });
          
          if (!canMessage) {
            // User doesn't have a message identity, they need to create one first
            console.log('User needs to create a message identity');
            setError(new Error('Message identity creation required. Please click the button below to create your message identity.'));
            setIsLoading(false);
            return;
          }
          
          console.log('User has a message identity, proceeding with client creation');
        } catch (e: any) {
          console.log('Error checking if user can message:', e);
          if (e.message?.includes('ethereum provider')) {
            console.error('Ethereum provider error, retrying with mock provider...');
            // Try reinitializing the mock provider
            setupMockEthereumProvider(walletClient, address);
          } else {
            console.log('This is expected if user has no identity yet, proceeding to create client anyway');
          }
          // We'll continue and let Client.create handle any issues
        }
        
        // User already has an XMTP identity or we're proceeding anyway with our custom signer
        console.log('Creating XMTP client with custom signer...');
        try {
          // Create the client with our custom signer - use dev environment for simpler testing
          console.log('Creating XMTP client with options: env=dev and explicit content codecs');
          const xmtp = await xmtpModule.Client.create(signer, { 
            env: 'dev',
            codecs: [xmtpModule.ContentTypeText] // Explicitly include text codec for better message handling
          });
          console.log('Message client created successfully');
          setClient(xmtp);

          // Load existing conversations
          console.log('Loading conversations...');
          await loadConversations(xmtp);
        } catch (e: any) {
          console.error('Error creating XMTP client:', e);
          
          if (e.message?.includes('declined') || e.message?.includes('rejected')) {
            setError(new Error('You declined the signature request. Please try again and approve the signature.'));
          } else if (e.message?.includes('timeout')) {
            setError(new Error('The signature request timed out. Please try again.'));
          } else if (e.message?.includes('not a function')) {
            setError(new Error('Your wallet appears to be incompatible with this messaging system. Please try a different wallet.'));
          } else if (e.message?.includes('ethereum provider')) {
            setError(new Error('XMTP requires an ethereum provider. We have created a mock provider, please try again.'));
          } else {
            setError(new Error(`Failed to create message client: ${e.message || 'Unknown error'}`));
          }
        }
      } catch (e: any) {
        console.error('Unexpected error initializing message client:', e);
        setError(new Error(`Failed to initialize messaging: ${e.message || 'Unknown error'}`));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load conversations
  const loadConversations = async (xmtpClient: Client) => {
    if (!xmtpClient) return;

    try {
      setLoadingConversations(true);
      const convos = await xmtpClient.conversations.list();
      
      // Get conversation metadata from Tableland
      if (db && tableName) {
        const chatData = await getChatData(db, tableName);
        
        // Merge XMTP conversations with metadata
        const conversationsWithMetadata = convos.map(convo => {
          const metadata = chatData.find(data => data.key === convo.peerAddress);
          return {
            ...convo,
            metadata: metadata ? JSON.parse(metadata.value) : {}
          };
        });
        
        setConversations(conversationsWithMetadata);
      } else {
        setConversations(convos);
      }
    } catch (e) {
      console.error('Error loading conversations:', e);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Disconnect client
  const disconnect = () => {
    setClient(null);
    setConversations([]);
  };

  // Send message to a peer
  const sendMessage = async (peerAddress: string, content: string) => {
    if (!client) {
      throw new Error('XMTP client not initialized');
    }

    try {
      const conversation = await client.conversations.newConversation(peerAddress);
      await conversation.send(content);
      
      // Refresh conversations after sending
      await loadConversations(client);
    } catch (e) {
      console.error('Error sending message:', e);
      throw e;
    }
  };

  // Create a new conversation
  const createNewConversation = async (peerAddress: string) => {
    if (!client || !db || !tableName) {
      throw new Error('Client or database not initialized');
    }

    try {
      // Create conversation in XMTP
      const conversation = await client.conversations.newConversation(peerAddress);
      
      // Store metadata in Tableland
      const metadata = {
        peerAddress,
        createdAt: new Date().toISOString(),
        lastMessage: null,
        unreadCount: 0
      };
      
      await insertChatData(db, tableName, peerAddress, JSON.stringify(metadata));
      
      // Refresh conversations
      await loadConversations(client);
    } catch (e) {
      console.error('Error creating conversation:', e);
      throw e;
    }
  };

  // We're not auto-initializing the client to prevent conflicts with wallet connection
  // Users will need to explicitly initialize the client when they navigate to the chat page
  // This prevents interference with the Reown modal's connection flow

  // Clean up when wallet disconnects
  useEffect(() => {
    if (!isConnected && client) {
      disconnect();
    }
  }, [isConnected, client]);

  const value = {
    client,
    isLoading,
    error,
    conversations,
    loadingConversations,
    initClient,
    createIdentity,
    disconnect,
    sendMessage,
    createNewConversation
  };

  return <XmtpContext.Provider value={value}>{children}</XmtpContext.Provider>;
};
