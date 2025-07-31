import React, { useRef, useEffect } from 'react';
import { User, ChatMessage } from '../../types';
import { Send, MessageCircle } from 'lucide-react';

interface ChatAreaProps {
  selectedUser: User | null;
  messages: ChatMessage[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  currentUserId: string;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  selectedUser,
  messages,
  newMessage,
  setNewMessage,
  onSendMessage,
  currentUserId
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Select a user to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
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
              const isMine = message.senderId === currentUserId;
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
      <form onSubmit={onSendMessage} className="p-4 border-t border-gray-200 bg-white">
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
    </div>
  );
};

export default ChatArea; 