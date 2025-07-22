import { supabase, handleSupabaseError, handleSupabaseSuccess } from '../lib/supabase';
import { notificationService } from './notificationService';
import { userService } from './userService';

export const projectService = {
  // Create a new project and assign members
  async createProject({ name, description, managerId, startDate, endDate, memberIds }: {
    name: string;
    description: string;
    managerId: string;
    startDate: string;
    endDate?: string;
    memberIds: string[];
  }) {
    try {
      // Insert project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name,
          description,
          manager_id: managerId,
          start_date: startDate,
          end_date: endDate || null
        })
        .select()
        .single();
      if (projectError) return handleSupabaseError(projectError);

      // Insert project members
      if (memberIds && memberIds.length > 0) {
        const memberRows = memberIds.map(userId => ({ project_id: project.id, user_id: userId }));
        const { error: membersError } = await supabase
          .from('project_members')
          .insert(memberRows);
        if (membersError) console.warn('Could not add project members:', membersError);
      }
      return handleSupabaseSuccess(project);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Get all projects for the current user (as member or manager)
  async getProjectsForUser(userId: string) {
    try {
      // Get projects where user is a member
      const { data: memberProjects, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', userId);
      if (memberError) return handleSupabaseError(memberError);
      const projectIds = memberProjects.map((pm: any) => pm.project_id);
      // Get projects where user is manager
      const { data: managedProjects, error: managerError } = await supabase
        .from('projects')
        .select('*')
        .eq('manager_id', userId);
      if (managerError) return handleSupabaseError(managerError);
      // Get all unique project IDs
      const allProjectIds = Array.from(new Set([
        ...projectIds,
        ...(managedProjects || []).map((p: any) => p.id)
      ]));
      if (allProjectIds.length === 0) return handleSupabaseSuccess([]);
      // Fetch all projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .in('id', allProjectIds)
        .order('created_at', { ascending: false });
      if (projectsError) return handleSupabaseError(projectsError);
      // Fetch members for each project
      const { data: allMembers, error: membersError } = await supabase
        .from('project_members')
        .select('project_id, user_id');
      if (membersError) return handleSupabaseError(membersError);
      // Attach members to projects
      const projectsWithMembers = projects.map((project: any) => ({
        ...project,
        memberIds: allMembers
          .filter((m: any) => m.project_id === project.id)
          .map((m: any) => m.user_id)
      }));
      return handleSupabaseSuccess(projectsWithMembers);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Add a daily entry (follow-up) to a project
  async addProjectEntry(entryData: {
    projectId: string;
    userId: string;
    date: string;
    text: string;
    file?: { url: string; name: string; type: string; size: number };
  }) {
    try {
      const insertData: any = {
        project_id: entryData.projectId,
        user_id: entryData.userId,
        date: entryData.date,
        text: entryData.text,
      };
      if (entryData.file) {
        insertData.file_url = entryData.file.url;
        insertData.file_name = entryData.file.name;
        insertData.file_type = entryData.file.type;
        insertData.file_size = entryData.file.size;
      }
      const { data, error } = await supabase
        .from('project_daily_entries')
        .insert(insertData)
        .select()
        .single();
      if (error) return handleSupabaseError(error);

      // Notify project manager if submitter is not the manager
      const projectRes = await supabase
        .from('projects')
        .select('id, name, manager_id')
        .eq('id', entryData.projectId)
        .single();
      if (projectRes.data && projectRes.data.manager_id && projectRes.data.manager_id !== entryData.userId) {
        // Get submitter info
        let submitterName = 'A team member';
        const submitterRes = await userService.getUserById(entryData.userId);
        if (
          submitterRes &&
          typeof submitterRes === 'object' &&
          'success' in submitterRes &&
          submitterRes.success === true &&
          'data' in submitterRes &&
          submitterRes.data &&
          submitterRes.data.name
        ) {
          submitterName = submitterRes.data.name;
        }
        await notificationService.createGeneralNotification(
          projectRes.data.manager_id,
          'New Project Follow-up',
          `${submitterName} submitted a follow-up for project "${projectRes.data.name}".`
        );
      }
      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Get all daily entries for a project
  async getProjectEntries(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('project_daily_entries')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Update project status
  async updateProjectStatus(projectId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', projectId)
        .select()
        .single();
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Update project details and members
  async updateProject({ id, name, description, managerId, startDate, endDate, memberIds, status }: {
    id: string;
    name: string;
    description: string;
    managerId: string;
    startDate: string;
    endDate?: string;
    memberIds: string[];
    status: string;
  }) {
    try {
      // Update project row
      const { data: updatedProject, error: projectError } = await supabase
        .from('projects')
        .update({
          name,
          description,
          manager_id: managerId,
          start_date: startDate,
          end_date: endDate || null,
          status,
        })
        .eq('id', id)
        .select()
        .single();
      if (projectError) return handleSupabaseError(projectError);

      // Update project members: remove all, then add current
      // Remove all current members
      const { error: removeError } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', id);
      if (removeError) console.warn('Could not remove old project members:', removeError);
      // Add new members
      if (memberIds && memberIds.length > 0) {
        const memberRows = memberIds.map(userId => ({ project_id: id, user_id: userId }));
        const { error: membersError } = await supabase
          .from('project_members')
          .insert(memberRows);
        if (membersError) console.warn('Could not add project members:', membersError);
      }
      return handleSupabaseSuccess(updatedProject);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Delete a project by id
  async deleteProject(id: string) {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(null);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },
};