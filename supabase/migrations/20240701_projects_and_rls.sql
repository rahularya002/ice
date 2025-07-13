-- Create projects table
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  manager_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  end_date date,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create project_members table
CREATE TABLE project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  added_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create project_daily_entries table
CREATE TABLE project_daily_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  text text NOT NULL,
  file_url text,
  file_name text,
  file_type text,
  file_size integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_daily_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- 1. Projects: Only admin/manager/project_manager can insert/update/delete, all members can select their projects
CREATE POLICY "Allow admin/manager/project_manager to insert/update/delete projects" ON projects
  FOR ALL
  USING (
    auth.role() = 'authenticated' AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'manager' OR role = 'project_manager'))
    )
  );

CREATE POLICY "Allow all to select projects they are a member of" ON projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
        AND project_members.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'manager' OR role = 'project_manager'))
  );

-- 2. Project Members: Only admin/manager/project_manager can insert/delete
CREATE POLICY "Allow admin/manager/project_manager to insert/delete project_members" ON project_members
  FOR ALL
  USING (
    auth.role() = 'authenticated' AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'manager' OR role = 'project_manager'))
    )
  );

-- 3. Project Daily Entries: Only project members can insert/select their own entries
CREATE POLICY "Allow project members to insert/view their own entries" ON project_daily_entries
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_daily_entries.project_id
        AND project_members.user_id = auth.uid()
    )
  ); 