export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'manager' | 'project_manager' | 'employee'
          designation: string | null
          department_id: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'admin' | 'manager' | 'project_manager' | 'employee'
          designation?: string | null
          department_id?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'manager' | 'project_manager' | 'employee'
          designation?: string | null
          department_id?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      designations: {
        Row: {
          id: string
          name: string
          description: string | null
          department_id: string | null
          is_custom: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          department_id?: string | null
          is_custom?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          department_id?: string | null
          is_custom?: boolean
          created_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          name: string
          description: string | null
          manager_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          department_id: string
          manager_id: string
          status: 'planning' | 'active' | 'completed' | 'on_hold'
          start_date: string
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          department_id: string
          manager_id: string
          status?: 'planning' | 'active' | 'completed' | 'on_hold'
          start_date: string
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          department_id?: string
          manager_id?: string
          status?: 'planning' | 'active' | 'completed' | 'on_hold'
          start_date?: string
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          added_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          added_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          added_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          project_id: string | null
          assigned_to: string
          assigned_by: string
          status: 'todo' | 'in_progress' | 'review' | 'completed'
          priority: 'low' | 'medium' | 'high'
          due_date: string | null
          estimated_hours: number | null
          actual_hours: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          project_id?: string | null
          assigned_to: string
          assigned_by: string
          status?: 'todo' | 'in_progress' | 'review' | 'completed'
          priority?: 'low' | 'medium' | 'high'
          due_date?: string | null
          estimated_hours?: number | null
          actual_hours?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          project_id?: string | null
          assigned_to?: string
          assigned_by?: string
          status?: 'todo' | 'in_progress' | 'review' | 'completed'
          priority?: 'low' | 'medium' | 'high'
          due_date?: string | null
          estimated_hours?: number | null
          actual_hours?: number
          created_at?: string
          updated_at?: string
        }
      }
      task_submissions: {
        Row: {
          id: string
          task_id: string
          submitted_by: string
          description: string | null
          status: 'pending' | 'approved' | 'rejected'
          feedback: string | null
          submitted_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: string
          task_id: string
          submitted_by: string
          description?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          feedback?: string | null
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          id?: string
          task_id?: string
          submitted_by?: string
          description?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          feedback?: string | null
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
      }
      task_submission_files: {
        Row: {
          id: string
          submission_id: string
          file_name: string
          file_size: number
          file_type: string
          file_path: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          file_name: string
          file_size: number
          file_type: string
          file_path: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_path?: string
          uploaded_at?: string
        }
      }
      task_comments: {
        Row: {
          id: string
          task_id: string
          user_id: string
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          comment: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          comment?: string
          created_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          task_id: string
          user_id: string
          hours: number
          description: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          hours: number
          description?: string | null
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          hours?: number
          description?: string | null
          date?: string
          created_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string | null
          project_id: string | null
          message: string
          type: 'direct' | 'project'
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id?: string | null
          project_id?: string | null
          message: string
          type: 'direct' | 'project'
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string | null
          project_id?: string | null
          message?: string
          type?: 'direct' | 'project'
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'task_assigned' | 'task_updated' | 'task_completed' | 'project_update' | 'general'
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'task_assigned' | 'task_updated' | 'task_completed' | 'project_update' | 'general'
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'task_assigned' | 'task_updated' | 'task_completed' | 'project_update' | 'general'
          read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'manager' | 'project_manager' | 'employee'
      project_status: 'planning' | 'active' | 'completed' | 'on_hold'
      task_status: 'todo' | 'in_progress' | 'review' | 'completed'
      task_priority: 'low' | 'medium' | 'high'
      submission_status: 'pending' | 'approved' | 'rejected'
      notification_type: 'task_assigned' | 'task_updated' | 'task_completed' | 'project_update' | 'general'
      chat_type: 'direct' | 'project'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}