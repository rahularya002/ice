import React from 'react';
import { useChatLogic } from './useChatLogic';
import ChatSidebar from './ChatSidebar';
import ChatArea from './ChatArea';
import ChatErrorBoundary from './ChatErrorBoundary';

const Chat: React.FC = () => {
  const {
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
    isReadMessagesLoaded
  } = useChatLogic();

  if (loading || !isReadMessagesLoaded) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading ? 'Loading chat...' : 'Initializing...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ChatErrorBoundary>
      <div className="flex h-full overflow-hidden bg-gray-50 rounded-lg shadow-lg">
        <ChatSidebar
          users={users}
          selectedUser={selectedUser}
          userSearch={userSearch}
          setUserSearch={setUserSearch}
          onUserSelect={handleUserSelect}
          lastMessages={lastMessages}
          unreadMap={unreadMap}
          currentUserId={user?.id || ''}
        />
        <ChatArea
          selectedUser={selectedUser}
          messages={messages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSendMessage={handleSendMessage}
          currentUserId={user?.id || ''}
        />
      </div>
    </ChatErrorBoundary>
  );
};

export default Chat;