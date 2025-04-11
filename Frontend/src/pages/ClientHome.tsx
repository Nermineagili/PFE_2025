import { useAuth } from '../context/AuthContext';
import HomePage from './HomePage';
import AdminHome from './AdminHome';
import Postlogin from '../components/ChatBot/Postlogin';

const ClientHome = () => {
  const { user } = useAuth();

  return (
    <div>
      {user?.role === 'admin' ? (
        <AdminHome />
      ) : (
        <>
          <HomePage extraFeature="true" />
          <Postlogin userType="client" />
        </>
      )}
    </div>
  );
};

export default ClientHome;