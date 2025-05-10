import React from 'react';
// import './MsgBubble.css'
interface Message {
  text: string;
  sender: 'user' | 'bot';
  options?: string[];
}

interface MsgBubbleProps {
  message: Message;
  onOptionSelect: (option: string) => void;
}

const MsgBubble: React.FC<MsgBubbleProps> = ({ message, onOptionSelect }) => {
  // Function to convert URLs into clickable links
  const formatMessage = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="message-link"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className={`msg-bubble ${message.sender}`}>
      <p>{formatMessage(message.text)}</p>
      {message.options && message.options.length > 0 && (
        <div className="options">
          {message.options.map((option, index) => (
            <button
              key={index}
              className="option-btn"
              onClick={() => onOptionSelect(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MsgBubble;