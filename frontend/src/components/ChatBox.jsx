import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function ChatBox({ messages = [], onSendMessage }) {
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 600 }}>
        💬 Chat
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <p style={{ color: 'var(--text-dark)', textAlign: 'center', fontSize: '0.85rem' }}>
            No messages yet. Say hi!
          </p>
        )}
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id || msg.timestamp + msg.username}
              className="chat-message"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <span style={{ color: 'var(--text-dark)', fontSize: '0.75rem', marginRight: '0.25rem' }}>
                {formatTime(msg.timestamp)}
              </span>
              <span className="chat-message-username">{msg.username}:</span>
              <span className="chat-message-text">{msg.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-container" onSubmit={handleSubmit}>
        <input
          className="form-input"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          style={{ fontSize: '0.85rem' }}
        />
        <button type="submit" className="btn btn-primary btn-small">
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatBox;
