export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'project_manager' | 'employee';
  designation?: string;
  departmentId?: string;
  avatar?: string;
  createdAt: Date;
}

export interface Designation {
  id: string;
  name: string;
  description: string;
  departmentId?: string;
  isCustom: boolean;
  createdAt: Date;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  managerId: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: Date;
  updatedAt: Date;
  submissions?: TaskSubmission[];
  comments?: TaskComment[];
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  submittedBy: string;
  description?: string;
  files: SubmissionFile[];
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
}

export interface SubmissionFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  comment: string;
  createdAt: Date;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  hours: number;
  description: string;
  date: Date;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'task_updated' | 'task_completed' | 'project_update' | 'general';
  read: boolean;
  createdAt: Date;
}

export interface PerformanceMetrics {
  userId: string;
  period: string;
  tasksCompleted: number;
  tasksAssigned: number;
  averageCompletionTime: number;
  onTimeCompletionRate: number;
  totalHoursLogged: number;
  productivityScore: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId?: string;
  message: string;
  timestamp: Date;
  type: 'direct' | 'project';
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'createdAt'> & { password: string }) => Promise<boolean>;
  loading?: boolean;
}