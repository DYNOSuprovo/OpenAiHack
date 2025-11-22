"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Plus, Mic, ChevronDown, Settings, Sparkles, PenTool, Hammer, Search, BookOpen, Send, Copy, ThumbsUp, ThumbsDown, RotateCcw, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function GeminiClone() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: messages })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickActions = [
    { icon: Sparkles, label: 'Create Image', color: 'from-yellow-500 to-orange-500', bgColor: 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20' },
    { icon: PenTool, label: 'Write', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20' },
    { icon: Hammer, label: 'Build', color: 'from-purple-500 to-pink-500', bgColor: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20' },
    { icon: Search, label: 'Deep Research', color: 'from-green-500 to-emerald-500', bgColor: 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20' },
    { icon: BookOpen, label: 'Learn', color: 'from-red-500 to-rose-500', bgColor: 'bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20' }
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-72' : 'w-20'} bg-black/40 backdrop-blur-xl border-r border-white/5 transition-all duration-500 ease-out flex flex-col relative z-10 shadow-2xl`}>
        <div className="p-5 flex items-center justify-between border-b border-white/5">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <Menu size={22} />
          </button>
          {showSidebar && <span className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Rover Ai</span>}
        </div>

        <div className="p-4">
          <button className="w-full p-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-blue-500/50">
            <Plus size={20} />
            {showSidebar && <span className="font-medium">New Chat</span>}
          </button>
        </div>

        <div className="flex-1 px-4 overflow-y-auto">
          {showSidebar && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-400 px-3 py-2">Recent Chats</div>
              {[1, 2, 3].map((i) => (
                <button key={i} className="w-full p-3 hover:bg-white/5 rounded-xl text-left text-sm text-gray-300 transition-all duration-200 hover:translate-x-1">
                  Chat {i}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 space-y-2">
          <button className="w-full p-3 hover:bg-white/5 rounded-xl flex items-center gap-3 transition-all duration-200 hover:translate-x-1">
            <Settings size={20} />
            {showSidebar && <span>Settings</span>}
          </button>
          {showSidebar && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center font-bold">
                A
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Ashwin</div>
                <div className="text-xs text-gray-400">Free Plan</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center relative z-10">
        {/* Header */}
        <div className="w-full max-w-5xl px-6 py-5 flex items-center justify-between backdrop-blur-sm">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Rover Ai
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-full flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-purple-500/50 font-medium">
            <Sparkles size={18} />
            Upgrade to Pro
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 w-full max-w-5xl px-6 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center animate-fade-in">
              <div className="mb-8 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-3xl opacity-30 animate-pulse"></div>
                <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent relative animate-gradient">
                  Hello, Ashwin
                </h1>
              </div>

              <p className="text-gray-400 text-lg mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                How can I help you today?
              </p>

              <div className="w-full max-w-3xl mb-8">
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-1.5 shadow-2xl border border-white/10">
                  <div className="bg-black/40 rounded-[22px] p-5 flex items-center gap-4">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything..."
                      className="flex-1 bg-transparent outline-none text-lg placeholder-gray-500"
                    />
                    <button className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95">
                      <Plus size={20} />
                    </button>
                    <button className="p-2.5 hover:bg-white/10 rounded-xl flex items-center gap-2 transition-all duration-200 hover:scale-110 active:scale-95">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="2" fill="currentColor" />
                        <circle cx="12" cy="5" r="2" fill="currentColor" />
                        <circle cx="12" cy="19" r="2" fill="currentColor" />
                      </svg>
                    </button>
                    <button className="px-4 py-2.5 hover:bg-white/10 rounded-xl flex items-center gap-2 transition-all duration-200 hover:scale-110 active:scale-95">
                      <span className="text-sm font-medium">Fast</span>
                      <ChevronDown size={16} />
                    </button>
                    <button className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95">
                      <Mic size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap justify-center max-w-4xl">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    className={`px-6 py-4 ${action.bgColor} backdrop-blur-sm rounded-2xl flex items-center gap-3 border transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg group`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <action.icon size={20} className={`bg-gradient-to-br ${action.color} bg-clip-text text-transparent`} />
                    <span className="font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 space-y-6 animate-fade-in">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                  {msg.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold flex-shrink-0 shadow-lg">
                      G
                    </div>
                  )}
                  <div className={`max-w-3xl ${msg.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10'
                    } rounded-3xl p-5 relative group`}>
                    <div className="text-base leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                    {msg.role === 'assistant' && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-110" title="Copy">
                          <Copy size={16} />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-110" title="Good response">
                          <ThumbsUp size={16} />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-110" title="Bad response">
                          <ThumbsDown size={16} />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-110" title="Regenerate">
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <User size={20} />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-4 animate-slide-up">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold flex-shrink-0 shadow-lg">
                    G
                  </div>
                  <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
                    <div className="flex gap-2">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                      <div className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area (when chat active) */}
        {messages.length > 0 && (
          <div className="w-full max-w-5xl px-6 pb-6 pt-4">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-1.5 shadow-2xl border border-white/10">
              <div className="bg-black/40 rounded-[22px] p-5 flex items-center gap-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a follow-up..."
                  className="flex-1 bg-transparent outline-none text-lg placeholder-gray-500"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || loading}
                  className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/50"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}