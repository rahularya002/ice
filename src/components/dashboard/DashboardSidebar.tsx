import React from 'react';
import { Clock, Calendar, Building } from 'lucide-react';

interface DashboardSidebarProps {
  upcomingDeadlines: any[];
  recentProjects: any[];
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ upcomingDeadlines, recentProjects }) => {
  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-3 sm:space-y-6 w-full">
      {/* Upcoming Deadlines */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          {upcomingDeadlines.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {upcomingDeadlines.map((task: any) => {
                const daysUntil = getDaysUntilDue(task.dueDate!);
                const isOverdue = daysUntil < 0;
                const isUrgent = daysUntil <= 2 && daysUntil >= 0;
                
                return (
                  <div key={task.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg w-full">
                    <div className="flex-1 w-full">
                      <p className="font-medium text-gray-900 text-xs sm:text-sm">{task.title}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(task.dueDate!).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-0 sm:ml-3 mt-2 sm:mt-0">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        isOverdue ? 'bg-red-100 text-red-800' :
                        isUrgent ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {isOverdue ? `${Math.abs(daysUntil)}d overdue` :
                         daysUntil === 0 ? 'Due today' :
                         `${daysUntil}d left`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2 sm:mb-3" />
              <p className="text-gray-500 text-xs sm:text-sm">No upcoming deadlines</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Building className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Projects</h3>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          {recentProjects.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {recentProjects.map((project: any) => (
                <div key={project.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg w-full">
                  <div className="flex-1 w-full">
                    <p className="font-medium text-gray-900 text-xs sm:text-sm">{project.name}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {project.startDate ? `Started: ${new Date(project.startDate).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <div className="ml-0 sm:ml-3 mt-2 sm:mt-0">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${project.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}> 
                      {project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : 'Unconfirmed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <Building className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2 sm:mb-3" />
              <p className="text-gray-500 text-xs sm:text-sm">No recent projects</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar; 