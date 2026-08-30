import React from 'react';
import { Sparkles, Plus, Menu } from 'lucide-react';

interface HeaderProps {
  onNewThread: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNewThread, onToggleMobileSidebar }) => {
  return (
    <header className="px-6 py-3.5 flex items-center justify-between bg-white border-b border-gray-100 select-none z-20 shrink-0">
      {/* Left: Standalone Monday BI Agent Brand Badge */}
      <div className="flex items-center space-x-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        
        <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border border-gray-200/90 bg-white shadow-xs">
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
          <span className="text-[16px] font-semibold text-gray-900 tracking-tight">Monday BI Agent</span>
        </div>
      </div>

      {/* Right: + New Thread Action */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={onNewThread}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gray-950 hover:bg-black text-white text-[14px] font-medium shadow-xs transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Thread</span>
        </button>
      </div>
    </header>
  );
};
