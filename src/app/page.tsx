"use client";
//@ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Plus, Send, Settings, User, Sparkles } from 'lucide-react';

export default function GeminiClone() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-64' : 'w-16'} bg-[#171717] border-r border-gray-800 transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          {showSidebar && <span className="text-lg font-medium">Rover Ai</span>}
        </div>

        <div className="p-4">
          <button className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center gap-2 transition-colors">
            <Plus size={18} />
            {showSidebar && <span>New Chat</span>}
          </button>
        </div>

        <div className="flex-1 px-4 overflow-y-auto">
          {showSidebar && (
            <div className="space-y-1">
              <div className="text-xs text-gray-500 px-3 py-2">Recent</div>
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} className="w-full p-2.5 hover:bg-gray-800 rounded-lg text-left text-sm text-gray-400 transition-colors">
                  Previous chat {i}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-800">
          <button className="w-full p-3 hover:bg-gray-800 rounded-lg flex items-center gap-3 transition-colors">
            <Settings size={18} />
            {showSidebar && <span>Settings</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-800">
          <div className="text-xl font-medium">Rover Ai</div>
          {/* <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors text-sm">
            <Sparkles size={16} />
            Upgrade
          </button> */}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <h1 className="text-4xl font-medium mb-8 text-gray-100">
                Hello, Ashwin
              </h1>
              <p className="text-gray-500 mb-8">How can I help you today?</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-sm font-medium">
                      G
                    </div>
                  )}
                  <div className={`max-w-2xl rounded-2xl p-4 ${msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#1a1a1a] text-gray-100'
                    }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <User size={18} />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-sm font-medium">
                    G
                  </div>
                  <div className="bg-[#1a1a1a] rounded-2xl p-4">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-800 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-[#1a1a1a] rounded-2xl p-4 flex items-center gap-3 border border-gray-800">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message Rover Ai..."
                className="flex-1 bg-transparent outline-none text-gray-100 placeholder-gray-500"
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || loading}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}