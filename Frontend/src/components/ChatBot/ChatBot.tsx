import { useState, useEffect, useRef } from 'react';
import { FaRobot, FaTimes, FaPaperPlane, FaSpinner } from 'react-icons/fa';
import MsgBubble from './MsgBubble';
import './ChatBot.css';

export interface Message {
  text: string;
  sender: 'user' | 'bot';
  options?: string[];
}

interface ChatBotProps {
  isAuthenticated: boolean;
  userId?: string | null;
  initialMessages: Message[];
}

const ChatBot: React.FC<ChatBotProps> = ({ isAuthenticated, userId, initialMessages }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { text, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, isAuthenticated, userId }),
      });
      
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      
      // Add a small delay to make the typing effect more natural
      setTimeout(() => {
        setMessages((prev) => [...prev, { 
          text: data.response, 
          sender: 'bot',
          options: data.options || [] 
        }]);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { text: 'Désolé, une erreur est survenue. Veuillez réessayer plus tard.', sender: 'bot' },
        ]);
        setIsLoading(false);
      }, 500);
    }
  };

  const handleOptionSelect = (option: string) => {
    handleSend(option);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend(input);
  };

  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <div className={`chatbot-wrapper ${isOpen ? 'open' : ''}`}>
      {isOpen ? (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <FaRobot className="icon" />
              <h5>Centre d'aide</h5>
            </div>
            <button onClick={toggleChat} className="close-btn" aria-label="Fermer le chat">
              <FaTimes />
            </button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <MsgBubble
                key={i}
                message={msg}
                onOptionSelect={handleOptionSelect}
              />
            ))}
            {isLoading && (
              <div className="msg-bubble bot typing-indicator">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chatbot-input">
            <input
              ref={inputRef}
              placeholder={
                isAuthenticated
                  ? 'Posez une question sur vos contrats...'
                  : 'Demandez des infos sur YOMI Assurance...'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button 
              className={`send-btn ${isLoading ? 'loading' : ''}`} 
              onClick={() => handleSend(input)}
              disabled={isLoading || !input.trim()}
              aria-label="Envoyer"
            >
              {isLoading ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
            </button>
          </div>
        </div>
      ) : (
        <button className="chatbot-launcher" onClick={toggleChat} aria-label="Ouvrir le chat">
          <FaRobot />
          <span>Aide</span>
        </button>
      )}
    </div>
  );
};

export default ChatBot;