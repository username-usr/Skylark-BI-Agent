import React from 'react';
import { Sparkles, Plus, Menu } from 'lucide-react';

interface HeaderProps {
  onNewThread: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNewThread, onToggleMobileSidebar }) => {
  return (
    <header className="h-16 border-b border-gray-100 bg-white/95 backdrop-blur-md px-6 md:px-8 flex items-center justify-between z-30 shrink-0">
      {/* Brand Badge */}
      <div className="flex items-center space-x-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-xl hover:bg-gray-100 text-gray-600"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="w-9 h-9 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-2xs">
          <Sparkles className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span className="text-base md:text-lg font-bold tracking-tight text-gray-900">
          Monday BI Agent
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onNewThread}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-950 hover:bg-black text-white text-sm md:text-[15px] font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Thread</span>
        </button>
      </div>
    </header>
  );
};
