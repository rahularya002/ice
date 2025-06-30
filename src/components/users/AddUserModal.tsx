import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Department, User, Designation } from '../../types';
import { designationService } from '../../services/designationService';

interface AddUserModalProps {
  onClose: () => void;
  onSubmit: (userData: Omit<User, 'id' | 'createdAt'> & { password: string }) => void;
  departments: Department[];
}

const AddUserModal: React.FC<AddUserModalProps> = ({ onClose, onSubmit, departments }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as User['role'],
    designation: '',
    departmentId: '',
  });
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [showCustomDesignation, setShowCustomDesignation] = useState(false);
  const [customDesignation, setCustomDesignation] = useState('');
  const [customDesignationDescription, setCustomDesignationDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Load designations from Supabase
  useEffect(() => {
    const loadDesignations = async () => {
      try {
        console.log('🔄 Loading designations from Supabase...');
        const result = await designationService.getDesignations();
        if (result.success) {
          console.log('✅ Designations loaded:', result.data);
          const mappedDesignations = result.data.map((designation: any) => ({
            id: designation.id,
            name: designation.name,
            description: designation.description,
            departmentId: designation.department_id,
            isCustom: designation.is_custom,
            createdAt: new Date(designation.created_at)
          }));
          setDesignations(mappedDesignations);
        } else {
          console.error('❌ Failed to load designations:', result.error);
        }
      } catch (error) {
        console.error('❌ Error loading designations:', error);
      }
    };

    loadDesignations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let finalDesignation = formData.designation;
    
    // If custom designation is being added
    if (showCustomDesignation && customDesignation.trim()) {
      try {
        console.log('📝 Creating custom designation:', customDesignation);
        const newDesignation: Omit<Designation, 'id' | 'createdAt'> = {
          name: customDesignation.trim(),
          description: customDesignationDescription.trim() || `Custom designation: ${customDesignation.trim()}`,
          departmentId: formData.departmentId || undefined,
          isCustom: true,
        };
        
        const result = await designationService.createDesignation(newDesignation);
        if (result.success) {
          console.log('✅ Custom designation created successfully');
          finalDesignation = customDesignation.trim();
        } else {
          console.error('❌ Failed to create custom designation:', result.error);
          alert('Failed to create custom designation. Please try again.');
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('❌ Error creating custom designation:', error);
        alert('Failed to create custom designation. Please try again.');
        setLoading(false);
        return;
      }
    }
    
    onSubmit({
      ...formData,
      designation: finalDesignation,
    });
    
    setLoading(false);
  };

  const handleDesignationChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomDesignation(true);
      setFormData({ ...formData, designation: '' });
    } else {
      setShowCustomDesignation(false);
      setFormData({ ...formData, designation: value });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
              disabled={loading}
            >
              <option value="employee">Employee</option>
              <option value="project_manager">Project Manager</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Designation
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={showCustomDesignation ? 'custom' : formData.designation}
              onChange={(e) => handleDesignationChange(e.target.value)}
              disabled={loading}
            >
              <option value="">Select a designation</option>
              {designations.map((designation) => (
                <option key={designation.id} value={designation.name}>
                  {designation.name} {designation.isCustom ? '(Custom)' : ''}
                </option>
              ))}
              <option value="custom">+ Add Custom Designation</option>
            </select>
          </div>

          {showCustomDesignation && (
            <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Designation Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={customDesignation}
                  onChange={(e) => setCustomDesignation(e.target.value)}
                  placeholder="Enter designation name"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={2}
                  value={customDesignationDescription}
                  onChange={(e) => setCustomDesignationDescription(e.target.value)}
                  placeholder="Describe the role and responsibilities"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              disabled={loading}
            >
              <option value="">No Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Add User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;