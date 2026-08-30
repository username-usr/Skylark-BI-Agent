import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowUp, 
  Paperclip, 
  User, 
  Loader2,
  Copy,
  Check,
  Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatSession, ChatMessage } from '../types';
import { sendChatMessage } from '../services/api';
import { MetricCards } from './MetricCards';
import { QualityBanner } from './QualityBanner';
import { BreakdownTable } from './BreakdownTable';

interface ChatInterfaceProps {
  session: ChatSession;
  onUpdateSessionMessages: (sessionId: string, messages: ChatMessage[], newTitle?: string) => void;
  externalQuery?: string;
  onClearExternalQuery?: () => void;
}

const EXAMPLE_CARDS = [
  {
    title: "Analyze Deals pipeline for this quarter",
    subtitle: "Open value, weighted pipeline & sector breakdown",
    query: "How is our open pipeline looking across sectors, and what is our weighted pipeline value?"
  },
  {
    title: "Check high-risk accounts & receivables",
    subtitle: "Find clients with open deals and unpaid AR",
    query: "Which customers have open deals and outstanding receivables?"
  },
  {
    title: "Review unbilled completed projects",
    subtitle: "Identify accrued revenue risks in Work Orders",
    query: "What is our total outstanding Receivables and Unbilled Completed Work?"
  },
  {
    title: "Run deterministic data quality audit",
    subtitle: "Detect missing deal values and status issues",
    query: "Run a data quality audit across Deals and Work Orders."
  }
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  session,
  onUpdateSessionMessages,
  externalQuery,
  onClearExternalQuery
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const isHomeView = session.messages.length === 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, loading]);

  useEffect(() => {
    if (externalQuery) {
      handleSend(externalQuery);
      if (onClearExternalQuery) onClearExternalQuery();
    }
  }, [externalQuery]);

  const estimateTokens = (text: string): number => {
    if (!text) return 0;
    return Math.max(1, Math.ceil(text.trim().length / 4));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...session.messages, userMsg];
    const isFirstUserMessage = session.messages.filter(m => m.sender === 'user').length === 0;
    const newTitle = isFirstUserMessage ? (textToSend.length > 28 ? `${textToSend.slice(0, 28)}...` : textToSend) : undefined;

    onUpdateSessionMessages(session.id, updatedMessages, newTitle);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage(textToSend);
      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: response.answer,
        metrics: response.metrics,
        warnings: response.warnings,
        table: response.table,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      onUpdateSessionMessages(session.id, [...updatedMessages, agentMsg], newTitle);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: `**Error processing query**: ${err.message || 'Failed to connect to backend agent.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      onUpdateSessionMessages(session.id, [...updatedMessages, errorMsg], newTitle);
    } finally {
      setLoading(false);
    }
  };

  // Calculate overall input & output tokens for current session
  const totalInputTokens = session.messages
    .filter(m => m.sender === 'user')
    .reduce((acc, m) => acc + estimateTokens(m.text), 0);

  const totalOutputTokens = session.messages
    .filter(m => m.sender === 'agent')
    .reduce((acc, m) => acc + estimateTokens(m.text), 0);

  const totalSessionTokens = totalInputTokens + totalOutputTokens;

  return (
    <div className="flex flex-col h-full w-full bg-white text-gray-900 overflow-hidden font-sans relative">
      {isHomeView ? (
        /* ==================== HERO SCREEN ==================== */
        <div className="flex-1 w-full overflow-y-auto px-4 py-8 md:py-12">
          <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-full">
            {/* 3D Purple Gradient Sphere */}
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-indigo-400 shadow-xl shadow-purple-500/25 flex items-center justify-center animate-pulse" />
              <div className="absolute inset-0 rounded-full blur-lg bg-purple-500/30 -z-10" />
            </div>

            {/* Hero Titles */}
            <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-gray-900 text-center mb-1">
              {getTimeGreeting()}, Founder
            </h2>
            <h1 className="text-2xl md:text-3xl font-medium tracking-tight text-gray-900 text-center mb-8">
              What's on <span className="text-purple-600 font-semibold">your mind?</span>
            </h1>

            {/* Prompt Input Box */}
            <div className="w-full bg-white rounded-3xl border border-gray-200 shadow-lg shadow-gray-200/40 p-4 md:p-5 mb-8 transition-all focus-within:border-gray-300 focus-within:shadow-xl">
              <div className="flex items-start space-x-2.5 mb-4">
                <Sparkles className="w-4 h-4 text-purple-600 mt-1 shrink-0" />
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={3}
                  placeholder="Ask Monday BI a business question or request an analysis..."
                  className="w-full bg-transparent text-sm md:text-base text-gray-900 placeholder:text-gray-400 outline-none resize-none"
                />
              </div>

              {/* Input Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleSend("Run a full cross-board risk analysis linking Deals pipeline with Work Orders receivables.")}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-medium text-gray-700 transition-colors cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5 text-gray-500" />
                  <span>Attach</span>
                </button>

                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="w-8 h-8 rounded-full bg-gray-950 hover:bg-black disabled:opacity-30 text-white flex items-center justify-center transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Example Prompt Cards */}
            <div className="w-full">
              <div className="text-xs font-medium text-gray-500 mb-3 px-1">
                Get started with an example below
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EXAMPLE_CARDS.map((card, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSend(card.query)}
                    className="p-4 rounded-2xl bg-gray-50/70 hover:bg-gray-100/80 border border-gray-200/80 hover:border-gray-300 transition-all cursor-pointer flex flex-col justify-between h-24 group shadow-xs"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-gray-900 group-hover:text-purple-700 transition-colors leading-snug">
                        {card.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== ACTIVE CONVERSATION STREAM ==================== */
        <>
          <div className="flex-1 w-full overflow-y-auto px-4 py-6 md:px-10 pb-20">
            <div className="max-w-3xl mx-auto space-y-6">
              {session.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3.5 ${
                    msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-gray-200 text-gray-800 font-medium'
                        : 'bg-purple-600 text-white'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`w-full rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gray-100/90 border border-gray-200/80 text-gray-900 max-w-xl ml-auto shadow-xs'
                        : 'bg-gray-50/80 border border-gray-200 text-gray-900 max-w-2xl'
                    }`}
                  >
                    {/* Header Bar: Sender, Timestamp, and Copy button ONLY (No top token badge) */}
                    <div className="flex items-center justify-between text-[11px] mb-2.5 font-mono text-gray-500 border-b border-gray-200/60 pb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-800">
                          {msg.sender === 'user' ? 'Founder' : 'Monday BI Agent'}
                        </span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="flex items-center space-x-1 hover:text-gray-900 transition-colors p-1 rounded hover:bg-gray-200/50 cursor-pointer"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] text-emerald-600 font-sans">Copied</span>
                          </>
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {/* Markdown Content */}
                    <div className="prose max-w-none text-sm text-gray-900 leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
                          strong: ({ children }) => (
                            <strong className="font-semibold text-gray-950 bg-gray-200/60 px-1 py-0.5 rounded text-[13px]">
                              {children}
                            </strong>
                          ),
                          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1.5 my-2.5">{children}</ul>,
                          li: ({ children }) => <li className="text-gray-800 leading-relaxed">{children}</li>,
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>

                    {msg.metrics && msg.metrics.length > 0 && (
                      <MetricCards metrics={msg.metrics} />
                    )}

                    {msg.warnings && msg.warnings.length > 0 && (
                      <QualityBanner warnings={msg.warnings} />
                    )}

                    {msg.table && <BreakdownTable table={msg.table} />}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-xs font-mono text-gray-600 flex items-center gap-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <span>Querying Monday.com boards & calculating metrics...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Sticky Bottom Prompt Bar */}
          <div className="shrink-0 p-4 md:p-5 border-t border-gray-100 bg-white/95 backdrop-blur-md">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-gray-300 focus-within:bg-white shadow-sm transition-all px-3 py-2 mb-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask a follow-up business query..."
                  className="flex-1 bg-transparent text-sm text-gray-900 px-2 py-1.5 outline-none placeholder:text-gray-400 font-sans"
                />

                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="w-8 h-8 rounded-full bg-gray-950 hover:bg-black disabled:opacity-30 text-white flex items-center justify-center transition-all shadow-sm cursor-pointer ml-2 active:scale-95"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Overall Input / Output Token Counter (Bottom Right Status Bar Only) */}
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 px-1">
                <span>Monday.com Live Sync</span>
                <div className="flex items-center space-x-2 text-gray-500">
                  <Zap className="w-3 h-3 text-purple-600" />
                  <span>Input: <strong className="text-gray-800 font-semibold">{totalInputTokens}</strong> tokens</span>
                  <span>•</span>
                  <span>Output: <strong className="text-gray-800 font-semibold">{totalOutputTokens}</strong> tokens</span>
                  <span>•</span>
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-gray-800 font-semibold">
                    Total: {totalSessionTokens}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
