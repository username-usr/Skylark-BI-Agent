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
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-56 bg-white rounded-2xl border border-gray-200/90 shadow-sm p-3 flex flex-col max-h-[calc(100vh-140px)] mb-7 shrink-0 select-none transition-all">
      {/* Top Action: New Chat */}
      <button
        onClick={onNewChat}
        className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-gray-950 hover:bg-black text-white text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer active:scale-98 mb-2.5"
      >
        <SquarePen className="w-3.5 h-3.5" />
        <span>New Chat</span>
      </button>

      {/* Search Thread Input */}
      <div className="relative mb-2.5">
        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search threads..."
          className="w-full bg-gray-50/80 border border-gray-200 focus:border-gray-300 focus:bg-white text-xs text-gray-800 rounded-xl pl-8 pr-2.5 py-1.5 outline-none transition-all placeholder:text-gray-400 font-sans"
        />
      </div>

      {/* Conversations / Threads List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        <div className="text-[11px] font-medium text-gray-400 px-1 mb-1">
          Recent Threads
        </div>

        {filteredSessions.length === 0 ? (
          <div className="text-center py-4 text-xs text-gray-400">
            No matching threads
          </div>
        ) : (
          filteredSessions.map((sess) => {
            const isActive = sess.id === activeSessionId;
            return (
              <div
                key={sess.id}
                onClick={() => onSelectSession(sess.id)}
                className={`group flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gray-100 text-gray-950 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2 truncate flex-1 mr-1">
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
    </aside>
  );
};
