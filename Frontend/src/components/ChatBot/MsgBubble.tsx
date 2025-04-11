import { FaUser, FaRobot } from 'react-icons/fa';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  options?: string[];
}

interface MsgBubbleProps {
  message: Message;
  onOptionSelect: (option: string) => void;
}

const MsgBubble = ({ message, onOptionSelect }: MsgBubbleProps) => {
  return (
    <div className={`message-bubble ${message.sender}`}>
      <div className="message-sender">
        {message.sender === 'user' ? <FaUser /> : <FaRobot />}
      </div>
      <div className="message-text">{message.text}</div>
      {message.options && (
        <div className="quick-replies">
          {message.options.map((option, i) => (
            <button 
              key={i} 
              className="quick-reply-btn"
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