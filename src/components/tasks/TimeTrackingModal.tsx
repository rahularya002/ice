import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';
import { Task } from '../../types';
import { timeEntryService } from '../../services/timeEntryService';

interface TimeTrackingModalProps {
  task: Task;
  onClose: () => void;
  onSubmit: (hours: number, description: string) => void;
}

const TimeTrackingModal: React.FC<TimeTrackingModalProps> = ({ task, onClose, onSubmit }) => {
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hours || parseFloat(hours) <= 0) {
      alert('Please enter valid hours');
      return;
    }

    setLoading(true);
    
    try {
      // Create time entry in Supabase
      const timeEntryData = {
        taskId: task.id,
        userId: task.assignedTo, // Assuming the assigned user is logging time
        hours: parseFloat(hours),
        description: description.trim() || 'Time logged for task',
        date: new Date()
      };

      const result = await timeEntryService.addTimeEntry(timeEntryData);
      
      if (result.success) {
        console.log('✅ Time entry created successfully');
        onSubmit(parseFloat(hours), description);
      } else {
        console.error('❌ Failed to create time entry:', result.error);
        alert('Failed to log time. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error creating time entry:', error);
      alert('Failed to log time. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Log Time</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h4 className="font-medium text-gray-900">{task.title}</h4>
            <p className="text-sm text-gray-600">{task.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hours Worked
              </label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g., 2.5"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">Enter hours in decimal format (e.g., 1.5 for 1 hour 30 minutes)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Work Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you worked on..."
                disabled={loading}
              />
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
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Logging...</span>
                  </div>
                ) : (
                  'Log Time'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TimeTrackingModal;