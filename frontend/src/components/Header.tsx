import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Plus, Menu, Cpu, ChevronDown, Check } from 'lucide-react';
import { AVAILABLE_MODELS } from '../types';

interface HeaderProps {
  onNewThread: () => void;
  onToggleMobileSidebar?: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onNewThread, 
  onToggleMobileSidebar,
  selectedModel,
  onSelectModel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      {/* Center/Right Action Buttons & Model Switcher */}
      <div className="flex items-center space-x-3">
        {/* Universal Model Switcher Dropdown (Always accessible anywhere) */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-gray-200 bg-gray-50/90 hover:bg-gray-100/90 text-xs md:text-sm font-medium text-gray-800 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Cpu className="w-4 h-4 text-purple-600" />
            <span className="font-semibold">{currentModel.name}</span>
            <span className="hidden sm:inline text-gray-400 font-mono text-[11px]">({currentModel.tag})</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-gray-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1.5">
                Active AI Engine
              </div>
              <div className="space-y-1">
                {AVAILABLE_MODELS.map((m) => {
                  const isSelected = m.id === selectedModel;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelectModel(m.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs md:text-[13px] flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-50 text-purple-900 font-bold border border-purple-100'
                          : 'text-gray-700 hover:bg-gray-100/80'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-gray-900">{m.name}</div>
                        <div className="text-[11px] text-gray-400">{m.provider} • {m.tag}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* New Thread Button */}
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
