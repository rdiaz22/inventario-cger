import React from 'react';
import { LucideIcon } from 'lucide-react';

const DashboardCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeType = 'positive', 
  color = 'blue',
  onClick 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  const changeColorClasses = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50',
  };

  return (
    <div 
      className={`bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
        onClick ? 'hover:border-blue-300' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`p-2 sm:p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        {change && (
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${changeColorClasses[changeType]}`}>
            {changeType === 'positive' ? '+' : changeType === 'negative' ? '-' : ''}
            {change}
          </div>
        )}
      </div>
      
      <div className="mb-2 sm:mb-3">
        <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
      </div>
      
      {onClick && (
        <div className="flex items-center text-xs sm:text-sm text-blue-600 font-medium">
          <span className="hidden sm:inline">Ver detalles</span>
          <span className="sm:hidden">Ver</span>
          <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
