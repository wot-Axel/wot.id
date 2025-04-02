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
    if (isConnected && !client && !initializingClient) {
      setInitializingClient(true);
      // Try to initialize the client
      initClient().catch(console.error).finally(() => {
        setInitializingClient(false);
      });
    }
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
  
  // Create XMTP identity
  const handleCreateIdentity = async () => {
    try {
      setInitializingClient(true);
      await createIdentity();
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
          <p>To use the chat functionality, you need to create a messaging identity.</p>
          <p>This requires a one-time signature from your wallet.</p>
          {error && <div className={styles.error}>{error.message}</div>}
          <button 
            className="button-primary" 
            onClick={handleCreateIdentity}
            disabled={initializingClient}
          >
            {initializingClient ? 'Creating Identity...' : 'Create Messaging Identity'}
          </button>
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
