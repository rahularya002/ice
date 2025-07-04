import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { departmentService } from '../../services/departmentService';
import { authService } from '../../services/authService';
import { User, Department } from '../../types';
import { Plus, Edit, Trash2, UserPlus, Search, Filter } from 'lucide-react';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Load users and departments from Supabase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔄 Loading users and departments from Supabase...');
        
        // Load users
        const usersResult = await userService.getUsers();
        if (usersResult.success && 'data' in usersResult && usersResult.data) {
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
        } else if ('error' in usersResult && usersResult.error) {
          console.error('❌ Failed to load users:', usersResult.error);
          setError('Failed to load users');
        }

        // Load departments
        const departmentsResult = await departmentService.getDepartments();
        if (departmentsResult.success && 'data' in departmentsResult && departmentsResult.data) {
          console.log('✅ Departments loaded:', departmentsResult.data);
          const mappedDepartments = departmentsResult.data.map((dept: any) => ({
            id: dept.id,
            name: dept.name,
            description: dept.description,
            managerId: dept.manager_id,
            createdAt: new Date(dept.created_at)
          }));
          setDepartments(mappedDepartments);
        } else if ('error' in departmentsResult && departmentsResult.error) {
          console.error('❌ Failed to load departments:', departmentsResult.error);
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

  const handleAddUser = async (userData: Omit<User, 'id' | 'createdAt'> & { password: string }) => {
    console.log('👤 Creating new user:', userData.email);
    setError(null);
    
    try {
      const result = await authService.createUser({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: userData.role,
        designation: userData.designation,
        departmentId: userData.departmentId
      });

      if (result.success && 'data' in result && result.data) {
        console.log('✅ User created successfully');
        setIsAddModalOpen(false);
        
        // Reload users to get the updated list
        const usersResult = await userService.getUsers();
        if (usersResult.success && 'data' in usersResult && usersResult.data) {
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
        } else if ('error' in usersResult && usersResult.error) {
          console.error('❌ Failed to load users:', usersResult.error);
          setError('Failed to load users');
        }
      } else if ('error' in result && result.error) {
        console.error('❌ Failed to create user:', result.error);
        setError(result.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('❌ Error creating user:', error);
      setError('Failed to create user');
    }
  };

  const handleEditUser = async (userId: string, userData: Partial<User>) => {
    console.log('✏️ Updating user:', userId);
    setError(null);
    
    try {
      const result = await userService.updateUser(userId, userData);
      if (result.success && 'data' in result && result.data) {
        console.log('✅ User updated successfully');
        setEditingUser(null);
        
        // Update local state
        setUsers(prev => prev.map(u => 
          u.id === userId 
            ? { ...u, ...userData, updatedAt: new Date() }
            : u
        ));
      } else if ('error' in result && result.error) {
        console.error('❌ Failed to update user:', result.error);
        setError(result.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
      setError('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      console.log('🗑️ Deleting user:', userId);
      setError(null);
      
      try {
        const result = await userService.deleteUser(userId);
        if (result.success && 'data' in result && result.data) {
          console.log('✅ User deleted successfully');
          setUsers(prev => prev.filter(u => u.id !== userId));
        } else if ('error' in result && result.error) {
          console.error('❌ Failed to delete user:', result.error);
          setError(result.error || 'Failed to delete user');
        }
      } catch (error) {
        console.error('❌ Error deleting user:', error);
        setError('Failed to delete user');
      }
    }
  };

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return 'No Department';
    const department = departments.find(d => d.id === departmentId);
    return department?.name || 'Unknown Department';
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'manager': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'project_manager': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'employee': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredUsers = users.filter(userItem => {
    const matchesSearch = userItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userItem.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (userItem.designation && userItem.designation.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || userItem.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const canEditUser = (targetUser: User) => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'manager' && targetUser.role !== 'admin') return true;
    return false;
  };

  const canDeleteUser = (targetUser: User) => {
    // Can't delete yourself
    if (targetUser.id === user?.id) return false;
    
    // Admins can delete anyone (except themselves)
    if (user?.role === 'admin') return true;
    
    // Managers can delete employees and project managers (but not other admins or managers)
    if (user?.role === 'manager' && (targetUser.role === 'employee' || targetUser.role === 'project_manager')) return true;
    
    return false;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 sticky top-0 z-10 bg-white">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Member Management</h1>
          <p className="text-gray-600 mt-1">Manage system members and their roles</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg text-sm md:text-base"
        >
          <Plus className="h-4 w-4 md:h-5 md:w-5" />
          <span>Add Member</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6 sticky top-0 z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 md:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent w-full sm:w-auto text-sm md:text-base"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-9 md:pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white w-full sm:w-auto text-sm md:text-base"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="project_manager">Project Manager</option>
                <option value="employee">Employee</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} members
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredUsers.map((userItem) => (
          <div key={userItem.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-all duration-200 flex flex-col">
            {/* Header with Avatar and Actions */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="h-10 w-10 md:h-12 md:w-12 bg-gradient-to-r from-amber-200 to-orange-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm md:text-lg font-semibold text-amber-800">
                    {userItem.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">{userItem.name}</h3>
                  <p className="text-xs md:text-sm text-gray-600 truncate">{userItem.email}</p>
                </div>
              </div>
              <div className="flex space-x-1 flex-shrink-0 ml-2">
                {canEditUser(userItem) && (
                  <button
                    onClick={() => setEditingUser(userItem)}
                    className="text-amber-600 hover:text-amber-800 p-1.5 md:p-2 rounded-lg hover:bg-amber-50 transition-colors duration-200"
                    title="Edit Member"
                  >
                    <Edit className="h-3 w-3 md:h-4 md:w-4" />
                  </button>
                )}
                {canDeleteUser(userItem) && (
                  <button
                    onClick={() => handleDeleteUser(userItem.id, userItem.name)}
                    className="text-red-600 hover:text-red-800 p-1.5 md:p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                    title="Delete Member"
                  >
                    <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3 flex-1">
              <div>
                <span className={`px-2 md:px-3 py-1 text-xs md:text-sm font-medium rounded-full border ${getRoleColor(userItem.role)}`}>
                  {userItem.role.replace('_', ' ')}
                </span>
              </div>

              {userItem.designation && (
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Designation</p>
                  <p className="font-medium text-gray-900 text-sm md:text-base truncate" title={userItem.designation}>
                    {userItem.designation}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs md:text-sm text-gray-500">Department</p>
                <p className="font-medium text-gray-900 text-sm md:text-base truncate" title={getDepartmentName(userItem.departmentId)}>
                  {getDepartmentName(userItem.departmentId)}
                </p>
              </div>

              <div>
                <p className="text-xs md:text-sm text-gray-500">Joined</p>
                <p className="font-medium text-gray-900 text-sm md:text-base">
                  {userItem.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12">
          <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No members found</p>
          <p className="text-sm text-gray-400 mt-1">
            {searchTerm || roleFilter !== 'all' ? 'Try adjusting your search or filters' : 'Add your first member to get started'}
          </p>
        </div>
      )}

      {isAddModalOpen && (
        <AddUserModal
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddUser}
          departments={departments}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={handleEditUser}
          departments={departments}
        />
      )}
    </div>
  );
};

export default UserManagement;