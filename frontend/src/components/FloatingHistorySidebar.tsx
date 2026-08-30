import React, { useState, useRef, useEffect } from 'react';
import { Search, MessageSquare, Trash2, Plus, X } from 'lucide-react';
import type { ChatSession } from '../types';

interface FloatingHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

export const FloatingHistorySidebar: React.FC<FloatingHistorySidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      ref={sidebarRef}
      className="absolute top-16 left-6 z-50 w-80 bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 p-3.5 flex flex-col max-h-[75vh] animate-in fade-in slide-in-from-top-2 duration-150 select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1.5 pb-2.5 border-b border-gray-100 mb-2.5">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-gray-900">Chat History & Threads</span>
          <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
            {sessions.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Integrated Search Thread */}
      <div className="relative mb-2.5">
        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search thread history..."
          className="w-full bg-gray-50 border border-gray-200 focus:border-gray-300 focus:bg-white text-xs text-gray-900 rounded-xl pl-8 pr-3 py-2 outline-none transition-all placeholder:text-gray-400 font-sans"
        />
      </div>

      {/* New Thread Action */}
      <button
        onClick={() => {
          onNewChat();
          onClose();
        }}
        className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-gray-950 hover:bg-black text-white text-xs font-medium rounded-xl transition-all shadow-sm mb-2 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>New Thread</span>
      </button>

      {/* Filtered Sessions List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-400">
            No matching threads found
          </div>
        ) : (
          filteredSessions.map((sess) => {
            const isActive = sess.id === activeSessionId;
            return (
              <div
                key={sess.id}
                onClick={() => {
                  onSelectSession(sess.id);
                  onClose();
                }}
                className={`group flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gray-100 text-gray-900 font-semibold border border-gray-200 shadow-xs'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate flex-1 mr-1.5">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                  <span className="truncate">{sess.title}</span>
                </div>

                {sessions.length > 1 && (
                  <button
                    onClick={(e) => onDeleteSession(sess.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-opacity"
                    title="Delete thread"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="pt-2.5 mt-2 border-t border-gray-100 text-[10px] text-gray-400 font-mono flex justify-between px-1">
        <span>Monday.com Live Data</span>
        <span>Auto-saved</span>
      </div>
    </div>
  );
};

