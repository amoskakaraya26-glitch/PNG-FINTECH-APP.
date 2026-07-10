import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../../services/api';
import './AIChat.css';

interface Message { role: 'user' | 'assistant'; content: string; }

const AIChat: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your PNG Wallet assistant 🤖 How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await aiAPI.chat(msg);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble right now. Please try again." }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      <button className="ai-fab" onClick={() => setOpen(!open)} title="AI Assistant">
        {open ? '✕' : '🤖'}
      </button>
      {open && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <span>🤖 PNG Wallet Assistant</span>
            <button onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="ai-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ai-message ${m.role}`}>
                {m.content}
              </div>
            ))}
            {loading && <div className="ai-message assistant typing">Typing...</div>}
            <div ref={bottomRef} />
          </div>
          <div className="ai-input">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && send()}
              placeholder="Ask anything..."
            />
            <button onClick={send} disabled={loading}>Send</button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;
