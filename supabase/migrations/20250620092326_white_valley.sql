/*
  # ICE Portal Database Schema

  1. New Tables
    - `profiles` - User profiles with role-based access
    - `designations` - Job titles and positions
    - `departments` - Organizational departments
    - `projects` - Project management
    - `project_members` - Project team assignments
    - `tasks` - Task management with assignments
    - `task_submissions` - File submissions for tasks
    - `task_submission_files` - File metadata for submissions
    - `task_comments` - Comments on tasks
    - `time_entries` - Time tracking for tasks
    - `chat_messages` - Real-time messaging
    - `notifications` - System notifications

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Secure data access based on user roles and relationships

  3. Functions & Triggers
    - Auto-create profile on user signup
    - Update timestamps automatically
    - Maintain data consistency
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

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role DEFAULT 'employee',
  designation text,
  department_id uuid,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create designations table
CREATE TABLE IF NOT EXISTS designations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  description text,
  department_id uuid,
  is_custom boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  description text,
  manager_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint for profiles.department_id
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_department 
  FOREIGN KEY (department_id) REFERENCES departments(id);

-- Add foreign key constraint for designations.department_id
ALTER TABLE designations ADD CONSTRAINT fk_designations_department 
  FOREIGN KEY (department_id) REFERENCES departments(id);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  department_id uuid NOT NULL REFERENCES departments(id),
  manager_id uuid NOT NULL REFERENCES profiles(id),
  status project_status DEFAULT 'planning',
  start_date date NOT NULL,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  project_id uuid REFERENCES projects(id),
  assigned_to uuid NOT NULL REFERENCES profiles(id),
  assigned_by uuid NOT NULL REFERENCES profiles(id),
  status task_status DEFAULT 'todo',
  priority task_priority DEFAULT 'medium',
  due_date timestamptz,
  estimated_hours numeric(5,2),
  actual_hours numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task_submissions table
CREATE TABLE IF NOT EXISTS task_submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES profiles(id),
  description text,
  status submission_status DEFAULT 'pending',
  feedback text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id)
);

-- Create task_submission_files table
CREATE TABLE IF NOT EXISTS task_submission_files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id uuid NOT NULL REFERENCES task_submissions(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  file_path text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  hours numeric(5,2) NOT NULL CHECK (hours > 0),
  description text,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid NOT NULL REFERENCES profiles(id),
  receiver_id uuid REFERENCES profiles(id),
  project_id uuid REFERENCES projects(id),
  message text NOT NULL,
  type chat_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  CHECK (
    (type = 'direct' AND receiver_id IS NOT NULL AND project_id IS NULL) OR
    (type = 'project' AND project_id IS NOT NULL AND receiver_id IS NULL)
  )
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type notification_type NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Profiles policies
CREATE POLICY "Users can read all profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins and managers can update any profile" ON profiles
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Designations policies
CREATE POLICY "Anyone can read designations" ON designations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and managers can manage designations" ON designations
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Departments policies
CREATE POLICY "Anyone can read departments" ON departments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and managers can manage departments" ON departments
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Projects policies
CREATE POLICY "Users can read projects they're involved in" ON projects
  FOR SELECT TO authenticated USING (
    manager_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Project managers and above can create projects" ON projects
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager', 'project_manager')
    )
  );

CREATE POLICY "Project managers and admins can update projects" ON projects
  FOR UPDATE TO authenticated USING (
    manager_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Project members policies
CREATE POLICY "Users can read project members for their projects" ON project_members
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id 
      AND (
        p.manager_id = auth.uid() OR
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Project managers can manage project members" ON project_members
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id 
      AND (
        p.manager_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'manager')
        )
      )
    )
  );

-- Tasks policies
CREATE POLICY "Users can read tasks assigned to them or created by them" ON tasks
  FOR SELECT TO authenticated USING (
    assigned_to = auth.uid() OR
    assigned_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    ) OR
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id 
      AND (
        p.manager_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members pm 
          WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
        )
      )
    ))
  );

CREATE POLICY "Project managers and above can create tasks" ON tasks
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager', 'project_manager')
    )
  );

CREATE POLICY "Users can update tasks assigned to them" ON tasks
  FOR UPDATE TO authenticated USING (
    assigned_to = auth.uid() OR
    assigned_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Task submissions policies
CREATE POLICY "Users can read submissions for their tasks" ON task_submissions
  FOR SELECT TO authenticated USING (
    submitted_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = task_id 
      AND (t.assigned_to = auth.uid() OR t.assigned_by = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can create submissions for tasks assigned to them" ON task_submissions
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = task_id AND t.assigned_to = auth.uid()
    )
  );

-- Task submission files policies
CREATE POLICY "Users can read files for submissions they can access" ON task_submission_files
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM task_submissions ts 
      WHERE ts.id = submission_id 
      AND (
        ts.submitted_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM tasks t 
          WHERE t.id = ts.task_id 
          AND (t.assigned_to = auth.uid() OR t.assigned_by = auth.uid())
        ) OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'manager')
        )
      )
    )
  );

-- Task comments policies
CREATE POLICY "Users can read comments for tasks they can access" ON task_comments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = task_id 
      AND (
        t.assigned_to = auth.uid() OR 
        t.assigned_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'manager')
        ) OR
        (t.project_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM projects p 
          WHERE p.id = t.project_id 
          AND (
            p.manager_id = auth.uid() OR
            EXISTS (
              SELECT 1 FROM project_members pm 
              WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
            )
          )
        ))
      )
    )
  );

CREATE POLICY "Users can create comments for tasks they can access" ON task_comments
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = task_id 
      AND (
        t.assigned_to = auth.uid() OR 
        t.assigned_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'manager')
        ) OR
        (t.project_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM projects p 
          WHERE p.id = t.project_id 
          AND (
            p.manager_id = auth.uid() OR
            EXISTS (
              SELECT 1 FROM project_members pm 
              WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
            )
          )
        ))
      )
    )
  );

-- Time entries policies
CREATE POLICY "Users can read their own time entries" ON time_entries
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    ) OR
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = task_id AND t.assigned_by = auth.uid()
    )
  );

CREATE POLICY "Users can create time entries for their tasks" ON time_entries
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = task_id AND t.assigned_to = auth.uid()
    )
  );

-- Chat messages policies
CREATE POLICY "Users can read their own messages" ON chat_messages
  FOR SELECT TO authenticated USING (
    sender_id = auth.uid() OR
    receiver_id = auth.uid() OR
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id 
      AND (
        p.manager_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members pm 
          WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
        )
      )
    ))
  );

CREATE POLICY "Users can send messages" ON chat_messages
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can read their own notifications" ON notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Insert default designations
INSERT INTO designations (name, description, is_custom) VALUES
  ('Chief Executive Officer', 'Top executive responsible for overall company operations', false),
  ('Chief Operating Officer', 'Executive responsible for day-to-day operations', false),
  ('Chief Financial Officer', 'Executive responsible for financial operations', false),
  ('Chief Technology Officer', 'Executive responsible for technology strategy', false),
  ('President', 'Senior executive position, often second to CEO', false),
  ('Vice President', 'Senior management position overseeing major divisions', false),
  ('Senior Vice President', 'High-level executive position', false),
  ('Executive Vice President', 'Top-tier executive position', false),
  ('Director', 'Senior management role overseeing departments or major functions', false),
  ('Senior Director', 'High-level director position', false),
  ('Manager', 'Mid-level management position', false),
  ('Senior Manager', 'Experienced management role', false),
  ('Assistant Manager', 'Entry-level management position', false),
  ('Team Lead', 'Leadership role for specific teams', false),
  ('Supervisor', 'Oversees day-to-day operations of a team', false),
  ('Principal', 'Senior individual contributor or specialist', false),
  ('Senior Principal', 'High-level specialist or expert', false),
  ('Senior Associate', 'Experienced professional level', false),
  ('Associate', 'Mid-level professional position', false),
  ('Junior Associate', 'Entry-level professional position', false),
  ('Senior Specialist', 'Experienced specialist in a particular field', false),
  ('Specialist', 'Professional with specialized skills', false),
  ('Consultant', 'Expert advisor in specific areas', false),
  ('Senior Consultant', 'Experienced consulting professional', false),
  ('Analyst', 'Professional who analyzes data and processes', false),
  ('Coordinator', 'Organizes and manages specific functions', false),
  ('Senior Coordinator', 'Experienced coordination role', false),
  ('Administrator', 'Manages administrative functions', false),
  ('Executive Assistant', 'Provides high-level administrative support', false),
  ('Assistant', 'Provides support and assistance', false);

-- Insert sample departments
INSERT INTO departments (id, name, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Operations', 'Main operations department'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Engineering', 'Civil engineering projects and consulting'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Research & Development', 'Innovation and research initiatives'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Administration', 'Administrative and support functions');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_department ON projects(department_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_submissions_task ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project ON chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);