'use client'

import React, { useState } from 'react';
import { useXmtp } from '@/context/XmtpContext';
import styles from './NewConversationModal.module.css';

interface NewConversationModalProps {
  onClose: () => void;
  onConversationCreated: (conversation: any) => void;
}

export default function NewConversationModal({
  onClose,
  onConversationCreated
}: NewConversationModalProps) {
  const [peerAddress, setPeerAddress] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const { createNewConversation, client } = useXmtp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!peerAddress.trim() || !client) return;
    
    try {
      setIsCreating(true);
      setError('');
      
      // Validate Ethereum address
      if (!peerAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid Ethereum address');
      }
      
      // Check if the address can be messaged
      const canMessage = await client.canMessage(peerAddress);
      if (!canMessage) {
        throw new Error('This address is not available on XMTP network');
      }
      
      // Create conversation
      await createNewConversation(peerAddress);
      
      // Get the conversation object
      const conversation = await client.conversations.newConversation(peerAddress);
      
      onConversationCreated(conversation);
    } catch (e: any) {
      console.error('Error creating conversation:', e);
      setError(e.message || 'Failed to create conversation');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>New Conversation</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="peerAddress">Recipient Ethereum Address</label>
            <input
              id="peerAddress"
              type="text"
              value={peerAddress}
              onChange={(e) => setPeerAddress(e.target.value)}
              placeholder="0x..."
              className={styles.input}
              required
            />
            {error && <div className={styles.error}>{error}</div>}
          </div>
          
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!peerAddress.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Start Conversation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
