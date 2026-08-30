import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { 
  loadSessions, 
  saveSessions, 
  getActiveSessionId, 
  setActiveSessionId, 
  createNewSession 
} from './services/chatHistory';
import { AVAILABLE_MODELS, type ChatSession, type ChatMessage } from './types';

export const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionIdState] = useState<string>('session-default');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [externalQuery, setExternalQuery] = useState<string | undefined>();
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('monday_bi_selected_model') || AVAILABLE_MODELS[0].id;
  });

  useEffect(() => {
    localStorage.setItem('monday_bi_selected_model', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    const loaded = loadSessions();
    setSessions(loaded);
    const activeId = getActiveSessionId();
    if (loaded.some(s => s.id === activeId)) {
      setActiveSessionIdState(activeId);
    } else if (loaded.length > 0) {
      setActiveSessionIdState(loaded[0].id);
      setActiveSessionId(loaded[0].id);
    }
  }, []);

  const handleSelectSession = (id: string) => {
    setActiveSessionIdState(id);
    setActiveSessionId(id);
    setIsMobileSidebarOpen(false);
  };

  const handleNewThread = () => {
    const newSess = createNewSession();
    const updated = [newSess, ...sessions];
    setSessions(updated);
    saveSessions(updated);
    setActiveSessionIdState(newSess.id);
    setActiveSessionId(newSess.id);
    setIsMobileSidebarOpen(false);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) return;
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    saveSessions(updated);
    if (activeSessionId === id && updated.length > 0) {
      setActiveSessionIdState(updated[0].id);
      setActiveSessionId(updated[0].id);
    }
  };

  const handleUpdateSessionMessages = (sessionId: string, messages: ChatMessage[], newTitle?: string) => {
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            messages,
            title: newTitle || s.title,
            updatedAt: new Date().toISOString()
          };
        }
        return s;
      });
      saveSessions(updated);
      return updated;
    });
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || createNewSession();

  return (
    <div className="h-screen w-screen bg-white font-sans antialiased text-gray-900 flex flex-col overflow-hidden">
      {/* Standalone Top Header with Universal Model Switcher */}
      <Header 
        onNewThread={handleNewThread} 
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
      />

      {/* Main Content Area: Floating Left Sidebar + Seamless Chat Canvas */}
      <div className="flex-1 flex overflow-hidden px-6 pt-5 gap-6 min-h-0 bg-white">
        {/* Desktop Floating Compact Sidebar */}
        <div className="hidden md:flex">
          <Sidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewThread}
            onDeleteSession={handleDeleteSession}
          />
        </div>

        {/* Mobile Drawer Overlay */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs md:hidden flex">
            <div className="w-64 bg-white h-full p-4 animate-in slide-in-from-left duration-200 shadow-xl">
              <Sidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
                onNewChat={handleNewThread}
                onDeleteSession={handleDeleteSession}
              />
            </div>
            <div className="flex-1" onClick={() => setIsMobileSidebarOpen(false)} />
          </div>
        )}

        {/* Seamless Chat Page */}
        <main className="flex-1 flex flex-col overflow-hidden h-full min-w-0 bg-white">
          <ChatInterface
            session={activeSession}
            onUpdateSessionMessages={handleUpdateSessionMessages}
            externalQuery={externalQuery}
            onClearExternalQuery={() => setExternalQuery(undefined)}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
