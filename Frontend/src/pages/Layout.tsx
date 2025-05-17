import React from 'react';
import CustomNavbar from '../components/navbar';
import Footer from '../components/Footer';
import { Outlet, useLocation, matchPath } from 'react-router-dom';
import ChatBot, { Message } from '../components/ChatBot/ChatBot';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  scrollToAPropos?: () => void;
  scrollToClaimForm?: () => void;
  scrollToContactUs?: () => void;
  scrollToServices?: () => void;
  isHomePage?: boolean;
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  scrollToAPropos,
  scrollToClaimForm,
  scrollToContactUs,
  scrollToServices,
  isHomePage = false,
  children,
}) => {
  const location = useLocation();
  const { isLoggedIn, user } = useAuth();

  const excludedPaths = ['/signin', '/signup', '/adminhome', '/settings'];
  const shouldExclude =
    excludedPaths.includes(location.pathname) ||
    matchPath('/admin/edit-user/:id', location.pathname);

  // Compute userName for authenticated users
  const userName = isLoggedIn && user?.name && user?.lastname
    ? `${user.name} ${user.lastname}`
    : user?.name || null;

  // Initial messages for the chatbot
  const initialMessages: Message[] = isLoggedIn && user
    ? [
        {
          text: `Bonjour ${userName || 'Utilisateur'} ! Comment puis-je vous aider avec vos contrats ou sinistres ?`,
          sender: 'bot',
          options: ['Déclarer un sinistre', 'Voir mes contrats', 'Aide compte'],
        },
      ]
    : [
        {
          text: 'Bienvenue sur YOMI Assurance ! Comment puis-je vous aider ?',
          sender: 'bot',
          options: ['S’inscrire', 'En savoir plus', 'Contacter le support'],
        },
      ];

  return (
    <>
      {!shouldExclude && (
        <CustomNavbar
          scrollToAPropos={isHomePage ? scrollToAPropos : undefined}
          scrollToClaimForm={isHomePage ? scrollToClaimForm : undefined}
          scrollToContactUs={isHomePage ? scrollToContactUs : undefined}
          scrollToServices={isHomePage ? scrollToServices : undefined}
          isHomePage={isHomePage}
        />
      )}
      <main>{children || <Outlet />}</main>
      {!shouldExclude && <Footer />}
      {!shouldExclude && (
        <ChatBot
          isAuthenticated={isLoggedIn}
          userId={isLoggedIn ? user?._id || null : null}
          userName={isLoggedIn ? userName : null}
          initialMessages={initialMessages}
        />
      )}
    </>
  );
};

export default Layout;