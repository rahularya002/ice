import React, { useState, useEffect } from 'react';
import { notificationService } from './services/notificationService';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import Sidebar from './components/dashboard/Sidebar';
import UserManagement from './components/users/UserManagement';
import DepartmentManagement from './components/departments/DepartmentManagement';
import TaskManagement from './components/tasks/TaskManagement';
import PerformanceReports from './components/reports/PerformanceReports';
import Chat from './components/chat/Chat';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProjectManagement from './components/projects/ProjectManagement';
import { useAuthStore } from './stores/authStore';

const AppContent: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const initialize = useAuthStore((state) => state.initialize);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    initialize();
    // eslint-disable-next-line
  }, []);

  // Request notification permission when user logs in
  useEffect(() => {
    if (user) {
      notificationService.requestNotificationPermission();
    }
  }, [user]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} activeTab={activeTab} />;
      case 'users':
        return <UserManagement />;
      case 'departments':
        return <DepartmentManagement />;
      case 'projects':
        return <ProjectManagement />;
      case 'tasks':
        return <TaskManagement />;
      case 'reports':
        return <PerformanceReports />;
      case 'chat':
        return <Chat />;
      default:
        return <Dashboard setActiveTab={setActiveTab} activeTab={activeTab} />;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar: static width on desktop, overlay on mobile */}
      <div className="hidden sm:block w-64 flex-shrink-0">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <div className="block sm:hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <div className="flex-1 overflow-auto pt-12 pl-4 sm:pt-0 sm:pl-0">
        {renderContent()}
      </div>
    </div>
  );
};

function App() {
  return <AppContent />;
}

export default App;