import React from "react";
import "./NosServices.css";

const services = [
  {
    icon: "🩺",
    title: "Assurance Santé",
    description: "Des soins de qualité sans se soucier des frais médicaux : consultations, hospitalisations, soins dentaires, etc."
  },
  {
    icon: "✈️",
    title: "Assurance Voyage",
    description: "Protégez vos voyages contre les imprévus : annulation, bagages perdus, urgences médicales à l’étranger."
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
    description: "Assurez vos biens et marchandises pendant leur transit, localement ou à l’international."
  },
  {
    icon: "🧑‍⚖️",
    title: "Responsabilité Civile",
    description: "Soyez couvert pour les dommages causés à des tiers dans votre vie personnelle ou professionnelle."
  }
];

const NosServices =  React.forwardRef<HTMLDivElement>((_props, ref) => {
  return (
    <section ref={ref} className="services-section" id="services">
      <h2>Nos Services</h2>
      <div className="services-grid">
        {services.map((service, index) => (
          <div key={index} className="service-card">
            <span className="service-icon">{service.icon}</span>
            <h4>{service.title}</h4>
            <p>{service.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
});

export default NosServices;
