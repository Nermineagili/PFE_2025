import React from "react";
import { useNavigate } from "react-router-dom";
import "./PolicyTypes.css";

// Define the policy type string literal type to match SubscribeForm
type PolicyType = 
  | 'santé'
  | 'voyage'
  | 'automobile'
  | 'responsabilité civile'
  | 'habitation'
  | 'professionnelle'
  | 'transport';

// Define a policy option interface for our insurance options
interface PolicyOption {
  icon: string;
  title: string;
  type: PolicyType;
  description: string;
}

const insuranceOptions: PolicyOption[] = [
  {
    icon: "🩺",
    title: "Assurance Santé",
    type: "santé",
    description: "Des soins de qualité sans se soucier des frais médicaux : consultations, hospitalisations, soins dentaires, etc."
  },
  {
    icon: "✈️",
    title: "Assurance Voyage",
    type: "voyage",
    description: "Protégez vos voyages contre les imprévus : annulation, bagages perdus, urgences médicales à l'étranger."
  },
  {
    icon: "🚗",
    title: "Assurance Automobile",
    type: "automobile",
    description: "Couvrez vos véhicules contre le vol, les accidents, les dommages corporels ou matériels."
  },
  {
    icon: "🏠",
    title: "Assurance Habitation",
    type: "habitation",
    description: "Protégez votre logement contre les incendies, vols, dégâts des eaux et autres sinistres."
  },
  {
    icon: "📦",
    title: "Assurance Transport",
    type: "transport",
    description: "Assurez vos biens et marchandises pendant leur transit, localement ou à l'international."
  },
  {
    icon: "🧑‍⚖️",
    title: "Responsabilité Civile",
    type: "responsabilité civile",
    description: "Soyez couvert pour les dommages causés à des tiers dans votre vie personnelle ou professionnelle."
  },
  {
    icon: "💼",
    title: "Assurance Professionnelle",
    type: "professionnelle",
    description: "Protégez votre activité professionnelle contre les risques spécifiques à votre secteur."
  }
];

interface PolicyTypeProps {
  onSelectPolicyType?: (type: PolicyType) => void;
  standalone?: boolean;
}

const PolicyType: React.FC<PolicyTypeProps> = ({ onSelectPolicyType, standalone = true }) => {
  const navigate = useNavigate();
  
  const handlePolicySelect = (policy: PolicyOption) => {
    if (onSelectPolicyType) {
      // Pass just the type string, not the whole policy object
      onSelectPolicyType(policy.type);
    }
  
    if (standalone) {
      navigate('/subscribe', { state: { policyType: policy.type } });
    }
  };

  return (
    <section className="policy-type-section">
      <h2>Choisissez votre type d'assurance</h2>
      <div className="policy-grid">
        {insuranceOptions.map((option, index) => (
          <div 
            key={index} 
            className="policy-card"
            onClick={() => handlePolicySelect(option)}
          >
            <span className="policy-icon">{option.icon}</span>
            <h4>{option.title}</h4>
            <p>{option.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PolicyType;