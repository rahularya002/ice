import { supabase, handleSupabaseError, handleSupabaseSuccess } from '../lib/supabase';
import { Notification as AppNotification } from '../types';

export const notificationService = {
  // Get notifications for a user
  async getNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Create notification
  async createNotification(notificationData: Omit<AppNotification, 'id' | 'createdAt'>) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notificationData.userId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          read: notificationData.read || false
        })
        .select()
        .single();

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(null);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Delete notification
  async deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(null);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Request notification permission
  requestNotificationPermission: async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  },

  // Create task assigned notification
  createTaskAssignedNotification: async (task: any, assignedUser: any, assignedByUser: any) => {
    const notificationData = {
      userId: assignedUser.id,
      title: 'New Task Assigned',
      message: `${assignedByUser.name} assigned you a new task: "${task.title}"`,
      type: 'task_assigned' as const,
      read: false
    };

    await notificationService.createNotification(notificationData);
    
    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification('ICE Portal - New Task Assigned', {
        body: `${assignedByUser.name} assigned you: "${task.title}"`,
        icon: '/vite.svg',
        tag: `task-${task.id}`,
      });
    }
  },

  // Create task updated notification
  createTaskUpdatedNotification: async (task: any, updatedByUser: any, oldStatus: string, newStatus: string) => {
    // Implementation for task update notifications
    const notificationData = {
      userId: task.assignedBy,
      title: 'Task Status Updated',
      message: `${updatedByUser.name} updated task "${task.title}" from ${oldStatus.replace('_', ' ')} to ${newStatus.replace('_', ' ')}`,
      type: 'task_updated' as const,
      read: false
    };

    await notificationService.createNotification(notificationData);
  },

  // Create task completed notification
  createTaskCompletedNotification: async (task: any, completedByUser: any) => {
    const notificationData = {
      userId: task.assignedBy,
      title: 'Task Completed',
      message: `${completedByUser.name} completed the task: "${task.title}"`,
      type: 'task_completed' as const,
      read: false
    };

    await notificationService.createNotification(notificationData);

    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification('ICE Portal - Task Completed', {
        body: `${completedByUser.name} completed: "${task.title}"`,
        icon: '/vite.svg',
        tag: `task-completed-${task.id}`,
      });
    }
  },

  // Create general notification
  createGeneralNotification: async (userId: string, title: string, message: string) => {
    const notificationData = {
      userId,
      title,
      message,
      type: 'general' as const,
      read: false
    };

    await notificationService.createNotification(notificationData);
  }
};