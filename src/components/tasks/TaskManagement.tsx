import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import { notificationService } from '../../services/notificationService';
import { Task, User } from '../../types';
import { Plus, Edit, Trash2, Timer, Upload, Eye, RotateCcw } from 'lucide-react';
import AddTaskModal from './AddTaskModal';
import TimeTrackingModal from './TimeTrackingModal';
import TaskSubmissionModal from './TaskSubmissionModal';
import TaskDetailsModal from './TaskDetailsModal';
import EditTaskModal from './EditTaskModal';

const TaskManagement: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [timeTrackingTask, setTimeTrackingTask] = useState<Task | null>(null);
  const [submissionTask, setSubmissionTask] = useState<Task | null>(null);
  const [detailsTask, setDetailsTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'created'>('created');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'assistance'>('tasks');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [requestChangeTask, setRequestChangeTask] = useState<Task | null>(null);
  const [requestChangeComment, setRequestChangeComment] = useState('');
  const [requestChangeStatus, setRequestChangeStatus] = useState(true); // true = set to in_progress
  const [requestChangeError, setRequestChangeError] = useState('');

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔄 Loading tasks and users from Supabase...');
        
        // Load tasks
        const tasksResult = await taskService.getTasks();
        if (tasksResult.success && 'data' in tasksResult) {
          console.log('✅ Tasks loaded:', tasksResult.data);
          const mappedTasks = tasksResult.data.map((task: any) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            assignedTo: task.assigned_to,
            assignedBy: task.assigned_by,
            status: task.status,
            priority: task.priority,
            dueDate: task.due_date ? new Date(task.due_date) : undefined,
            estimatedHours: task.estimated_hours,
            actualHours: task.actual_hours || 0,
            createdAt: new Date(task.created_at),
            updatedAt: new Date(task.updated_at),
            submissions: (task.task_submissions || []).map((submission: any) => ({
              ...submission,
              submittedBy: submission.submitted_by,
              submittedAt: submission.submitted_at ? new Date(submission.submitted_at) : undefined,
              files: (submission.task_submission_files || []).map((file: any) => ({
                id: file.id,
                name: file.file_name,
                size: file.file_size,
                type: file.file_type,
                url: file.file_path,
                uploadedAt: file.uploaded_at,
              })),
            })),
            comments: (task.task_comments || []).map((c: any) => ({
              id: c.id,
              taskId: c.task_id,
              userId: c.user_id,
              comment: c.comment,
              createdAt: c.created_at ? new Date(c.created_at) : new Date(),
            })),
            attachments: (task.attachments || task.task_files || []).map((file: any) => ({
              id: file.id,
              name: file.file_name,
              size: file.file_size,
              type: file.file_type,
              url: file.file_path,
              uploadedAt: file.uploaded_at,
              uploadedBy: file.uploaded_by,
            }))
          }));
          setTasks(mappedTasks);
        } else {
          const errorMsg = 'error' in tasksResult ? tasksResult.error : 'Unknown error';
          console.error('❌ Failed to load tasks:', errorMsg);
          setError(errorMsg ?? 'Failed to load tasks');
          return; // Stop further execution if tasks fail to load
        }

        // Load users
        const usersResult = await userService.getUsers();
        if (usersResult.success && 'data' in usersResult) {
          console.log('✅ Users loaded:', usersResult.data);
          const mappedUsers = usersResult.data.map((profile: any) => ({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            designation: profile.designation,
            departmentId: profile.department_id,
            createdAt: new Date(profile.created_at)
          }));
          setUsers(mappedUsers);
        } else {
          const errorMsg = 'error' in usersResult ? usersResult.error : 'Unknown error';
          console.error('❌ Failed to load users:', errorMsg);
        }
      } catch (error) {
        console.error('❌ Error loading data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Set default filter to 'created' for admin users
  useEffect(() => {
    if (user?.role === 'admin') {
      setFilter('created');
    }
  }, [user]);

  // Filter tasks based on user role
  const userTasks = tasks.filter(task => {
    switch (filter) {
      case 'assigned':
        return task.assignedTo === user?.id;
      case 'created':
        return task.assignedBy === user?.id;
      default:
        // 'all'
        if (user?.role === 'admin' || user?.role === 'manager') {
          return true; // show all for admin/manager
        }
        return task.assignedTo === user?.id || task.assignedBy === user?.id;
    }
  });

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('📝 Creating new task:', taskData.title);
    setError(null);
    
    try {
      const result = await taskService.createTask(taskData);
      if (result.success && 'data' in result && result.data) {
        console.log('✅ Task created successfully');
        setIsAddModalOpen(false);
        
        // Reload tasks
        const tasksResult = await taskService.getTasks();
        if (tasksResult.success && 'data' in tasksResult) {
          const mappedTasks = tasksResult.data.map((task: any) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            assignedTo: task.assigned_to,
            assignedBy: task.assigned_by,
            status: task.status,
            priority: task.priority,
            dueDate: task.due_date ? new Date(task.due_date) : undefined,
            estimatedHours: task.estimated_hours,
            actualHours: task.actual_hours || 0,
            createdAt: new Date(task.created_at),
            updatedAt: new Date(task.updated_at),
            submissions: (task.task_submissions || []).map((submission: any) => ({
              ...submission,
              submittedBy: submission.submitted_by,
              submittedAt: submission.submitted_at ? new Date(submission.submitted_at) : undefined,
              files: (submission.task_submission_files || []).map((file: any) => ({
                id: file.id,
                name: file.file_name,
                size: file.file_size,
                type: file.file_type,
                url: file.file_path,
                uploadedAt: file.uploaded_at,
              })),
            })),
            comments: task.task_comments || [],
            attachments: (task.attachments || task.task_files || []).map((file: any) => ({
              id: file.id,
              name: file.file_name,
              size: file.file_size,
              type: file.file_type,
              url: file.file_path,
              uploadedAt: file.uploaded_at,
              uploadedBy: file.uploaded_by,
            }))
          }));
          setTasks(mappedTasks);
        }
        // Send notification to assigned user
        const assignedUser = users.find(u => u.id === taskData.assignedTo);
        const assignedByUser = users.find(u => u.id === taskData.assignedBy);
        if (assignedUser && assignedByUser) {
          await notificationService.createTaskAssignedNotification(
            result.data,
            assignedUser,
            assignedByUser
          );
        }
      } else {
        // Fix: result may not have 'error' property, so check for it safely
        const errorMsg = 'error' in result && result.error ? result.error : 'Failed to create task';
        console.error('❌ Failed to create task:', errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error creating task:', error);
      setError('Failed to create task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      console.log('🗑️ Deleting task:', taskId);
      setError(null);
      
      try {
        const result = await taskService.deleteTask(taskId);
        if (result.success) {
          console.log('✅ Task deleted successfully');
          // Reload tasks from backend to ensure UI is in sync
          const tasksResult = await taskService.getTasks();
          if (tasksResult.success && 'data' in tasksResult) {
            const mappedTasks = tasksResult.data.map((task: any) => ({
              id: task.id,
              title: task.title,
              description: task.description,
              assignedTo: task.assigned_to,
              assignedBy: task.assigned_by,
              status: task.status,
              priority: task.priority,
              dueDate: task.due_date ? new Date(task.due_date) : undefined,
              estimatedHours: task.estimated_hours,
              actualHours: task.actual_hours || 0,
              createdAt: new Date(task.created_at),
              updatedAt: new Date(task.updated_at),
              submissions: (task.task_submissions || []).map((submission: any) => ({
                ...submission,
                submittedBy: submission.submitted_by,
                submittedAt: submission.submitted_at ? new Date(submission.submitted_at) : undefined,
                files: (submission.task_submission_files || []).map((file: any) => ({
                  id: file.id,
                  name: file.file_name,
                  size: file.file_size,
                  type: file.file_type,
                  url: file.file_path,
                  uploadedAt: file.uploaded_at,
                })),
              })),
              comments: task.task_comments || [],
              attachments: (task.attachments || task.task_files || []).map((file: any) => ({
                id: file.id,
                name: file.file_name,
                size: file.file_size,
                type: file.file_type,
                url: file.file_path,
                uploadedAt: file.uploaded_at,
                uploadedBy: file.uploaded_by,
              }))
            }));
            setTasks(mappedTasks);
          }
        } else {
          // Fix: result may not have 'error' property, so check for it safely
          const errorMsg = 'error' in result && result.error ? result.error : 'Failed to delete task';
          console.error('❌ Failed to delete task:', errorMsg);
          setError(errorMsg);
        }
      } catch (error) {
        console.error('❌ Error deleting task:', error);
        setError('Failed to delete task');
      }
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    console.log('🔄 Updating task status:', taskId, newStatus);
    setError(null);

    try {
      const result = await taskService.updateTask(taskId, { status: newStatus });
      if (result.success) {
        console.log('✅ Task status updated successfully');
        
        // Update local state
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date() } : t
        ));
      } else {
        console.error('❌ Failed to update task status:', (result as any).error);
        setError('Failed to update task status');
      }
    } catch (error) {
      console.error('❌ Error updating task status:', error);
      setError('Failed to update task status');
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown User';
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'todo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canCreateTasks = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'project_manager';
  const canDeleteTask = (task: Task) => {
    if (user?.role === 'employee') return false;
    if (user?.role === 'admin') return true;
    return task.assignedBy === user?.id || user?.role === 'manager';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600">Manage and track task progress</p>
        </div>
        {canCreateTasks && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('created')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              filter === 'created' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Created by me
          </button>
          <button
            onClick={() => setFilter('assigned')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              filter === 'assigned' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Assigned to Me
          </button>
          {user?.role !== 'employee' && (
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                filter === 'all' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All tasks
            </button>
          )}
        </div>
      </div>

      {activeTab === 'tasks' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-0 z-10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setDetailsTask(task)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        <div className="text-sm text-gray-500 truncate" style={{ maxWidth: 400 }}>
                          {task.description.length > 80 ? `${task.description.slice(0, 80)}...` : task.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getUserName(task.assignedTo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user?.role === 'employee' ? (
                        <span className={`text-xs font-medium rounded-full px-2 py-1 ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      ) : (
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as Task['status'])}
                          className={`text-xs font-medium rounded-full px-2 py-1 border-0 focus:ring-2 focus:ring-amber-500 ${getStatusColor(task.status)}`}
                          disabled={task.assignedTo !== user?.id && user?.role !== 'admin' && user?.role !== 'manager'}
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="completed">Completed</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        {task.submissions && task.submissions.length > 0 ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            {task.submissions.length} submitted
                          </span>
                        ) : (
                          <span className="text-gray-400">No submissions</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={e => { e.stopPropagation(); setDetailsTask(task); }}
                          className="text-gray-600 hover:text-gray-900 p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {task.assignedTo === user?.id && (
                          <>
                            <button
                              onClick={e => { e.stopPropagation(); setTimeTrackingTask(task); }}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Log Time"
                            >
                              <Timer className="h-4 w-4" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); setSubmissionTask(task); }}
                              className="text-amber-600 hover:text-amber-900 p-1"
                              title="Submit Work"
                            >
                              <Upload className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {user?.role !== 'employee' && (
                          <button
                            className="text-amber-600 hover:text-amber-900 p-1"
                            title="Edit Task"
                            onClick={e => { e.stopPropagation(); setEditTask(task); setIsEditModalOpen(true); }}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {user && (user.role === 'admin' || user.role === 'manager') && task.status !== 'in_progress' && task.status !== 'todo' && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setRequestChangeTask(task);
                              setRequestChangeComment('');
                              setRequestChangeStatus(true);
                              setRequestChangeError('');
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Request Changes"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                        {canDeleteTask(task) && (
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete Task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <AddTaskModal
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddTask}
          users={users}
          currentUser={user}
        />
      )}

      {timeTrackingTask && (
        <TimeTrackingModal
          task={timeTrackingTask}
          onClose={() => setTimeTrackingTask(null)}
          onSubmit={async (hours) => {
            // In a real app, you would save time entries to Supabase
            // For now, just update the task's actual hours
            const currentHours = timeTrackingTask.actualHours || 0;
            await taskService.updateTask(timeTrackingTask.id, { actualHours: currentHours + hours });
            
            // Reload tasks
            const tasksResult = await taskService.getTasks();
            if (tasksResult.success && 'data' in tasksResult) {
              const mappedTasks = tasksResult.data.map((task: any) => ({
                id: task.id,
                title: task.title,
                description: task.description,
                assignedTo: task.assigned_to,
                assignedBy: task.assigned_by,
                status: task.status,
                priority: task.priority,
                dueDate: task.due_date ? new Date(task.due_date) : undefined,
                estimatedHours: task.estimated_hours,
                actualHours: task.actual_hours || 0,
                createdAt: new Date(task.created_at),
                updatedAt: new Date(task.updated_at),
                submissions: (task.task_submissions || []).map((submission: any) => ({
                  ...submission,
                  submittedBy: submission.submitted_by,
                  submittedAt: submission.submitted_at ? new Date(submission.submitted_at) : undefined,
                  files: (submission.task_submission_files || []).map((file: any) => ({
                    id: file.id,
                    name: file.file_name,
                    size: file.file_size,
                    type: file.file_type,
                    url: file.file_path,
                    uploadedAt: file.uploaded_at,
                  })),
                })),
                comments: task.task_comments || [],
                attachments: (task.attachments || task.task_files || []).map((file: any) => ({
                  id: file.id,
                  name: file.file_name,
                  size: file.file_size,
                  type: file.file_type,
                  url: file.file_path,
                  uploadedAt: file.uploaded_at,
                  uploadedBy: file.uploaded_by,
                }))
              }));
              setTasks(mappedTasks);
            }
            
            setTimeTrackingTask(null);
          }}
        />
      )}

      {submissionTask && (
        <TaskSubmissionModal
          task={submissionTask}
          onClose={() => setSubmissionTask(null)}
          onSubmit={async (description, files) => {
            await taskService.createTaskSubmission({
              taskId: submissionTask.id,
              submittedBy: user?.id || '',
              description,
              files
            });
            
            // Reload tasks
            const tasksResult = await taskService.getTasks();
            if (tasksResult.success && 'data' in tasksResult) {
              const mappedTasks = tasksResult.data.map((task: any) => ({
                id: task.id,
                title: task.title,
                description: task.description,
                assignedTo: task.assigned_to,
                assignedBy: task.assigned_by,
                status: task.status,
                priority: task.priority,
                dueDate: task.due_date ? new Date(task.due_date) : undefined,
                estimatedHours: task.estimated_hours,
                actualHours: task.actual_hours || 0,
                createdAt: new Date(task.created_at),
                updatedAt: new Date(task.updated_at),
                submissions: (task.task_submissions || []).map((submission: any) => ({
                  ...submission,
                  submittedBy: submission.submitted_by,
                  submittedAt: submission.submitted_at ? new Date(submission.submitted_at) : undefined,
                  files: (submission.task_submission_files || []).map((file: any) => ({
                    id: file.id,
                    name: file.file_name,
                    size: file.file_size,
                    type: file.file_type,
                    url: file.file_path,
                    uploadedAt: file.uploaded_at,
                  })),
                })),
                comments: task.task_comments || [],
                attachments: (task.attachments || task.task_files || []).map((file: any) => ({
                  id: file.id,
                  name: file.file_name,
                  size: file.file_size,
                  type: file.file_type,
                  url: file.file_path,
                  uploadedAt: file.uploaded_at,
                  uploadedBy: file.uploaded_by,
                }))
              }));
              setTasks(mappedTasks);
            }
            
            setSubmissionTask(null);
          }}
        />
      )}

      {detailsTask && (
        <TaskDetailsModal
          task={detailsTask}
          onClose={() => setDetailsTask(null)}
          currentUser={user}
          onCommentAdd={async (comment) => {
            await taskService.addTaskComment(detailsTask.id, user?.id || '', comment);
            
            // Reload tasks
            const tasksResult = await taskService.getTasks();
            if (tasksResult.success && 'data' in tasksResult) {
              const mappedTasks = tasksResult.data.map((task: any) => ({
                id: task.id,
                title: task.title,
                description: task.description,
                assignedTo: task.assigned_to,
                assignedBy: task.assigned_by,
                status: task.status,
                priority: task.priority,
                dueDate: task.due_date ? new Date(task.due_date) : undefined,
                estimatedHours: task.estimated_hours,
                actualHours: task.actual_hours || 0,
                createdAt: new Date(task.created_at),
                updatedAt: new Date(task.updated_at),
                submissions: (task.task_submissions || []).map((submission: any) => ({
                  ...submission,
                  submittedBy: submission.submitted_by,
                  submittedAt: submission.submitted_at ? new Date(submission.submitted_at) : undefined,
                  files: (submission.task_submission_files || []).map((file: any) => ({
                    id: file.id,
                    name: file.file_name,
                    size: file.file_size,
                    type: file.file_type,
                    url: file.file_path,
                    uploadedAt: file.uploaded_at,
                  })),
                })),
                comments: task.task_comments || [],
                attachments: (task.attachments || task.task_files || []).map((file: any) => ({
                  id: file.id,
                  name: file.file_name,
                  size: file.file_size,
                  type: file.file_type,
                  url: file.file_path,
                  uploadedAt: file.uploaded_at,
                  uploadedBy: file.uploaded_by,
                }))
              }));
              setTasks(mappedTasks);
              setDetailsTask(mappedTasks.find((t: typeof mappedTasks[number]) => t.id === detailsTask.id) || null);
            }
          }}
        />
      )}

      {isEditModalOpen && editTask && (
        <EditTaskModal
          task={editTask}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditTask(null);
          }}
          onSubmit={async (updatedTaskData) => {
            if (!editTask) return;
            setError(null);
            try {
              const result = await taskService.updateTask(editTask.id, updatedTaskData);
              if (result.success) {
                // Reload tasks
                const tasksResult = await taskService.getTasks();
                if (tasksResult.success && 'data' in tasksResult) {
                  const mappedTasks = tasksResult.data.map((task: any) => ({
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    assignedTo: task.assigned_to,
                    assignedBy: task.assigned_by,
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.due_date ? new Date(task.due_date) : undefined,
                    estimatedHours: task.estimated_hours,
                    actualHours: task.actual_hours || 0,
                    createdAt: new Date(task.created_at),
                    updatedAt: new Date(task.updated_at),
                    submissions: (task.task_submissions || []).map((submission: any) => ({
                      ...submission,
                      submittedBy: submission.submitted_by,
                      submittedAt: submission.submitted_at ? new Date(submission.submitted_at) : undefined,
                      files: (submission.task_submission_files || []).map((file: any) => ({
                        id: file.id,
                        name: file.file_name,
                        size: file.file_size,
                        type: file.file_type,
                        url: file.file_path,
                        uploadedAt: file.uploaded_at,
                      })),
                    })),
                    comments: task.task_comments || [],
                    attachments: (task.attachments || task.task_files || []).map((file: any) => ({
                      id: file.id,
                      name: file.file_name,
                      size: file.file_size,
                      type: file.file_type,
                      url: file.file_path,
                      uploadedAt: file.uploaded_at,
                      uploadedBy: file.uploaded_by,
                    }))
                  }));
                  setTasks(mappedTasks);
                }
                setIsEditModalOpen(false);
                setEditTask(null);
              } else {
                const errorMsg = 'error' in result && result.error ? result.error : 'Failed to update task';
                setError(errorMsg);
              }
            } catch (error) {
              setError('Failed to update task');
            }
          }}
          users={users}
          currentUser={user}
        />
      )}

      {/* Request Changes Modal */}
      {requestChangeTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Request Changes for: {requestChangeTask.title}</h3>
              <button
                onClick={() => setRequestChangeTask(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-xl">&times;</span>
              </button>
            </div>
            <form
              onSubmit={async e => {
                e.preventDefault();
                if (!requestChangeComment.trim()) {
                  setRequestChangeError('Comment is required');
                  return;
                }
                setRequestChangeError('');
                if (!requestChangeTask || !user) return;
                try {
                  // 1. Add comment (mark as change request)
                  await taskService.addTaskComment(
                    requestChangeTask.id,
                    user.id,
                    `[Change Requested] ${requestChangeComment.trim()}`
                  );
                  // 2. Update status if checked
                  if (requestChangeStatus && requestChangeTask.status !== 'in_progress') {
                    await taskService.updateTask(requestChangeTask.id, { status: 'in_progress' });
                  }
                  // 3. Notify assigned employee
                  const assignedUser = users.find(u => u.id === requestChangeTask.assignedTo);
                  if (assignedUser) {
                    await notificationService.createGeneralNotification(
                      assignedUser.id,
                      'Task Change Requested',
                      `${user.name} requested changes for task: "${requestChangeTask.title}". Please review the feedback.`
                    );
                  }
                  // 4. Reload tasks
                  const tasksResult = await taskService.getTasks();
                  if (tasksResult.success && 'data' in tasksResult) {
                    const mappedTasks = tasksResult.data.map((task: any) => ({
                      id: task.id,
                      title: task.title,
                      description: task.description,
                      assignedTo: task.assigned_to,
                      assignedBy: task.assigned_by,
                      status: task.status,
                      priority: task.priority,
                      dueDate: task.due_date ? new Date(task.due_date) : undefined,
                      estimatedHours: task.estimated_hours,
                      actualHours: task.actual_hours || 0,
                      createdAt: new Date(task.created_at),
                      updatedAt: new Date(task.updated_at),
                      submissions: (task.task_submissions || []).map((submission: any) => ({
                        ...submission,
                        submittedBy: submission.submitted_by,
                        submittedAt: submission.submitted_at ? new Date(submission.submitted_at) : undefined,
                        files: (submission.task_submission_files || []).map((file: any) => ({
                          id: file.id,
                          name: file.file_name,
                          size: file.file_size,
                          type: file.file_type,
                          url: file.file_path,
                          uploadedAt: file.uploaded_at,
                        })),
                      })),
                      comments: task.task_comments || [],
                      attachments: (task.attachments || task.task_files || []).map((file: any) => ({
                        id: file.id,
                        name: file.file_name,
                        size: file.file_size,
                        type: file.file_type,
                        url: file.file_path,
                        uploadedAt: file.uploaded_at,
                        uploadedBy: file.uploaded_by,
                      }))
                    }));
                    setTasks(mappedTasks);
                  }
                  setRequestChangeTask(null);
                  setRequestChangeComment('');
                  setRequestChangeStatus(true);
                } catch (err) {
                  setRequestChangeError('Failed to request changes. Please try again.');
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback/Comment <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={requestChangeComment}
                  onChange={e => setRequestChangeComment(e.target.value)}
                  required
                  placeholder="Describe what needs to be changed or improved..."
                />
                {requestChangeError && <div className="text-red-600 text-xs mt-1">{requestChangeError}</div>}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="set-in-progress"
                  checked={requestChangeStatus}
                  onChange={e => setRequestChangeStatus(e.target.checked)}
                />
                <label htmlFor="set-in-progress" className="text-sm text-gray-700">
                  Set status to <span className="font-semibold">In Progress</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setRequestChangeTask(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;