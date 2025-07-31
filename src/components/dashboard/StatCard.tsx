import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  colorClass?: string;
  trend?: {
    value: string;
    type: 'increase' | 'decrease';
  };
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, colorClass = '', trend }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col items-start min-w-[140px] w-full">
      <div className={`mb-4 p-2 rounded-lg ${colorClass}`}>{icon}</div>
      <div className="flex items-center space-x-2 mb-1">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {trend && (
          <span className={`text-xs font-medium ${trend.type === 'increase' ? 'text-green-600' : 'text-red-600'}`}>{trend.value}</span>
        )}
      </div>
      <span className="text-xs text-gray-500 font-medium">{label}</span>
    </div>
  );
};

export default StatCard;