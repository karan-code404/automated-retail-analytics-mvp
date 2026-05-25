import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  RefreshCw,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export default function Chat({ token, currentDataset }) {
  const [messages, setMessages] = useState([
    { 
      sender: 'bot', 
      text: "Hello! I am your AI Report Assistant. I have access to your active dataset context. You can ask me questions like:\n\n- *'Why did sales drop?'*\n- *'What is our top category?'*\n- *'What was the forecast slope?'*\n- *'Show data quality or duplicates'*",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    
    // Add User Message to Log
    setMessages(prev => [...prev, { sender: 'user', text: userMessage, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chatbot', {
        message: userMessage
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.success) {
        setMessages(prev => [...prev, { 
          sender: 'bot', 
          text: response.data.reply, 
          timestamp: new Date() 
        }]);
      } else {
        throw new Error(response.data.error || 'Failed to retrieve chatbot response.');
      }
    } catch (err) {
      console.error(err);
      setError('Chatbot request failed. Verify the server is online.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to parse basic markdown indicators into React HTML elements
  const parseMarkdown = (text) => {
    return text.split('\n').map((line, idx) => {
      let content = line;
      
      // Handle Headers e.g., ### Title
      if (content.startsWith('### ')) {
        return <h4 key={idx} className="text-sm font-extrabold text-white mt-4 mb-2 first:mt-0">{content.replace('### ', '')}</h4>;
      }
      
      // Handle Bullet Points e.g., - item or * item
      const isBullet = content.startsWith('- ') || content.startsWith('* ') || content.startsWith('• ');
      if (isBullet) {
        content = content.substring(2);
      }
      
      // Handle bold tags e.g. **bold** or *italic*
      // Simple regex replacement for bold **text**
      const parts = content.split(/(\*\*.*?\*\*)/g);
      const parsedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="text-teal-400 font-bold">{part.slice(2, -2)}</strong>;
        }
        // Handle italic _text_ or *text*
        const subParts = part.split(/(\*.*?\*)/g);
        return subParts.map((subPart, sIdx) => {
          if (subPart.startsWith('*') && subPart.endsWith('*')) {
            return <em key={sIdx} className="text-slate-200 italic">{subPart.slice(1, -1)}</em>;
          }
          return subPart;
        });
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start space-x-2 pl-4 py-0.5 text-xs">
            <span className="text-teal-400 mt-1">•</span>
            <span>{parsedLine}</span>
          </div>
        );
      }

      return <p key={idx} className="text-xs leading-relaxed mb-1.5 min-h-[1em]">{parsedLine}</p>;
    });
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col justify-between max-w-4xl mx-auto space-y-4 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">AI Report Assistant</h2>
        <p className="text-slate-400 mt-1">Converse with our contextual assistant to query outliers, segment growth, or diagnostic warnings.</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-red-500/20 bg-red-950/15 flex items-center space-x-2.5 text-red-200">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <span className="text-xs font-semibold">{error}</span>
        </div>
      )}

      {/* Main chat window container */}
      <div className="flex-1 glass-panel rounded-2xl border border-slate-800 p-6 flex flex-col justify-between overflow-hidden">
        
        {/* Messages Feed Area */}
        <div className="flex-grow overflow-y-auto space-y-4 pr-2 mb-4 scroll-smooth">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex items-start space-x-3.5 max-w-[85%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div className={`p-2 rounded-full border flex-shrink-0 ${
                msg.sender === 'user' 
                  ? 'bg-slate-800 border-slate-700 text-slate-300' 
                  : 'bg-teal-950/40 border-teal-500/20 text-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.1)]'
              }`}>
                {msg.sender === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>

              {/* Message Bubble */}
              <div className={`p-4 rounded-2xl text-slate-300 ${
                msg.sender === 'user' 
                  ? 'bg-slate-900 border border-slate-800/80 rounded-tr-none' 
                  : 'bg-slate-900/50 border border-slate-800/50 rounded-tl-none shadow-[0_0_15px_rgba(15,23,42,0.1)]'
              }`}>
                <div className="space-y-0.5">
                  {parseMarkdown(msg.text)}
                </div>
                <span className="text-[8px] text-slate-500 font-mono mt-2 block text-right">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {/* Assistant Typing indicator */}
          {isLoading && (
            <div className="flex items-start space-x-3.5 max-w-[85%] animate-pulse">
              <div className="p-2 rounded-full bg-teal-950/40 border border-teal-500/20 text-teal-400">
                <Bot className="h-3.5 w-3.5 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50 rounded-tl-none text-slate-400 text-xs flex items-center space-x-1.5">
                <span>Assistant is auditing context data...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Message Form */}
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3.5 border-t border-slate-800/60 pt-4 bg-slate-900/20">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3.5 text-xs text-slate-200 focus:outline-none transition-colors duration-200 placeholder-slate-500"
            placeholder={currentDataset ? "Ask about anomalies, segments, KPIs, or actions..." : "Upload a dataset to activate chatbot queries..."}
            disabled={!currentDataset}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !currentDataset}
            className="p-3.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 shadow-[0_0_10px_rgba(45,212,191,0.15)] hover:shadow-[0_0_15px_rgba(45,212,191,0.3)] transition-all duration-200 cursor-pointer disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
