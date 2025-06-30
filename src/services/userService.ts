import { supabase, supabaseAdmin, handleSupabaseError, handleSupabaseSuccess } from '../lib/supabase';
import { User } from '../types';

export const userService = {
  // Get all users
  async getUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Get user by ID
  async getUserById(id: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Update user profile
  async updateUser(id: string, updates: Partial<User>) {
    try {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.role) updateData.role = updates.role;
      if (updates.designation !== undefined) updateData.designation = updates.designation;
      if (updates.departmentId !== undefined) updateData.department_id = updates.departmentId;

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Delete user (soft delete by updating auth)
  async deleteUser(id: string) {
    try {
      if (!supabaseAdmin) {
        return handleSupabaseError(new Error('Admin access not available'));
      }

      // Delete the auth user (this will cascade to profile)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(null);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Get users by department
  async getUsersByDepartment(departmentId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('department_id', departmentId)
        .order('name');

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }
};