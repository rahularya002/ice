/*
  # ICE Portal Database Schema

  1. New Tables
    - `profiles` - User profiles extending Supabase auth
    - `designations` - Job designations/titles
    - `departments` - Organizational departments
    - `projects` - Project management
    - `tasks` - Task tracking and management
    - `task_submissions` - File submissions for tasks
    - `task_comments` - Comments on tasks
    - `time_entries` - Time tracking for tasks
    - `chat_messages` - Real-time messaging
    - `notifications` - User notifications

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Secure file uploads and access

  3. Real-time Features
    - Enable real-time subscriptions for chat and notifications
    - Task status updates
    - Project collaboration
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'project_manager', 'employee');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'completed', 'on_hold');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'completed');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE notification_type AS ENUM ('task_assigned', 'task_updated', 'task_completed', 'project_update', 'general');
CREATE TYPE chat_type AS ENUM ('direct', 'project');

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  designation text,
  department_id uuid REFERENCES departments(id),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Designations table
CREATE TABLE IF NOT EXISTS designations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  department_id uuid REFERENCES departments(id),
  is_custom boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  manager_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  department_id uuid REFERENCES departments(id) NOT NULL,
  manager_id uuid REFERENCES profiles(id) NOT NULL,
  status project_status DEFAULT 'planning',
  start_date date NOT NULL,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Project members junction table
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  project_id uuid REFERENCES projects(id),
  assigned_to uuid REFERENCES profiles(id) NOT NULL,
  assigned_by uuid REFERENCES profiles(id) NOT NULL,
  status task_status DEFAULT 'todo',
  priority task_priority DEFAULT 'medium',
  due_date timestamptz,
  estimated_hours numeric,
  actual_hours numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Task submissions table
CREATE TABLE IF NOT EXISTS task_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  submitted_by uuid REFERENCES profiles(id) NOT NULL,
  description text,
  status submission_status DEFAULT 'pending',
  feedback text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id)
);

-- Task submission files table
CREATE TABLE IF NOT EXISTS task_submission_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES task_submissions(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  file_path text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Task comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Time entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  hours numeric NOT NULL CHECK (hours > 0),
  description text,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) NOT NULL,
  receiver_id uuid REFERENCES profiles(id),
  project_id uuid REFERENCES projects(id),
  message text NOT NULL,
  type chat_type NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type notification_type NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint for department_id in profiles (after departments table exists)
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_department 
  FOREIGN KEY (department_id) REFERENCES departments(id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submission_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins and managers can insert profiles" ON profiles FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Designations policies
CREATE POLICY "Everyone can view designations" ON designations FOR SELECT USING (true);
CREATE POLICY "Admins and managers can manage designations" ON designations FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Departments policies
CREATE POLICY "Everyone can view departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Admins and managers can manage departments" ON departments FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Projects policies
CREATE POLICY "Users can view relevant projects" ON projects FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (
        role IN ('admin', 'manager') OR
        projects.manager_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members 
          WHERE project_id = projects.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Managers and above can manage projects" ON projects FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager', 'project_manager')
    )
  );

-- Project members policies
CREATE POLICY "Users can view project members for accessible projects" ON project_members FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (
        role IN ('admin', 'manager') OR
        EXISTS (
          SELECT 1 FROM projects 
          WHERE id = project_members.project_id 
          AND (manager_id = auth.uid() OR id IN (
            SELECT project_id FROM project_members pm2 WHERE pm2.user_id = auth.uid()
          ))
        )
      )
    )
  );

-- Tasks policies
CREATE POLICY "Users can view relevant tasks" ON tasks FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (
        role IN ('admin', 'manager') OR
        tasks.assigned_to = auth.uid() OR
        tasks.assigned_by = auth.uid()
      )
    )
  );

CREATE POLICY "Managers and above can create tasks" ON tasks FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager', 'project_manager')
    )
  );

CREATE POLICY "Users can update tasks they're involved with" ON tasks FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (
        role IN ('admin', 'manager') OR
        tasks.assigned_to = auth.uid() OR
        tasks.assigned_by = auth.uid()
      )
    )
  );

-- Task submissions policies
CREATE POLICY "Users can view submissions for accessible tasks" ON task_submissions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE id = task_submissions.task_id 
      AND (
        assigned_to = auth.uid() OR 
        assigned_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can submit work for their tasks" ON task_submissions FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE id = task_submissions.task_id 
      AND assigned_to = auth.uid()
    )
  );

-- Task comments policies
CREATE POLICY "Users can view comments for accessible tasks" ON task_comments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE id = task_comments.task_id 
      AND (
        assigned_to = auth.uid() OR 
        assigned_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can comment on accessible tasks" ON task_comments FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE id = task_comments.task_id 
      AND (
        assigned_to = auth.uid() OR 
        assigned_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'manager')
        )
      )
    )
  );

-- Time entries policies
CREATE POLICY "Users can view time entries for accessible tasks" ON time_entries FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE id = time_entries.task_id 
      AND (
        assigned_to = auth.uid() OR 
        assigned_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can log time for their tasks" ON time_entries FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE id = time_entries.task_id 
      AND assigned_to = auth.uid()
    )
  );

-- Chat messages policies
CREATE POLICY "Users can view their chat messages" ON chat_messages FOR SELECT 
  USING (
    sender_id = auth.uid() OR 
    receiver_id = auth.uid() OR
    (
      type = 'project' AND 
      EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = chat_messages.project_id 
        AND user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can send chat messages" ON chat_messages FOR INSERT 
  WITH CHECK (sender_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE 
  USING (user_id = auth.uid());

-- Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'New User'), 'employee');
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update task actual hours when time entry is added
CREATE OR REPLACE FUNCTION update_task_actual_hours()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tasks 
  SET actual_hours = (
    SELECT COALESCE(SUM(hours), 0) 
    FROM time_entries 
    WHERE task_id = NEW.task_id
  )
  WHERE id = NEW.task_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update task hours
CREATE TRIGGER update_task_hours_on_time_entry
  AFTER INSERT ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_task_actual_hours();

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;