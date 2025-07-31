import React, { useState } from 'react';
import { Activity, Calendar, Target } from 'lucide-react';
import { CheckSquare } from 'lucide-react';

interface RecentTasksProps {
  tasks: any[];
  onTaskClick: () => void;
}

const RecentTasks: React.FC<RecentTasksProps> = ({ tasks, onTaskClick }) => {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const recentTasks = tasks.slice(0, 5);

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 w-full">
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Tasks</h3>
          </div>
          <span className="text-xs sm:text-sm text-gray-500">{recentTasks.length} tasks</span>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        {recentTasks.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {recentTasks.map((task: any) => (
              <div
                key={task.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer w-full"
                onClick={onTaskClick}
              >
                <div className="flex-1 w-full">
                  <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{task.title}</h4>
                  <p
                    className={`text-xs sm:text-sm text-gray-600 mb-2${expandedTaskId !== task.id ? ' truncate' : ''}`}
                    style={
                      expandedTaskId !== task.id
                        ? { maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
                        : { maxWidth: '100%' }
                    }
                  >
                    {expandedTaskId === task.id
                      ? task.description
                      : task.description.length > 80
                        ? `${task.description.slice(0, 80)}...`
                        : task.description}
                  </p>
                  {task.description.length > 80 && expandedTaskId !== task.id && (
                    <button
                      className="text-xs text-blue-600 hover:underline"
                      onClick={e => {
                        e.stopPropagation();
                        setExpandedTaskId(task.id);
                      }}
                    >
                      Read more
                    </button>
                  )}
                  {expandedTaskId === task.id && (
                    <button
                      className="text-xs text-blue-600 hover:underline ml-2"
                      onClick={e => {
                        e.stopPropagation();
                        setExpandedTaskId(null);
                      }}
                    >
                      Show less
                    </button>
                  )}
                  <div className="flex flex-wrap items-center space-x-2 sm:space-x-3 mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTaskStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    {task.dueDate && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-0 sm:ml-4 mt-2 sm:mt-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <CheckSquare className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-500 text-sm sm:text-base">No tasks assigned yet</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">Tasks will appear here once they're assigned to you</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentTasks; 