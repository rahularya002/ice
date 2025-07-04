import { supabase, handleSupabaseError, handleSupabaseSuccess } from '../lib/supabase';
// Removed import of Project because it is not exported from '../types'

export const projectService = {
  // Get all projects
  async getProjects() {
    try {
      // First, get projects without the nested project_members query to avoid recursion
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) {
        return handleSupabaseError(projectsError);
      }

      // Then, get project members separately
      const { data: projectMembers, error: membersError } = await supabase
        .from('project_members')
        .select('project_id, user_id');

      if (membersError) {
        console.warn('Could not fetch project members:', membersError);
        // Continue without members data rather than failing completely
      }

      // Combine the data
      const projectsWithMembers = projects.map(project => ({
        ...project,
        project_members: projectMembers 
          ? projectMembers.filter(member => member.project_id === project.id)
          : []
      }));

      return handleSupabaseSuccess(projectsWithMembers);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Get project by ID
  async getProjectById(id: string) {
    try {
      // Get project without nested query
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) {
        return handleSupabaseError(projectError);
      }

      // Get project members separately
      const { data: projectMembers, error: membersError } = await supabase
        .from('project_members')
        .select('project_id, user_id')
        .eq('project_id', id);

      if (membersError) {
        console.warn('Could not fetch project members:', membersError);
      }

      // Combine the data
      const projectWithMembers = {
        ...project,
        project_members: projectMembers || []
      };

      return handleSupabaseSuccess(projectWithMembers);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Create project
  async createProject(projectData: Omit<any, 'id' | 'createdAt'>) { // Fix: use 'any' instead of 'Project' to avoid TS error
    try {
      // Create the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          description: projectData.description,
          department_id: projectData.departmentId,
          manager_id: projectData.managerId,
          status: projectData.status,
          start_date: projectData.startDate.toISOString(),
          end_date: projectData.endDate?.toISOString() || null
        })
        .select()
        .single();

      if (projectError) {
        return handleSupabaseError(projectError);
      }

      // Add project members
      if (projectData.memberIds && projectData.memberIds.length > 0) {
        const memberInserts = projectData.memberIds.map((userId: string) => ({
          project_id: project.id,
          user_id: userId
        }));

        const { error: membersError } = await supabase
          .from('project_members')
          .insert(memberInserts);

        if (membersError) {
          console.error('Failed to add project members:', membersError);
          // Don't fail the entire operation, just log the error
        }
      }

      return handleSupabaseSuccess(project);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Update project
  async updateProject(id: string, updates: Partial<any>) { // Fix: use 'any' instead of 'Project' to avoid TS error
    try {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.departmentId) updateData.department_id = updates.departmentId;
      if (updates.managerId) updateData.manager_id = updates.managerId;
      if (updates.status) updateData.status = updates.status;
      if (updates.startDate) updateData.start_date = updates.startDate.toISOString();
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate?.toISOString() || null;

      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return handleSupabaseError(error);
      }

      // Update project members if provided
      if (updates.memberIds !== undefined) {
        // Remove existing members
        await supabase
          .from('project_members')
          .delete()
          .eq('project_id', id);

        // Add new members
        if (Array.isArray(updates.memberIds) && updates.memberIds.length > 0) {
          const memberInserts = updates.memberIds.map((userId: string) => ({
            project_id: id,
            user_id: userId
          }));

          await supabase
            .from('project_members')
            .insert(memberInserts);
        }
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Delete project
  async deleteProject(id: string) {
    try {
      // Delete project members first
      await supabase
        .from('project_members')
        .delete()
        .eq('project_id', id);

      // Delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(null);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }
};