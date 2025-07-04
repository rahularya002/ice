import { supabase, handleSupabaseError, handleSupabaseSuccess } from '../lib/supabase';
import { Task } from '../types';

export const taskService = {
  // Get all tasks
  async getTasks() {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_files:task_files(*),
          task_submissions (
            *,
            task_submission_files (*)
          ),
          task_comments (
            *,
            profiles:user_id (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return handleSupabaseError(error);
      }

      // Map attachments for each task
      const tasksWithAttachments = (data || []).map(task => ({
        ...task,
        attachments: task.task_files || []
      }));

      return handleSupabaseSuccess(tasksWithAttachments);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Create task
  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          assigned_to: taskData.assignedTo,
          assigned_by: taskData.assignedBy,
          status: taskData.status,
          priority: taskData.priority,
          due_date: taskData.dueDate?.toISOString() || null,
          estimated_hours: taskData.estimatedHours || null,
          actual_hours: taskData.actualHours || 0
        })
        .select()
        .single();

      if (error) {
        return handleSupabaseError(error);
      }

      // Insert attachments into task_files if any
      if (taskData.attachments && taskData.attachments.length > 0) {
        const fileInserts = taskData.attachments.map(file => ({
          task_id: data.id,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_path: file.url,
          uploaded_by: taskData.assignedBy,
          uploaded_at: (file.uploadedAt || new Date()).toISOString(),
        }));
        const { error: filesError } = await supabase
          .from('task_files')
          .insert(fileInserts);
        if (filesError) {
          console.error('Failed to add task files:', filesError);
        }
      }

      // Fetch the task again to include attachments
      const { data: fullTask, error: fetchError } = await supabase
        .from('tasks')
        .select(`*, task_files:task_files(*)`)
        .eq('id', data.id)
        .single();
      if (fetchError) {
        return handleSupabaseError(fetchError);
      }
      return handleSupabaseSuccess({ ...fullTask, attachments: fullTask.task_files || [] });
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Update task
  async updateTask(id: string, updates: Partial<Task>) {
    try {
      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.assignedTo) updateData.assigned_to = updates.assignedTo;
      if (updates.assignedBy) updateData.assigned_by = updates.assignedBy;
      if (updates.status) updateData.status = updates.status;
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate?.toISOString() || null;
      if (updates.estimatedHours !== undefined) updateData.estimated_hours = updates.estimatedHours;
      if (updates.actualHours !== undefined) updateData.actual_hours = updates.actualHours;

      const { data, error } = await supabase
        .from('tasks')
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

  // Delete task
  async deleteTask(id: string) {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(null);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Add task comment
  async addTaskComment(taskId: string, userId: string, comment: string) {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: userId,
          comment
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

  // Create task submission
  async createTaskSubmission(submissionData: {
    taskId: string;
    submittedBy: string;
    description?: string;
    files: any[];
  }) {
    try {
      // Create the submission
      const { data: submission, error: submissionError } = await supabase
        .from('task_submissions')
        .insert({
          task_id: submissionData.taskId,
          submitted_by: submissionData.submittedBy,
          description: submissionData.description || null
        })
        .select()
        .single();

      if (submissionError) {
        return handleSupabaseError(submissionError);
      }

      // Add files if any
      if (submissionData.files && submissionData.files.length > 0) {
        const fileInserts = submissionData.files.map(file => ({
          submission_id: submission.id,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_path: file.url
        }));

        const { error: filesError } = await supabase
          .from('task_submission_files')
          .insert(fileInserts);

        if (filesError) {
          console.error('Failed to add submission files:', filesError);
        }
      }

      return handleSupabaseSuccess(submission);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }
};