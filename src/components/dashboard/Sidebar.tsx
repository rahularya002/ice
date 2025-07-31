import React, { useState, useCallback } from 'react';
import { useAuthStore, AuthState } from '../../stores/authStore';
import { 
  LayoutDashboard, 
  Users, 
  Building, 
  CheckSquare, 
  MessageCircle, 
  LogOut,
  BarChart3,
  Briefcase,
  Calendar
} from 'lucide-react';
import NotificationBell from '../notifications/NotificationBell';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface SidebarMenuItemProps {
  item: any;
  isActive: boolean;
  onClick: (id: string) => void;
}

const SidebarMenuItem = React.memo(function SidebarMenuItem({ item, isActive, onClick }: SidebarMenuItemProps) {
  const Icon = item.icon;
  return (
    <li key={item.id}>
      <button
        onClick={() => onClick(item.id)}
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
});

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const user = useAuthStore((state: AuthState) => state.user);
  const logout = useAuthStore((state: AuthState) => state.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'project_manager', 'employee'] },
    { id: 'users', label: 'Members', icon: Users, roles: ['admin', 'manager'] },
    { id: 'departments', label: 'Departments', icon: Building, roles: ['admin', 'manager', 'project_manager'] },
    { id: 'projects', label: 'Projects', icon: Briefcase, roles: ['admin', 'manager', 'project_manager', 'employee'] },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, roles: ['admin', 'manager', 'project_manager', 'employee'] },
    { id: 'meetings', label: 'Meetings', icon: Calendar, roles: ['admin', 'manager', 'project_manager', 'employee'] },
    { id: 'reports', label: 'Analytics', icon: BarChart3, roles: ['admin', 'manager', 'project_manager', 'employee'] },
    { id: 'chat', label: 'Communication', icon: MessageCircle, roles: ['admin', 'manager', 'project_manager', 'employee'] },
  ];

  const visibleMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const handleMenuClick = useCallback((id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  }, [setActiveTab]);

  // Hamburger button (mobile only)
  // Place this outside the sidebar, so export it for use in parent if needed
  // For now, render it here for demo
  return (
    <>
      {/* Hamburger menu button (mobile only) */}
      <button
        className="block sm:hidden fixed top-4 left-4 z-40 bg-white rounded-full p-2 shadow border border-gray-200"
        aria-label="Open sidebar"
        onClick={() => setMobileOpen(true)}
      >
        <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay for mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 sm:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Drawer (mobile) and static (desktop) */}
      <div
        className={`
          fixed z-40 top-0 left-0 h-full w-64 bg-white shadow-lg border-r border-gray-100 flex flex-col transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          sm:static sm:translate-x-0 sm:shadow-none sm:w-64
        `}
        style={{ maxWidth: '100vw' }}
      >
        {/* Close button (mobile only) */}
        <div className="flex sm:hidden justify-end p-4">
          <button
            aria-label="Close sidebar"
            className="text-gray-500 hover:text-amber-600"
            onClick={() => setMobileOpen(false)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
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
            <div className="hidden sm:block"><NotificationBell /></div>
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
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {visibleMenuItems.map((item) => (
              <SidebarMenuItem
                key={item.id}
                item={item}
                isActive={activeTab === item.id}
                onClick={handleMenuClick}
              />
            ))}
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
    </>
  );
};

export default Sidebar;