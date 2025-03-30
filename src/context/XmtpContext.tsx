'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client } from '@xmtp/xmtp-js';
import { useAccount, useWalletClient } from 'wagmi';
import { Database } from '@tableland/sdk';
import { checkChatTableExists, createChatTable, insertChatData, getChatData } from '@/utils/tablelandUtils';

// Use a type assertion approach instead of extending Window interface
type EthereumProvider = {
  request: (args: {method: string; params?: any[]}) => Promise<any>;
  isMetaMask?: boolean;
  on?: (event: string, callback: (...args: any[]) => void) => void;
  removeListener?: (event: string, callback: (...args: any[]) => void) => void;
};

interface XmtpContextType {
  client: Client | null;
  isLoading: boolean;
  error: Error | null;
  conversations: any[];
  loadingConversations: boolean;
  initClient: () => Promise<void>;
  createIdentity: () => Promise<boolean>;
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
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConversations, setLoadingConversations] = useState<boolean>(false);
  const [db, setDb] = useState<Database | null>(null);
  const [tableName, setTableName] = useState<string>('');

  // Initialize Tableland database
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

    if (isConnected && address) {
      initDb();
    }
  }, [isConnected, address]);

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

  // Create XMTP identity using a more direct approach with ethereum provider
  const createIdentity = async (): Promise<boolean> => {
    if (!address) {
      setError(new Error('Wallet not connected'));
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting message identity creation process...');
      console.log('Wallet address:', address);
      
      // Access window ethereum provider directly
      if (typeof window !== 'undefined' && window.ethereum) {
        console.log('Using window.ethereum provider for identity creation');
        
        try {
          // Create an ethers-compatible signer using window.ethereum
          const provider = window.ethereum as EthereumProvider;
          
          // Basic ethereum provider compatible signer
          const signer = {
            getAddress: async () => address,
            signMessage: async (message: string) => {
              console.log('Requesting signature from ethereum provider...');
              try {
                // Use personal_sign for maximum wallet compatibility
                return await provider.request({
                  method: 'personal_sign',
                  params: [message, address]
                });
              } catch (e: any) {
                console.error('Error during personal_sign:', e);
                throw new Error(`Wallet declined signature: ${e.message}`);
              }
            }
          };
          
          console.log('Creating XMTP client with ethereum provider...');
          // Use development mode to reduce complexity
          const xmtp = await Client.create(signer, { env: 'dev' });
          
          console.log('Message client created successfully!');
          setClient(xmtp);
          setError(null);
          
          // Load conversations
          console.log('Loading conversations...');
          await loadConversations(xmtp);
          
          return true;
        } catch (e: any) {
          console.error('Error with ethereum provider:', e);
          setError(new Error(`Wallet signing error: ${e.message || 'Unknown error'}`));
          return false;
        }
      } else {
        console.error('No ethereum provider found in window');
        setError(new Error('Your browser wallet is not properly connected. Please refresh the page and try again.'));
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

  // Initialize XMTP client with the same ethereum provider approach
  const initClient = async () => {
    if (!address) {
      console.log('Cannot initialize client: wallet not connected');
      setError(new Error('Wallet not connected'));
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
      
      // Use window.ethereum directly like in createIdentity
      if (typeof window === 'undefined' || !window.ethereum) {
        console.error('No ethereum provider found');
        setError(new Error('Browser wallet not detected. Please make sure your wallet is connected.'));
        setIsLoading(false);
        return;
      }
      
      try {
        // Check if this address can message using dev environment for simpler testing
        console.log('Checking if user can message...');
        const canMessage = await Client.canMessage(address, { env: 'dev' });
        
        if (!canMessage) {
          // User doesn't have a message identity, they need to create one first
          console.log('User needs to create a message identity');
          setError(new Error('Message identity creation required. Please click the button below to create your message identity.'));
          setIsLoading(false);
          return;
        }
        
        console.log('User has a message identity, proceeding with client creation');
      } catch (e: any) {
        console.error('Error checking message identity:', e);
        setError(new Error(`Could not verify message identity: ${e.message || 'Unknown error'}`));
        setIsLoading(false);
        return;
      }
      
      // User already has an XMTP identity, we can create the client
      try {
        console.log('User has message identity, creating client...');
        // Use ethereum provider directly like in createIdentity
        const provider = window.ethereum as EthereumProvider;
        
        // Basic ethereum provider compatible signer
        const signer = {
          getAddress: async () => address,
          signMessage: async (message: string) => {
            console.log('Requesting signature from ethereum provider...');
            try {
              return await provider.request({
                method: 'personal_sign',
                params: [message, address]
              });
            } catch (e: any) {
              console.error('Error during personal_sign:', e);
              throw new Error(`Wallet declined signature: ${e.message}`);
            }
          }
        };
        
        // Create the client with ethereum provider signer - use dev environment for simpler testing
        const xmtp = await Client.create(signer, { env: 'dev' });
        console.log('Message client created successfully');
        setClient(xmtp);

        // Load existing conversations
        console.log('Loading conversations...');
        await loadConversations(xmtp);
      } catch (e: any) {
        console.error('Error initializing message client:', e);
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
