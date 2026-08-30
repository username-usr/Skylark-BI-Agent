import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import type { MetricCard } from '../types';

interface MetricCardsProps {
  metrics: MetricCard[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics }) => {
  if (!metrics || metrics.length === 0) return null;

  const getIcon = (type?: string) => {
    switch (type) {
      case 'danger':
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'primary':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getBadgeStyle = (type?: string) => {
    switch (type) {
      case 'danger':
        return 'bg-red-50 text-red-700 border-red-200/80';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'primary':
        return 'bg-purple-50 text-purple-700 border-purple-200/80';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200/80';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 my-4">
      {metrics.map((metric, idx) => (
        <div 
          key={idx}
          className={`p-4 rounded-2xl border ${getBadgeStyle(metric.type)} transition-all shadow-2xs`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-[13px] font-bold uppercase tracking-wider text-gray-500">
              {metric.title}
            </span>
            {getIcon(metric.type)}
          </div>
          <div className="text-2xl md:text-[26px] font-bold tracking-tight text-gray-950 mb-1">
            {metric.value}
          </div>
          {metric.subtext && (
            <div className="text-xs md:text-[13.5px] text-gray-500 font-medium">
              {metric.subtext}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
