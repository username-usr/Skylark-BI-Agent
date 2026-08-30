import React from 'react';
import { X, MessageSquare, Trash2, Plus, Clock } from 'lucide-react';
import type { ChatSession } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-700" />
            <h3 className="text-[16px] font-normal leading-[1.4] tracking-[-0.02em] text-gray-900">Chat History & Threads</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action: New Thread */}
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-gray-950 hover:bg-black text-white text-[16px] font-normal leading-[1.4] tracking-[-0.02em] rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Thread</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="max-h-80 overflow-y-auto p-4 space-y-1.5">
          {sessions.map((sess) => {
            const isActive = sess.id === activeSessionId;
            return (
              <div
                key={sess.id}
                onClick={() => {
                  onSelectSession(sess.id);
                  onClose();
                }}
                className={`group flex items-center justify-between p-3 rounded-xl text-[16px] font-normal leading-[1.4] tracking-[-0.02em] transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gray-100 text-gray-900 border border-gray-300'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3 truncate flex-1 mr-2">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                  <span className="truncate">{sess.title}</span>
                </div>

                {sessions.length > 1 && (
                  <button
                    onClick={(e) => onDeleteSession(sess.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-opacity"
                    title="Delete thread"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-[16px] font-normal leading-[1.4] tracking-[-0.02em] text-gray-500 flex justify-between">
          <span>{sessions.length} saved threads</span>
          <span>Monday.com Hosted MCP</span>
        </div>
      </div>
    </div>
  );
};
