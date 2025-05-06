import { useState } from 'react';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';
import MsgBubble from './MsgBubble';
import './ChatBot.css';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  options?: string[];
}

const Prelogin = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Bienvenue ! Je peux vous aider avec :", sender: 'bot', options: ['Problèmes de connexion', 'Inscription', 'Informations générales'] }
  ]);

  const handleSend = (text: string) => {
    setMessages(prev => [...prev, { text, sender: 'user' }]);
    // Ajouter ici la logique de réponse du bot
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
            <button onClick={() => setIsOpen(false)} className="close-btn">
              <FaTimes />
            </button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <MsgBubble 
                key={i} 
                message={msg} 
                onOptionSelect={handleSend}
              />
            ))}
          </div>
          <div className="chatbot-input">
            <input placeholder="Tapez votre question..." />
            <button className="send-btn">
              <FaPaperPlane />
            </button>
          </div>
        </div>
      ) : (
        <button 
          className="chatbot-launcher"
          onClick={() => setIsOpen(true)}
        >
          <FaRobot />
          <span>Aide</span>
        </button>
      )}
    </div>
  );
};

export default Prelogin;
