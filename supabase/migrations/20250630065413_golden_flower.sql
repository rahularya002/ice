/*
  # Sample Data for Testing

  1. Sample Users
    - Admin user
    - Manager
    - Project Manager
    - Employees

  2. Sample Departments
    - Engineering
    - Operations
    - Human Resources

  3. Sample Designations
    - Various job titles

  4. Sample Tasks
    - Different statuses and priorities
    - Assigned to different users

  5. Sample Data
    - Comments, time entries, notifications
*/

-- Insert sample departments first
INSERT INTO departments (id, name, description, manager_id) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Engineering', 'Software development and technical operations', NULL),
  ('22222222-2222-2222-2222-222222222222', 'Operations', 'Business operations and project management', NULL),
  ('33333333-3333-3333-3333-333333333333', 'Human Resources', 'People management and organizational development', NULL);

-- Insert sample designations
INSERT INTO designations (id, name, description, department_id, is_custom) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'Chief Executive Officer', 'Top executive responsible for overall company operations', NULL, false),
  ('d2222222-2222-2222-2222-222222222222', 'Vice President', 'Senior management position overseeing major divisions', NULL, false),
  ('d3333333-3333-3333-3333-333333333333', 'Director', 'Senior management role overseeing departments', NULL, false),
  ('d4444444-4444-4444-4444-444444444444', 'Manager', 'Mid-level management position', NULL, false),
  ('d5555555-5555-5555-5555-555555555555', 'Senior Associate', 'Experienced professional level', NULL, false),
  ('d6666666-6666-6666-6666-666666666666', 'Associate', 'Mid-level professional position', NULL, false),
  ('d7777777-7777-7777-7777-777777777777', 'Software Engineer', 'Technical development role', '11111111-1111-1111-1111-111111111111', false),
  ('d8888888-8888-8888-8888-888888888888', 'Project Coordinator', 'Project management and coordination', '22222222-2222-2222-2222-222222222222', false),
  ('d9999999-9999-9999-9999-999999999999', 'HR Specialist', 'Human resources specialist', '33333333-3333-3333-3333-333333333333', false);

-- Note: Sample users will be created through the application's user creation process
-- This ensures proper auth.users entries are created

-- Insert sample tasks (these will be created after users are set up)
-- The application will handle creating the initial admin user and sample data

-- Insert sample notifications for testing
-- These will be created through the application's notification system

-- Insert sample chat messages
-- These will be created through the application's chat system

-- Create a function to set up sample data after users are created
CREATE OR REPLACE FUNCTION setup_sample_data()
RETURNS void AS $$
DECLARE
  admin_id uuid;
  manager_id uuid;
  pm_id uuid;
  employee_id uuid;
BEGIN
  -- Get user IDs (assuming they exist)
  SELECT id INTO admin_id FROM profiles WHERE role = 'admin' LIMIT 1;
  SELECT id INTO manager_id FROM profiles WHERE role = 'manager' LIMIT 1;
  SELECT id INTO pm_id FROM profiles WHERE role = 'project_manager' LIMIT 1;
  SELECT id INTO employee_id FROM profiles WHERE role = 'employee' LIMIT 1;

  -- Only proceed if we have users
  IF admin_id IS NOT NULL AND manager_id IS NOT NULL AND pm_id IS NOT NULL AND employee_id IS NOT NULL THEN
    
    -- Update department managers
    UPDATE departments SET manager_id = manager_id WHERE name = 'Engineering';
    UPDATE departments SET manager_id = manager_id WHERE name = 'Operations';
    UPDATE departments SET manager_id = admin_id WHERE name = 'Human Resources';

    -- Insert sample tasks
    INSERT INTO tasks (id, title, description, assigned_to, assigned_by, status, priority, due_date, estimated_hours) VALUES
      ('t1111111-1111-1111-1111-111111111111', 'Setup Development Environment', 'Configure development tools and environment for new project', employee_id, pm_id, 'completed', 'high', now() - interval '2 days', 4),
      ('t2222222-2222-2222-2222-222222222222', 'Code Review Process', 'Review and approve pending code changes', employee_id, manager_id, 'in_progress', 'medium', now() + interval '3 days', 2),
      ('t3333333-3333-3333-3333-333333333333', 'Database Migration', 'Migrate database schema to new version', employee_id, pm_id, 'todo', 'high', now() + interval '1 week', 6),
      ('t4444444-4444-4444-4444-444444444444', 'User Documentation', 'Create user documentation for new features', employee_id, manager_id, 'review', 'low', now() + interval '5 days', 3);

    -- Insert sample task comments
    INSERT INTO task_comments (task_id, user_id, comment) VALUES
      ('t1111111-1111-1111-1111-111111111111', pm_id, 'Great work on setting up the environment! Everything looks good.'),
      ('t1111111-1111-1111-1111-111111111111', employee_id, 'Thank you! Ready to move on to the next phase.'),
      ('t2222222-2222-2222-2222-222222222222', manager_id, 'Please focus on the authentication module first.'),
      ('t3333333-3333-3333-3333-333333333333', pm_id, 'Make sure to backup the database before migration.');

    -- Insert sample time entries
    INSERT INTO time_entries (task_id, user_id, hours, description, date) VALUES
      ('t1111111-1111-1111-1111-111111111111', employee_id, 4.0, 'Set up development environment and tools', current_date - 1),
      ('t2222222-2222-2222-2222-222222222222', employee_id, 1.5, 'Started code review for authentication module', current_date),
      ('t4444444-4444-4444-4444-444444444444', employee_id, 2.0, 'Drafted initial user documentation outline', current_date - 2);

    -- Insert sample notifications
    INSERT INTO notifications (user_id, title, message, type) VALUES
      (employee_id, 'New Task Assigned', 'You have been assigned a new task: Database Migration', 'task_assigned'),
      (pm_id, 'Task Completed', 'Setup Development Environment has been completed', 'task_completed'),
      (manager_id, 'Task Update', 'Code Review Process is now in progress', 'task_updated'),
      (employee_id, 'Welcome to ICE Portal', 'Welcome to the ICE Portal task management system!', 'general');

    -- Insert sample chat messages
    INSERT INTO chat_messages (sender_id, receiver_id, message, type) VALUES
      (pm_id, employee_id, 'Hi! How is the development environment setup going?', 'direct'),
      (employee_id, pm_id, 'All done! Ready for the next task.', 'direct'),
      (manager_id, employee_id, 'Great work on completing the setup task!', 'direct'),
      (employee_id, manager_id, 'Thank you! Looking forward to the code review.', 'direct');

  END IF;
END;
$$ LANGUAGE plpgsql;

-- The setup_sample_data function will be called after users are created through the application