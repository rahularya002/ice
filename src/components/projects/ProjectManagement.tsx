import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import AddProjectModal from './AddProjectModal';
import ProjectDetailsModal from './ProjectDetailsModal';
import EditProjectModal from './EditProjectModal';
import { Pencil } from 'lucide-react';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';
import { User } from '../../types';
import { useAuthStore } from '../../stores/authStore';

const ProjectManagement: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'current'>('current');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<any | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  const canAddProject = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'project_manager';

  // Fetch users and projects
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch users
        const usersResult = await userService.getUsers();
        console.log('Fetched users result:', usersResult);
        if (usersResult.success && 'data' in usersResult && usersResult.data) {
          const mappedUsers = usersResult.data.map((profile: any) => ({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            designation: profile.designation,
            createdAt: new Date(profile.created_at)
          }));
          setUsers(mappedUsers);
        }
        // Fetch projects for current user
        if (user?.id) {
          const projectsResult = await projectService.getProjectsForUser(user.id);
          console.log('Fetched projects result:', projectsResult);
          if (projectsResult.success && 'data' in projectsResult && projectsResult.data) {
            setProjects(projectsResult.data);
            console.log('Projects set in state:', projectsResult.data);
          } else if ('error' in projectsResult && projectsResult.error) {
            setError(projectsResult.error.message || 'Failed to load projects');
            console.error('Error loading projects:', projectsResult.error);
          }
        }
      } catch (err: any) {
        setError('Failed to load data');
        console.error('Error in loadData:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

  const refreshProjects = async () => {
    if (user?.id) {
      setLoading(true);
      setError(null);
      const projectsResult = await projectService.getProjectsForUser(user.id);
      console.log('Refreshed projects result:', projectsResult);
      if (projectsResult.success && 'data' in projectsResult && projectsResult.data) {
        setProjects(projectsResult.data);
        console.log('Projects set in state (refresh):', projectsResult.data);
      } else if ('error' in projectsResult && projectsResult.error) {
        setError(projectsResult.error.message || 'Failed to load projects');
        console.error('Error refreshing projects:', projectsResult.error);
      }
      setLoading(false);
    }
  };

  const handleAddProject = async (projectData: any) => {
    setIsAddModalOpen(false);
    setLoading(true);
    setError(null);
    try {
      console.log('Creating project with data:', projectData);
      const result = await projectService.createProject(projectData);
      console.log('Create project API result:', result);
      if (result.success) {
        await refreshProjects();
      } else if ('error' in result && result.error) {
        setError(result.error.message || 'Failed to add project');
        console.error('Error adding project:', result.error);
      }
    } catch (err: any) {
      setError('Failed to add project');
      console.error('Exception in handleAddProject:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProjectSubmit = async (updatedProjectData: any) => {
    setIsEditModalOpen(false);
    setProjectToEdit(null);
    setLoading(true);
    setError(null);
    try {
      console.log('Updating project with data:', updatedProjectData);
      const result = await projectService.updateProject(updatedProjectData);
      console.log('Update project API result:', result);
      if (result.success) {
        await refreshProjects();
      } else if ('error' in result && result.error) {
        setError(result.error.message || 'Failed to update project');
        console.error('Error updating project:', result.error);
      }
    } catch (err: any) {
      setError('Failed to update project');
      console.error('Exception in handleEditProjectSubmit:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProject = (project: any) => {
    setProjectToEdit(project);
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 sticky top-0 z-10 bg-white">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600 mt-1">Manage projects, assign members, and track progress</p>
        </div>
        {canAddProject && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-amber-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl hover:bg-amber-700 transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg text-sm md:text-base"
          >
            <Plus className="h-4 w-4 md:h-5 md:w-5" />
            <span>Add Project</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${activeTab === 'current' ? 'bg-amber-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
          onClick={() => setActiveTab('current')}
        >
          Current Projects
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${activeTab === 'upcoming' ? 'bg-amber-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming Projects
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading projects...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {projects
            .filter(project => {
              const today = new Date();
              today.setHours(0,0,0,0);
              const start = new Date(project.start_date);
              start.setHours(0,0,0,0);
              if (activeTab === 'upcoming') {
                return start > today;
              } else {
                return start <= today;
              }
            })
            .map(project => {
              const manager = users.find(u => u.id === project.manager_id);
              const members = users.filter(u => project.memberIds?.includes(u.id));
              return (
                <div
                  key={project.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-shadow duration-200 flex flex-col cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate" title={project.name}>
                        {project.name}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600 line-clamp-2" title={project.description}>
                        {project.description}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex flex-col items-end gap-2">
                      {canAddProject && (
                        <button
                          className="text-amber-600 hover:text-amber-800 p-1 rounded-full"
                          title="Edit Project"
                          onClick={e => { e.stopPropagation(); handleEditProject(project); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {project.status === 'confirmed' ? (
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">Confirmed</span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">Unconfirmed</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-gray-600">Manager:</span>
                      <span className="font-medium text-gray-900 truncate ml-2" title={manager?.name}>
                        {manager?.name || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-gray-600">Start:</span>
                      <span className="font-medium text-gray-900">{project.start_date}</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-gray-600">End:</span>
                      <span className="font-medium text-gray-900">{project.end_date || '-'}</span>
                    </div>
                    <div className="flex flex-col text-xs md:text-sm mt-2">
                      <span className="text-gray-600 mb-1">Members:</span>
                      <div className="flex flex-wrap gap-1">
                        {members.length === 0 ? (
                          <span className="text-gray-400">No members assigned</span>
                        ) : (
                          members.map(m => (
                            <span key={m.id} className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-medium">
                              {m.name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          {projects.filter(project => {
            const today = new Date();
            today.setHours(0,0,0,0);
            const start = new Date(project.start_date);
            start.setHours(0,0,0,0);
            if (activeTab === 'upcoming') {
              return start > today;
            } else {
              return start <= today;
            }
          }).length === 0 && (
            <div className="col-span-full text-center text-gray-400 py-12">
              No projects to display yet.
            </div>
          )}
        </div>
      )}

      {canAddProject && isAddModalOpen && (
        <AddProjectModal
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddProject}
          users={users}
        />
      )}
      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          users={users}
          onClose={() => setSelectedProject(null)}
          refreshProjects={refreshProjects}
          currentUserId={user?.id || ''}
        />
      )}
      {canAddProject && isEditModalOpen && projectToEdit && (
        <EditProjectModal
          onClose={() => { setIsEditModalOpen(false); setProjectToEdit(null); }}
          onSubmit={handleEditProjectSubmit}
          users={users}
          initialProject={projectToEdit}
        />
      )}
    </div>
  );
};

export default ProjectManagement; 