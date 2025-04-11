import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Prelogin from './Prelogin';
import './ChatBot.css';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  options?: string[];
}

const Postlogin = ({ userType }: { userType: 'client' | 'admin' }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    setMessages([{
      text: `Hello ${user?.name}! How can I assist you ${userType === 'admin' ? 'with admin tasks' : 'with your claims'}?`,
      sender: 'bot',
      options: userType === 'admin' 
        ? ['View reports', 'Manage users', 'System help'] 
        : ['File claim', 'Check status', 'Account help']
    }]);
  }, [user, userType]);

  return (
    <Prelogin />
  );
};

export default Postlogin;