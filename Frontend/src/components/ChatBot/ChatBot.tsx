import { useAuth } from '../../context/AuthContext';
import Prelogin from './Prelogin';
import Postlogin from './Postlogin';

const ChatBot = () => {
  const { user } = useAuth();

  if (user) {
    // Pass userType or any other user-specific data
    return <Postlogin userType={user.role === 'admin' ? 'admin' : 'client'} />;
  } else {
    return <Prelogin />;
  }
};

export default ChatBot;
