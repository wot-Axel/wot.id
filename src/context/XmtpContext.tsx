'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client } from '@xmtp/xmtp-js';
import { useAccount, useWalletClient } from 'wagmi';
import { Database } from '@tableland/sdk';
import { checkChatTableExists, createChatTable, insertChatData, getChatData } from '@/utils/tablelandUtils';

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

  // Create XMTP identity using a more direct approach
  const createIdentity = async (): Promise<boolean> => {
    if (!walletClient || !address) {
      setError(new Error('Wallet not connected'));
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting message identity creation process...');
      console.log('Wallet address:', address);
      console.log('Wallet client available:', !!walletClient);
      
      // Directly create a new client which will create the identity
      try {
        // Use a more direct approach with the wallet client
        console.log('Creating XMTP client with wallet...');
        
        // Convert walletClient to the format XMTP expects
        const signer = {
          getAddress: async () => address,
          signMessage: async (message: string) => {
            console.log('Requesting signature for message...');
            return await walletClient.signMessage({ message });
          }
        };
        
        // Create the client with our custom signer
        console.log('Initializing XMTP client...');
        const xmtp = await Client.create(signer, { 
          env: 'production'
        });
        
        console.log('XMTP client created successfully!');
        setClient(xmtp);
        setError(null); // Clear any previous errors
        
        // Load conversations after successful client creation
        console.log('Loading conversations...');
        await loadConversations(xmtp);
        
        return true;
      } catch (e: any) {
        console.error('Error creating message identity:', e);
        
        // Provide more specific error messages based on the error type
        if (e.message?.includes('declined') || e.message?.includes('rejected')) {
          setError(new Error('You declined the signature request. Please try again and approve the signature.'));
        } else if (e.message?.includes('timeout')) {
          setError(new Error('The signature request timed out. Please try again.'));
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

  // Initialize XMTP client
  const initClient = async () => {
    if (!walletClient || !address) {
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

      console.log('Checking if user has a message identity...');
      // First check if the user already has an XMTP identity
      try {
        const canMessage = await Client.canMessage(address as string, { env: 'production' });
        
        if (!canMessage) {
          // User doesn't have an XMTP identity yet
          console.log('User needs to create a message identity');
          setError(new Error('Message identity creation required. Please try again later after wallet connection is fully established.'));
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
        // Use our custom signer approach for consistency
        const signer = {
          getAddress: async () => address,
          signMessage: async (message: string) => {
            console.log('Requesting signature for message...');
            return await walletClient.signMessage({ message });
          }
        };
        
        // Create the client with our custom signer
        const xmtp = await Client.create(signer, { env: 'production' });
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
