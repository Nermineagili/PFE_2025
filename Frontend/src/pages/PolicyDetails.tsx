import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PolicyDetails.css";

// Policy type details content
const policyDetails = {
  "Assurance Santé": {
    icon: "🩺",
    title: "Assurance Santé",
    tagline: "Votre santé mérite la meilleure protection",
    description: "Notre assurance santé vous offre une tranquillité d'esprit totale face aux dépenses médicales imprévues.",
    benefits: [
      "Remboursement des consultations médicales jusqu'à 100%",
      "Prise en charge des hospitalisations et des interventions chirurgicales",
      "Couverture des soins dentaires et optiques",
      "Accès à un réseau de professionnels de santé qualifiés",
      "Options pour les médecines douces et alternatives"
    ],
    testimonial: {
      text: "Grâce à mon assurance santé Yomi, j'ai pu me faire opérer sans me soucier des frais. Le remboursement a été rapide et la prise en charge complète!",
      author: "Sophie M., 42 ans"
    },
    cta: "Protégez votre santé dès aujourd'hui",
    subscriptionType: "santé" // This corresponds to the policy type in SubscribeForm
  },
  "Assurance Voyage": {
    icon: "✈️",
    title: "Assurance Voyage",
    tagline: "Voyagez l'esprit tranquille, où que vous alliez",
    description: "Notre assurance voyage vous protège contre tous les imprévus pendant vos déplacements, pour des souvenirs sans mauvaises surprises.",
    benefits: [
      "Annulation de voyage remboursée en cas d'imprévu",
      "Assistance médicale 24/7 partout dans le monde",
      "Indemnisation pour bagages perdus ou retardés",
      "Responsabilité civile à l'étranger",
      "Couverture des sports et activités à risque (en option)"
    ],
    testimonial: {
      text: "Lors de mon voyage au Japon, j'ai dû être hospitalisé d'urgence. L'assurance voyage Yomi a tout pris en charge et m'a même aidé avec la barrière de la langue!",
      author: "Thomas L., 35 ans"
    },
    cta: "Assurez vos prochaines aventures",
    subscriptionType: "voyage"
  },
  "Assurance Automobile": {
    icon: "🚗",
    title: "Assurance Automobile",
    tagline: "La route en toute sécurité pour vous et votre véhicule",
    description: "Notre assurance automobile offre une protection complète pour votre véhicule et garantit votre tranquillité sur la route.",
    benefits: [
      "Couverture tous risques personnalisable",
      "Protection contre le vol et le vandalisme",
      "Assistance 24/7 en cas de panne ou d'accident",
      "Véhicule de remplacement inclus",
      "Bonus fidélité pour les conducteurs responsables"
    ],
    testimonial: {
      text: "Suite à un accident, ma voiture était inutilisable. Yomi a pris en charge toutes les réparations et m'a fourni un véhicule pendant toute la durée des travaux. Service impeccable!",
      author: "Michel D., 53 ans"
    },
    cta: "Conduisez en toute sérénité",
    subscriptionType: "automobile"
  },
  "Multirisque Habitation": {
    icon: "🏠",
    title: "Multirisque Habitation",
    tagline: "Votre foyer mérite une protection à sa mesure",
    description: "Notre assurance habitation protège votre logement et vos biens contre tous les sinistres, pour que votre chez-vous reste un havre de paix.",
    benefits: [
      "Protection contre incendie, dégâts des eaux et catastrophes naturelles",
      "Couverture vol et vandalisme avec indemnisation rapide",
      "Responsabilité civile pour votre famille",
      "Assistance d'urgence 24/7 (plombier, serrurier, électricien)",
      "Options pour objets de valeur et équipements high-tech"
    ],
    testimonial: {
      text: "Après un dégât des eaux important, Yomi a organisé et pris en charge tous les travaux de rénovation. Leur réactivité a été impressionnante!",
      author: "Claire B., 39 ans"
    },
    cta: "Protégez votre chez-vous",
    subscriptionType: "habitation"
  },
  "Assurance Transport": {
    icon: "📦",
    title: "Assurance Transport",
    tagline: "Vos marchandises méritent un voyage sans encombre",
    description: "Notre assurance transport sécurise vos biens et marchandises pendant leur transit, du point A au point B, sans compromis.",
    benefits: [
      "Couverture mondiale pour vos expéditions",
      "Protection contre les dommages, pertes et vols",
      "Indemnisation rapide en cas de sinistre",
      "Options pour marchandises sensibles ou de grande valeur",
      "Suivi des réclamations simplifié"
    ],
    testimonial: {
      text: "En tant qu'entreprise d'import-export, l'assurance transport Yomi est cruciale pour nous. Leur réactivité lors d'un conteneur endommagé nous a sauvés financièrement.",
      author: "Laurent M., Directeur logistique"
    },
    cta: "Sécurisez vos expéditions",
    subscriptionType: "transport"
  },
  "Responsabilité Civile": {
    icon: "🧑‍⚖️",
    title: "Responsabilité Civile",
    tagline: "Protégez-vous des conséquences de vos actes",
    description: "Notre assurance responsabilité civile vous couvre financièrement pour les dommages que vous pourriez causer involontairement à autrui.",
    benefits: [
      "Protection juridique en cas de litige",
      "Couverture des dommages corporels et matériels causés à des tiers",
      "Protection pour toute la famille, y compris les enfants mineurs",
      "Options spécifiques pour les professionnels",
      "Accompagnement personnalisé en cas de sinistre"
    ],
    testimonial: {
      text: "Suite à un accident causé par mon fils mineur, l'assurance responsabilité civile Yomi a pris en charge tous les frais et m'a accompagné juridiquement. Un vrai soulagement!",
      author: "Philippe R., 48 ans"
    },
    cta: "Assurez votre tranquillité d'esprit",
    subscriptionType: "responsabilité civile"
  }
};

type PolicyType = keyof typeof policyDetails;

interface PolicyDetailsProps {
  selectedPolicy?: PolicyType | null;
  onClose?: () => void;
}

const PolicyDetails: React.FC<PolicyDetailsProps> = ({ selectedPolicy, onClose }) => {
  const [hoverButton, setHoverButton] = useState(false);
  const navigate = useNavigate();
  
  if (!selectedPolicy) return null;
  
  const policy = policyDetails[selectedPolicy];
  
  const handleSubscribeClick = () => {
    // Navigate to the subscribe form with the selected policy type
    navigate('/souscription', { 
      state: { policyType: policy.subscriptionType } 
    });
    
    // Close the modal if onClose function is provided
    if (onClose) {
      onClose();
    }
  };
  
  return (
    <div className="yomi-policy-details-container">
      <div className="yomi-policy-details-card">
        <button className="yomi-policy-close-button" onClick={onClose}>×</button>
        
        <div className="yomi-policy-header">
          <span className="yomi-policy-icon">{policy.icon}</span>
          <h2>{policy.title}</h2>
          <p className="yomi-policy-tagline">{policy.tagline}</p>
        </div>
        
        <div className="yomi-policy-content">
          <p className="yomi-policy-description">{policy.description}</p>
          
          <div className="yomi-policy-benefits">
            <h3>Ce que cette assurance vous offre:</h3>
            <ul>
              {policy.benefits.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
          </div>
          
          <div className="yomi-policy-testimonial">
            <blockquote>
              "{policy.testimonial.text}"
              <footer>— {policy.testimonial.author}</footer>
            </blockquote>
          </div>
        </div>
        
        <div className="yomi-policy-cta">
          <button 
            className={`yomi-policy-cta-button ${hoverButton ? 'hover' : ''}`}
            onMouseEnter={() => setHoverButton(true)}
            onMouseLeave={() => setHoverButton(false)}
            onClick={handleSubscribeClick}
          >
            {policy.cta}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyDetails;