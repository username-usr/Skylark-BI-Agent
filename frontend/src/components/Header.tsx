import React from 'react';
import { Sparkles, Plus, Menu } from 'lucide-react';

interface HeaderProps {
  onNewThread: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onNewThread, 
  onToggleMobileSidebar
}) => {
  return (
    <header className="h-16 border-b border-gray-100 bg-white/95 backdrop-blur-md px-6 md:px-8 flex items-center justify-between z-30 shrink-0">
      {/* Brand Card with smooth curves and proportional star icon */}
      <div className="flex items-center space-x-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-xl hover:bg-gray-100 text-gray-600"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Floating Brand Card */}
        <div className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-2xl bg-white border border-gray-200/85 shadow-xs hover:border-gray-300 transition-all">
          <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <Sparkles className="w-3.5 h-3.5 stroke-[2.4]" />
          </div>
          <span className="text-sm md:text-[15px] font-bold tracking-tight text-gray-900">
            Monday BI Agent
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onNewThread}
          className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-gray-950 hover:bg-black text-white text-sm md:text-[14.5px] font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Thread</span>
        </button>
      </div>
    </header>
  );
};
