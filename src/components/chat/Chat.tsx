import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { chatService } from '../../services/chatService';
import { userService } from '../../services/userService';
import { ChatMessage, User } from '../../types';
import { Send, Users, MessageCircle } from 'lucide-react';

const Chat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [chatType, setChatType] = useState<'direct'>('direct');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load users
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load users
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

  // Load messages when chat selection changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!user) return;

      try {
        let filters: any = {};
        
        if (chatType === 'direct' && selectedUser) {
          filters = {
            senderId: user.id,
            receiverId: selectedUser.id,
            type: 'direct'
          };
        } else {
          setMessages([]);
          return;
        }

        const result = await chatService.getChatMessages(filters);
        if (result.success && 'data' in result) {
          const mappedMessages = result.data.map((msg: any) => ({
            id: msg.id,
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            message: msg.message,
            timestamp: new Date(msg.created_at),
            type: msg.type
          }));
          setMessages(mappedMessages);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
  }, [selectedUser, chatType, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const messageData: Omit<ChatMessage, 'id' | 'timestamp'> = {
        senderId: user.id,
        receiverId: chatType === 'direct' ? selectedUser?.id : undefined,
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
        
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
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

  return (
    <div className="p-6 h-[600px] flex flex-col">
      <div className="flex justify-between items-center mb-6 sticky top-0 z-10 bg-white">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ICE Communication Hub</h1>
          <p className="text-gray-600">Connect and collaborate with your team</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Chat List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col h-screen">
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setChatType('direct')}
              className="flex-1 px-3 py-2 text-sm rounded-lg transition-colors bg-amber-100 text-amber-800"
            >
              <Users className="h-4 w-4 inline mr-1" />
              Members
            </button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
            {users.map((userItem) => (
              <button
                key={userItem.id}
                onClick={() => setSelectedUser(userItem)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedUser?.id === userItem.id
                    ? 'bg-amber-50 border border-amber-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-amber-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-amber-800">
                      {userItem.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{userItem.name}</p>
                    <p className="text-xs text-gray-500">{userItem.designation || userItem.role.replace('_', ' ')}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        {/* Chat Window */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-screen">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 sticky top-0 z-10 bg-white">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-amber-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-amber-800">
                      {selectedUser?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedUser?.name}</p>
                    <p className="text-xs text-gray-500">
                      {selectedUser?.designation || selectedUser?.role.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto min-h-0">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === user?.id
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderId === user?.id ? 'text-amber-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Select a member to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;