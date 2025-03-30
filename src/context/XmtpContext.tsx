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

  // Check if user has an XMTP identity and create one if needed
  const createIdentity = async (): Promise<boolean> => {
    if (!walletClient || !address) {
      setError(new Error('Wallet not connected'));
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting XMTP identity creation process...');
      console.log('Wallet address:', address);
      
      // Force a new client creation which will create the identity if it doesn't exist
      try {
        // This will trigger the signature request
        console.log('Attempting to create XMTP client...');
        // Create the XMTP client with minimal options to avoid TypeScript errors
        // This will create the identity if it doesn't exist
        const xmtp = await Client.create(walletClient as any, { 
          env: 'production'
        });
        
        console.log('XMTP client created successfully');
        setClient(xmtp);
        
        // Load existing conversations
        await loadConversations(xmtp);
        
        return true;
      } catch (e: any) {
        console.error('Error creating XMTP identity:', e);
        // Provide more specific error message
        if (e.message?.includes('User declined to sign')) {
          setError(new Error('You declined the signature request. Please try again and approve the signature.'));
        } else {
          setError(new Error(`Failed to create message identity: ${e.message || 'Unknown error'}`));
        }
        return false;
      }
    } catch (e: any) {
      console.error('Error in identity creation process:', e);
      setError(new Error(`Error creating message identity: ${e.message || 'Unknown error'}`));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize XMTP client
  const initClient = async () => {
    if (!walletClient || !address) {
      setError(new Error('Wallet not connected'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check if we already have a client before creating a new one
      if (client) {
        setIsLoading(false);
        return;
      }

      // First check if the user already has an XMTP identity
      const canMessage = await Client.canMessage(address as string, { env: 'production' });
      
      if (!canMessage) {
        // User doesn't have an XMTP identity yet
        console.log('User needs to create an XMTP identity');
        setError(new Error('Message identity creation required. Please try again later after wallet connection is fully established.'));
        setIsLoading(false);
        return;
      }
      
      // User already has an XMTP identity, we can create the client
      try {
        // Cast the wallet client to any to bypass type checking
        const xmtp = await Client.create(walletClient as any, { env: 'production' });
        setClient(xmtp);

        // Load existing conversations
        await loadConversations(xmtp);
      } catch (e: any) {
        console.error('Error initializing XMTP client:', e);
        setError(e);
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
