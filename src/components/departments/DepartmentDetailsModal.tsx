import React, { useEffect, useState } from 'react';
import { X, Users, Calendar, Briefcase } from 'lucide-react';
import { Department, User as UserType, Task } from '../../types';
import { userService } from '../../services/userService';
import { taskService } from '../../services/taskService';

interface DepartmentDetailsModalProps {
  department: Department;
  onClose: () => void;
}

const DepartmentDetailsModal: React.FC<DepartmentDetailsModalProps> = ({ department, onClose }) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch users
      const usersResult = await userService.getUsers();
      let loadedUsers: UserType[] = [];
      if (usersResult.success && 'data' in usersResult && usersResult.data) {
        loadedUsers = usersResult.data.map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          designation: u.designation,
          departmentId: u.department_id,
          createdAt: new Date(u.created_at)
        }));
      }
      setUsers(loadedUsers);
      // Fetch tasks
      const tasksResult = await taskService.getTasks();
      let loadedTasks: Task[] = [];
      if (tasksResult.success && 'data' in tasksResult && tasksResult.data) {
        loadedTasks = tasksResult.data.map((t: any) => ({
          ...t,
          createdAt: t.created_at ? new Date(t.created_at) : undefined,
          updatedAt: t.updated_at ? new Date(t.updated_at) : undefined,
          dueDate: t.due_date ? new Date(t.due_date) : undefined,
        }));
      }
      setTasks(loadedTasks);
      setLoading(false);
    };
    fetchData();
  }, [department.id]);

  const departmentMembers = users.filter((u: UserType) => u.departmentId === department.id);
  const departmentTasks = tasks.filter((t: Task) => {
    const assignedUser = users.find((u: UserType) => u.id === t.assignedTo);
    return assignedUser?.departmentId === department.id;
  });

  const manager = users.find((u: UserType) => u.id === department.managerId);

  const getRoleColor = (role: UserType['role']) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-purple-100 text-purple-800';
      case 'project_manager': return 'bg-amber-100 text-amber-800';
      case 'employee': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const completedTasks = departmentTasks.filter((t: Task) => t.status === 'completed').length;
  const activeTasks = departmentTasks.filter((t: Task) => t.status !== 'completed').length;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto flex items-center justify-center min-h-[300px]">
          <div className="text-center w-full py-12">
            <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading department details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 z-10 bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
              <p className="text-sm text-gray-600">{department.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Department Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-800">Total Members</p>
                  <p className="text-2xl font-bold text-amber-900">{departmentMembers.length}</p>
                </div>
                <Users className="h-8 w-8 text-amber-600" />
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Completed Tasks</p>
                  <p className="text-2xl font-bold text-green-900">{completedTasks}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-800">Active Tasks</p>
                  <p className="text-2xl font-bold text-yellow-900">{activeTasks}</p>
                </div>
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Manager Information */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Department Manager</h4>
            {manager ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-amber-200 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-amber-800">
                      {manager.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{manager.name}</p>
                    <p className="text-sm text-gray-600">{manager.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(manager.role)}`}>
                        {manager.role.replace('_', ' ')}
                      </span>
                      {manager.designation && (
                        <span className="text-xs text-gray-500">• {manager.designation}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No manager assigned</p>
            )}
          </div>

          {/* Department Members */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Department Members</h4>
            {departmentMembers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {departmentMembers.map((member: UserType) => (
                  <div key={member.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-amber-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-amber-800">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                            {member.role.replace('_', ' ')}
                          </span>
                          {member.designation && (
                            <span className="text-xs text-gray-500">• {member.designation}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No members in this department</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDetailsModal;