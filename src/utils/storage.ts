import { User, Department, Task, ChatMessage, TimeEntry, Notification, PerformanceMetrics, TaskSubmission, TaskComment, Designation } from '../types';

const STORAGE_KEYS = {
  USERS: 'office_users',
  DEPARTMENTS: 'office_departments',
  PROJECTS: 'office_projects',
  TASKS: 'office_tasks',
  CHAT_MESSAGES: 'office_chat_messages',
  TIME_ENTRIES: 'office_time_entries',
  NOTIFICATIONS: 'office_notifications',
  PERFORMANCE_METRICS: 'office_performance_metrics',
  TASK_SUBMISSIONS: 'office_task_submissions',
  TASK_COMMENTS: 'office_task_comments',
  DESIGNATIONS: 'office_designations',
  CURRENT_USER: 'office_current_user',
} as const;

// Initialize default data
const initializeDefaultData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const defaultUsers: User[] = [
      {
        id: '1',
        email: 'admin@company.com',
        name: 'Admin User',
        role: 'admin',
        designation: 'Chief Executive Officer',
        createdAt: new Date(),
      },
      {
        id: '2',
        email: 'manager@company.com',
        name: 'Sarah Manager',
        role: 'manager',
        designation: 'Vice President',
        departmentId: '1',
        createdAt: new Date(),
      },
      {
        id: '3',
        email: 'projectmanager@company.com',
        name: 'John Project Manager',
        role: 'project_manager',
        designation: 'Director',
        departmentId: '1',
        createdAt: new Date(),
      },
      {
        id: '4',
        email: 'employee@company.com',
        name: 'Jane Employee',
        role: 'employee',
        designation: 'Senior Associate',
        departmentId: '1',
        createdAt: new Date(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
    const defaultDepartments: Department[] = [
      {
        id: '1',
        name: 'Operations',
        description: 'Main operations department',
        managerId: '2',
        createdAt: new Date(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(defaultDepartments));
  }

  if (!localStorage.getItem(STORAGE_KEYS.DESIGNATIONS)) {
    const defaultDesignations: Designation[] = [
      // Executive Level
      { id: '1', name: 'Chief Executive Officer', description: 'Top executive responsible for overall company operations', isCustom: false, createdAt: new Date() },
      { id: '2', name: 'Chief Operating Officer', description: 'Executive responsible for day-to-day operations', isCustom: false, createdAt: new Date() },
      { id: '3', name: 'Chief Financial Officer', description: 'Executive responsible for financial operations', isCustom: false, createdAt: new Date() },
      { id: '4', name: 'Chief Technology Officer', description: 'Executive responsible for technology strategy', isCustom: false, createdAt: new Date() },
      { id: '5', name: 'President', description: 'Senior executive position, often second to CEO', isCustom: false, createdAt: new Date() },
      
      // Senior Management
      { id: '6', name: 'Vice President', description: 'Senior management position overseeing major divisions', isCustom: false, createdAt: new Date() },
      { id: '7', name: 'Senior Vice President', description: 'High-level executive position', isCustom: false, createdAt: new Date() },
      { id: '8', name: 'Executive Vice President', description: 'Top-tier executive position', isCustom: false, createdAt: new Date() },
      { id: '9', name: 'Director', description: 'Senior management role overseeing departments or major functions', isCustom: false, createdAt: new Date() },
      { id: '10', name: 'Senior Director', description: 'High-level director position', isCustom: false, createdAt: new Date() },
      
      // Middle Management
      { id: '11', name: 'Manager', description: 'Mid-level management position', isCustom: false, createdAt: new Date() },
      { id: '12', name: 'Senior Manager', description: 'Experienced management role', isCustom: false, createdAt: new Date() },
      { id: '13', name: 'Assistant Manager', description: 'Entry-level management position', isCustom: false, createdAt: new Date() },
      { id: '14', name: 'Team Lead', description: 'Leadership role for specific teams', isCustom: false, createdAt: new Date() },
      { id: '15', name: 'Supervisor', description: 'Oversees day-to-day operations of a team', isCustom: false, createdAt: new Date() },
      
      // Professional Levels
      { id: '16', name: 'Principal', description: 'Senior individual contributor or specialist', isCustom: false, createdAt: new Date() },
      { id: '17', name: 'Senior Principal', description: 'High-level specialist or expert', isCustom: false, createdAt: new Date() },
      { id: '18', name: 'Senior Associate', description: 'Experienced professional level', isCustom: false, createdAt: new Date() },
      { id: '19', name: 'Associate', description: 'Mid-level professional position', isCustom: false, createdAt: new Date() },
      { id: '20', name: 'Junior Associate', description: 'Entry-level professional position', isCustom: false, createdAt: new Date() },
      
      // Specialist Roles
      { id: '21', name: 'Senior Specialist', description: 'Experienced specialist in a particular field', isCustom: false, createdAt: new Date() },
      { id: '22', name: 'Specialist', description: 'Professional with specialized skills', isCustom: false, createdAt: new Date() },
      { id: '23', name: 'Consultant', description: 'Expert advisor in specific areas', isCustom: false, createdAt: new Date() },
      { id: '24', name: 'Senior Consultant', description: 'Experienced consulting professional', isCustom: false, createdAt: new Date() },
      { id: '25', name: 'Analyst', description: 'Professional who analyzes data and processes', isCustom: false, createdAt: new Date() },
      
      // Coordinator/Administrative
      { id: '26', name: 'Coordinator', description: 'Organizes and manages specific functions', isCustom: false, createdAt: new Date() },
      { id: '27', name: 'Senior Coordinator', description: 'Experienced coordination role', isCustom: false, createdAt: new Date() },
      { id: '28', name: 'Administrator', description: 'Manages administrative functions', isCustom: false, createdAt: new Date() },
      { id: '29', name: 'Executive Assistant', description: 'Provides high-level administrative support', isCustom: false, createdAt: new Date() },
      { id: '30', name: 'Assistant', description: 'Provides support and assistance', isCustom: false, createdAt: new Date() },
    ];
    localStorage.setItem(STORAGE_KEYS.DESIGNATIONS, JSON.stringify(defaultDesignations));
  }

  // Initialize sample tasks and time entries for demo
  if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
    const sampleTasks: Task[] = [
      {
        id: '1',
        title: 'Quarterly Report Preparation',
        description: 'Prepare comprehensive quarterly business report',
        assignedTo: '4',
        assignedBy: '3',
        status: 'completed',
        priority: 'high',
        estimatedHours: 8,
        actualHours: 7.5,
        dueDate: new Date(Date.now() - 86400000), // Yesterday
        createdAt: new Date(Date.now() - 172800000), // 2 days ago 
        updatedAt: new Date(Date.now() - 86400000),
        submissions: [],
        comments: [],
      },
      {
        id: '2',
        title: 'Client Presentation Review',
        description: 'Review and finalize client presentation materials',
        assignedTo: '4',
        assignedBy: '2',
        status: 'in_progress',
        priority: 'medium',
        estimatedHours: 4,
        actualHours: 2,
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
        createdAt: new Date(),
        updatedAt: new Date(),
        submissions: [],
        comments: [],
      },
    ];
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(sampleTasks));
  }

  if (!localStorage.getItem(STORAGE_KEYS.TIME_ENTRIES)) {
    const sampleTimeEntries: TimeEntry[] = [
      {
        id: '1',
        taskId: '1',
        userId: '4',
        hours: 7.5,
        description: 'Compiled data and created comprehensive quarterly report',
        date: new Date(Date.now() - 86400000),
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        id: '2',
        taskId: '2',
        userId: '4',
        hours: 2,
        description: 'Initial review of presentation slides and content',
        date: new Date(),
        createdAt: new Date(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(sampleTimeEntries));
  }
};

export const storage = {
  // Users
  getUsers: (): User[] => {
    initializeDefaultData();
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users).map((u: any) => ({ ...u, createdAt: new Date(u.createdAt) })) : [];
  },

  saveUsers: (users: User[]) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  addUser: (user: User) => {
    const users = storage.getUsers();
    users.push(user);
    storage.saveUsers(users);
  },

  updateUser: (userId: string, updates: Partial<User>) => {
    const users = storage.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      storage.saveUsers(users);
    }
  },

  // Designations
  getDesignations: (): Designation[] => {
    initializeDefaultData();
    const designations = localStorage.getItem(STORAGE_KEYS.DESIGNATIONS);
    return designations ? JSON.parse(designations).map((d: any) => ({ ...d, createdAt: new Date(d.createdAt) })) : [];
  },

  saveDesignations: (designations: Designation[]) => {
    localStorage.setItem(STORAGE_KEYS.DESIGNATIONS, JSON.stringify(designations));
  },

  addDesignation: (designation: Designation) => {
    const designations = storage.getDesignations();
    designations.push(designation);
    storage.saveDesignations(designations);
  },

  // Departments
  getDepartments: (): Department[] => {
    const departments = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    return departments ? JSON.parse(departments).map((d: any) => ({ ...d, createdAt: new Date(d.createdAt) })) : [];
  },

  saveDepartments: (departments: Department[]) => {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
  },

  addDepartment: (department: Department) => {
    const departments = storage.getDepartments();
    departments.push(department);
    storage.saveDepartments(departments);
  },

  // Tasks
  getTasks: (): Task[] => {
    initializeDefaultData();
    const tasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    return tasks ? JSON.parse(tasks).map((t: any) => ({ 
      ...t, 
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt),
      dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
      submissions: t.submissions || [],
      comments: t.comments || [],
    })) : [];
  },

  saveTasks: (tasks: Task[]) => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  addTask: (task: Task) => {
    const tasks = storage.getTasks();
    tasks.push(task);
    storage.saveTasks(tasks);
  },

  updateTask: (taskId: string, updates: Partial<Task>) => {
    const tasks = storage.getTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date() };
      storage.saveTasks(tasks);
    }
  },

  // Task Submissions
  getTaskSubmissions: (): TaskSubmission[] => {
    const submissions = localStorage.getItem(STORAGE_KEYS.TASK_SUBMISSIONS);
    return submissions ? JSON.parse(submissions).map((s: any) => ({ 
      ...s, 
      submittedAt: new Date(s.submittedAt),
      files: s.files.map((f: any) => ({ ...f, uploadedAt: new Date(f.uploadedAt) }))
    })) : [];
  },

  saveTaskSubmissions: (submissions: TaskSubmission[]) => {
    localStorage.setItem(STORAGE_KEYS.TASK_SUBMISSIONS, JSON.stringify(submissions));
  },

  addTaskSubmission: (submission: TaskSubmission) => {
    const submissions = storage.getTaskSubmissions();
    submissions.push(submission);
    storage.saveTaskSubmissions(submissions);
    
    // Update task with submission
    const tasks = storage.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === submission.taskId);
    if (taskIndex !== -1) {
      if (!tasks[taskIndex].submissions) {
        tasks[taskIndex].submissions = [];
      }
      tasks[taskIndex].submissions!.push(submission);
      storage.saveTasks(tasks);
    }
  },

  // Task Comments
  getTaskComments: (): TaskComment[] => {
    const comments = localStorage.getItem(STORAGE_KEYS.TASK_COMMENTS);
    return comments ? JSON.parse(comments).map((c: any) => ({ 
      ...c, 
      createdAt: new Date(c.createdAt)
    })) : [];
  },

  saveTaskComments: (comments: TaskComment[]) => {
    localStorage.setItem(STORAGE_KEYS.TASK_COMMENTS, JSON.stringify(comments));
  },

  addTaskComment: (comment: TaskComment) => {
    const comments = storage.getTaskComments();
    comments.push(comment);
    storage.saveTaskComments(comments);
    
    // Update task with comment
    const tasks = storage.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === comment.taskId);
    if (taskIndex !== -1) {
      if (!tasks[taskIndex].comments) {
        tasks[taskIndex].comments = [];
      }
      tasks[taskIndex].comments!.push(comment);
      storage.saveTasks(tasks);
    }
  },

  // Time Entries
  getTimeEntries: (): TimeEntry[] => {
    const entries = localStorage.getItem(STORAGE_KEYS.TIME_ENTRIES);
    return entries ? JSON.parse(entries).map((e: any) => ({ 
      ...e, 
      date: new Date(e.date),
      createdAt: new Date(e.createdAt)
    })) : [];
  },

  saveTimeEntries: (entries: TimeEntry[]) => {
    localStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(entries));
  },

  addTimeEntry: (entry: TimeEntry) => {
    const entries = storage.getTimeEntries();
    entries.push(entry);
    storage.saveTimeEntries(entries);
  },

  // Notifications
  getNotifications: (): Notification[] => {
    const notifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return notifications ? JSON.parse(notifications).map((n: any) => ({ 
      ...n, 
      createdAt: new Date(n.createdAt)
    })) : [];
  },

  saveNotifications: (notifications: Notification[]) => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },

  addNotification: (notification: Notification) => {
    const notifications = storage.getNotifications();
    notifications.push(notification);
    storage.saveNotifications(notifications);
  },

  markNotificationAsRead: (notificationId: string) => {
    const notifications = storage.getNotifications();
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      notifications[index].read = true;
      storage.saveNotifications(notifications);
    }
  },

  // Performance Metrics
  getPerformanceMetrics: (): PerformanceMetrics[] => {
    const metrics = localStorage.getItem(STORAGE_KEYS.PERFORMANCE_METRICS);
    return metrics ? JSON.parse(metrics) : [];
  },

  savePerformanceMetrics: (metrics: PerformanceMetrics[]) => {
    localStorage.setItem(STORAGE_KEYS.PERFORMANCE_METRICS, JSON.stringify(metrics));
  },

  calculatePerformanceMetrics: (userId: string, period: string): PerformanceMetrics => {
    const tasks = storage.getTasks();
    const timeEntries = storage.getTimeEntries();
    
    const userTasks = tasks.filter(t => t.assignedTo === userId);
    const completedTasks = userTasks.filter(t => t.status === 'completed');
    const userTimeEntries = timeEntries.filter(e => e.userId === userId);
    
    const totalHoursLogged = userTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const onTimeCompletions = completedTasks.filter(t => {
      if (!t.dueDate) return true;
      return t.updatedAt <= t.dueDate;
    }).length;
    
    const onTimeCompletionRate = completedTasks.length > 0 ? (onTimeCompletions / completedTasks.length) * 100 : 0;
    
    const averageCompletionTime = completedTasks.length > 0 
      ? completedTasks.reduce((sum, task) => {
          const days = Math.ceil((task.updatedAt.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / completedTasks.length
      : 0;

    const productivityScore = Math.min(100, 
      (completedTasks.length * 20) + 
      (onTimeCompletionRate * 0.5) + 
      (totalHoursLogged * 2)
    );

    return {
      userId,
      period,
      tasksCompleted: completedTasks.length,
      tasksAssigned: userTasks.length,
      averageCompletionTime,
      onTimeCompletionRate,
      totalHoursLogged,
      productivityScore: Math.round(productivityScore),
    };
  },

  // Chat Messages
  getChatMessages: (): ChatMessage[] => {
    const messages = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
    return messages ? JSON.parse(messages).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) : [];
  },

  saveChatMessages: (messages: ChatMessage[]) => {
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages));
  },

  addChatMessage: (message: ChatMessage) => {
    const messages = storage.getChatMessages();
    messages.push(message);
    storage.saveChatMessages(messages);
  },

  // Current User
  getCurrentUser: (): User | null => {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? { ...JSON.parse(user), createdAt: new Date(JSON.parse(user).createdAt) } : null;
  },

  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },
};