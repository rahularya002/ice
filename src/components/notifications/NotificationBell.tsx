import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import { Bell } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const updateUnreadCount = async () => {
        try {
          const result = await notificationService.getNotifications(user.id);
          if (result.success) {
            const unread = result.data.filter((n: any) => !n.read).length;
            setUnreadCount(unread);
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };

      updateUnreadCount();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(updateUnreadCount, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleBellClick = () => {
    setIsNotificationCenterOpen(true);
  };

  return (
    <>
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
    </>
  );
};

export default NotificationBell;