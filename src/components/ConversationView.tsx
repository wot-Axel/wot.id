'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useXmtp } from '@/context/XmtpContext';
import styles from './ConversationView.module.css';

interface ConversationViewProps {
  conversation: any;
}

export default function ConversationView({ conversation }: ConversationViewProps) {
  const { address } = useAccount();
  const { client } = useXmtp();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages for the conversation
  useEffect(() => {
    const loadMessages = async () => {
      if (!client || !conversation) return;
      
      try {
        setIsLoading(true);
        const convo = await client.conversations.newConversation(conversation.peerAddress);
        const msgs = await convo.messages();
        setMessages(msgs);
      } catch (e) {
        console.error('Error loading messages:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [client, conversation]);

  // Set up message listener
  useEffect(() => {
    if (!client || !conversation) return;
    
    const listenForMessages = async () => {
      const convo = await client.conversations.newConversation(conversation.peerAddress);
      
      for await (const message of await convo.streamMessages()) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    };
    
    listenForMessages();
  }, [client, conversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !client || !conversation) return;
    
    try {
      const convo = await client.conversations.newConversation(conversation.peerAddress);
      await convo.send(newMessage);
      setNewMessage('');
    } catch (e) {
      console.error('Error sending message:', e);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className={styles.conversationView}>
      <div className={styles.header}>
        <div className={styles.peerInfo}>
          <div className={styles.avatar}>
            {conversation.peerAddress.substring(2, 4).toUpperCase()}
          </div>
          <div className={styles.peerAddress}>
            {`${conversation.peerAddress.substring(0, 6)}...${conversation.peerAddress.substring(38)}`}
          </div>
        </div>
      </div>
      
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyMessages}>
            <p>No messages yet</p>
            <p className={styles.hint}>Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`${styles.message} ${message.senderAddress === address ? styles.sent : styles.received}`}
            >
              <div className={styles.messageContent}>
                {message.content}
              </div>
              <div className={styles.messageTime}>
                {new Date(message.sent).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className={styles.messageForm} onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className={styles.messageInput}
        />
        <button type="submit" className={styles.sendButton} disabled={!newMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
