import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { storage } from '../../utils/storage';
import { chatService } from '../../services/chatService';
import { userService } from '../../services/userService';
import { notificationService } from '../../services/notificationService';
import { ChatMessage, User } from '../../types';
import { Send, Users, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Chat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [chatType, setChatType] = useState<'direct'>('direct');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userSearch, setUserSearch] = useState('');
  const [unreadMap, setUnreadMap] = useState<{ [userId: string]: number }>({});
  const [lastMessages, setLastMessages] = useState<{ [userId: string]: ChatMessage | undefined }>({});
  const [readMessages, setReadMessages] = useState<Set<string>>(() => {
    // Load read messages from localStorage for this user
    const { user } = storage.getCurrentUser ? { user: storage.getCurrentUser() } : { user: null };
    if (user) {
      const key = `readMessages_${user.id}`;
      const saved = localStorage.getItem(key);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  const subscriptionRef = useRef<any>(null);

  // Load users
  useEffect(() => {
    const loadData = async () => {
      try {
        const usersResult = await userService.getUsers();
        if (usersResult.success && 'data' in usersResult) {
          const mappedUsers = usersResult.data
            .filter((profile: any) => profile.id !== user?.id)
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
        console.error('Error loading chat data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  // Function to mark messages as read
  const markMessagesAsRead = (userId: string, messageIds: string[]) => {
    if (!user) return;
    // Update local state
    setUnreadMap(prev => {
      const updated = { ...prev, [userId]: 0 };
      return updated;
    });
    // Update readMessages state and localStorage
    setReadMessages(prev => {
      const updated = new Set([...prev, ...messageIds]);
      localStorage.setItem(`readMessages_${user.id}`, JSON.stringify(Array.from(updated)));
      return updated;
    });
  };

  // Load messages when selected user changes
  useEffect(() => {
    if (!user || !selectedUser) return;
    
    const fetchSelectedChat = async () => {
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
        setMessages(mappedMessages);
        
        // Mark messages as read when viewing a chat
        const messageIds = mappedMessages.map((msg: ChatMessage) => msg.id);
        markMessagesAsRead(selectedUser.id, messageIds);
      }
    };
    
    fetchSelectedChat();
  }, [user, selectedUser]);

  // Enhanced function to calculate unread messages
  const calculateUnreadMessages = (allMessages: ChatMessage[], userId: string) => {
    if (!user) return 0;
    
    // Only count messages FROM the other user TO current user that haven't been read
    const unreadMessages = allMessages.filter((msg: ChatMessage) => 
      msg.senderId === userId && 
      msg.receiverId === user.id && 
      !readMessages.has(msg.id)
    );
    
    return unreadMessages.length;
  };

  // Supabase realtime subscription
  useEffect(() => {
    if (!user) return;

    const fetchInitialData = async () => {
      const result = await chatService.getChatMessages({ type: 'direct', senderId: user.id });
      if (result.success && 'data' in result) {
        const allMsgs = result.data.map((msg: any): ChatMessage => ({
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
            m.senderId === u.id || m.receiverId === u.id
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
      }
    };

    fetchInitialData();

    // Subscribe to realtime updates
    const channel = supabase.channel('realtime:chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
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
        
        // Update last messages for sidebar
        const otherUserId = newMsg.senderId === user.id ? newMsg.receiverId : newMsg.senderId;
        if (otherUserId) {
          setLastMessages(prev => ({
            ...prev,
            [otherUserId]: newMsg
          }));
          
          // Update unread count only if message is FROM other user TO current user
          // and we're not currently viewing this chat
          if (selectedUser?.id !== otherUserId && newMsg.senderId === otherUserId && newMsg.receiverId === user.id) {
            setUnreadMap(prev => ({
              ...prev,
              [otherUserId]: (prev[otherUserId] || 0) + 1
            }));
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
      }
    };
  }, [user, users, selectedUser, readMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
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
        
        // Mark our own message as read
        markMessagesAsRead(selectedUser.id, [newMsg.id]);
        
        setNewMessage('');
        
        // Send notification to receiver
        if (selectedUser.id !== user.id) {
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
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle user selection with read marking
  const handleUserSelect = async (userItem: User) => {
    setSelectedUser(userItem);
    // The useEffect will handle marking messages as read
  };

  if (loading) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  // Calculate sidebar users
  const searchLower = userSearch.toLowerCase();
  // Show all users except the current user, filtered by search
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchLower)
  );

  // Sort users: recent chats first, then alphabetically
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aHasMessages = lastMessages[a.id] !== undefined;
    const bHasMessages = lastMessages[b.id] !== undefined;
    
    if (aHasMessages && !bHasMessages) return -1;
    if (!aHasMessages && bHasMessages) return 1;
    
    if (aHasMessages && bHasMessages) {
      const aTime = lastMessages[a.id]?.timestamp.getTime() || 0;
      const bTime = lastMessages[b.id]?.timestamp.getTime() || 0;
      return bTime - aTime;
    }
    
    return a.name.localeCompare(b.name);
  });
  return (
    <div className="flex h-full overflow-hidden bg-gray-50 rounded-lg shadow-lg">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center space-x-2">
          <Users className="h-5 w-5 text-amber-600" />
          <span className="font-semibold text-lg text-gray-900">Chats</span>
        </div>
        
        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <input
            type="text"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
          />
        </div>
        
        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {sortedUsers.length === 0 ? (
            <div className="text-gray-400 text-sm text-center mt-8 px-4">
              No users found
            </div>
          ) : (
            <div className="py-2">
              {sortedUsers.map((userItem) => {
                const lastMsg = lastMessages[userItem.id];
                const unreadCount = unreadMap[userItem.id] || 0;
                const isSelected = selectedUser?.id === userItem.id;
                
                return (
                  <button
                    key={userItem.id}
                    onClick={() => handleUserSelect(userItem)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors duration-150 ${
                      isSelected
                        ? 'bg-amber-50 border-r-4 border-amber-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative">
                      <div className="h-12 w-12 bg-amber-200 rounded-full flex items-center justify-center text-lg font-bold text-amber-800">
                        {userItem.name.charAt(0).toUpperCase()}
                      </div>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-medium text-gray-900 truncate">
                        {userItem.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {lastMsg ? (
                          <>
                            {lastMsg.senderId === user?.id ? 'You: ' : ''}
                            {lastMsg.message}
                          </>
                        ) : (
                          'No messages yet'
                        )}
                      </p>
                    </div>
                    {lastMsg && (
                      <div className="text-xs text-gray-400">
                        {lastMsg.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center space-x-3 p-4 border-b border-gray-200 bg-white">
              <div className="relative">
                <div className="h-10 w-10 bg-amber-200 rounded-full flex items-center justify-center text-lg font-bold text-amber-800">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-green-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                <p className="text-sm text-gray-500">{selectedUser.designation || 'Online'}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 px-4 py-4 overflow-y-auto bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, idx) => {
                    const isMine = message.senderId === user?.id;
                    const prevMsg = messages[idx - 1];
                    const showAvatar = !prevMsg || prevMsg.senderId !== message.senderId;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md ${isMine ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              isMine
                                ? 'bg-amber-600 text-white'
                                : 'bg-white text-gray-900 border border-gray-200'
                            }`}
                          >
                            <p className="text-sm break-words">{message.message}</p>
                          </div>
                          <div className={`text-xs mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                            <span className="text-gray-500">
                              {message.timestamp.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-amber-600 text-white rounded-full hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Select a user to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;