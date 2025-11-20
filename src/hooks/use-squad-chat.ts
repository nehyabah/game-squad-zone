import { useState, useEffect, useCallback, useRef } from 'react';
import { chatApi, type ChatMessage, type SendMessageData } from '@/lib/api/chat';

export function useSquadChat(squadId: string | null, refreshInterval = 15000) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);
  const isPageVisible = useRef(true);

  const loadMessages = useCallback(async (showLoading = true) => {
    if (!squadId || !isActiveRef.current) return;
    
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      const fetchedMessages = await chatApi.getSquadMessages(squadId);
      if (isActiveRef.current) {
        // Update messages with deduplication
        setMessages(prevMessages => {
          // If this is the initial load or the messages are different, update
          if (!showLoading || JSON.stringify(prevMessages) !== JSON.stringify(fetchedMessages)) {
            return fetchedMessages;
          }
          return prevMessages;
        });
      }
    } catch (err) {
      if (isActiveRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load messages');
      }
    } finally {
      if (showLoading && isActiveRef.current) {
        setLoading(false);
      }
    }
  }, [squadId]);

  const sendMessage = useCallback(async (data: SendMessageData) => {
    if (!squadId) return;

    try {
      setSending(true);
      setError(null);
      const newMessage = await chatApi.sendMessage(squadId, data);
      if (isActiveRef.current) {
        setMessages(prev => [...prev, newMessage]);
        // Refresh messages after sending to ensure we have the latest state
        setTimeout(() => loadMessages(false), 500);
      }
    } catch (err) {
      if (isActiveRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
      }
      throw err;
    } finally {
      if (isActiveRef.current) {
        setSending(false);
      }
    }
  }, [squadId, loadMessages]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!squadId) return;

    try {
      await chatApi.deleteMessage(squadId, messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
      throw err;
    }
  }, [squadId]);

  const refetch = useCallback(() => {
    loadMessages();
  }, [loadMessages]);

  // Start/stop polling based on squadId
  useEffect(() => {
    isActiveRef.current = true;

    if (squadId) {
      // Load initial messages
      loadMessages();
      
      // Set up polling for new messages
      intervalRef.current = setInterval(() => {
        if (isPageVisible.current) {
          loadMessages(false); // Don't show loading spinner for polling
        }
      }, refreshInterval);
    } else {
      setMessages([]);
      setError(null);
    }

    // Cleanup function
    return () => {
      isActiveRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [squadId, refreshInterval, loadMessages]);

  // Page visibility handler to pause polling when page is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden;
      // Immediately refresh when page becomes visible again
      if (!document.hidden && squadId) {
        loadMessages(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [squadId, loadMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    deleteMessage,
    refetch,
    isPolling: !!squadId && !!intervalRef.current,
  };
}