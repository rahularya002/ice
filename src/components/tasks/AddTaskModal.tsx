import React, { useState } from 'react';
import { X } from 'lucide-react';
import { User, Task, SubmissionFile } from '../../types';

interface AddTaskModalProps {
  onClose: () => void;
  onSubmit: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  users: User[];
  currentUser: User | null;
}

const CLOUDINARY_UPLOAD_PRESET = 'task-files';
const CLOUDINARY_CLOUD_NAME = 'dom7v8fgf';

async function uploadFileToCloudinary(file: File) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error('Cloudinary upload failed');
  return await response.json();
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ 
  onClose, 
  onSubmit, 
  users,
  currentUser 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    assignedBy: currentUser?.id || '',
    status: 'todo' as Task['status'],
    priority: 'medium' as Task['priority'],
    dueDate: '',
    estimatedHours: '',
  });

  const [attachments, setAttachments] = useState<SubmissionFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: formData.title,
      description: formData.description,
      assignedTo: formData.assignedTo,
      assignedBy: formData.assignedBy,
      status: formData.status,
      priority: formData.priority,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
      actualHours: 0,
      submissions: [],
      comments: [],
      attachments: attachments.length > 0 ? attachments : undefined,
    };
    onSubmit(taskData);
  };

  const availableUsers = users.filter(u => u.role === 'employee' || u.role === 'project_manager');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = Array.from(e.target.files || []);
    if (attachments.length + files.length > 2) {
      setUploadError('You can only upload up to 2 files.');
      return;
    }
    setUploading(true);
    try {
      const newFiles: SubmissionFile[] = [];
      for (const file of files) {
        console.log('Uploading file to Cloudinary:', file);
        // Optionally: validate file size/type here
        const result = await uploadFileToCloudinary(file);
        console.log('Cloudinary upload result:', result);
        newFiles.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: result.original_filename,
          size: result.bytes,
          type: result.format,
          url: result.secure_url,
          uploadedAt: new Date(),
        });
      }
      setAttachments(prev => [...prev, ...newFiles]);
      console.log('All uploaded files:', newFiles);
    } catch (err) {
      setUploadError('File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add New Task</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter task description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
            >
              <option value="">Select a user</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {currentUser?.role !== 'employee' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date (Optional)
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Hours
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attach File(s) (Optional, max 2)
              </label>
              <input
                type="file"
                multiple
                accept=".doc,.docx,.pdf,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar,.xlsx,.xls,.ppt,.pptx"
                onChange={handleFileChange}
                disabled={attachments.length >= 2 || uploading}
              />
              {uploadError && <div className="text-red-600 text-xs mt-1">{uploadError}</div>}
              {uploading && <div className="text-blue-600 text-xs mt-1">Uploading...</div>}
              {attachments.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {attachments.map(file => (
                    <li key={file.id} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                      <span className="text-xs">{file.name}</span>
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">View</a>
                      <button type="button" onClick={() => removeAttachment(file.id)} className="text-red-500 text-xs ml-2">Remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;