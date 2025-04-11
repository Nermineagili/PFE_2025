import React from "react";
import "./APropos.css";
import PourquoiYomi from "./PourquoiYomi";

const APropos = React.forwardRef<HTMLDivElement>((_props, ref) => {
  return (
    <section ref={ref} id="apropos-section" className="apropos-section">
      <h2>Qui sommes-nous ?</h2>
      <p>
        <strong>Yomi Assurance</strong>, en partenariat avec <strong>Atlanta Assurances</strong>, est votre expert de confiance dans la gestion des risques personnels et professionnels.
        Nous proposons une gamme complète de solutions d’assurance pour protéger votre santé, vos biens, votre mobilité et vos responsabilités.
      </p>
      <p>
        Notre mission est de vous offrir une couverture <strong>fiable</strong> et <strong>adaptée</strong> à vos besoins, afin que vous puissiez vivre et travailler en toute sérénité.
      </p>

      <h3>Nos Valeurs</h3>
      <div className="beliefs">
        <div className="belief">
          <span>🤝</span>
          <h4>Confiance</h4>
          <p>Une relation transparente et durable avec nos clients et partenaires.</p>
        </div>
        <div className="belief">
          <span>⚙️</span>
          <h4>Innovation</h4>
          <p>Une plateforme digitale moderne pour simplifier la gestion de vos assurances.</p>
        </div>
        <div className="belief">
          <span>🛡️</span>
          <h4>Protection</h4>
          <p>Des solutions solides pour couvrir vos risques personnels et professionnels.</p>
        </div>
      </div>
      <PourquoiYomi />
    </section>
  );
});

export default APropos;
