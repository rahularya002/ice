import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import { Notification as AppNotification } from '../../types';
import { Bell, X, Check, Clock, User, CheckSquare, AlertCircle } from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      const loadNotifications = async () => {
        setLoading(true);
        try {
          const result = await notificationService.getNotifications(user.id);
          if (result.success && 'data' in result) {
            const mappedNotifications = result.data.map((notification: any) => ({
              id: notification.id,
              userId: notification.user_id,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              read: notification.read,
              createdAt: new Date(notification.created_at)
            }));
            setNotifications(mappedNotifications);
          }
        } catch (error) {
          console.error('Error loading notifications:', error);
        } finally {
          setLoading(false);
        }
      };

      loadNotifications();
    }
  }, [user, isOpen]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await notificationService.markAsRead(notificationId);
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      const result = await notificationService.markAllAsRead(user.id);
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'task_assigned':
        return <CheckSquare className="h-5 w-5 text-blue-600" />;
      case 'task_updated':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'task_completed':
        return <Check className="h-5 w-5 text-green-600" />;
      case 'project_update':
        return <User className="h-5 w-5 text-purple-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-16 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {notifications.filter(n => !n.read).length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-amber-600 hover:text-amber-800"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-amber-50 border-l-4 border-amber-500' : ''
                  }`}
                  onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </p>
                      <p className={`text-sm ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {getTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No notifications yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;