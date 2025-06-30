import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { storage } from '../../utils/storage';
import { Project } from '../../types';
import { Plus, Edit, Trash2, FolderOpen, Users, Calendar } from 'lucide-react';
import AddProjectModal from './AddProjectModal';

const ProjectManagement: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState(storage.getProjects());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const users = storage.getUsers();
  const departments = storage.getDepartments();

  const userProjects = user?.role === 'admin' || user?.role === 'manager'
    ? projects 
    : projects.filter(p => p.managerId === user?.id || p.memberIds.includes(user?.id || ''));

  const handleAddProject = (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      id: Date.now().toString(),
      ...projectData,
      createdAt: new Date(),
    };

    storage.addProject(newProject);
    setProjects(storage.getProjects());
    setIsAddModalOpen(false);
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      storage.saveProjects(updatedProjects);
      setProjects(updatedProjects);
    }
  };

  const getManagerName = (managerId: string) => {
    const manager = users.find(u => u.id === managerId);
    return manager?.name || 'Unknown Manager';
  };

  const getDepartmentName = (departmentId: string) => {
    const department = departments.find(d => d.id === departmentId);
    return department?.name || 'Unknown Department';
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'planning': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canManageProjects = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'project_manager';

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600">Manage projects and track progress</p>
        </div>
        {canManageProjects && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Project</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userProjects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FolderOpen className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              {canManageProjects && (project.managerId === user?.id || user?.role === 'admin' || user?.role === 'manager') && (
                <div className="flex space-x-1">
                  <button className="text-blue-600 hover:text-blue-900 p-1">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-4">{project.description}</p>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2" />
                <span>{project.memberIds.length} member{project.memberIds.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{project.startDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Manager:</span>
                <span className="font-medium text-gray-900">{getManagerName(project.managerId)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Department:</span>
                <span className="font-medium text-gray-900">{getDepartmentName(project.departmentId)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {userProjects.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No projects found</p>
        </div>
      )}

      {isAddModalOpen && (
        <AddProjectModal
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddProject}
          departments={departments}
          users={users}
          currentUser={user}
        />
      )}
    </div>
  );
};

export default ProjectManagement;