import React, { useState } from "react";
import "./NosServices.css";
import PolicyDetails from "../pages/PolicyDetails";

const services = [
  {
    icon: "🩺",
    title: "Assurance Santé",
    description: "Des soins de qualité sans se soucier des frais médicaux : consultations, hospitalisations, soins dentaires, etc."
  },
  {
    icon: "✈️",
    title: "Assurance Voyage",
    description: "Protégez vos voyages contre les imprévus : annulation, bagages perdus, urgences médicales à l'étranger."
  },
  {
    icon: "🚗",
    title: "Assurance Automobile",
    description: "Couvrez vos véhicules contre le vol, les accidents, les dommages corporels ou matériels."
  },
  {
    icon: "🏠",
    title: "Multirisque Habitation",
    description: "Protégez votre logement contre les incendies, vols, dégâts des eaux et autres sinistres."
  },
  {
    icon: "📦",
    title: "Assurance Transport",
    description: "Assurez vos biens et marchandises pendant leur transit, localement ou à l'international."
  },
  {
    icon: "🧑‍⚖️",
    title: "Responsabilité Civile",
    description: "Soyez couvert pour les dommages causés à des tiers dans votre vie personnelle ou professionnelle."
  }
];

const NosServices = React.forwardRef<HTMLDivElement>((_props, ref) => {
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);

  const handleCardClick = (policyTitle: string) => {
    setSelectedPolicy(policyTitle);
  };

  const closeDetails = () => {
    setSelectedPolicy(null);
  };

  return (
    <section ref={ref} className="services-section" id="services">
      <h2>Nos Services</h2>
      <div className="services-grid">
        {services.map((service, index) => (
          <div 
            key={index} 
            className="service-card" 
            onClick={() => handleCardClick(service.title)}
          >
            <span className="service-icon">{service.icon}</span>
            <h4>{service.title}</h4>
            <p>{service.description}</p>
            <button className="learn-more-btn">En savoir plus</button>
          </div>
        ))}
      </div>

      {selectedPolicy && (
        <PolicyDetails 
          selectedPolicy={selectedPolicy as any} 
          onClose={closeDetails} 
        />
      )}
    </section>
  );
});

export default NosServices;