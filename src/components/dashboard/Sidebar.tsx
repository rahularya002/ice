import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Building, 
  CheckSquare, 
  MessageCircle, 
  LogOut,
  BarChart3
} from 'lucide-react';
import NotificationBell from '../notifications/NotificationBell';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'project_manager', 'employee'] },
    { id: 'users', label: 'Members', icon: Users, roles: ['admin', 'manager'] },
    { id: 'departments', label: 'Departments', icon: Building, roles: ['admin', 'manager', 'project_manager'] },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, roles: ['admin', 'manager', 'project_manager', 'employee'] },
    { id: 'reports', label: 'Analytics', icon: BarChart3, roles: ['admin', 'manager', 'project_manager', 'employee'] },
    { id: 'chat', label: 'Communication', icon: MessageCircle, roles: ['admin', 'manager', 'project_manager', 'employee'] },
  ];

  const visibleMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="bg-white shadow-sm border-r border-gray-100 h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">ICE</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">ICE Portal</h1>
              <p className="text-xs text-gray-500">Civil Engineers Institute</p>
            </div>
          </div>
          <NotificationBell />
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-r from-amber-200 to-orange-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-amber-800">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {user?.designation || user?.role.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-amber-600' : ''}`} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;