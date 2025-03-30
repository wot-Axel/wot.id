'use client'

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAppKitAccount } from '@reown/appkit/react';
import { useXmtp } from '@/context/XmtpContext';
import { ConnectButton } from '@/components/ConnectButton';
import ConversationList from '@/components/ConversationList';
import ConversationView from '@/components/ConversationView';
import NewConversationModal from '@/components/NewConversationModal';
import styles from './chat.module.css';

export default function ChatPage() {
  const { address } = useAccount();
  const { isConnected } = useAppKitAccount();
  const { client, isLoading, error, initClient, createIdentity, disconnect, conversations } = useXmtp();
  const [creatingIdentity, setCreatingIdentity] = useState(false);
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
        <h1>Message</h1>
        <p>Connect your wallet to start messaging</p>
        <ConnectButton />
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="main-content">
        <h1>Message</h1>
        <div className={styles.loadingContainer}>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="main-content">
        <h1>Message</h1>
        <div className={styles.errorContainer}>
          <h2>Message Initialization Error</h2>
          <p>{error.message}</p>
          
          {/* Always show the identity help section for any error */}
          <div className={styles.identityHelp}>
            <p>To use the messaging feature, you need to create an XMTP identity first.</p>
            <p>This requires a one-time signature to create your secure messaging identity.</p>
            
            <button 
              className="button-primary"
              disabled={creatingIdentity}
              onClick={async () => {
                setCreatingIdentity(true);
                try {
                  console.log('Attempting to create message identity...');
                  const success = await createIdentity();
                  
                  if (success) {
                    console.log('Identity creation successful, client should be initialized');
                    // No need to call initClient again as createIdentity already does this
                    setCreatingIdentity(false);
                  } else {
                    console.log('Identity creation failed');
                    setCreatingIdentity(false);
                  }
                } catch (e) {
                  console.error('Exception during identity creation:', e);
                  setCreatingIdentity(false);
                }
              }}
            >
              {creatingIdentity ? 'Creating Identity...' : 'Create Message Identity'}
            </button>
            
            <p className={styles.identityNote}>
              <strong>Note:</strong> When prompted to sign the message identity in your wallet, please approve it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <h1>Message</h1>
      
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
