import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button, Modal } from 'react-bootstrap';
import { useAuth } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import { MdAssignment, MdFileDownload, MdInfo, MdAutorenew, MdEdit } from 'react-icons/md';
import CustomNavbar from '../components/navbar';
import './MesContrats.css';

interface Contract {
  _id: string;
  userId: string;
  policyType: 'santé' | 'voyage' | 'automobile' | 'responsabilité civile' | 'habitation' | 'professionnelle' | 'transport';
  startDate: string;
  endDate: string;
  premiumAmount: number;
  coverageDetails: string;
  policyDetails: {
    maladiesPreexistantes?: string;
    fumeur?: boolean;
    traitementsActuels?: string;
    destination?: string;
    departureDate?: string;
    returnDate?: string;
    carModel?: string;
    registrationNumber?: string;
    usage?: string;
    coveredActivities?: string;
    coverageLimit?: number;
    homeType?: string;
    location?: string;
    alarmSystem?: boolean;
    profession?: string;
    annualRevenue?: number;
    employeeCount?: number;
    transportType?: string;
    goodsValue?: number;
  };
  claims?: string[];
  status?: 'active' | 'expired' | 'pending';
  policyNumber?: string;
}

const MesContrats: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get policy color based on type
  const getPolicyColor = (type: string) => {
    const colors: {[key: string]: string} = {
      'santé': 'success',
      'voyage': 'primary',
      'automobile': 'danger',
      'responsabilité civile': 'warning',
      'habitation': 'info',
      'professionnelle': 'dark'
    };
    return colors[type] || 'secondary';
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    const variants: {[key: string]: string} = {
      'active': 'success',
      'expired': 'danger',
      'pending': 'warning'
    };
    return variants[status] || 'secondary';
  };

  // Get remaining days
  const getRemainingDays = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Handle view details click
  const handleViewDetails = (contract: Contract) => {
    setSelectedContract(contract);
    setShowModal(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
  };

  useEffect(() => {
    const fetchContracts = async () => {
      if (!user?._id) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          navigate('/signin');
          return;
        }
    
        const response = await axios.get(`http://localhost:5000/api/contracts/${user._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const contractsWithStatus = response.data.map((contract: Contract) => {
          const endDate = new Date(contract.endDate);
          const today = new Date();
          let status = 'active';
          
          if (today > endDate) {
            status = 'expired';
          }
          
          return {
            ...contract,
            status,
            policyNumber: contract.policyNumber || `POL-${Math.floor(100000 + Math.random() * 900000)}`
          };
        });
        
        setContracts(contractsWithStatus);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          navigate('/signin');
        } else {
          setError('Impossible de récupérer vos contrats. Veuillez réessayer plus tard.');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [user?._id]);

  // If not logged in
  if (!user?._id) {
    return (
      <>
        <CustomNavbar />
        <Container className="mt-5 text-center">
          <Alert variant="warning">
            <Alert.Heading>Connexion requise</Alert.Heading>
            <p>Veuillez vous connecter pour voir vos contrats.</p>
            <Button variant="primary" onClick={() => navigate('/signin')}>Se connecter</Button>
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <CustomNavbar />
      <Container className="mes-contrats-container" style={{ marginTop: '70px' }}>
      <Row className="mb-4">
          <Col>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
              <h2 className="page-title mb-3 mb-md-0">  </h2>
              <Button 
                variant="outline-primary" 
                className="d-flex align-items-center"
                onClick={() => navigate('/souscription')}
              >
                <MdAutorenew className="me-2" /> Souscrire à un nouveau contrat
              </Button>
            </div>
          </Col>
        </Row>

        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Chargement...</span>
            </Spinner>
            <p className="mt-2">Chargement de vos contrats...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">
            {error}
          </Alert>
        ) : contracts.length === 0 ? (
          <Card className="text-center">
            <Card.Body className="py-5">
              <MdAssignment size={60} className="text-muted mb-3" />
              <Card.Title>Aucun contrat trouvé</Card.Title>
              <Card.Text>
                Vous n'avez pas encore souscrit à un contrat d'assurance.
              </Card.Text>
              <Button 
                variant="outline-secondary" 
                className="mt-2 w-100"
                onClick={() => navigate('/souscription', { state: { contract: contracts } })}
              >
                <MdEdit className="me-2" /> Modifier
              </Button>
              <Button variant="primary" className="mt-2" onClick={() => navigate('/souscription')}>
                Souscrire à un contrat
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Row>
            {contracts.map((contract) => {
              const remainingDays = getRemainingDays(contract.endDate);
              
              return (
                <Col key={contract._id} xl={4} lg={6} md={6} sm={12} className="mb-4">
                  <Card className={`contract-card ${contract.status === 'expired' ? 'expired' : ''}`}>
                    <Card.Header className={`bg-${getPolicyColor(contract.policyType)} text-white`}>
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 text-capitalize contract-title">Assurance {contract.policyType}</h5>
                        <Badge bg={getStatusVariant(contract.status || 'pending')}>
                          {contract.status === 'active' ? 'Actif' : 
                           contract.status === 'expired' ? 'Expiré' : 'En attente'}
                        </Badge>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <div className="contract-id">
                        Police N° {contract.policyNumber}
                      </div>
                      
                      <div className="contract-dates">
                        <div className="date-item">
                          <div className="date-label">Date de début</div>
                          <div className="date-value">{new Date(contract.startDate).toLocaleDateString('fr-FR')}</div>
                        </div>
                        <div className="date-separator"></div>
                        <div className="date-item">
                          <div className="date-label">Date de fin</div>
                          <div className="date-value">{new Date(contract.endDate).toLocaleDateString('fr-FR')}</div>
                        </div>
                      </div>
                      
                      {contract.status === 'active' && (
                        <div className="remaining-days">
                          {remainingDays > 0 ? (
                            <div className="text-center">
                              <div className="days-number">{remainingDays}</div>
                              <div className="days-label">jours restants</div>
                            </div>
                          ) : (
                            <div className="expiring-soon">Expire aujourd'hui</div>
                          )}
                        </div>
                      )}
                      
                      <div className="premium-amount">
                        <span className="amount">{contract.premiumAmount} dt</span>
                        <span className="period">/an</span>
                      </div>
                      
                      <div className="contract-actions">
                        <Button 
                          variant="outline-primary" 
                          className="w-100"
                          onClick={() => handleViewDetails(contract)}
                        >
                          <MdInfo className="me-2" /> Voir les détails
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Container>
      
      {/* Contract Details Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        {selectedContract && (
          <>
            <Modal.Header closeButton className={`bg-${getPolicyColor(selectedContract.policyType)} text-white`}>
              <Modal.Title className="modal-title">Détails du contrat - {selectedContract.policyType.toUpperCase()}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row>
                <Col md={6} className="mb-3">
                  <h5>Informations générales</h5>
                  <p><strong>Numéro de police:</strong> {selectedContract.policyNumber}</p>
                  <p><strong>Type:</strong> {selectedContract.policyType}</p>
                  <p><strong>Statut:</strong> <Badge bg={getStatusVariant(selectedContract.status || '')}>
                    {selectedContract.status === 'active' ? 'Actif' : 
                     selectedContract.status === 'expired' ? 'Expiré' : 'En attente'}
                  </Badge></p>
                  <p><strong>Prime annuelle:</strong> {selectedContract.premiumAmount} €</p>
                </Col>
                <Col md={6} className="mb-3">
                  <h5>Période de couverture</h5>
                  <p><strong>Date de début:</strong> {new Date(selectedContract.startDate).toLocaleDateString('fr-FR')}</p>
                  <p><strong>Date de fin:</strong> {new Date(selectedContract.endDate).toLocaleDateString('fr-FR')}</p>
                  {selectedContract.status === 'active' && (
                    <p><strong>Jours restants:</strong> {getRemainingDays(selectedContract.endDate)}</p>
                  )}
                </Col>
              </Row>
              
              <hr/>
              
              <h5>Détails de couverture</h5>
              <p className="coverage-details">{selectedContract.coverageDetails}</p>
              
              {selectedContract.claims && selectedContract.claims.length > 0 && (
                <>
                  <hr/>
                  <h5>Sinistres associés</h5>
                  <ul className="list-unstyled">
                    {selectedContract.claims.map((claim, index) => (
                      <li key={index} className="border-bottom pb-2 mb-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <span>Sinistre #{claim}</span>
                          <Button 
                            variant="link" 
                            size="sm"
                            onClick={() => navigate(`/mes-declarations?claimId=${claim}`)}
                          >
                            Voir les détails
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Modal.Body>
            <Modal.Footer className="d-flex flex-column flex-md-row justify-content-between">
              <Button variant="outline-secondary" onClick={handleCloseModal} className="mb-2 mb-md-0">
                Fermer
              </Button>
              <div className="d-flex flex-column flex-md-row gap-2">
                <Button variant="primary" className="d-flex align-items-center">
                  <MdFileDownload className="me-2" /> Télécharger
                </Button>
                {selectedContract.status === 'expired' && (
                  <Button variant="success" className="d-flex align-items-center">
                    <MdAutorenew className="me-2" /> Renouveler
                  </Button>
                )}
              </div>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </>
  );
};

export default MesContrats;