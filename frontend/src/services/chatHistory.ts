import type { ChatSession } from '../types';

const STORAGE_KEY = 'skylark_monday_chat_sessions_v2';
const ACTIVE_SESSION_KEY = 'skylark_monday_active_session_id_v2';

const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: 'session-default',
    title: 'New Conversation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: []
  }
];

export const loadSessions = (): ChatSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SESSIONS));
      return INITIAL_SESSIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SESSIONS;
  } catch {
    return INITIAL_SESSIONS;
  }
};

export const saveSessions = (sessions: ChatSession[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions:', e);
  }
};

export const getActiveSessionId = (): string => {
  return localStorage.getItem(ACTIVE_SESSION_KEY) || 'session-default';
};

export const setActiveSessionId = (id: string): void => {
  localStorage.setItem(ACTIVE_SESSION_KEY, id);
};

export const createNewSession = (firstQuery?: string): ChatSession => {
  const newSession: ChatSession = {
    id: `session-${Date.now()}`,
    title: firstQuery ? (firstQuery.length > 28 ? `${firstQuery.slice(0, 28)}...` : firstQuery) : 'New Conversation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: []
  };
  return newSession;
};
