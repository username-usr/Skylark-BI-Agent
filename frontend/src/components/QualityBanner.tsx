import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { QualityWarning } from '../types';

interface QualityBannerProps {
  warnings: QualityWarning[];
}

export const QualityBanner: React.FC<QualityBannerProps> = ({ warnings }) => {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="space-y-2.5 my-4">
      {warnings.map((w, idx) => (
        <div 
          key={idx}
          className="flex items-start space-x-3 p-3.5 md:p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs md:text-[14px] leading-relaxed shadow-2xs"
        >
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold mr-1.5 uppercase text-[11px] md:text-xs tracking-wider bg-amber-100/80 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
              {w.type}
            </span>
            <span className="font-medium text-amber-900">{w.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
