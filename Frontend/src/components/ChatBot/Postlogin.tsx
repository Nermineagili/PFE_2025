import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ChatBot, { Message } from './ChatBot';

const Postlogin = ({ userType }: { userType: 'client' | 'admin' }) => {
  const { user } = useAuth();
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (user?._id) {
      const fullName = user.name && user.lastname ? `${user.name} ${user.lastname}` : user.name || 'Utilisateur';
      setInitialMessages([
        {
          text: `Bonjour ${fullName} ! Comment puis-je vous aider ${
            userType === 'admin' ? 'avec vos tâches administratives' : 'avec vos sinistres ou contrats'
          } ?`,
          sender: 'bot' as const,
          options:
            userType === 'admin'
              ? ['Voir les rapports', 'Gérer les utilisateurs', 'Aide système']
              : ['Déclarer un sinistre', 'Vérifier l’état', 'Aide compte'],
        },
      ]);
    }
  }, [user, userType]);

  if (!user?._id) {
    return <div>Veuillez vous connecter pour accéder au chatbot.</div>;
  }

  return (
    <ChatBot
      isAuthenticated={true}
      userId={user._id}
      initialMessages={initialMessages}
    />
  );
};

export default Postlogin;