import { useAuth } from '../context/AuthContext';
import HomePage from './HomePage';
import AdminHome from './AdminHome';
import Postlogin from '../components/ChatBot/Postlogin';
import ChatBot from '../components/ChatBot/ChatBot';

const ClientHome = () => {
  const { user } = useAuth();

  return (
    <div>
      {user?.role === 'admin' ? (
        <AdminHome />
      ) : (
        <>
          <HomePage extraFeature="true" />
          {/* <ChatBot isAuthenticated={true} initialMessages={[]} /> */}
        </>
      )}
    </div>
  );
};

export default ClientHome;