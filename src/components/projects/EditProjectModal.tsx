import React, { useState } from 'react';
import { X } from 'lucide-react';
import { User } from '../../types';

interface EditProjectModalProps {
  onClose: () => void;
  onSubmit: (projectData: any) => void;
  users: User[];
  initialProject: any;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ onClose, onSubmit, users, initialProject }) => {
  const [formData, setFormData] = useState({
    name: initialProject.name || '',
    description: initialProject.description || '',
    managerId: initialProject.manager_id || '',
    startDate: initialProject.start_date || '',
    endDate: initialProject.end_date || '',
    memberIds: initialProject.memberIds || [],
    status: initialProject.status || 'unconfirmed',
    id: initialProject.id,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onSubmit(formData);
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit Project</h3>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Manager</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.managerId}
              onChange={e => setFormData({ ...formData, managerId: e.target.value })}
              disabled={loading}
              required
            >
              <option value="">Select a manager</option>
              {users.filter(u => u.role === 'project_manager' || u.role === 'manager' || u.role === 'admin').map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                disabled={loading}
                min={formData.startDate}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              disabled={loading}
              required
            >
              <option value="unconfirmed">Unconfirmed</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Employees</label>
            <select
              multiple
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.memberIds}
              onChange={e => {
                const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
                setFormData({ ...formData, memberIds: options });
              }}
              disabled={loading}
              size={Math.min(6, users.length)}
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl (Cmd on Mac) to select multiple members.</p>
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
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
              disabled={loading}
            >
              Update Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal; 