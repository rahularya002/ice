-- Migration: Remove all project-related tables, columns, types, policies, and indexes
-- Date: 2024-07-01

-- 1. Drop project-related tables
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- 2. Remove project references from other tables
ALTER TABLE IF EXISTS tasks DROP COLUMN IF EXISTS project_id;
ALTER TABLE IF EXISTS chat_messages DROP COLUMN IF EXISTS project_id;

-- 3. Remove project-related enum types
DROP TYPE IF EXISTS project_status CASCADE;

-- 4. Remove project-related RLS policies
-- Tasks
DROP POLICY IF EXISTS "Users can read tasks assigned to them or created by them" ON tasks;
DROP POLICY IF EXISTS "Project managers and above can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks assigned to them" ON tasks;
-- Chat messages
DROP POLICY IF EXISTS "Users can read their own messages" ON chat_messages;

-- 5. Remove project-related indexes
DROP INDEX IF EXISTS idx_tasks_project;
DROP INDEX IF EXISTS idx_chat_messages_project;
DROP INDEX IF EXISTS idx_project_members_project;
DROP INDEX IF EXISTS idx_project_members_user;
DROP INDEX IF EXISTS idx_projects_manager;
DROP INDEX IF EXISTS idx_projects_department;

-- 6. Recreate clean RLS policies for tasks
CREATE POLICY "Users can read their own tasks" ON tasks
  FOR SELECT TO authenticated
  USING (
    assigned_to = auth.uid() OR
    assigned_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can create tasks" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    assigned_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE TO authenticated
  USING (
    assigned_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 7. Recreate clean RLS policies for chat_messages
CREATE POLICY "Users can read their own chat messages" ON chat_messages
  FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid() OR
    receiver_id = auth.uid()
  );

CREATE POLICY "Users can send chat messages" ON chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- 8. (Optional) Clean up any functions, triggers, or sample data referencing projects or project_members as needed. 