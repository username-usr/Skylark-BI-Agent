import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { WarningWidget } from '../types';

interface QualityBannerProps {
  warnings: WarningWidget[];
}

export const QualityBanner: React.FC<QualityBannerProps> = ({ warnings }) => {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="space-y-2 my-3">
      {warnings.map((w, idx) => (
        <div
          key={idx}
          className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 text-[16px] font-normal leading-[1.4] tracking-[-0.02em] shadow-sm"
        >
          <div className="p-1 rounded-md bg-amber-100 shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 leading-[1.4]">
            <span className="font-normal text-amber-700 mr-1.5 uppercase">
              [{w.type}]
            </span>
            <span className="text-amber-900">{w.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
