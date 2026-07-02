import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaPaperPlane, FaTimes, FaCommentDots } from 'react-icons/fa';
import api from '../services/api';

const AiChatWidget = ({ eventId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hi! I'm the AI Assistant. Ask me about time, parking, or tickets! 🤖" }
  ]);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents page reload
    
    if (!question.trim()) return;

    // 1. Show User Message Immediately
    const userText = question;
    setQuestion(""); // Clear input
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      // 2. Call Backend
      const response = await api.post('/api/ai/chat', {
        eventId: eventId,
        question: userText
      });

      // 3. Show AI Response
      setMessages(prev => [...prev, { sender: 'bot', text: response.data.answer }]);

    } catch (error) {
      
      let errorMsg = "Sorry, I can't connect right now.";
      if (error.response?.data?.answer) {
        errorMsg = error.response.data.answer;
      } else if (error.response?.status === 403) {
        errorMsg = "Security Block: The chat endpoint allows guests, but your browser might be blocking it.";
      } else if (error.response?.status === 404) {
        errorMsg = "Error: Event data not found.";
      }

      setMessages(prev => [...prev, { sender: 'bot', text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
      
      {/* --- Chat Window --- */}
      {isOpen && (
        <div className="bg-white dark:bg-gray-800 w-80 h-96 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col mb-4 overflow-hidden animate-fade-in-up">
          
          {/* Header */}
          <div className="bg-blue-600 p-4 flex justify-between items-center text-white shadow-md">
            <div className="flex items-center gap-2">
              <FaRobot className="text-xl" />
              <span className="font-bold tracking-wide">Event Assistant</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="hover:bg-blue-500 p-1 rounded-full transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-600 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-2xl rounded-bl-none text-xs text-gray-500 animate-pulse flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form 
            onSubmit={handleSubmit} 
            className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
            />
            <button 
              type="submit" 
              disabled={loading || !question.trim()}
              className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <FaPaperPlane size={14} className={loading ? "opacity-0" : "opacity-100"} />
            </button>
          </form>
        </div>
      )}

      {/* --- Toggle Button --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg flex items-center justify-center text-white text-2xl transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-300"
      >
        {isOpen ? <FaTimes /> : <FaCommentDots />}
      </button>
    </div>
  );
};

export default AiChatWidget;