import { useState, useCallback, useRef } from 'react';
import { ChatMessage } from '../../types';
import { chatService } from '../../services/chatService';

interface UseMessagePaginationProps {
  userId: string;
  selectedUserId: string;
  pageSize?: number;
}

export const useMessagePagination = ({ 
  userId, 
  selectedUserId, 
  pageSize = 50 
}: UseMessagePaginationProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentPageRef = useRef(0);
  const isLoadingRef = useRef(false);

  const loadMessages = useCallback(async (reset = false) => {
    if (!userId || !selectedUserId || isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      if (reset) {
        currentPageRef.current = 0;
        setMessages([]);
        setHasMore(true);
      }

      const result = await chatService.getChatMessages({
        type: 'direct',
        senderId: userId,
        receiverId: selectedUserId,
        page: currentPageRef.current,
        pageSize
      });

      if (result.success && 'data' in result) {
        const newMessages = result.data.map((msg: any): ChatMessage => ({
          id: msg.id,
          senderId: msg.sender_id,
          receiverId: msg.receiver_id,
          message: msg.message,
          timestamp: new Date(msg.created_at),
          type: msg.type
        }));

        if (reset) {
          setMessages(newMessages);
        } else {
          setMessages(prev => [...prev, ...newMessages]);
        }

        // Check if we have more messages
        setHasMore(newMessages.length === pageSize);
        currentPageRef.current += 1;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [userId, selectedUserId, pageSize]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadMessages(false);
    }
  }, [hasMore, loading, loadMessages]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const resetMessages = useCallback(() => {
    loadMessages(true);
  }, [loadMessages]);

  return {
    messages,
    loading,
    hasMore,
    error,
    loadMore,
    addMessage,
    resetMessages,
    loadMessages
  };
}; 