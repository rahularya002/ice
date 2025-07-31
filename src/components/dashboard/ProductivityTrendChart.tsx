import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';

interface ProductivityTrendChartProps {
  tasks: any[];
  loading?: boolean;
}

const ProductivityTrendChart: React.FC<ProductivityTrendChartProps> = ({ tasks, loading = false }) => {
  // Calculate productivity trends for the last 7 days
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const last7Days = getLast7Days();
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate completed tasks per day
  const completedTasksByDay = last7Days.map(date => {
    const dayTasks = tasks.filter(task => {
      if (!task.createdAt) return false;
      const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
      return taskDate === date;
    });
    return {
      date,
      count: dayTasks.length,
      label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: date === todayStr
    };
  });

  // Calculate trend
  const totalCompleted = completedTasksByDay.reduce((sum, day) => sum + day.count, 0);
  const averageCompleted = totalCompleted / 7;
  const recentDays = completedTasksByDay.slice(-3);
  const recentAverage = recentDays.reduce((sum, day) => sum + day.count, 0) / 3;

  let trend = 'stable';
  let trendIcon = Minus;
  let trendColor = 'text-gray-500';

  if (recentAverage > averageCompleted * 1.1) {
    trend = 'increasing';
    trendIcon = TrendingUp;
    trendColor = 'text-green-500';
  } else if (recentAverage < averageCompleted * 0.9) {
    trend = 'decreasing';
    trendIcon = TrendingDown;
    trendColor = 'text-red-500';
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Productivity Trend</CardTitle>
          <CardDescription>Task completion over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...completedTasksByDay.map(day => day.count), 1);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Productivity Trend</CardTitle>
        <CardDescription>Task completion over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        {totalCompleted === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-gray-400">
            <Calendar className="h-10 w-10 mb-2" />
            <div className="font-medium">No completed tasks in the last 7 days</div>
            <div className="text-xs">Complete tasks to see your productivity trend!</div>
          </div>
        ) : (
          <>
            {/* Chart Axis */}
            <div className="relative h-40 flex items-end w-full">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between z-0">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="border-t border-dashed border-gray-200 w-full" style={{height: '20%'}} />
                ))}
              </div>
              {/* Bars */}
              <div className="flex w-full h-full z-10 items-end">
                {completedTasksByDay.map((day, idx) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center group">
                    {/* Bar */}
                    <div
                      className={`w-7 sm:w-8 rounded-t-md transition-all duration-300 mb-1 ${day.isToday ? 'bg-orange-500 shadow-lg ring-2 ring-orange-400' : 'bg-amber-500'} ${day.count === 0 ? 'opacity-40' : ''}`}
                      style={{ height: `${(day.count / maxCount) * 90 + 10}%`, minHeight: '10px' }}
                    >
                      {day.count > 0 && (
                        <div className="text-xs text-center font-semibold text-amber-900 mt-[-1.5em] select-none">
                          {day.count}
                        </div>
                      )}
                    </div>
                    {/* Day label */}
                    <div className={`text-xs mt-1 ${day.isToday ? 'font-bold text-amber-700' : 'text-gray-500'}`}>{day.label}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Summary & Trend */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalCompleted}</div>
                <div className="text-xs text-gray-500">Total completed this week</div>
              </div>
              <div className="flex items-center space-x-2">
                {React.createElement(trendIcon, { className: `h-5 w-5 ${trendColor}` })}
                <div className="text-right">
                  <div className={`text-sm font-medium ${trendColor}`}>
                    {trend === 'increasing' ? '+' : trend === 'decreasing' ? '-' : ''}
                    {Math.abs(recentAverage - averageCompleted).toFixed(1)} avg
                  </div>
                  <div className="text-xs text-gray-500 capitalize">{trend} trend</div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductivityTrendChart; 