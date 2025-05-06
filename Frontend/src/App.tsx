import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import ClientHome from './pages/ClientHome';
import AdminHome from './pages/AdminHome';
import { AuthProvider, useAuth } from "./context/AuthContext"; 
import { ThemeProvider } from "./context/ThemeContext"; 
import { Suspense } from 'react';
import ClaimForm from './pages/ClaimForm';
import EditUser from './components/EditUser';
import '@fortawesome/fontawesome-free/css/all.css';
import MesDeclarations from './pages/MesDeclarations';
import Settings from './components/Settings'; 
import './styles/theme.css'; 
import SubscribeForm from './components/SubscribeForm';
import UserGuide from './pages/UserGuide';
import Layout from './pages/Layout';
import MesContrats from './pages/MesContrats';
import SupervisorHome from './pages/SupervisorHome';
import PolicyType from './pages/PolicyTypes';
import SupervisorMessages from './components/SupervisorMessages';
import PaymentSuccess from './components/PaymentSuccess';
import StripeWrapper from './components/StripeWrapper';
import ManageUsers from './components/ManageUsers';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Suspense fallback={<div>Loading...</div>}>
            <AppContent />
          </Suspense>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { isLoggedIn, user } = useAuth();

  return (
    <Routes>
      {/* Homepage */}
      <Route 
        path="/" 
        element={
          !isLoggedIn ? (
            <HomePage />
          ) : user?.role === 'admin' ? (
            <Navigate to="/adminhome" replace />
          ) : user?.role === 'superviseur' ? (
            <Navigate to="/supervisorhome" replace />
          )
          : (
            <Navigate to="/clienthome" replace />
          )
        } 
      />

      {/* Auth */}
      <Route path="/signup" element={!isLoggedIn ? <SignUp /> : <Navigate to="/" replace />} />
      <Route path="/signin" element={!isLoggedIn ? <SignIn /> : <Navigate to="/" replace />} />
      <Route path="/forgot-password" element={!isLoggedIn ? <ForgotPassword /> : <Navigate to="/" replace />} />
      <Route 
        path="/reset-password/:token" 
        element={!isLoggedIn ? <ResetPassword /> : <Navigate to="/" replace />} 
      />      {/* Routes with Layout */}
      <Route element={<Layout />}>
        <Route path="/policytypes" element={<PolicyType />} />
        <Route path="/claimform" element={<ClaimForm />} />
        <Route path="/souscription" element={<StripeWrapper />} />
        <Route path="/mes-declarations" element={<MesDeclarations />} />
        <Route path="/guide" element={<UserGuide />} />
        <Route path="/mes-contrats" element={<MesContrats />} />
        // In your router configuration
        <Route path= "/payment-success" element={<PaymentSuccess />}/>
      </Route>

      {/* Routes without Layout */}
      <Route 
          path="/clienthome" 
          element={isLoggedIn && user?.role === 'user' ? <ClientHome /> : <Navigate to="/" replace />} 
        />
      <Route 
        path="/adminhome" 
        element={isLoggedIn && user?.role === 'admin' ? <AdminHome /> : <Navigate to="/" replace />} 
      />
      <Route path="/admin/approve-reset/:token/:userId" element={isLoggedIn && user?.role === 'admin' ?<ManageUsers />: <Navigate to="/" replace />} />

      <Route 
        path="/supervisorhome" 
        element={isLoggedIn && user?.role === 'superviseur' ? <SupervisorHome /> : <Navigate to="/" replace />} 
      />
<Route 
  path="/supervisor-messages" 
  element={isLoggedIn && user?.role === 'superviseur' ? <SupervisorMessages /> : <Navigate to="/" replace />} 
/>
      <Route path="/settings" element={<Settings />} />
      <Route path="/admin/edit-user/:id" element={<EditUserWrapper />} />
    </Routes>
  );
}

function EditUserWrapper() {
  const { id } = useParams<{ id: string }>();
  return <EditUser id={id || ''} onClose={() => {}} />;
}

export default App;
