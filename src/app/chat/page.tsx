'use client'

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useXmtp } from '@/context/XmtpContext';
import { ConnectButton } from '@/components/ConnectButton';
import ConversationList from '@/components/ConversationList';
import ConversationView from '@/components/ConversationView';
import NewConversationModal from '@/components/NewConversationModal';
import styles from './chat.module.css';

export default function ChatPage() {
  const { address, isConnected } = useAccount();
  const { client, isLoading, initClient, conversations } = useXmtp();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  // Initialize the XMTP client when the chat page is loaded and the wallet is connected
  // This is done explicitly here rather than automatically to prevent conflicts with wallet connection
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isConnected && !client && !isLoading) {
      // Add a small delay to ensure wallet connection is fully complete
      timeoutId = setTimeout(() => {
        initClient();
      }, 1000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isConnected, client, isLoading, initClient]);

  if (!isConnected) {
    return (
      <div className="main-content">
        <h1>Chat</h1>
        <p>Connect your wallet to start chatting</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="main-content">
      <h1>Chat</h1>
      
      <div className={styles.chatContainer}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2>Conversations</h2>
            <button 
              className="button-primary"
              onClick={() => setShowNewConversationModal(true)}
            >
              New Chat
            </button>
          </div>
          
          <ConversationList 
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
          />
        </div>
        
        <div className={styles.chatMain}>
          {selectedConversation ? (
            <ConversationView conversation={selectedConversation} />
          ) : (
            <div className={styles.emptyState}>
              <p>Select a conversation or start a new chat</p>
            </div>
          )}
        </div>
      </div>
      
      {showNewConversationModal && (
        <NewConversationModal 
          onClose={() => setShowNewConversationModal(false)}
          onConversationCreated={(conversation) => {
            setSelectedConversation(conversation);
            setShowNewConversationModal(false);
          }}
        />
      )}
    </div>
  );
}
