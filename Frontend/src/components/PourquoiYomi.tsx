import "./PourquoiYomi.css";
import { useNavigate } from "react-router-dom";

const PourquoiYomi = () => {
  const navigate = useNavigate();
  return (
    <section className="pourquoi-yomi-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Pourquoi choisir Yomi Assurance ?</h2>
          <div className="title-underline"></div>
        </div>

        <div className="row features-container">
          <div className="col-md-6">
            <div className="feature-box">
              <div className="feature-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <div className="feature-content">
                <h3>Fiabilité</h3>
                <p>En partenariat avec Atlanta Assurances, Yomi vous garantit une couverture fiable et solide pour tous vos besoins.</p>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="feature-box">
              <div className="feature-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="feature-content">
                <h3>Accessibilité</h3>
                <p>Profitez de notre plateforme intuitive, accessible à tout moment et partout, que ce soit sur mobile ou ordinateur.</p>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="feature-box">
              <div className="feature-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="feature-content">
                <h3>Accompagnement personnalisé</h3>
                <p>Nous vous offrons un suivi humain, avec des conseillers toujours prêts à répondre à vos questions et vous guider.</p>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="feature-box">
              <div className="feature-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="feature-content">
                <h3>Transparence totale</h3>
                <p>Avec Yomi, tout est clair : des garanties simples, des prix justes et une communication transparente.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="cta-container">
        <p>Découvrez comment utiliser notre plateforme pour gérer facilement vos assurances.</p>
        <button onClick={() => navigate("/guide")} className="btn-primary1">
              Découvrir nos offres
        </button>
      </div>
      </div>
    </section>
  );
};

export default PourquoiYomi;