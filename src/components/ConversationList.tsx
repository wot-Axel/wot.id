'use client'

import React from 'react';
import styles from './ConversationList.module.css';

interface ConversationListProps {
  conversations: any[];
  selectedConversation: any;
  onSelectConversation: (conversation: any) => void;
}

export default function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className={styles.emptyList}>
        <p>No conversations yet</p>
        <p className={styles.hint}>Click "New Chat" to start messaging</p>
      </div>
    );
  }

  return (
    <div className={styles.conversationList}>
      {conversations.map((conversation) => {
        const isSelected = selectedConversation && 
          selectedConversation.peerAddress === conversation.peerAddress;
        
        return (
          <div
            key={conversation.peerAddress}
            className={`${styles.conversationItem} ${isSelected ? styles.selected : ''}`}
            onClick={() => onSelectConversation(conversation)}
          >
            <div className={styles.avatar}>
              {conversation.peerAddress.substring(2, 4).toUpperCase()}
            </div>
            <div className={styles.conversationDetails}>
              <div className={styles.peerAddress}>
                {`${conversation.peerAddress.substring(0, 6)}...${conversation.peerAddress.substring(38)}`}
              </div>
              <div className={styles.lastMessage}>
                {conversation.metadata?.lastMessage || 'No messages yet'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
