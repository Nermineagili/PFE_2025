const Groq = require('groq-sdk');

// Groq configuration
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Optional: MongoDB setup (uncomment if needed)
// const mongoose = require('mongoose');
// mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
// const Contract = mongoose.model('Contract', new mongoose.Schema({
//   userId: String,
//   contractId: String,
//   status: String,
// }));

const handleChat = async (req, res) => {
  const { message, isAuthenticated = false, userId = null, userName = null } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message requis.' });
  }

  // Base system prompt
  let systemPrompt = `
    Tu es un assistant virtuel intelligent pour YOMI Assurance, une plateforme moderne d'assurance digitale.

    Voici ce que fait la plateforme :
    - Fournit un espace client sécurisé pour s’inscrire, s’authentifier, consulter ses contrats et garanties.
    - Permet de déclarer un sinistre et de suivre son traitement en temps réel.
    - Offre la possibilité de payer en ligne et de renouveler automatiquement ses contrats.

    Fonctionnalités principales :
    - Souscription automatisée grâce à des formulaires intelligents, une analyse des données et la signature électronique.
    - Gestion des sinistres par intelligence artificielle : analyse, estimation des indemnités, réponse instantanée et suivi.
    - Détection des fraudes à l’aide d’algorithmes d’IA et validation manuelle des cas suspects.
    - Chatbot d’assistance 24h/24 et 7j/7 avec réponses personnalisées selon le profil client.

    Consignes :
    - Réponds uniquement en français.
    - Si la question porte sur une autre plateforme, réponds brièvement et redirige vers YOMI Assurance :
      Exemple : "Je n'ai pas d'informations sur [Autre plateforme], mais YOMI Assurance offre un service automatisé et intelligent pour gérer vos contrats et sinistres. Souhaitez-vous en savoir plus ?"
    - Si l'utilisateur pose une question courante comme "Comment déclarer un sinistre ?", "Comment voir mes contrats ?", "Est-ce que le paiement est sécurisé ?", donne une réponse claire et utile selon les fonctionnalités décrites ci-dessus.

    Ton objectif est d’accompagner efficacement l’utilisateur dans l’utilisation de la plateforme YOMI Assurance.
  `;

  // Customize prompt based on authentication status
  if (isAuthenticated && userId) {
    const name = userName || 'Utilisateur'; // Fallback to 'Utilisateur' if name is missing
    systemPrompt += `
      L'utilisateur est connecté (Nom: ${name}). Fournis des réponses personnalisées, par exemple :
      - Pour "voir mes contrats", indique comment accéder à l'espace client.
      - Pour "déclarer un sinistre", explique le processus dans l'espace client.
      - Si la question nécessite des données spécifiques (ex. statut d’un sinistre), suppose un scénario générique ou dis : "Veuillez vérifier votre espace client pour des détails précis."
    `;
  } else {
    systemPrompt += `
      L'utilisateur n'est pas connecté. Concentre-toi sur les questions pré-inscription, comme :
      - Le processus de souscription.
      - La sécurité des paiements.
      - Les fonctionnalités générales de YOMI Assurance.
      Incite l'utilisateur à s'inscrire pour plus de détails.
    `;
  }

  // Optional: Database query for dynamic responses (uncomment if needed)
  // let dynamicInfo = '';
  // if (isAuthenticated && message.toLowerCase().includes('contrats')) {
  //   const contracts = await Contract.find({ userId });
  //   dynamicInfo = contracts.length
  //     ? `Vous avez ${contracts.length} contrat(s) : ${contracts.map(c => `Contrat #${c.contractId} (${c.status})`).join(', ')}.`
  //     : 'Aucun contrat trouvé. Vérifiez votre espace client.';
  //   systemPrompt += dynamicInfo ? `\nInformations dynamiques : ${dynamicInfo}` : '';
  // }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const botResponse = completion.choices[0].message.content;
    res.json({ response: botResponse });
  } catch (error) {
    console.error('Groq API error:', error.message, error.stack);
    res.status(500).json({ error: 'Une erreur est survenue.' });
  }
};

module.exports = { handleChat };