
import { useNavigate } from "react-router-dom";
import "./PourquoiYomi.css";

const PourquoiYomi = () => {
  const navigate = useNavigate();
  
  return (
    <section className="yomi-why-section">
      <div className="yomi-why-container">
        <div className="yomi-why-header">
          <h2 className="yomi-why-title">Pourquoi choisir Yomi Assurance ?</h2>
          <div className="yomi-why-title-underline"></div>
        </div>
        
        <div className="yomi-why-features-grid">
          <div className="yomi-why-feature-item">
            <div className="yomi-why-feature-box">
              <div className="yomi-why-feature-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <div className="yomi-why-feature-content">
                <h3>Fiabilité</h3>
                <p>En partenariat avec Atlanta Assurances, Yomi vous garantit une couverture fiable et solide pour tous vos besoins.</p>
              </div>
            </div>
          </div>
          
          <div className="yomi-why-feature-item">
            <div className="yomi-why-feature-box">
              <div className="yomi-why-feature-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="yomi-why-feature-content">
                <h3>Accessibilité</h3>
                <p>Profitez de notre plateforme intuitive, accessible à tout moment et partout, que ce soit sur mobile ou ordinateur.</p>
              </div>
            </div>
          </div>
          
          <div className="yomi-why-feature-item">
            <div className="yomi-why-feature-box">
              <div className="yomi-why-feature-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="yomi-why-feature-content">
                <h3>Accompagnement personnalisé</h3>
                <p>Nous vous offrons un suivi humain, avec des conseillers toujours prêts à répondre à vos questions et vous guider.</p>
              </div>
            </div>
          </div>
          
          <div className="yomi-why-feature-item">
            <div className="yomi-why-feature-box">
              <div className="yomi-why-feature-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="yomi-why-feature-content">
                <h3>Transparence totale</h3>
                <p>Avec Yomi, tout est clair : des garanties simples, des prix justes et une communication transparente.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="yomi-why-cta">
          <p>Découvrez comment utiliser notre plateforme pour gérer facilement vos assurances.</p>
          <button 
            onClick={() => navigate("/guide")} 
            className="yomi-why-button"
          >
            Découvrir nos offres
          </button>
        </div>
      </div>
    </section>
  );
};

export default PourquoiYomi;