import React, { useState } from 'react';
import { 
  SquarePen, 
  Search, 
  MessageSquare, 
  Trash2
} from 'lucide-react';
import type { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-72 md:w-80 h-full flex flex-col shrink-0 select-none">
      {/* Detached Floating Sidebar Container */}
      <div className="flex-1 bg-white rounded-3xl border border-gray-200/90 shadow-sm flex flex-col overflow-hidden p-4">
        
        {/* + New Chat Primary Action Button */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center space-x-2.5 px-4 py-2.5 rounded-2xl bg-gray-950 hover:bg-black text-white text-sm md:text-[15px] font-semibold transition-all shadow-xs cursor-pointer active:scale-98 mb-3.5"
        >
          <SquarePen className="w-4 h-4 stroke-[2.2]" />
          <span>New Chat</span>
        </button>

        {/* Search Threads Input */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search threads..."
            className="w-full bg-gray-50/80 hover:bg-gray-100/70 focus:bg-white text-sm md:text-[14.5px] text-gray-900 placeholder:text-gray-400 pl-10 pr-3.5 py-2 rounded-xl border border-gray-200/80 focus:border-purple-300 outline-none transition-all"
          />
        </div>

        {/* Recent Threads List */}
        <div className="text-xs md:text-[13px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
          Recent Threads
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-xs md:text-sm text-gray-400">
              No threads found
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm md:text-[14.5px] transition-all cursor-pointer ${
                    isActive
                      ? 'bg-purple-50/80 text-purple-900 font-semibold border border-purple-100 shadow-2xs'
                      : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-950'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate flex-1 mr-2">
                    <MessageSquare className={`w-4 h-4 shrink-0 stroke-[2] ${isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    <span className="truncate leading-snug">{session.title}</span>
                  </div>

                  {sessions.length > 1 && (
                    <button
                      onClick={(e) => onDeleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 text-gray-400 rounded transition-all cursor-pointer"
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
      </div>
    </aside>
  );
};
