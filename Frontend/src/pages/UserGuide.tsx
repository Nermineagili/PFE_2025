import React from "react";
import { Card, Row, Col, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { MdAssignment, MdPayment, MdInsertDriveFile, MdDashboard, MdHelpOutline } from "react-icons/md";
import "./UserGuide.css";

const UserGuide: React.FC = () => {
  return (
    <div className="yomi-user-guide-container">
      <section className="yomi-guide-hero">
        <h1>Bienvenue sur Yomi Assurance</h1>
        <p className="yomi-guide-lead">
          Découvrez comment utiliser notre plateforme pour gérer facilement vos assurances
        </p>
      </section>

      <section className="yomi-guide-steps">
        <h2>Comment utiliser notre application</h2>
        <p>Suivez ces étapes simples pour tirer le meilleur parti de nos services</p>

        <Row className="mt-4">
          <Col md={6} lg={4} className="mb-4">
            <Card className="yomi-guide-card">
              <div className="yomi-card-icon-container">
                <MdInsertDriveFile className="yomi-card-icon" />
                <span className="yomi-step-number">1</span>
              </div>
              <Card.Body>
                <Card.Title>Souscrire à un contrat</Card.Title>
                <Card.Text>
                  Choisissez parmi nos différentes offres d'assurance et souscrivez en quelques clics.
                </Card.Text>
                <ul className="yomi-guide-list">
                  <li>Sélectionnez le type d'assurance qui vous convient</li>
                  <li>Remplissez le formulaire avec vos informations</li>
                  <li>Vérifiez votre devis personnalisé</li>
                  <li>Confirmez votre souscription</li>
                </ul>
                <Link to="/souscription">
                  <Button variant="primary" className="yomi-guide-button">
                    Souscrire maintenant
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={4} className="mb-4">
            <Card className="yomi-guide-card">
              <div className="yomi-card-icon-container">
                <MdAssignment className="yomi-card-icon" />
                <span className="yomi-step-number">2</span>
              </div>
              <Card.Body>
                <Card.Title>Déclarer un sinistre</Card.Title>
                <Card.Text>
                  En cas d'incident, déclarez votre sinistre rapidement pour accélérer le traitement.
                </Card.Text>
                <ul className="yomi-guide-list">
                  <li>Accédez au formulaire de déclaration</li>
                  <li>Décrivez les circonstances de l'incident</li>
                  <li>Téléchargez les documents justificatifs</li>
                  <li>Soumettez votre déclaration pour analyse</li>
                </ul>
                <Link to="/clienthome">
                  <Button variant="primary" className="yomi-guide-button">
                    Déclarer un sinistre
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={4} className="mb-4">
            <Card className="yomi-guide-card">
              <div className="yomi-card-icon-container">
                <MdPayment className="yomi-card-icon" />
                <span className="yomi-step-number">3</span>
              </div>
              <Card.Body>
                <Card.Title>Effectuer un paiement</Card.Title>
                <Card.Text>
                  Réglez vos primes d'assurance en ligne de manière sécurisée.
                </Card.Text>
                <ul className="yomi-guide-list">
                  <li>Consultez vos factures en attente</li>
                  <li>Choisissez votre méthode de paiement préférée</li>
                  <li>Procédez au paiement en toute sécurité</li>
                  <li>Recevez votre confirmation instantanément</li>
                </ul>
                <Link to="/paiement">
                  <Button variant="primary" className="yomi-guide-button">
                    Gérer mes paiements
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={4} className="mb-4">
            <Card className="yomi-guide-card">
              <div className="yomi-card-icon-container">
                <MdDashboard className="yomi-card-icon" />
                <span className="yomi-step-number">4</span>
              </div>
              <Card.Body>
                <Card.Title>Suivre mes déclarations</Card.Title>
                <Card.Text>
                  Consultez l'état d'avancement de vos déclarations de sinistre.
                </Card.Text>
                <ul className="yomi-guide-list">
                  <li>Visualisez toutes vos déclarations en cours</li>
                  <li>Consultez les détails de chaque sinistre</li>
                  <li>Suivez l'état de traitement en temps réel</li>
                  <li>Fournissez des informations complémentaires si nécessaire</li>
                </ul>
                <Link to="/mes-declarations">
                  <Button variant="primary" className="yomi-guide-button">
                    Voir mes déclarations
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={4} className="mb-4">
            <Card className="yomi-guide-card">
              <div className="yomi-card-icon-container">
                <MdHelpOutline className="yomi-card-icon" />
                <span className="yomi-step-number">5</span>
              </div>
              <Card.Body>
                <Card.Title>Obtenir de l'aide</Card.Title>
                <Card.Text>
                  Besoin d'assistance ? Contactez nos conseillers pour toute question.
                </Card.Text>
                <ul className="yomi-guide-list">
                  <li>Consultez notre FAQ pour les questions courantes</li>
                  <li>Utilisez notre formulaire de contact</li>
                  <li>Appelez notre service client aux heures d'ouverture</li>
                  <li>Prenez rendez-vous avec un conseiller</li>
                </ul>
                <Link to="/contact">
                  <Button variant="primary" className="yomi-guide-button">
                    Contacter un conseiller
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </section>

      <section className="yomi-guide-cta">
        <h2>Prêt à commencer ?</h2>
        <p>Créez votre compte ou connectez-vous pour accéder à tous nos services</p>
        <div className="yomi-guide-buttons">
          <Link to="/signup">
            <Button className="yomi-btn-signup" size="lg">
              Créer un compte
            </Button>
          </Link>
          <Link to="/signin">
            <Button className="yomi-btn-login" size="lg">
              Se connecter
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default UserGuide;