import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowUp, 
  User, 
  Loader2,
  Copy,
  Check,
  Zap,
  ChevronDown,
  Cpu
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AVAILABLE_MODELS, type ChatSession, type ChatMessage } from '../types';
import { sendChatMessage } from '../services/api';
import { MetricCards } from './MetricCards';
import { QualityBanner } from './QualityBanner';
import { BreakdownTable } from './BreakdownTable';

interface ChatInterfaceProps {
  session: ChatSession;
  onUpdateSessionMessages: (sessionId: string, messages: ChatMessage[], newTitle?: string) => void;
  externalQuery?: string;
  onClearExternalQuery?: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

const THINKING_PHRASES = [
  "Thinking...",
  "Pondering operational and commercial data...",
  "Analyzing Monday.com pipeline records...",
  "Synthesizing executive insights...",
  "Reconciling cross-board metrics and cash flow...",
  "Structuring strategic recommendations..."
];

const EXAMPLE_CARDS = [
  {
    title: "Prepare Executive Leadership Update",
    subtitle: "Consolidated commercial, operations, cash flow & risk briefing",
    query: "Prepare a comprehensive leadership update summarizing deals pipeline, operations execution, billing, and cross-board risks."
  },
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
    subtitle: "Identify accrued revenue leakage in Work Orders",
    query: "What is our total outstanding Receivables and Unbilled Completed Work?"
  }
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  session,
  onUpdateSessionMessages,
  externalQuery,
  onClearExternalQuery,
  selectedModel,
  onSelectModel
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [isHeroDropdownOpen, setIsHeroDropdownOpen] = useState(false);
  const [isBottomDropdownOpen, setIsBottomDropdownOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const heroDropdownRef = useRef<HTMLDivElement>(null);
  const bottomDropdownRef = useRef<HTMLDivElement>(null);

  const currentModelObj = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0];

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

  // Cycle thinking phrases every 2.4 seconds during loading
  useEffect(() => {
    if (!loading) {
      setThinkingIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setThinkingIndex((prev) => (prev + 1) % THINKING_PHRASES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [loading]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (heroDropdownRef.current && !heroDropdownRef.current.contains(event.target as Node)) {
        setIsHeroDropdownOpen(false);
      }
      if (bottomDropdownRef.current && !bottomDropdownRef.current.contains(event.target as Node)) {
        setIsBottomDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    const newTitle = isFirstUserMessage ? (textToSend.length > 32 ? `${textToSend.slice(0, 32)}...` : textToSend) : undefined;

    onUpdateSessionMessages(session.id, updatedMessages, newTitle);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage(textToSend, selectedModel);
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
      let naturalError = "The server is currently waking up or experiencing an upstream delay.";
      const status = err.response?.status;
      
      if (status === 502 || status === 504) {
        naturalError = (
          "**Temporary Upstream Server Delay (502)**\n\n" +
          "The selected AI engine took longer than expected or the hosting container is waking up from idle mode.\n\n" +
          "**Recommended Resolution:**\n" +
          "- Resend your question, or switch to **Gemini 3.5 Flash-Lite** via the model switcher for instant responses."
        );
      } else if (status === 429) {
        naturalError = (
          "**Rate Limit Reached (429)**\n\n" +
          "The per-minute request limit for the selected model was reached. Please wait ~20-30 seconds before retrying."
        );
      } else if (err.message) {
        naturalError = `**Notice**: ${err.message}`;
      }

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: naturalError,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      onUpdateSessionMessages(session.id, [...updatedMessages, errorMsg], newTitle);
    } finally {
      setLoading(false);
    }
  };

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
        <div className="flex-1 w-full overflow-y-auto px-6 py-10 md:py-14">
          <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-full">
            {/* 3D Purple Gradient Sphere */}
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-indigo-400 shadow-xl shadow-purple-500/25 flex items-center justify-center animate-pulse" />
              <div className="absolute inset-0 rounded-full blur-xl bg-purple-500/30 -z-10" />
            </div>

            {/* Hero Titles */}
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900 text-center mb-1">
              {getTimeGreeting()}, Founder
            </h2>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900 text-center mb-10">
              What's on <span className="text-purple-600 font-bold">your mind?</span>
            </h1>

            {/* Hero Prompt Input Box */}
            <div className="w-full bg-white rounded-[36px] border border-gray-200 shadow-lg shadow-gray-200/40 p-5 md:p-6 mb-10 transition-all focus-within:border-gray-300 focus-within:shadow-xl relative">
              <div className="flex items-start space-x-3 mb-5">
                <Sparkles className="w-5 h-5 text-purple-600 mt-1 shrink-0 stroke-[2.2]" />
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
                  placeholder="Ask Monday BI a business question or request a leadership update..."
                  className="w-full bg-transparent text-base md:text-[17px] leading-relaxed text-gray-900 placeholder:text-gray-400 outline-none resize-none"
                />
              </div>

              {/* Input Footer: Model Switcher Pill + Right-aligned Submit Arrow */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 relative">
                
                {/* Hero Model Switcher */}
                <div className="relative" ref={heroDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsHeroDropdownOpen(!isHeroDropdownOpen)}
                    className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-gray-200 bg-gray-50/90 hover:bg-gray-100 text-xs md:text-[13.5px] font-medium text-gray-700 transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Cpu className="w-3.5 h-3.5 text-purple-600" />
                    <span className="font-semibold text-gray-900">{currentModelObj.name}</span>
                    <span className="text-gray-400 font-mono text-[11px]">({currentModelObj.tag})</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  {/* Hero Dropdown Menu */}
                  {isHeroDropdownOpen && (
                    <div className="absolute left-0 bottom-full mb-2 w-72 bg-white rounded-2xl border border-gray-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1.5">
                        Select AI Model
                      </div>
                      <div className="space-y-1">
                        {AVAILABLE_MODELS.map((m) => {
                          const isSelected = m.id === selectedModel;
                          return (
                            <button
                              key={m.id}
                              onClick={() => {
                                onSelectModel(m.id);
                                setIsHeroDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs md:text-[13px] flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-purple-50 text-purple-900 font-bold border border-purple-100'
                                  : 'text-gray-700 hover:bg-gray-100/80'
                              }`}
                            >
                              <div>
                                <div className="font-medium text-gray-900">{m.name}</div>
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

                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="w-9 h-9 rounded-full bg-gray-950 hover:bg-black disabled:opacity-30 text-white flex items-center justify-center transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Example Prompt Cards */}
            <div className="w-full">
              <div className="text-xs md:text-[13px] font-semibold text-gray-500 mb-3.5 px-1 uppercase tracking-wider">
                Executive Starters
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {EXAMPLE_CARDS.map((card, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSend(card.query)}
                    className="p-4 md:p-5 rounded-3xl bg-gray-50/70 hover:bg-gray-100/80 border border-gray-200/80 hover:border-gray-300 transition-all cursor-pointer flex flex-col justify-between min-h-[105px] group shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-sm md:text-[15px] font-semibold text-gray-900 group-hover:text-purple-700 transition-colors leading-snug">
                          {card.title}
                        </h4>
                        {idx === 0 && <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Featured</span>}
                      </div>
                      <p className="text-xs md:text-[13px] text-gray-500 leading-relaxed">
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
          <div className="flex-1 w-full overflow-y-auto px-4 py-6 md:px-10 pb-24">
            <div className="max-w-3xl mx-auto space-y-7">
              {session.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3.5 ${
                    msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-gray-200 text-gray-800 font-semibold'
                        : 'bg-purple-600 text-white'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`w-full rounded-3xl px-6 py-5 text-base md:text-[16.5px] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gray-100/90 border border-gray-200/80 text-gray-900 max-w-xl ml-auto shadow-2xs'
                        : 'bg-gray-50/80 border border-gray-200 text-gray-900 max-w-2xl'
                    }`}
                  >
                    {/* Header Bar */}
                    <div className="flex items-center justify-between text-xs md:text-[13px] mb-3 font-mono text-gray-500 border-b border-gray-200/60 pb-2">
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
                        className="flex items-center space-x-1.5 hover:text-gray-900 transition-colors p-1 rounded-lg hover:bg-gray-200/50 cursor-pointer"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-xs text-emerald-600 font-sans font-medium">Copied</span>
                          </>
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Markdown Content */}
                    <div className="prose max-w-none text-base md:text-[16.5px] text-gray-900 leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-3.5 last:mb-0 leading-relaxed text-base md:text-[16.5px]">{children}</p>,
                          strong: ({ children }) => (
                            <strong className="font-semibold text-gray-950 bg-gray-200/60 px-1.5 py-0.5 rounded text-[15px]">
                              {children}
                            </strong>
                          ),
                          ul: ({ children }) => <ul className="list-disc pl-5 space-y-2 my-3">{children}</ul>,
                          li: ({ children }) => <li className="text-gray-800 leading-relaxed text-base md:text-[16px]">{children}</li>,
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
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-3xl px-6 py-4 text-xs md:text-sm font-mono text-gray-700 flex items-center gap-3 shadow-2xs">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <span className="font-medium animate-pulse">{THINKING_PHRASES[thinkingIndex]}</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Sticky Bottom Prompt Bar */}
          <div className="shrink-0 p-4 md:p-6 border-t border-gray-100 bg-white/95 backdrop-blur-md">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center bg-gray-50 rounded-full border border-gray-200/90 focus-within:border-gray-300 focus-within:bg-white shadow-sm transition-all px-4 py-2 mb-2.5 relative">
                
                {/* Active Chat Bottom Model Switcher Button & Dropdown */}
                <div className="relative shrink-0 mr-2" ref={bottomDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsBottomDropdownOpen(!isBottomDropdownOpen)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-800 transition-all cursor-pointer shadow-2xs active:scale-95"
                    title="Change Active AI Model"
                  >
                    <Cpu className="w-3.5 h-3.5 text-purple-600" />
                    <span className="max-w-[110px] truncate">{currentModelObj.name}</span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>

                  {/* Bottom Popover Dropdown */}
                  {isBottomDropdownOpen && (
                    <div className="absolute left-0 bottom-full mb-2.5 w-72 bg-white rounded-2xl border border-gray-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1.5">
                        Switch Model for Next Message
                      </div>
                      <div className="space-y-1">
                        {AVAILABLE_MODELS.map((m) => {
                          const isSelected = m.id === selectedModel;
                          return (
                            <button
                              key={m.id}
                              onClick={() => {
                                onSelectModel(m.id);
                                setIsBottomDropdownOpen(false);
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

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask a follow-up business query..."
                  className="flex-1 bg-transparent text-base md:text-[16.5px] text-gray-900 px-2 py-1 outline-none placeholder:text-gray-400 font-sans"
                />

                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="w-9 h-9 rounded-full bg-gray-950 hover:bg-black disabled:opacity-30 text-white flex items-center justify-center transition-all shadow-sm cursor-pointer ml-2 active:scale-95"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Overall Input / Output Token Counter */}
              <div className="flex items-center justify-between text-xs md:text-[13px] font-mono text-gray-400 px-2">
                <span>Active: <strong className="text-gray-700 font-semibold">{currentModelObj.name}</strong></span>
                <div className="flex items-center space-x-2 text-gray-500">
                  <Zap className="w-3.5 h-3.5 text-purple-600" />
                  <span>In: <strong className="text-gray-800 font-semibold">{totalInputTokens}</strong></span>
                  <span>•</span>
                  <span>Out: <strong className="text-gray-800 font-semibold">{totalOutputTokens}</strong></span>
                  <span>•</span>
                  <span className="bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200 text-gray-800 font-semibold">
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
