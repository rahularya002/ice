/*
  # Sample Data for ICE Portal

  1. Sample Departments
    - Engineering Department
    - Project Management Office
    - Quality Assurance
    - Research & Development

  2. Sample Designations
    - Chief Executive Officer
    - Senior Engineer
    - Project Manager
    - Quality Analyst
    - Research Scientist

  3. Notes
    - This creates basic organizational structure
    - Admin user should be created through the application
*/

-- Insert sample departments
INSERT INTO departments (id, name, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Engineering Department', 'Core engineering and technical development'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Project Management Office', 'Project planning, execution, and oversight'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Quality Assurance', 'Quality control and testing'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Research & Development', 'Innovation and research initiatives')
ON CONFLICT (id) DO NOTHING;

-- Insert sample designations
INSERT INTO designations (name, description, department_id) VALUES
  ('Chief Executive Officer', 'Executive leadership and strategic direction', NULL),
  ('Senior Engineer', 'Senior technical engineering role', '550e8400-e29b-41d4-a716-446655440001'),
  ('Project Manager', 'Project planning and execution', '550e8400-e29b-41d4-a716-446655440002'),
  ('Quality Analyst', 'Quality assurance and testing', '550e8400-e29b-41d4-a716-446655440003'),
  ('Research Scientist', 'Research and development', '550e8400-e29b-41d4-a716-446655440004'),
  ('Junior Engineer', 'Entry-level engineering position', '550e8400-e29b-41d4-a716-446655440001'),
  ('Technical Lead', 'Technical team leadership', '550e8400-e29b-41d4-a716-446655440001'),
  ('QA Manager', 'Quality assurance management', '550e8400-e29b-41d4-a716-446655440003')
ON CONFLICT (name) DO NOTHING;