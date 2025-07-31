import React from 'react';
import { Users, Building, CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import StatCard from './StatCard';

interface DashboardStatsProps {
  stats: Array<{
    title: string;
    value: number;
    icon: string;
    color: string;
    textColor: string;
    bgColor: string;
    change: string;
    changeType: 'increase' | 'decrease';
    visible: boolean;
  }>;
  loading: boolean;
  onStatClick: (tabName: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users className="h-6 w-6 text-amber-600" />,
  Building: <Building className="h-6 w-6 text-blue-600" />,
  CheckSquare: <CheckSquare className="h-6 w-6 text-purple-600" />,
  Clock: <Clock className="h-6 w-6 text-yellow-600" />,
  AlertCircle: <AlertCircle className="h-6 w-6 text-red-600" />,
};

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, loading, onStatClick }) => {
  const visibleStats = stats.filter(stat => stat.visible);

  if (loading) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-6 mb-4 sm:mb-8 w-full">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 w-full">
            <Skeleton className="h-6 w-6 mb-4 rounded-lg" />
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-6 mb-4 sm:mb-8 w-full">
      {visibleStats.map((stat, index) => (
        <StatCard
          key={index}
          icon={iconMap[stat.icon] || <Users className="h-6 w-6" />}
          value={stat.value}
          label={stat.title}
          colorClass={stat.bgColor}
          trend={{ value: stat.change, type: stat.changeType }}
        />
      ))}
    </div>
  );
};

export default DashboardStats; 