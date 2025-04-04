'use client'

import * as React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode, Suspense } from 'react';
// Import Client type only for type checking, not the actual implementation
import type { Client } from '@xmtp/xmtp-js';
import { useAccount, useWalletClient } from 'wagmi';
import { useAppKitAccount } from '@reown/appkit/react';
import { Wallet } from 'ethers';

/**
 * IMPLEMENTATION PHASES
 * 
 * Phase 1 (Current): Basic XMTP messaging functionality without persistent storage
 * - Setup XMTP client with wallet connection
 * - Send and receive messages
 * - List conversations
 * 
 * Phase 2 (Planned): Add persistent storage with Ceramic
 * - Store message history in Ceramic
 * - Retrieve message history when reconnecting
 * - Implement message encryption for privacy
 */

// Phase 2 imports (will be uncommented when implemented)
// import { Database } from '../utils/ceramicUtils';
// import { TableType, checkTableExists, createTable, insertData, getData } from '../utils/ceramicUtils';

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
const setupMockEthereumProvider = (walletClient: any, address: string | undefined) => {
  // Only run in browser
  if (typeof window === 'undefined') return;
  
  // Safety check - address should never be undefined when this function is called
  if (!address) {
    console.error('No address provided to setupMockEthereumProvider');
    return;
  }
  
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
        // This allows XMTP to work with any chain the user is connected to
        const chainId = walletClient?.chain?.id;
        return chainId ? `0x${chainId.toString(16)}` : '0x1';
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

// We don't need to redeclare window.ethereum as it's already defined elsewhere
// This was causing TypeScript errors

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
  createNewConversation: (peerAddress: string) => Promise<any>;
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
  // Phase 2: Tableland state (commented out until implementation)
  // const [db, setDb] = useState<Database | null>(null);
  // const [tableName, setTableName] = useState<string>('');

  // Phase 1: Setup mock ethereum provider without Tableland initialization
  useEffect(() => {
    // Setup mock ethereum provider when wallet is connected
    if (isConnected && address && walletClient) {
      // Initialize the mock ethereum provider
      setupMockEthereumProvider(walletClient, address);
    }
  }, [isConnected, address, walletClient]);

  // Phase 2: Tableland table setup (commented out until implementation)
  /*
  useEffect(() => {
    const setupChatTable = async () => {
      if (!db || !address) return;
      
      try {
        // Check if chat table exists using our generic function
        const tableExists = await checkTableExists(db, TableType.CHAT, address);
        
        if (!tableExists) {
          // Create chat table using our generic function
          const newTableName = await createTable(db, TableType.CHAT, address);
          setTableName(newTableName);
          console.log('Created new chat table:', newTableName);
        } else {
          // Get existing table name (in a real implementation, we would query for this)
          const existingTableName = `${TableType.CHAT}_${address.slice(0, 8)}_31337_1`;
          setTableName(existingTableName);
          console.log('Using existing chat table:', existingTableName);
        }
      } catch (error) {
        console.error('Error setting up chat table:', error);
      }
    };

    if (db && address) {
      setupChatTable();
    }
  }, [db, address]);
  */

  // Create XMTP identity with more detailed logging and error handling
  // Added option to use a development key for testing
  const createIdentity = async (useDevelopmentKey: boolean = false): Promise<boolean> => {
    console.log('------- CREATE IDENTITY DEBUGGING -------');
    console.log('Checking wallet connection status...');
    console.log('AppKit isConnected:', isConnected);
    console.log('Address available:', !!address);
    console.log('Wallet client available:', !!walletClient);
    console.log('Using development mode:', useDevelopmentKey);
    
    // Clear any existing XMTP state from localStorage first
    if (typeof window !== 'undefined') {
      console.log('Clearing any existing XMTP state from localStorage...');
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('xmtp_') || key.includes('xmtp'))) {
          keysToRemove.push(key);
        }
      }
      
      // Remove the keys in a separate loop to avoid issues with changing localStorage during iteration
      keysToRemove.forEach(key => {
        console.log('Removing localStorage item:', key);
        localStorage.removeItem(key);
      });
    }
    
    // For development key, we don't need a wallet connection
    if (!useDevelopmentKey) {
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
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting message identity creation process...');
      console.log('Wallet address:', address || 'Not used (development mode)');
      console.log('Using development key?', useDevelopmentKey);
      
      try {
        // Dynamically import the XMTP Client
        const xmtpModule = await getXmtpClient();
        
        let xmtp;
        
        if (useDevelopmentKey) {
          // Use development keys for testing - this bypasses the need for wallet signatures
          console.log('Using development key instead of wallet signature...');
          
          // For development, we'll use a static key so it's consistent between page reloads
          // This ensures the identity persists in the browser's memory
          // In production, you would NEVER use a hardcoded key
          const DEV_PRIVATE_KEY = '0x1111111111111111111111111111111111111111111111111111111111111111';
          console.log('Using development private key for consistent testing');
          
          try {
            // First check if we can load an existing client with this key
            console.log('Attempting to create XMTP client with development key...');
            
            // Clear any existing XMTP state to ensure a fresh start
            if (typeof window !== 'undefined') {
              console.log('Clearing all XMTP-related localStorage items...');
              localStorage.removeItem('xmtp_dev_client_created');
              localStorage.removeItem('xmtp_keys');
              localStorage.removeItem('xmtp_cache');
              console.log('Cleared previous development client state');
            }
            
            // Create a fresh client with the development key
            console.log('Creating fresh XMTP client with development key...');
            
            // Check which method is available in the XMTP library
            console.log('Available methods on Client:', Object.keys(xmtpModule.Client));
            
            // Create a wallet from the private key
            const wallet = new Wallet(DEV_PRIVATE_KEY);
            
            // Use the create method with the wallet
            xmtp = await xmtpModule.Client.create(wallet, {
              env: 'dev',
              skipContactPublishing: true,
            });
            console.log('Successfully created XMTP client with development key');
            
            // Store the client in localStorage to ensure it persists
            if (typeof window !== 'undefined') {
              // Set the client directly in the React state
              setClient(xmtp);
              
              // Set the flag to indicate we have a development client
              localStorage.setItem('xmtp_dev_client_created', 'true');
              console.log('Saved development client state to localStorage');
              
              // Load conversations immediately instead of reloading the page
              console.log('Loading conversations for the development client...');
              loadConversations(xmtp).then(() => {
                console.log('Successfully loaded conversations for development client');
              }).catch(error => {
                console.error('Error loading conversations:', error);
              });
            }
          } catch (devKeyError) {
            console.error('Error creating client with development key:', devKeyError);
            throw devKeyError;
          }
        } else {
          // Standard flow with wallet signature
          // We already verified walletClient and address exist above, but TypeScript needs reassurance
          if (!walletClient || !address) {
            throw new Error('Wallet client or address is undefined');
          }
          
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
                // TypeScript needs this check even though we've already verified walletClient exists
                if (!walletClient) {
                  throw new Error('Wallet client is undefined');
                }
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
        
        // Verify the client was created properly
        if (!xmtp) {
          console.error('XMTP client was not created properly');
          throw new Error('Failed to create XMTP client');
        }
        
        console.log('Setting XMTP client in React state...');
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
    
    // If we already have a client, just return it
    if (client) {
      console.log('Client already exists, using existing client');
      return;
    }
    
    // Simple check for development client flag
    const hasDevClient = typeof window !== 'undefined' && localStorage.getItem('xmtp_dev_client_created') === 'true';
    console.log('Development client detected in localStorage:', hasDevClient);
    
    // If we're on the chat page and there's no development client, show the message to create one
    if (!hasDevClient && typeof window !== 'undefined' && window.location.pathname.includes('/chat')) {
      console.log('On chat page without development client, showing create identity message');
      setError(new Error('Message identity creation required. Please click the button below to create your message identity.'));
      return;
    }
    
    // In development mode, we can bypass some of the wallet checks
    if (!hasDevClient) {
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
    } else {
      console.log('Using development client, bypassing wallet checks');
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
      if (walletClient) {
        setupMockEthereumProvider(walletClient, address);
      } else {
        console.log('Skipping mock ethereum provider setup - walletClient is undefined');
      }
      
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
            if (!walletClient) {
              throw new Error('Wallet client is undefined');
            }
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
        
        // Simple check for development client flag
        const hasDevClient = typeof window !== 'undefined' && localStorage.getItem('xmtp_dev_client_created') === 'true';
        console.log('Checking if user can message...');
        console.log('Development client detected in localStorage:', hasDevClient);
        
        // If we have a development client flag, try to create a client with the development key
        if (hasDevClient) {
          console.log('Development client detected, creating client with development key');
          try {
            // Use the development private key to create a client
            const DEV_PRIVATE_KEY = '0x1111111111111111111111111111111111111111111111111111111111111111';
            
            // Check which method is available in the XMTP library
            console.log('Available methods on Client:', Object.keys(xmtpModule.Client));
            
            // Try to create a client using the available method
            let xmtp;
            if (typeof xmtpModule.Client.create === 'function') {
              // Create a wallet from the private key
              const wallet = new Wallet(DEV_PRIVATE_KEY);
              
              // Use the create method with the wallet
              xmtp = await xmtpModule.Client.create(wallet, {
                env: 'dev',
                skipContactPublishing: true,
              });
            } else {
              throw new Error('No suitable method found to create XMTP client');
            }
            
            console.log('Successfully created XMTP client with development key');
            setClient(xmtp);
            
            // Load conversations
            await loadConversations(xmtp);
            setIsLoading(false);
            return;
          } catch (error) {
            console.error('Error creating development client:', error);
            // If development client creation fails, clear the flag and show an error
            if (typeof window !== 'undefined') {
              localStorage.removeItem('xmtp_dev_client_created');
            }
            setError(new Error('Failed to create development client. Please try again.'));
            setIsLoading(false);
            return;
          }
        } else {
          try {
            // Try to use canMessage with our custom signer (wrapped in try/catch for better error handling)
            const canMessage = await xmtpModule.Client.canMessage(address as string, { env: 'dev' });
            
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
              if (walletClient) {
                setupMockEthereumProvider(walletClient, address);
              } else {
                console.error('Cannot setup mock provider: walletClient is undefined');
              }
            } else {
              console.log('This is expected if user has no identity yet, proceeding to create client anyway');
            }
            // We'll continue and let Client.create handle any issues
          }
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

  // Simplified conversation loading without Tableland integration
  // In Phase 2, this will be updated to use Tableland for persistent storage
  const loadConversations = async (xmtpClient: Client) => {
    if (!xmtpClient) return;

    try {
      setLoadingConversations(true);
      const convos = await xmtpClient.conversations.list();
      
      // Use conversations directly from XMTP without Tableland metadata
      const conversationsWithBasicMetadata = await Promise.all(convos.map(async (convo) => {
        // Get the most recent message for each conversation to use as preview
        let lastMessagePreview = 'No messages yet';
        try {
          const messages = await convo.messages({ limit: 1 });
          if (messages.length > 0) {
            lastMessagePreview = typeof messages[0].content === 'string' 
              ? messages[0].content 
              : 'Message content not available';
              
            // Truncate long messages
            if (lastMessagePreview.length > 30) {
              lastMessagePreview = lastMessagePreview.substring(0, 27) + '...';
            }
          }
        } catch (e) {
          console.error('Error fetching messages for conversation:', e);
        }
        
        return {
          ...convo,
          metadata: {
            peerAddress: convo.peerAddress,
            lastMessage: lastMessagePreview,
            createdAt: new Date().toISOString(),
            unreadCount: 0
          }
        };
      }));
      
      setConversations(conversationsWithBasicMetadata);
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

  // Create a new conversation with a peer address
  const createNewConversation = async (peerAddress: string) => {
    if (!client) {
      throw new Error('XMTP client not initialized');
    }

    try {
      // Create conversation in XMTP
      const conversation = await client.conversations.newConversation(peerAddress);
      
      // In Phase 2, we'll add Tableland integration for metadata storage
      
      // Refresh conversations
      await loadConversations(client);
      
      return conversation;
    } catch (e) {
      console.error('Error creating conversation:', e);
      throw e;
    }
  };

  // We're not auto-initializing the client to prevent conflicts with wallet connection
  // Users will need to explicitly initialize the client when they navigate to the chat page
  // This prevents interference with the Reown modal's connection flow

  // Check for development client in localStorage when component mounts
  useEffect(() => {
    // This effect runs once when the component mounts
    if (typeof window !== 'undefined' && localStorage.getItem('xmtp_dev_client_created') === 'true') {
      console.log('Found development client in localStorage, attempting to initialize...');
      // Try to create a client with the development key
      createIdentity(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount

  // Clean up when wallet disconnects
  useEffect(() => {
    if (!isConnected && client) {
      // Don't disconnect if we're using a development client
      if (typeof window !== 'undefined' && localStorage.getItem('xmtp_dev_client_created') !== 'true') {
        disconnect();
      }
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
