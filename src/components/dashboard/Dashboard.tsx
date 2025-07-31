import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { userService } from '../../services/userService';
import { departmentService } from '../../services/departmentService';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { Meeting } from '../../types';
import { meetingService } from '../../services/meetingService';
import AddMeetingModal from '../meetings/AddMeetingModal';
import MeetingList from '../meetings/MeetingList';
import { Calendar } from 'lucide-react';
import DashboardStats from './DashboardStats';
import RecentTasks from './RecentTasks';
import DashboardSidebar from './DashboardSidebar';


interface DashboardProps {
  setActiveTab: (tab: string) => void;
  activeTab: string;
}
const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, activeTab }) => {
  const user = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Parallelize all fetches
        const [usersResult, departmentsResult, tasksResult, projectsResult, meetingsResult] = await Promise.all([
          userService.getUsers(),
          departmentService.getDepartments(),
          taskService.getTasks(),
          user ? projectService.getProjectsForUser(user.id) : Promise.resolve({ success: true, data: [] }),
          meetingService.getMeetings()
        ]);
        // Users
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
        // Departments
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
        // Tasks
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
        // Projects
        if (projectsResult.success && 'data' in projectsResult) {
          setProjects(projectsResult.data);
        }
        // Meetings
        if (meetingsResult.success && 'data' in meetingsResult) {
          setMeetings(meetingsResult.data ?? []);
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
      icon: 'Users',
      color: 'bg-gradient-to-r from-amber-500 to-orange-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      change: '+12%',
      changeType: 'increase' as const,
      visible: user?.role === 'admin'
    },
    {
      title: 'Departments',
      value: departments.length,
      icon: 'Building',
      color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+5%',
      changeType: 'increase' as const,
      visible: user?.role === 'admin' || user?.role === 'project_manager'
    },
    {
      title: 'Total Tasks',
      value: userTasks.length,
      icon: 'CheckSquare',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+8%',
      changeType: 'increase' as const,
      visible: true
    },
    {
      title: 'Completed Tasks',
      value: completedTasks,
      icon: 'CheckSquare',
      color: 'bg-gradient-to-r from-green-500 to-emerald-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+15%',
      changeType: 'increase' as const,
      visible: true
    },
    {
      title: 'Pending Tasks',
      value: pendingTasks,
      icon: 'Clock',
      color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: '-3%',
      changeType: 'decrease' as const,
      visible: true
    },
    {
      title: 'Overdue Tasks',
      value: overdueTasks,
      icon: 'AlertCircle',
      color: 'bg-gradient-to-r from-red-500 to-pink-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      change: '-10%',
      changeType: 'decrease' as const,
      visible: true
    }
  ];
  const upcomingDeadlines = userTasks
    .filter((t: any) => t.dueDate && t.status !== 'completed')
    .sort((a: any, b: any) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const recentProjects = projects.slice(0, 5);



  const handleDeleteMeeting = async (meeting: any) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;
    const { error } = await meetingService.deleteMeeting(meeting.id);
    if (!error) {
      setMeetings(meetings.filter(m => m.id !== meeting.id));
    } else {
      alert('Failed to delete meeting.');
    }
  };

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
            />
          </div>
        </div>
        <AddMeetingModal
          isOpen={meetingModalOpen}
          onClose={() => setMeetingModalOpen(false)}
          onMeetingAdded={meeting => setMeetings([meeting, ...meetings])}
          currentUserId={user?.id || ''}
        />
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-6 bg-gray-50 min-h-screen w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-4 sm:mb-8 sticky top-0 z-10 bg-white w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-2 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {user?.designation || user?.role.replace('_', ' ')} • The Institute of Civil Engineers
            </p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-end">
            <div className="text-right w-full sm:w-auto">
              <p className="text-xs sm:text-sm text-gray-500">Today</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900">
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
      <DashboardStats 
        stats={stats}
        loading={loading}
        onStatClick={setActiveTab}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 w-full">
        <RecentTasks tasks={userTasks} onTaskClick={() => setActiveTab('tasks')} />
        <DashboardSidebar 
          upcomingDeadlines={upcomingDeadlines}
          recentProjects={recentProjects}
        />
      </div>
    </div>
  );
};

export default Dashboard;