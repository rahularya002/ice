import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { taskService } from '../../services/taskService';
import { timeEntryService } from '../../services/timeEntryService';
import { User, Task, TimeEntry } from '../../types';
import { BarChart3, Clock, Target, Award, Users } from 'lucide-react';

interface PerformanceMetrics {
  userId: string;
  period: string;
  tasksCompleted: number;
  tasksAssigned: number;
  averageCompletionTime: number;
  onTimeCompletionRate: number;
  totalHoursLogged: number;
  productivityScore: number;
}

const PerformanceReports: React.FC = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const canViewAllReports = user?.role === 'admin' || user?.role === 'manager';
  const availableUsers = canViewAllReports ? users : users.filter(u => u.id === user?.id);

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        console.log('🔄 Loading performance data from Supabase...');
        
        // Load users
        const usersResult = await userService.getUsers();
        if (usersResult.success && 'data' in usersResult) {
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
        }

        // Load tasks
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
            submissions: task.task_submissions || [],
            comments: task.task_comments || []
          }));
          setTasks(mappedTasks);
        }

        // Load time entries
        const timeEntriesResult = await timeEntryService.getTimeEntries();
        if (timeEntriesResult.success && 'data' in timeEntriesResult) {
          const mappedTimeEntries = timeEntriesResult.data.map((entry: any) => ({
            id: entry.id,
            taskId: entry.task_id,
            userId: entry.user_id,
            hours: entry.hours,
            description: entry.description,
            date: new Date(entry.date),
            createdAt: new Date(entry.created_at)
          }));
          setTimeEntries(mappedTimeEntries);
        }
      } catch (error) {
        console.error('❌ Error loading performance data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate performance metrics
  const calculatePerformanceMetrics = (userId: string, period: string): PerformanceMetrics => {
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
  };

  useEffect(() => {
    if (selectedUser) {
      const userMetrics = calculatePerformanceMetrics(selectedUser, selectedPeriod);
      setMetrics([userMetrics]);
    } else if (canViewAllReports) {
      const allMetrics = users.map(u => calculatePerformanceMetrics(u.id, selectedPeriod));
      setMetrics(allMetrics);
    }
  }, [selectedUser, selectedPeriod, canViewAllReports, users, tasks, timeEntries]);

  const getUserName = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser?.name || 'Unknown User';
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 80) return { level: 'Excellent', color: 'text-green-600 bg-green-100' };
    if (score >= 60) return { level: 'Good', color: 'text-blue-600 bg-blue-100' };
    if (score >= 40) return { level: 'Average', color: 'text-yellow-600 bg-yellow-100' };
    return { level: 'Needs Improvement', color: 'text-red-600 bg-red-100' };
  };

  const averageMetrics = metrics.length > 0 ? {
    tasksCompleted: Math.round(metrics.reduce((sum, m) => sum + m.tasksCompleted, 0) / metrics.length),
    onTimeRate: Math.round(metrics.reduce((sum, m) => sum + m.onTimeCompletionRate, 0) / metrics.length),
    avgCompletionTime: Math.round(metrics.reduce((sum, m) => sum + m.averageCompletionTime, 0) / metrics.length),
    totalHours: Math.round(metrics.reduce((sum, m) => sum + m.totalHoursLogged, 0)),
    avgProductivity: Math.round(metrics.reduce((sum, m) => sum + m.productivityScore, 0) / metrics.length),
  } : null;

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (!canViewAllReports && user) {
    // Employee view - show only their own performance
    const userMetrics = calculatePerformanceMetrics(user.id, selectedPeriod);
    const performance = getPerformanceLevel(userMetrics.productivityScore);

    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Performance</h1>
          <p className="text-gray-600">Track your productivity and task completion</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Period
          </label>
          <input
            type="month"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasks Completed</p>
                <p className="text-2xl font-bold text-gray-900">{userMetrics.tasksCompleted}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On-Time Rate</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(userMetrics.onTimeCompletionRate)}%</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hours Logged</p>
                <p className="text-2xl font-bold text-gray-900">{userMetrics.totalHoursLogged}h</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Performance Score</p>
                <p className="text-2xl font-bold text-gray-900">{userMetrics.productivityScore}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Level</h3>
          <div className="flex items-center space-x-4">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${performance.color}`}>
              {performance.level}
            </span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(userMetrics.productivityScore, 100)}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">{userMetrics.productivityScore}/100</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Reports</h1>
          <p className="text-gray-600">Track team productivity and performance metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Period
          </label>
          <input
            type="month"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select User (Optional)
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Users</option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {averageMetrics && !selectedUser && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Tasks/User</p>
                <p className="text-2xl font-bold text-gray-900">{averageMetrics.tasksCompleted}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg On-Time Rate</p>
                <p className="text-2xl font-bold text-gray-900">{averageMetrics.onTimeRate}%</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">{averageMetrics.totalHours}h</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Productivity</p>
                <p className="text-2xl font-bold text-gray-900">{averageMetrics.avgProductivity}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Team Size</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.length}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedUser ? `${getUserName(selectedUser)} Performance` : 'Team Performance Overview'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  On-Time Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Completion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours Logged
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.map((metric) => {
                const performance = getPerformanceLevel(metric.productivityScore);
                return (
                  <tr key={metric.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getUserName(metric.userId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.tasksCompleted} / {metric.tasksAssigned}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Math.round(metric.onTimeCompletionRate)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.averageCompletionTime} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.totalHoursLogged}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${performance.color}`}>
                          {performance.level}
                        </span>
                        <span className="text-sm text-gray-600">({metric.productivityScore})</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {metrics.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No performance data available for the selected period</p>
        </div>
      )}
    </div>
  );
};

export default PerformanceReports;