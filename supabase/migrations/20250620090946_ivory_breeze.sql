/*
  # Sample Data for ICE Portal

  1. Sample Data
    - Default designations
    - Sample departments
    - Sample users (profiles)
    - Sample projects and tasks

  2. Notes
    - This is for development/demo purposes
    - In production, data would be added through the admin interface
*/

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

-- Note: Sample users will be created through the admin interface
-- The auth.users entries need to be created first, then profiles will be auto-created via trigger

-- Sample projects (will be added after users are created)
-- Sample tasks (will be added after projects are created)