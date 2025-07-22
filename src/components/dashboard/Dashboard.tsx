import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { departmentService } from '../../services/departmentService';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { Meeting } from '../../types';
import { meetingService } from '../../services/meetingService';
import AddMeetingModal from '../meetings/AddMeetingModal';
import MeetingList from '../meetings/MeetingList';
import EditMeetingModal from '../meetings/EditMeetingModal';
import { 
  Users, 
  Building, 
  CheckSquare, 
  Clock,
  AlertCircle,
  Calendar,
  Target,
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';


interface DashboardProps {
  setActiveTab: (tab: string) => void;
  activeTab: string;
}
const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, activeTab }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Loading dashboard data from Supabase...');
        
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

        // Load departments
        const departmentsResult = await departmentService.getDepartments();
        if (departmentsResult.success && 'data' in departmentsResult) {
          const mappedDepartments = departmentsResult.data.map((dept: any) => ({
            id: dept.id,
            name: dept.name,
            description: dept.description,
            managerId: dept.manager_id,
            createdAt: new Date(dept.created_at)
          }));
          setDepartments(mappedDepartments);
        }

        // Load tasks
        const tasksResult = await taskService.getTasks();
        if (tasksResult.success && 'data' in tasksResult) {
          console.log('Raw tasks from backend:', tasksResult.data); // <-- Debug log
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

        // Load projects
        if (user) {
          const projectsResult = await projectService.getProjectsForUser(user.id);
          if (projectsResult.success && 'data' in projectsResult) {
            const mappedProjects = projectsResult.data.map((project: any) => ({
              id: project.id,
              name: project.name,
              description: project.description,
              managerId: project.manager_id,
              startDate: project.start_date,
              endDate: project.end_date,
              status: project.status,
              createdAt: new Date(project.created_at)
            }));
            setProjects(mappedProjects);
          }
        }
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Load meetings
  useEffect(() => {
    if (user) {
      meetingService.getMeetings().then(res => {
        if (res.success && 'data' in res) {
          const mappedMeetings = (res.data || []).map((meeting: any) => ({
            ...meeting,
            createdBy: meeting.created_by || meeting.createdBy,
            agendaFile: meeting.agenda_file || undefined,
          }));
          setMeetings(mappedMeetings);
        }
      });
    }
  }, [user]);

  // Filter tasks for current user
  const userTasks = (user?.role === 'admin' || user?.role === 'manager')
    ? tasks
    : tasks.filter(task => 
        task.assignedTo === user?.id || task.assignedBy === user?.id
      );

  const completedTasks = userTasks.filter((t: any) => t.status === 'completed').length;
  const pendingTasks = userTasks.filter((t: any) => t.status !== 'completed').length;
  const overdueTasks = userTasks.filter((t: any) => 
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
  ).length;

  const stats = [
    {
      title: 'Total Members',
      value: users.length,
      icon: Users,
      color: 'bg-gradient-to-r from-amber-500 to-orange-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      change: '+12%',
      changeType: 'increase',
      visible: user?.role === 'admin'
    },
    {
      title: 'Departments',
      value: departments.length,
      icon: Building,
      color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+5%',
      changeType: 'increase',
      visible: user?.role === 'admin' || user?.role === 'project_manager'
    },
    {
      title: 'Total Tasks',
      value: userTasks.length,
      icon: CheckSquare,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+8%',
      changeType: 'increase',
      visible: true
    },
    {
      title: 'Completed Tasks',
      value: completedTasks,
      icon: CheckSquare,
      color: 'bg-gradient-to-r from-green-500 to-emerald-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+15%',
      changeType: 'increase',
      visible: true
    },
    {
      title: 'Pending Tasks',
      value: pendingTasks,
      icon: Clock,
      color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: '-3%',
      changeType: 'decrease',
      visible: true
    },
    {
      title: 'Overdue Tasks',
      value: overdueTasks,
      icon: AlertCircle,
      color: 'bg-gradient-to-r from-red-500 to-pink-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      change: '-10%',
      changeType: 'decrease',
      visible: true
    }
  ];

  const visibleStats = stats.filter(stat => stat.visible);
  const recentTasks = userTasks.slice(0, 5);
  const upcomingDeadlines = userTasks
    .filter((t: any) => t.dueDate && t.status !== 'completed')
    .sort((a: any, b: any) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const recentProjects = projects.slice(0, 5);

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleDeleteMeeting = async (meeting: any) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;
    const { error } = await meetingService.deleteMeeting(meeting.id);
    if (!error) {
      setMeetings(meetings.filter(m => m.id !== meeting.id));
    } else {
      alert('Failed to delete meeting.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'meetings') {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-8">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Meetings</h3>
            </div>
            <button
              className="px-3 py-1 rounded bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm shadow"
              onClick={() => setMeetingModalOpen(true)}
            >
              Add Meeting
            </button>
          </div>
          <div className="p-6">
            <MeetingList
              meetings={meetings}
              users={users}
              currentUser={user || undefined}
              onDeleteMeeting={handleDeleteMeeting}
              onEditMeeting={meeting => setEditingMeeting(meeting)}
            />
          </div>
        </div>
        <AddMeetingModal
          isOpen={meetingModalOpen}
          onClose={() => setMeetingModalOpen(false)}
          onMeetingAdded={meeting => setMeetings([meeting, ...meetings])}
          currentUserId={user?.id || ''}
        />
        {editingMeeting && (
          <EditMeetingModal
            isOpen={!!editingMeeting}
            onClose={() => setEditingMeeting(null)}
            meeting={editingMeeting}
            onMeetingUpdated={updated => {
              setMeetings(meetings => meetings.map(m => m.id === updated.id ? updated : m));
              setEditingMeeting(null);
            }}
            currentUserId={user?.id || ''}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 sticky top-0 z-10 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-1">.
              {user?.designation || user?.role.replace('_', ' ')} • The Institute of Civil Engineers
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Today</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {visibleStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
                <div className="flex items-center space-x-1">
                  {stat.changeType === 'increase' ? (
                    <ArrowUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <Activity className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Tasks</h3>
              </div>
              <span className="text-sm text-gray-500">{recentTasks.length} tasks</span>
            </div>
          </div>
          <div className="p-6">
            {recentTasks.length > 0 ? (
              <div className="space-y-4">
                {recentTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                    onClick={() => {
                      setActiveTab('tasks');
                    }}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                      <p
                        className={`text-sm text-gray-600 mb-2${expandedTaskId !== task.id ? ' truncate' : ''}`}
                        style={
                          expandedTaskId !== task.id
                            ? { maxWidth: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
                            : { maxWidth: 400 }
                        }
                      >
                        {expandedTaskId === task.id
                          ? task.description
                          : task.description.length > 80
                            ? `${task.description.slice(0, 80)}...`
                            : task.description}
                      </p>
                      {task.description.length > 80 && expandedTaskId !== task.id && (
                        <button
                          className="text-xs text-blue-600 hover:underline"
                          onClick={e => {
                            e.stopPropagation();
                            setExpandedTaskId(task.id);
                          }}
                        >
                          Read more
                        </button>
                      )}
                      {expandedTaskId === task.id && (
                        <button
                          className="text-xs text-blue-600 hover:underline ml-2"
                          onClick={e => {
                            e.stopPropagation();
                            setExpandedTaskId(null);
                          }}
                        >
                          Show less
                        </button>
                      )}
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTaskStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        {task.dueDate && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <Target className="h-5 w-5 text-amber-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No tasks assigned yet</p>
                <p className="text-sm text-gray-400 mt-1">Tasks will appear here once they're assigned to you</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
              </div>
            </div>
            <div className="p-6">
              {upcomingDeadlines.length > 0 ? (
                <div className="space-y-3">
                  {upcomingDeadlines.map((task: any) => {
                    const daysUntil = getDaysUntilDue(task.dueDate!);
                    const isOverdue = daysUntil < 0;
                    const isUrgent = daysUntil <= 2 && daysUntil >= 0;
                    
                    return (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {new Date(task.dueDate!).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            isOverdue ? 'bg-red-100 text-red-800' :
                            isUrgent ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {isOverdue ? `${Math.abs(daysUntil)}d overdue` :
                             daysUntil === 0 ? 'Due today' :
                             `${daysUntil}d left`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Projects */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
              </div>
            </div>
            <div className="p-6">
              {recentProjects.length > 0 ? (
                <div className="space-y-3">
                  {recentProjects.map((project: any) => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{project.name}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {project.startDate ? `Started: ${new Date(project.startDate).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                      <div className="ml-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${project.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}> 
                          {project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : 'Unconfirmed'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No recent projects</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;