import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { CheckSquare, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface TaskStatusChartProps {
  tasks: any[];
  loading?: boolean;
}

const TaskStatusChart: React.FC<TaskStatusChartProps> = ({ tasks, loading = false }) => {
  // Calculate task status distribution
  const statusCounts = tasks.reduce((acc: any, task: any) => {
    const status = task.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const totalTasks = tasks.length;
  const statusData = [
    {
      status: 'completed',
      label: 'Completed',
      count: statusCounts.completed || 0,
      color: 'bg-green-500',
      icon: CheckCircle,
      percentage: totalTasks > 0 ? ((statusCounts.completed || 0) / totalTasks) * 100 : 0
    },
    {
      status: 'in_progress',
      label: 'In Progress',
      count: statusCounts.in_progress || 0,
      color: 'bg-blue-500',
      icon: Clock,
      percentage: totalTasks > 0 ? ((statusCounts.in_progress || 0) / totalTasks) * 100 : 0
    },
    {
      status: 'review',
      label: 'Under Review',
      count: statusCounts.review || 0,
      color: 'bg-yellow-500',
      icon: AlertCircle,
      percentage: totalTasks > 0 ? ((statusCounts.review || 0) / totalTasks) * 100 : 0
    },
    {
      status: 'pending',
      label: 'Pending',
      count: statusCounts.pending || 0,
      color: 'bg-gray-500',
      icon: CheckSquare,
      percentage: totalTasks > 0 ? ((statusCounts.pending || 0) / totalTasks) * 100 : 0
    }
  ];

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Task Status Distribution</CardTitle>
          <CardDescription>Overview of task completion status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Task Status Distribution</CardTitle>
        <CardDescription>Overview of task completion status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusData.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.status} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className="text-gray-600">{item.count}</span>
                </div>
                <div className="space-y-1">
                  <Progress value={item.percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{item.percentage.toFixed(1)}%</span>
                    <span>{item.count} of {totalTasks} tasks</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {statusData.find(s => s.status === 'completed')?.count || 0}
              </div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {statusData.find(s => s.status === 'in_progress')?.count || 0}
              </div>
              <div className="text-xs text-gray-500">In Progress</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskStatusChart; 