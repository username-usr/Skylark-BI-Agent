import React from 'react';
import { TrendingUp, Coins, BarChart3, AlertOctagon, CheckCircle2 } from 'lucide-react';
import type { MetricWidget } from '../types';

interface MetricCardsProps {
  metrics: MetricWidget[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics }) => {
  if (!metrics || metrics.length === 0) return null;

  const getStyleAndIcon = (type: MetricWidget['type']) => {
    switch (type) {
      case 'primary':
        return {
          cardBg: 'bg-white border-gray-200 hover:border-gray-300',
          icon: <Coins className="w-4 h-4 text-gray-900" />,
          titleColor: 'text-gray-500',
          valueColor: 'text-gray-900',
        };
      case 'success':
        return {
          cardBg: 'bg-emerald-50/50 border-emerald-200',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          titleColor: 'text-emerald-700',
          valueColor: 'text-emerald-950',
        };
      case 'warning':
        return {
          cardBg: 'bg-amber-50/50 border-amber-200',
          icon: <TrendingUp className="w-4 h-4 text-amber-600" />,
          titleColor: 'text-amber-700',
          valueColor: 'text-amber-950',
        };
      case 'danger':
        return {
          cardBg: 'bg-rose-50/50 border-rose-200',
          icon: <AlertOctagon className="w-4 h-4 text-rose-600" />,
          titleColor: 'text-rose-700',
          valueColor: 'text-rose-950',
        };
      default:
        return {
          cardBg: 'bg-gray-50/80 border-gray-200',
          icon: <BarChart3 className="w-4 h-4 text-gray-600" />,
          titleColor: 'text-gray-500',
          valueColor: 'text-gray-900',
        };
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-3.5">
      {metrics.map((m, idx) => {
        const { cardBg, icon, titleColor, valueColor } = getStyleAndIcon(m.type);
        return (
          <div
            key={idx}
            className={`p-4 rounded-2xl border shadow-sm transition-all duration-150 ${cardBg}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[16px] font-normal leading-[1.4] tracking-[-0.02em] uppercase ${titleColor}`}>
                {m.title}
              </span>
              {icon}
            </div>
            
            <div className={`text-[16px] font-normal leading-[1.4] tracking-[-0.02em] ${valueColor}`}>
              {m.value}
            </div>

            {m.subtext && (
              <div className="text-[16px] font-normal leading-[1.4] tracking-[-0.02em] text-gray-500 mt-1">
                {m.subtext}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
