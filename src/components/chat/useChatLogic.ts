import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { storage } from '../../utils/storage';
import { chatService } from '../../services/chatService';
import { userService } from '../../services/userService';
import { notificationService } from '../../services/notificationService';
import { ChatMessage, User } from '../../types';
import { supabase } from '../../lib/supabase';

// Debounce utility for localStorage writes
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

export const useChatLogic = () => {
  const user = useAuthStore((state) => state.user);
  
  // Core state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [chatType, setChatType] = useState<'direct'>('direct');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [unreadMap, setUnreadMap] = useState<{ [userId: string]: number }>({});
  const [lastMessages, setLastMessages] = useState<{ [userId: string]: ChatMessage | undefined }>({});
  
  // Separate read messages state to avoid hydration issues
  const [readMessages, setReadMessages] = useState<Set<string>>(new Set());
  const [isReadMessagesLoaded, setIsReadMessagesLoaded] = useState(false);
  
  // Refs for cleanup and debouncing
  const subscriptionRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const pendingReadMessagesRef = useRef<Set<string>>(new Set());
  
  // Debounced localStorage writer
  const debouncedSaveReadMessages = useMemo(
    () => debounce((readMessages: Set<string>) => {
      if (user) {
        localStorage.setItem(`readMessages_${user.id}`, JSON.stringify(Array.from(readMessages)));
      }
    }, 1000),
    [user]
  );

  // Load read messages from localStorage after mount (prevents hydration mismatch)
  useEffect(() => {
    if (!user || isReadMessagesLoaded) return;
    
    try {
      const key = `readMessages_${user.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setReadMessages(new Set(parsed));
      }
    } catch (error) {
      console.error('Error loading read messages:', error);
    } finally {
      setIsReadMessagesLoaded(true);
    }
  }, [user, isReadMessagesLoaded]);

  // Save read messages to localStorage when they change
  useEffect(() => {
    if (isReadMessagesLoaded && user) {
      debouncedSaveReadMessages(readMessages);
    }
  }, [readMessages, isReadMessagesLoaded, user, debouncedSaveReadMessages]);

  // Memoized function to mark messages as read
  const markMessagesAsRead = useCallback((userId: string, messageIds: string[]) => {
    if (!user || !isReadMessagesLoaded) return;
    
    // Update read messages state
    setReadMessages(prev => {
      const updated = new Set([...prev, ...messageIds]);
      return updated;
    });
    
    // Update unread count for this user
    setUnreadMap(prev => ({
      ...prev,
      [userId]: 0
    }));
  }, [user, isReadMessagesLoaded]);

  // Memoized function to calculate unread messages
  const calculateUnreadMessages = useCallback((allMessages: ChatMessage[], userId: string) => {
    if (!user || !isReadMessagesLoaded) return 0;
    
    // Only count messages FROM the other user TO current user that haven't been read
    const unreadMessages = allMessages.filter((msg: ChatMessage) => 
      msg.senderId === userId && 
      msg.receiverId === user.id && 
      !readMessages.has(msg.id)
    );
    
    return unreadMessages.length;
  }, [user, readMessages, isReadMessagesLoaded]);

  // Load users (single responsibility)
  useEffect(() => {
    if (!user) return;
    
    const loadUsers = async () => {
      try {
        setLoading(true);
        const usersResult = await userService.getUsers();
        if (usersResult.success && 'data' in usersResult) {
          const mappedUsers = usersResult.data
            .filter((profile: any) => profile.id !== user.id)
            .map((profile: any) => ({
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role,
              designation: profile.designation,
              departmentId: profile.department_id,
              createdAt: new Date(profile.created_at)
            }));
          setUsers(mappedUsers);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [user]);

  // Load messages for selected user (single responsibility)
  useEffect(() => {
    if (!user || !selectedUser || !isReadMessagesLoaded) return;
    
    const fetchSelectedChat = async () => {
      try {
        const result = await chatService.getChatMessages({
          type: 'direct',
          senderId: user.id,
          receiverId: selectedUser.id
        });
        
        if (result.success && 'data' in result) {
          const mappedMessages = result.data.map((msg: any): ChatMessage => ({
            id: msg.id,
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            message: msg.message,
            timestamp: new Date(msg.created_at),
            type: msg.type
          }));
          
          // Sort messages by timestamp
          mappedMessages.sort((a: ChatMessage, b: ChatMessage) => a.timestamp.getTime() - b.timestamp.getTime());
          setMessages(mappedMessages);
          
          // Mark messages as read when viewing a chat
          const messageIds = mappedMessages
            .filter((msg: ChatMessage) => msg.senderId === selectedUser.id && msg.receiverId === user.id)
            .map((msg: ChatMessage) => msg.id);
          
          if (messageIds.length > 0) {
            markMessagesAsRead(selectedUser.id, messageIds);
          }
        }
      } catch (error) {
        console.error('Error fetching chat messages:', error);
      }
    };
    
    fetchSelectedChat();
  }, [user, selectedUser, isReadMessagesLoaded, markMessagesAsRead]);

  // Initialize chat data and set up realtime subscription (single responsibility)
  useEffect(() => {
    if (!user || users.length === 0 || !isReadMessagesLoaded || isInitializedRef.current) return;
    
    isInitializedRef.current = true;

    const fetchInitialData = async () => {
      try {
        // Fetch all messages where current user is involved
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .eq('type', 'direct')
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching initial chat data:', error);
          return;
        }

        const allMsgs = data.map((msg: any): ChatMessage => ({
          id: msg.id,
          senderId: msg.sender_id,
          receiverId: msg.receiver_id,
          message: msg.message,
          timestamp: new Date(msg.created_at),
          type: msg.type
        }));
        
        // Update last messages and unread counts for sidebar
        const lastMessageMap: { [userId: string]: ChatMessage | undefined } = {};
        const unreadCounts: { [userId: string]: number } = {};
        
        users.forEach(u => {
          const userMsgs = allMsgs.filter((m: ChatMessage) => 
            (m.senderId === u.id && m.receiverId === user.id) ||
            (m.senderId === user.id && m.receiverId === u.id)
          );
          
          if (userMsgs.length > 0) {
            // Sort by timestamp and get the latest
            userMsgs.sort((a: ChatMessage, b: ChatMessage) => b.timestamp.getTime() - a.timestamp.getTime());
            lastMessageMap[u.id] = userMsgs[0];
            
            // Calculate unread messages properly
            unreadCounts[u.id] = calculateUnreadMessages(allMsgs, u.id);
          }
        });
        
        setLastMessages(lastMessageMap);
        setUnreadMap(unreadCounts);
      } catch (error) {
        console.error('Error fetching initial chat data:', error);
      }
    };

    fetchInitialData();

    // Subscribe to realtime updates
    const channel = supabase.channel('realtime:chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `sender_id=eq.${user.id} OR receiver_id=eq.${user.id}`,
      }, (payload) => {
        const msg = payload.new;
        const newMsg: ChatMessage = {
          id: msg.id,
          senderId: msg.sender_id,
          receiverId: msg.receiver_id,
          message: msg.message,
          timestamp: new Date(msg.created_at),
          type: msg.type
        };
        
        // Determine the other user in the conversation
        const otherUserId = newMsg.senderId === user.id ? newMsg.receiverId : newMsg.senderId;
        
        if (otherUserId) {
          // Update last messages for sidebar
          setLastMessages(prev => ({
            ...prev,
            [otherUserId]: newMsg
          }));
          
          // Update unread count only if message is FROM other user TO current user
          if (newMsg.senderId === otherUserId && newMsg.receiverId === user.id) {
            if (selectedUser?.id !== otherUserId) {
              // If we're not viewing this chat, increment unread count
              setUnreadMap(prev => ({
                ...prev,
                [otherUserId]: (prev[otherUserId] || 0) + 1
              }));
            } else {
              // If we are viewing this chat, ensure unread count is 0
              setUnreadMap(prev => ({
                ...prev,
                [otherUserId]: 0
              }));
            }
          }
        }
        
        // If this message is for the currently selected chat, add to messages
        if (
          selectedUser &&
          ((newMsg.senderId === user.id && newMsg.receiverId === selectedUser.id) ||
           (newMsg.senderId === selectedUser.id && newMsg.receiverId === user.id))
        ) {
          setMessages(prev => [...prev, newMsg]);
          
          // If it's a message from the selected user, mark it as read immediately
          if (newMsg.senderId === selectedUser.id) {
            markMessagesAsRead(selectedUser.id, [newMsg.id]);
          }
        }
      });
    
    channel.subscribe();
    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [user, users, selectedUser, isReadMessagesLoaded, calculateUnreadMessages, markMessagesAsRead]);

  // Clear unread count when selected user changes (single responsibility)
  useEffect(() => {
    if (selectedUser && user) {
      setUnreadMap(prev => ({
        ...prev,
        [selectedUser.id]: 0
      }));
    }
  }, [selectedUser, user]);

  // Handle sending messages
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedUser) return;

    try {
      const messageData: Omit<ChatMessage, 'id' | 'timestamp'> = {
        senderId: user.id,
        receiverId: selectedUser.id,
        message: newMessage.trim(),
        type: chatType,
      };

      const result = await chatService.sendMessage(messageData);
      if (result.success && 'data' in result) {
        const newMsg: ChatMessage = {
          id: result.data.id,
          senderId: result.data.sender_id,
          receiverId: result.data.receiver_id,
          message: result.data.message,
          timestamp: new Date(result.data.created_at),
          type: result.data.type
        };
        
        // Add to current messages
        setMessages(prev => [...prev, newMsg]);
        
        // Update last message for sidebar
        setLastMessages(prev => ({
          ...prev,
          [selectedUser.id]: newMsg
        }));
        
        setNewMessage('');
        
        // Send notification to receiver
        await notificationService.createGeneralNotification(
          selectedUser.id,
          'New Message',
          `${user.name}: ${newMsg.message}`
        );
        
        if (Notification.permission === 'granted') {
          new Notification('New Message', {
            body: `${user.name}: ${newMsg.message}`,
            icon: '/vite.svg',
            tag: `chat-${selectedUser.id}`,
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [newMessage, user, selectedUser, chatType]);

  // Handle user selection
  const handleUserSelect = useCallback((userItem: User) => {
    setSelectedUser(userItem);
    
    // Immediately clear unread count for this user since we're viewing their chat
    setUnreadMap(prev => ({
      ...prev,
      [userItem.id]: 0
    }));
  }, []);

  return {
    user,
    messages,
    newMessage,
    setNewMessage,
    selectedUser,
    users,
    loading,
    userSearch,
    setUserSearch,
    unreadMap,
    lastMessages,
    handleSendMessage,
    handleUserSelect,
    markMessagesAsRead,
    calculateUnreadMessages,
    isReadMessagesLoaded
  };
}; 