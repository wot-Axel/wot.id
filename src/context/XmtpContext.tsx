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

  // Initialize XMTP client
  const initClient = async () => {
    if (!walletClient || !address) {
      setError(new Error('Wallet not connected'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create a new XMTP client with the wallet
      const xmtp = await Client.create(walletClient, { env: 'production' });
      setClient(xmtp);

      // Load existing conversations
      await loadConversations(xmtp);
    } catch (e: any) {
      console.error('Error initializing XMTP client:', e);
      setError(e);
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

  // Auto-initialize client when wallet connects
  useEffect(() => {
    if (isConnected && walletClient && !client && !isLoading) {
      initClient();
    }
  }, [isConnected, walletClient, client, isLoading]);

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
    disconnect,
    sendMessage,
    createNewConversation
  };

  return <XmtpContext.Provider value={value}>{children}</XmtpContext.Provider>;
};
