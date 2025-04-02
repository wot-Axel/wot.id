'use client'

import React, { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useXmtp } from '@/context/XmtpContext';
import ConversationList from '@/components/ConversationList';
import ConversationView from '@/components/ConversationView';
import NewConversationModal from '@/components/NewConversationModal';
import styles from './chat.module.css';

export default function ChatPage() {
  const { isConnected } = useAppKitAccount();
  const { client, isLoading, error, conversations, initClient, createIdentity } = useXmtp();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [initializingClient, setInitializingClient] = useState(false);
  
  // Initialize client when page loads if user is connected
  useEffect(() => {
    const initializeXmtpClient = async () => {
      if (isConnected && !client && !initializingClient) {
        setInitializingClient(true);
        console.log('Initializing XMTP client from page load effect...');
        
        try {
          // Check if we have a development client in localStorage
          const hasDevClient = typeof window !== 'undefined' && localStorage.getItem('xmtp_dev_client_created') === 'true';
          
          if (hasDevClient) {
            console.log('Found existing dev client in localStorage, attempting to use it...');
          }
          
          // Try to initialize the client
          await initClient();
          console.log('Client initialization completed successfully');
        } catch (error) {
          console.error('Failed to initialize client:', error);
        } finally {
          setInitializingClient(false);
        }
      }
    };
    
    initializeXmtpClient();
  }, [isConnected, client, initClient, initializingClient]);
  
  // Handle conversation selection
  const handleSelectConversation = (conversation: any) => {
    setSelectedConversation(conversation);
  };
  
  // Handle new conversation button click
  const handleNewConversation = () => {
    setShowNewConversationModal(true);
  };
  
  // Handle closing the new conversation modal
  const handleCloseModal = () => {
    setShowNewConversationModal(false);
  };
  
  // Create XMTP identity with more robust error handling
  const handleCreateIdentity = async () => {
    try {
      setInitializingClient(true);
      console.log('Explicitly creating identity in development mode...');
      
      // First clear any existing client state from localStorage
      if (typeof window !== 'undefined') {
        console.log('Clearing any existing XMTP state from localStorage...');
        // Clear all XMTP-related items to ensure a fresh start
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('xmtp_') || key.includes('xmtp'))) {
            console.log('Removing localStorage item:', key);
            localStorage.removeItem(key);
          }
        }
      }
      
      // Use development mode for easier testing
      console.log('Creating new development identity...');
      const success = await createIdentity(true);
      
      if (success) {
        console.log('Successfully created identity in development mode');
        // The page will be reloaded by the createIdentity function
        // No need to reload here as it would cause a double reload
      } else {
        console.error('Failed to create identity in development mode');
      }
    } catch (e) {
      console.error('Error creating identity:', e);
    } finally {
      setInitializingClient(false);
    }
  };
  
  // If not connected, show connect prompt
  if (!isConnected) {
    return (
      <div className="legal-page">
        <h1>Chat</h1>
        <div className={styles.connectPrompt}>
          <p>Please connect your wallet to access the chat functionality.</p>
        </div>
      </div>
    );
  }
  
  // If no client and not loading, show identity creation prompt
  if (!client && !isLoading && !initializingClient) {
    return (
      <div className="legal-page">
        <h1>Chat</h1>
        <div className={styles.identityPrompt}>
          <h2>Create a Messaging Identity</h2>
          <p>To use the chat functionality, you need to create a messaging identity.</p>
          <p>For this demo, we'll use a development identity that doesn't require a wallet signature.</p>
          
          {error && (
            <div className={styles.error}>
              <h3>Error Creating Identity</h3>
              <p>{error.message}</p>
              <p>Please try again or refresh the page.</p>
            </div>
          )}
          
          <button 
            className="button-primary" 
            onClick={handleCreateIdentity}
            disabled={initializingClient}
            style={{ padding: '12px 24px', fontSize: '16px', margin: '20px 0' }}
          >
            {initializingClient ? 'Creating Identity...' : 'Create Development Identity'}
          </button>
          
          <div className={styles.identityNote} style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
            <p><strong>Note:</strong> This is using XMTP's development network for demonstration purposes. 
            In a production environment, this would use your actual wallet signature.</p>
            <p><strong>Troubleshooting:</strong> If you encounter issues, try clearing your browser cache and refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }
  
  // If loading, show loading state
  if (isLoading || initializingClient) {
    return (
      <div className="legal-page">
        <h1>Chat</h1>
        <div className={styles.loadingContainer}>
          <p>Loading chat functionality...</p>
        </div>
      </div>
    );
  }
  
  // If there's an error, show error state
  if (error) {
    return (
      <div className="legal-page">
        <h1>Chat</h1>
        <div className={styles.errorContainer}>
          <p>Error: {error.message}</p>
          <button 
            className="button-primary" 
            onClick={() => initClient()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Main chat interface
  return (
    <div className="legal-page">
      <h1>Chat</h1>
      
      <div className={styles.chatContainer}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2>Conversations</h2>
            <button 
              className={styles.newChatButton}
              onClick={handleNewConversation}
            >
              New Chat
            </button>
          </div>
          
          <ConversationList 
            conversations={conversations} 
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
          />
        </div>
        
        <div className={styles.mainContent}>
          {selectedConversation ? (
            <ConversationView conversation={selectedConversation} />
          ) : (
            <div className={styles.noConversationSelected}>
              <p>Select a conversation or start a new chat</p>
            </div>
          )}
        </div>
      </div>
      
      {showNewConversationModal && (
        <NewConversationModal 
          onClose={handleCloseModal}
          onConversationCreated={(conversation) => {
            setSelectedConversation(conversation);
            setShowNewConversationModal(false);
          }}
        />
      )}
    </div>
  );
}
