import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Users, Building } from 'lucide-react';

interface DepartmentDistributionChartProps {
  users: any[];
  departments: any[];
  loading?: boolean;
}

const DepartmentDistributionChart: React.FC<DepartmentDistributionChartProps> = ({ 
  users, 
  departments, 
  loading = false 
}) => {
  // Calculate user distribution by department
  const departmentStats = departments.map(dept => {
    const deptUsers = users.filter(user => user.departmentId === dept.id);
    return {
      id: dept.id,
      name: dept.name,
      count: deptUsers.length,
      percentage: users.length > 0 ? (deptUsers.length / users.length) * 100 : 0
    };
  }).sort((a, b) => b.count - a.count);

  // Colors for different departments
  const colors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-purple-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-yellow-500'
  ];

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Department Distribution</CardTitle>
          <CardDescription>User distribution across departments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
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
        <CardTitle className="text-lg">Department Distribution</CardTitle>
        <CardDescription>User distribution across departments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {departmentStats.map((dept, index) => (
            <div key={dept.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                  <span className="font-medium">{dept.name}</span>
                </div>
                <span className="text-gray-600">{dept.count} users</span>
              </div>
              <div className="space-y-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${colors[index % colors.length]} transition-all duration-300`}
                    style={{ width: `${dept.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{dept.percentage.toFixed(1)}%</span>
                  <span>{dept.count} of {users.length} total</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {departments.length}
              </div>
              <div className="text-xs text-gray-500">Departments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {users.length}
              </div>
              <div className="text-xs text-gray-500">Total Users</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DepartmentDistributionChart; 