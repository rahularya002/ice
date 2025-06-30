import React from 'react';
import { X, Users, Calendar, User, Briefcase } from 'lucide-react';
import { Department, User as UserType } from '../../types';
import { storage } from '../../utils/storage';

interface DepartmentDetailsModalProps {
  department: Department;
  onClose: () => void;
}

const DepartmentDetailsModal: React.FC<DepartmentDetailsModalProps> = ({ department, onClose }) => {
  const users = storage.getUsers();
  const projects = storage.getProjects();
  const tasks = storage.getTasks();

  const departmentMembers = users.filter(u => u.departmentId === department.id);
  const departmentProjects = projects.filter(p => p.departmentId === department.id);
  const departmentTasks = tasks.filter(t => {
    const assignedUser = users.find(u => u.id === t.assignedTo);
    return assignedUser?.departmentId === department.id;
  });

  const manager = users.find(u => u.id === department.managerId);

  const getRoleColor = (role: UserType['role']) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-purple-100 text-purple-800';
      case 'project_manager': return 'bg-amber-100 text-amber-800';
      case 'employee': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'planning': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const completedTasks = departmentTasks.filter(t => t.status === 'completed').length;
  const activeTasks = departmentTasks.filter(t => t.status !== 'completed').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
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

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Active Projects</p>
                  <p className="text-2xl font-bold text-blue-900">{departmentProjects.filter(p => p.status === 'active').length}</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-600" />
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
                {departmentMembers.map((member) => (
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

          {/* Department Projects */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Department Projects</h4>
            {departmentProjects.length > 0 ? (
              <div className="space-y-3">
                {departmentProjects.map((project) => (
                  <div key={project.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{project.name}</p>
                        <p className="text-sm text-gray-600">{project.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getProjectStatusColor(project.status)}`}>
                            {project.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {project.memberIds.length} member{project.memberIds.length !== 1 ? 's' : ''}
                          </span>
                          <span className="text-xs text-gray-500">
                            Started: {project.startDate.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No projects in this department</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDetailsModal;