import { supabase, handleSupabaseError, handleSupabaseSuccess } from '../lib/supabase';
import { TimeEntry } from '../types';

export const timeEntryService = {
  // Get all time entries
  async getTimeEntries() {
    try {
      const { data, error } = await supabase
        .from('time_entries')
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

  // Get time entries by user
  async getTimeEntriesByUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Get time entries by task
  async getTimeEntriesByTask(taskId: string) {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Add time entry
  async addTimeEntry(timeEntryData: Omit<TimeEntry, 'id' | 'createdAt'>) {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          task_id: timeEntryData.taskId,
          user_id: timeEntryData.userId,
          hours: timeEntryData.hours,
          description: timeEntryData.description,
          date: timeEntryData.date.toISOString().split('T')[0] // Convert to date string
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

  // Update time entry
  async updateTimeEntry(id: string, updates: Partial<TimeEntry>) {
    try {
      const updateData: any = {};
      if (updates.hours !== undefined) updateData.hours = updates.hours;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.date) updateData.date = updates.date.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('time_entries')
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

  // Delete time entry
  async deleteTimeEntry(id: string) {
    try {
      const { error } = await supabase
        .from('time_entries')
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