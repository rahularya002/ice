import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { departmentService } from '../../services/departmentService';
import { userService } from '../../services/userService';
import { Department, User } from '../../types';
import { Plus, Edit, Trash2, Building, Users, Eye } from 'lucide-react';
import AddDepartmentModal from './AddDepartmentModal';
import EditDepartmentModal from './EditDepartmentModal';
import DepartmentDetailsModal from './DepartmentDetailsModal';

const DepartmentManagement: React.FC = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (user?.role !== 'admin' && user?.role !== 'manager' && user?.role !== 'project_manager') {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔄 Loading departments and users from Supabase...');
        
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
          setError('Failed to load departments');
        }

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

  const handleAddDepartment = async (departmentData: Omit<Department, 'id' | 'createdAt'>) => {
    console.log('🏢 Creating new department:', departmentData.name);
    setError(null);
    
    try {
      const result = await departmentService.createDepartment(departmentData);
      if (result.success && 'data' in result && result.data) {
        console.log('✅ Department created successfully');
        setIsAddModalOpen(false);
        
        // Reload departments
        const departmentsResult = await departmentService.getDepartments();
        if (departmentsResult.success && 'data' in departmentsResult && departmentsResult.data) {
          const mappedDepartments = departmentsResult.data.map((dept: any) => ({
            id: dept.id,
            name: dept.name,
            description: dept.description,
            managerId: dept.manager_id,
            createdAt: new Date(dept.created_at)
          }));
          setDepartments(mappedDepartments);
        }
      } else if ('error' in result && result.error) {
        console.error('❌ Failed to create department:', result.error);
        setError(result.error || 'Failed to create department');
      }
    } catch (error) {
      console.error('❌ Error creating department:', error);
      setError('Failed to create department');
    }
  };

  const handleEditDepartment = async (departmentId: string, departmentData: Partial<Department>) => {
    console.log('✏️ Updating department:', departmentId);
    setError(null);
    
    try {
      const result = await departmentService.updateDepartment(departmentId, departmentData);
      if (result.success && 'data' in result && result.data) {
        console.log('✅ Department updated successfully');
        setEditingDepartment(null);
        
        // Update local state
        setDepartments(prev => prev.map(d => 
          d.id === departmentId 
            ? { ...d, ...departmentData }
            : d
        ));
      } else if ('error' in result && result.error) {
        console.error('❌ Failed to update department:', result.error);
        setError(result.error || 'Failed to update department');
      }
    } catch (error) {
      console.error('❌ Error updating department:', error);
      setError('Failed to update department');
    }
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    if (window.confirm('Are you sure you want to delete this department? Users in this department will be moved to "No Department".')) {
      console.log('🗑️ Deleting department:', departmentId);
      setError(null);
      
      try {
        const result = await departmentService.deleteDepartment(departmentId);
        if (result.success) {
          console.log('✅ Department deleted successfully');
          setDepartments(prev => prev.filter(d => d.id !== departmentId));
          
          // Reload users to reflect department changes
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
          }
        } else {
          console.error('❌ Failed to delete department:', 'error' in result ? result.error : undefined);
          setError(('error' in result && result.error) ? result.error : 'Failed to delete department');
        }
      } catch (error) {
        console.error('❌ Error deleting department:', error);
        setError('Failed to delete department');
      }
    }
  };

  const getManagerName = (managerId: string) => {
    const manager = users.find(u => u.id === managerId);
    return manager?.name || 'Unknown Manager';
  };

  const getDepartmentMemberCount = (departmentId: string) => {
    return users.filter(u => u.departmentId === departmentId).length;
  };

  const canAddDepartment = user?.role === 'admin' || user?.role === 'manager';
  const canEditDepartment = user?.role === 'admin' || user?.role === 'manager';

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 sticky top-0 z-10 bg-white">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Department Management</h1>
          <p className="text-gray-600 mt-1">Manage departments and their structure</p>
        </div>
        {canAddDepartment && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-amber-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl hover:bg-amber-700 transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg text-sm md:text-base"
          >
            <Plus className="h-4 w-4 md:h-5 md:w-5" />
            <span>Add Department</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {departments.map((department) => {
          const memberCount = getDepartmentMemberCount(department.id);
          return (
            <div key={department.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-shadow duration-200 flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3 min-w-0 flex-1">
                  <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                    <Building className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate" title={department.name}>
                      {department.name}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 line-clamp-2" title={department.description}>
                      {department.description}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1 flex-shrink-0 ml-2">
                  <button 
                    onClick={() => setSelectedDepartment(department)}
                    className="text-amber-600 hover:text-amber-800 p-1.5 md:p-2 rounded-lg hover:bg-amber-50 transition-colors duration-200"
                    title="View Details"
                  >
                    <Eye className="h-3 w-3 md:h-4 md:w-4" />
                  </button>
                  {canEditDepartment && (
                    <>
                      <button 
                        onClick={() => setEditingDepartment(department)}
                        className="text-amber-600 hover:text-amber-800 p-1.5 md:p-2 rounded-lg hover:bg-amber-50 transition-colors duration-200" 
                        title="Edit Department"
                      >
                        <Edit className="h-3 w-3 md:h-4 md:w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(department.id)}
                        className="text-red-600 hover:text-red-800 p-1.5 md:p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                        title="Delete Department"
                      >
                        <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3 flex-1">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Manager:</span>
                  <span className="font-medium text-gray-900 truncate ml-2" title={getManagerName(department.managerId)}>
                    {getManagerName(department.managerId)}
                  </span>
                </div>
                
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Members:</span>
                  <button
                    onClick={() => setSelectedDepartment(department)}
                    className="font-medium text-amber-600 hover:text-amber-800 flex items-center space-x-1"
                  >
                    <Users className="h-3 w-3" />
                    <span>{memberCount}</span>
                  </button>
                </div>
                
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">
                    {department.createdAt.toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2 md:gap-4 text-center">
                  <div className="bg-amber-50 rounded-lg p-2">
                    <p className="text-xs text-amber-600 font-medium">Active Projects</p>
                    <p className="text-lg md:text-xl font-bold text-amber-800">0</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-xs text-green-600 font-medium">Completed Tasks</p>
                    <p className="text-lg md:text-xl font-bold text-green-800">0</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {departments.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No departments created yet</p>
        </div>
      )}

      {isAddModalOpen && (
        <AddDepartmentModal
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddDepartment}
          users={users.filter(u => u.role === 'project_manager' || u.role === 'manager' || u.role === 'admin')}
        />
      )}

      {editingDepartment && (
        <EditDepartmentModal
          department={editingDepartment}
          onClose={() => setEditingDepartment(null)}
          onSubmit={handleEditDepartment}
          users={users.filter(u => u.role === 'project_manager' || u.role === 'manager' || u.role === 'admin')}
        />
      )}

      {selectedDepartment && (
        <DepartmentDetailsModal
          department={selectedDepartment}
          onClose={() => setSelectedDepartment(null)}
        />
      )}
    </div>
  );
};

export default DepartmentManagement;