import React from 'react';
import { User, ChatMessage } from '../../types';
import { Users } from 'lucide-react';

interface ChatSidebarProps {
  users: User[];
  selectedUser: User | null;
  userSearch: string;
  setUserSearch: (search: string) => void;
  onUserSelect: (user: User) => void;
  lastMessages: { [userId: string]: ChatMessage | undefined };
  unreadMap: { [userId: string]: number };
  currentUserId: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  users,
  selectedUser,
  userSearch,
  setUserSearch,
  onUserSelect,
  lastMessages,
  unreadMap,
  currentUserId
}) => {
  // Calculate sidebar users
  const searchLower = userSearch.toLowerCase();
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
                  onClick={() => onUserSelect(userItem)}
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
                          {lastMsg.senderId === currentUserId ? 'You: ' : ''}
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
  );
};

export default ChatSidebar; 