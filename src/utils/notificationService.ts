import { storage } from './storage';
import { Notification as AppNotification, Task, User } from '../types';

export const notificationService = {
  // Create notification when task is assigned
  createTaskAssignedNotification: (task: Task, assignedUser: User, assignedByUser: User) => {
    const notification: AppNotification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId: assignedUser.id,
      title: 'New Task Assigned',
      message: `${assignedByUser.name} assigned you a new task: "${task.title}"`,
      type: 'task_assigned',
      read: false,
      createdAt: new Date(),
    };

    storage.addNotification(notification);
    
    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification('ICE Portal - New Task Assigned', {
        body: `${assignedByUser.name} assigned you: "${task.title}"`,
        icon: '/vite.svg',
        tag: `task-${task.id}`,
      });
    }
  },

  // Create notification when task status is updated
  createTaskUpdatedNotification: (task: Task, updatedByUser: User, oldStatus: string, newStatus: string) => {
    const users = storage.getUsers();
    const assignedUser = users.find(u => u.id === task.assignedTo);
    const assignedByUser = users.find(u => u.id === task.assignedBy);

    // Notify the person who assigned the task (if different from updater)
    if (assignedByUser && assignedByUser.id !== updatedByUser.id) {
      const notification: AppNotification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        userId: assignedByUser.id,
        title: 'Task Status Updated',
        message: `${updatedByUser.name} updated task "${task.title}" from ${oldStatus.replace('_', ' ')} to ${newStatus.replace('_', ' ')}`,
        type: 'task_updated',
        read: false,
        createdAt: new Date(),
      };

      storage.addNotification(notification);
    }

    // Notify the assigned user (if different from updater)
    if (assignedUser && assignedUser.id !== updatedByUser.id) {
      const notification: AppNotification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        userId: assignedUser.id,
        title: 'Your Task Status Updated',
        message: `Task "${task.title}" status changed from ${oldStatus.replace('_', ' ')} to ${newStatus.replace('_', ' ')}`,
        type: 'task_updated',
        read: false,
        createdAt: new Date(),
      };

      storage.addNotification(notification);
    }
  },

  // Create notification when task is completed
  createTaskCompletedNotification: (task: Task, completedByUser: User) => {
    const users = storage.getUsers();
    const assignedByUser = users.find(u => u.id === task.assignedBy);

    if (assignedByUser && assignedByUser.id !== completedByUser.id) {
      const notification: AppNotification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        userId: assignedByUser.id,
        title: 'Task Completed',
        message: `${completedByUser.name} completed the task: "${task.title}"`,
        type: 'task_completed',
        read: false,
        createdAt: new Date(),
      };

      storage.addNotification(notification);

      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('ICE Portal - Task Completed', {
          body: `${completedByUser.name} completed: "${task.title}"`,
          icon: '/vite.svg',
          tag: `task-completed-${task.id}`,
        });
      }
    }
  },

  // Create notification for project updates
  createProjectUpdateNotification: (projectId: string, title: string, message: string, updatedByUser: User) => {
    const projects = storage.getProjects();
    const users = storage.getUsers();
    const project = projects.find(p => p.id === projectId);

    if (project) {
      // Notify all project members
      const memberIds = [...project.memberIds, project.managerId];
      
      memberIds.forEach(memberId => {
        if (memberId !== updatedByUser.id) {
          const notification: AppNotification = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId: memberId,
            title,
            message,
            type: 'project_update',
            read: false,
            createdAt: new Date(),
          };

          storage.addNotification(notification);
        }
      });
    }
  },

  // Request browser notification permission
  requestNotificationPermission: async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  },

  // Create general notification
  createGeneralNotification: (userId: string, title: string, message: string) => {
    const notification: AppNotification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId,
      title,
      message,
      type: 'general',
      read: false,
      createdAt: new Date(),
    };

    storage.addNotification(notification);
  },
};