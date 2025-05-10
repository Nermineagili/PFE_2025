import ChatBot, { Message } from './ChatBot';

const Prelogin = () => {
  const initialMessages: Message[] = [
    {
      text: 'Bienvenue ! Je peux vous aider avec :',
      sender: 'bot' as const,
      options: ['Problèmes de connexion', 'Inscription', 'Informations générales'],
    },
  ];

  return (
    <ChatBot
      isAuthenticated={false}
      initialMessages={initialMessages}
    />
  );
};

export default Prelogin;