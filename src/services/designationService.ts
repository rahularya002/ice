import { supabase, handleSupabaseError, handleSupabaseSuccess } from '../lib/supabase';
import { Designation } from '../types';

export const designationService = {
  // Get all designations
  async getDesignations() {
    try {
      const { data, error } = await supabase
        .from('designations')
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

  // Create designation
  async createDesignation(designationData: Omit<Designation, 'id' | 'createdAt'>) {
    try {
      const { data, error } = await supabase
        .from('designations')
        .insert({
          name: designationData.name,
          description: designationData.description,
          department_id: designationData.departmentId || null,
          is_custom: designationData.isCustom || false
        })
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

  // Update designation
  async updateDesignation(id: string, updates: Partial<Designation>) {
    try {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.departmentId !== undefined) updateData.department_id = updates.departmentId;
      if (updates.isCustom !== undefined) updateData.is_custom = updates.isCustom;

      const { data, error } = await supabase
        .from('designations')
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

  // Delete designation
  async deleteDesignation(id: string) {
    try {
      const { error } = await supabase
        .from('designations')
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