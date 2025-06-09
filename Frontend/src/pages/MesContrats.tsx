import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button, Modal } from 'react-bootstrap';
import { useAuth } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import { MdAssignment, MdFileDownload, MdInfo, MdAutorenew, MdEdit } from 'react-icons/md';
import CustomNavbar from '../components/navbar';
import './MesContrats.css';
import ChatBot from '../components/ChatBot/ChatBot';

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
  status?: 'active' | 'expired' | 'pending' | 'pending_payment' | 'cancelled' | 'pending_renewal' | 'archived';
  archivedAt?: string;
  replacedBy?: string;
  policyNumber?: string;
  renewalData?: {
    renewalOffered: boolean;
    renewalPremium: number;
    renewalCoverage: string;
    renewalPolicyDetails: any;
  };
  previousContract?: string;
  signature?: string; // Added to match backend
}

const MesContrats: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [downloadMessage, setDownloadMessage] = useState<string>('');
  const [downloadMessageType, setDownloadMessageType] = useState<'success' | 'error' | ''>('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [renewalModalShow, setRenewalModalShow] = useState(false);
  const [contractToRenew, setContractToRenew] = useState<Contract | null>(null);
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [renewalError, setRenewalError] = useState('');
  const [renewalSuccess, setRenewalSuccess] = useState(false);

  const getPolicyColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'santé': '#28a745',
      'voyage': '#007bff',
      'automobile': '#dc3545',
      'responsabilité civile': '#ffc107',
      'habitation': '#17a2b8',
      'professionnelle': '#343a40',
      'transport': '#6c757d',
    };
    return colors[type] || '#6c757d';
  };

  const getStatusVariant = (status: string | undefined) => {
    const variants: Record<string, string> = {
      'active': 'success',
      'expired': 'danger',
      'pending': 'warning',
      'pending_payment': 'warning',
      'cancelled': 'secondary',
      'pending_renewal': 'info',
    };
    return variants[status || ''] || 'secondary';
  };

  const getRemainingDays = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateNewEndDate = (endDate: string): string => {
    const endDateObj = new Date(endDate);
    endDateObj.setFullYear(endDateObj.getFullYear() + 1);
    return endDateObj.toLocaleDateString('fr-FR');
  };

  const handleDownloadContract = async (contract: Contract) => {
    try {
      setDownloadMessage('');
      setDownloadMessageType('');
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/signin');
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/contracts/download/${contract._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/pdf',
          },
          responseType: 'blob',
        }
      );

      if (response.status !== 200) {
        const errorText = await response.data.text();
        throw new Error(errorText || 'Failed to download contract');
      }

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Contrat_${contract.policyType}_${contract.policyNumber || contract._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadMessage('Contrat téléchargé avec succès !');
      setDownloadMessageType('success');
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      let errorMessage = 'Une erreur est survenue lors du téléchargement du contrat.';
      if (error.response?.data) {
        try {
          const errorData = await error.response.data.text();
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.message || errorMessage;
        } catch (e) {
          errorMessage = error.message || errorMessage;
        }
      } else {
        errorMessage = error.message || errorMessage;
      }
      setDownloadMessage(errorMessage);
      setDownloadMessageType('error');
    }
  };

  const handleViewDetails = (contract: Contract) => {
    setSelectedContract(contract);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setDownloadMessage('');
    setDownloadMessageType('');
  };

  const handlePrepareRenewal = async (contract: Contract) => {
    try {
      setRenewalLoading(true);
      setRenewalError('');
      setRenewalSuccess(false);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/signin');
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/contracts/prepare-renewal/${contract._id}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to prepare renewal');
      }
  
      setContractToRenew({
        ...contract,
        renewalData: response.data.renewalData,
      });
      setRenewalModalShow(true);
  
    } catch (error: any) {
      let errorMessage = 'Failed to prepare renewal';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setRenewalError(errorMessage);
      console.error('Renewal error:', error);
    } finally {
      setRenewalLoading(false);
    }
  };

  const handleExecuteRenewal = async () => {
    if (!contractToRenew) return;

    try {
      setRenewalLoading(true);
      setRenewalError('');
      setRenewalSuccess(false);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/signin');
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/contracts/execute-renewal/${contractToRenew._id}`,
        { paymentMethodId: 'pm_card_visa' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      setRenewalSuccess(true);
      fetchContracts();
      
      setTimeout(() => {
        setRenewalModalShow(false);
        setRenewalSuccess(false);
      }, 2000);
      
    } catch (error: any) {
      console.error('Error executing renewal:', error);
      let errorMessage = 'Échec du renouvellement. Veuillez réessayer.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setRenewalError(errorMessage);
    } finally {
      setRenewalLoading(false);
    }
  };

  const fetchContracts = async (showArchived = false) => {
    if (!user?._id) return;
    
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        navigate('/signin');
        return;
      }
  
      const response = await axios.get(`http://localhost:5000/api/contracts/${user._id}`, {
        params: { showArchived },
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const contractsWithStatus = response.data
        .filter((contract: Contract) => showArchived || contract.status !== 'archived')
        .map((contract: Contract) => ({
          ...contract,
          status: contract.status || (contract.replacedBy ? 'archived' : new Date(contract.endDate) < new Date() ? 'expired' : 'active'),
          policyNumber: contract.policyNumber || `POL-${Math.floor(100000 + Math.random() * 900000)}`,
          formattedStartDate: new Date(contract.startDate).toLocaleDateString('fr-FR'),
          formattedEndDate: new Date(contract.endDate).toLocaleDateString('fr-FR'),
        }))
        .sort((a: Contract, b: Contract) => {
          const statusOrder = { active: 1, expired: 2, archived: 3 };
          return (statusOrder[a.status as keyof typeof statusOrder] || 4) - 
                 (statusOrder[b.status as keyof typeof statusOrder] || 4);
        });
  
      setContracts(contractsWithStatus);
    } catch (err) {
      console.error('Failed to fetch contracts:', err);
      
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          navigate('/signin');
        } else {
          setError(err.response?.data?.message || 'Impossible de récupérer vos contrats. Veuillez réessayer plus tard.');
        }
      } else {
        setError('Une erreur inattendue est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditContract = (contract: Contract) => {
    navigate('/souscription', { state: { contract } });
  };

  useEffect(() => {
    fetchContracts();
  }, [user?._id]);

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

  // Calculate cache data
  const activeContracts = contracts.filter(c => c.status === 'active');
  const totalPremium = activeContracts.reduce((sum, c) => sum + c.premiumAmount, 0);
  const totalCoverageTypes = new Set(activeContracts.map(c => c.policyType)).size;

  return (
    <>
      <CustomNavbar />
      <Container className="mc-container" style={{ marginTop: '70px', paddingBottom: '100px' }}>
        <Row className="mb-4">
          <Col>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
              <Button 
                variant="outline-primary" 
                className="d-flex align-items-center mb-2 mb-md-0"
                style={{ borderRadius: '20px', padding: '8px 20px' }}
                onClick={() => navigate('/souscription')}
              >
                <MdAutorenew className="me-2" /> Souscrire à un nouveau contrat
              </Button>
            </div>
          </Col>
        </Row>

        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" role="status" variant="primary" />
            <p className="mt-2 text-muted">Chargement de vos contrats...</p>
          </div>
        ) : error ? (
          <Alert variant="danger" className="text-center">
            {error}
          </Alert>
        ) : contracts.length === 0 ? (
          <Card className="text-center shadow-sm" style={{ borderRadius: '15px' }}>
            <Card.Body className="py-5">
              <MdAssignment size={60} className="text-muted mb-3" />
              <Card.Title className="fs-4">Aucun contrat trouvé</Card.Title>
              <Card.Text className="text-muted">
                Vous n'avez pas encore souscrit à un contrat d'assurance.
              </Card.Text>
              <Button variant="primary" className="mt-3" style={{ borderRadius: '20px' }} onClick={() => navigate('/souscription')}>
                Souscrire à un contrat
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Row className="g-4">
            {contracts.map((contract) => {
              const remainingDays = getRemainingDays(contract.endDate);
              const policyColor = getPolicyColor(contract.policyType);

              return (
                <Col key={contract._id} xl={4} lg={6} md={6} sm={12}>
                  <Card 
                    className="contract-card shadow-sm h-100" 
                    style={{ borderRadius: '15px', border: `1px solid ${policyColor}`, transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <Card.Header 
                      className="text-white" 
                      style={{ 
                        background: `linear-gradient(45deg, ${policyColor}, ${policyColor}dd)`, 
                        borderRadius: '15px 15px 0 0' 
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 text-capitalize contract-title fs-5">Assurance {contract.policyType}</h5>
                        <Badge 
                          bg={getStatusVariant(contract.status || 'pending')} 
                          style={{ fontSize: '0.9rem', padding: '5px 10px' }}
                        >
                          {contract.status === 'active' ? 'Actif' : 
                           contract.status === 'expired' ? 'Expiré' : 
                           contract.status === 'pending_payment' ? 'Paiement en attente' :
                           contract.status === 'pending_renewal' ? 'Renouvellement en attente' :
                           contract.status === 'cancelled' ? 'Annulé' : 'En attente'}
                        </Badge>
                      </div>
                    </Card.Header>
                    <Card.Body className="d-flex flex-column justify-content-between">
                      <div>
                        <div className="contract-id text-muted mb-2">
                          Police N° {contract.policyNumber}
                        </div>
                        
                        <div className="contract-dates d-flex justify-content-between mb-3">
                          <div className="date-item text-center">
                            <div className="date-label text-muted small">Début</div>
                            <div className="date-value fw-bold">{new Date(contract.startDate).toLocaleDateString('fr-FR')}</div>
                          </div>
                          <div className="date-separator mx-2" style={{ borderLeft: '1px solid #dee2e6', height: '40px' }}></div>
                          <div className="date-item text-center">
                            <div className="date-label text-muted small">Fin</div>
                            <div className="date-value fw-bold">{new Date(contract.endDate).toLocaleDateString('fr-FR')}</div>
                          </div>
                        </div>
                        
                        {contract.status === 'active' && (
                          <div className="remaining-days text-center mb-3">
                            {remainingDays > 0 ? (
                              <div>
                                <div className="days-number fs-3 fw-bold text-primary">{remainingDays}</div>
                                <div className="days-label text-muted small">jours restants</div>
                              </div>
                            ) : (
                              <div className="expiring-soon text-danger fw-bold">Expire aujourd'hui</div>
                            )}
                          </div>
                        )}
                        
                        <div className="premium-amount text-center mb-3">
                          <span className="amount fs-4 fw-bold text-success">{contract.premiumAmount} €</span>
                          <span className="period text-muted small">/an</span>
                        </div>
                      </div>
                      
                      <div className="contract-actions">
                        <Button 
                          variant="outline-primary" 
                          className="w-100 mb-2 rounded-pill"
                          onClick={() => handleViewDetails(contract)}
                        >
                          <MdInfo className="me-2" /> Voir les détails
                        </Button>
                        
                        {contract.status === 'expired' && (
                          <Button 
                            variant="outline-success" 
                            className="w-100 rounded-pill"
                            onClick={() => handlePrepareRenewal(contract)}
                            disabled={renewalLoading}
                          >
                            {renewalLoading ? (
                              <>
                                <Spinner as="span" animation="border" size="sm" className="me-2" />
                                Traitement...
                              </>
                            ) : (
                              <>
                                <MdAutorenew className="me-2" /> Renouveler
                              </>
                            )}
                          </Button>
                        )}
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
            <Modal.Header 
              closeButton 
              style={{ 
                background: `linear-gradient(45deg, ${getPolicyColor(selectedContract.policyType)}, ${getPolicyColor(selectedContract.policyType)}dd)`, 
                borderRadius: '15px 15px 0 0' 
              }}
            >
              <Modal.Title className="modal-title text-white">Détails du contrat - {selectedContract.policyType.toUpperCase()}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row>
                <Col md={6} className="mb-3">
                  <h5 className="fw-bold">Informations générales</h5>
                  <p className="mb-2"><strong>Numéro de police:</strong> {selectedContract.policyNumber}</p>
                  <p className="mb-2"><strong>Type:</strong> {selectedContract.policyType}</p>
                  <p className="mb-2"><strong>Statut:</strong> <Badge bg={getStatusVariant(selectedContract.status)} className="fs-6">{selectedContract.status === 'active' ? 'Actif' : selectedContract.status === 'expired' ? 'Expiré' : selectedContract.status === 'pending_payment' ? 'Paiement en attente' : selectedContract.status === 'pending_renewal' ? 'Renouvellement en attente' : selectedContract.status === 'cancelled' ? 'Annulé' : 'En attente'}</Badge></p>
                  <p><strong>Prime annuelle:</strong> <span className="text-success fw-bold">{selectedContract.premiumAmount} €</span></p>
                </Col>
                <Col md={6} className="mb-3">
                  <h5 className="fw-bold">Période de couverture</h5>
                  <p className="mb-2"><strong>Date de début:</strong> {new Date(selectedContract.startDate).toLocaleDateString('fr-FR')}</p>
                  <p className="mb-2"><strong>Date de fin:</strong> {new Date(selectedContract.endDate).toLocaleDateString('fr-FR')}</p>
                  {selectedContract.status === 'active' && (
                    <p><strong>Jours restants:</strong> <span className="text-primary fw-bold">{getRemainingDays(selectedContract.endDate)}</span></p>
                  )}
                </Col>
              </Row>
              
              <hr className="my-4"/>
              
              <h5 className="fw-bold">Détails de couverture</h5>
              <p className="coverage-details text-muted">{selectedContract.coverageDetails}</p>
              
              {selectedContract.policyDetails && Object.keys(selectedContract.policyDetails).length > 0 && (
                <>
                  <hr className="my-4"/>
                  <h5 className="fw-bold">Détails spécifiques</h5>
                  <Row>
                    {selectedContract.policyType === 'santé' && (
                      <Col md={12}>
                        {selectedContract.policyDetails.maladiesPreexistantes && (
                          <p className="mb-2"><strong>Maladies préexistantes:</strong> {selectedContract.policyDetails.maladiesPreexistantes}</p>
                        )}
                        <p className="mb-2"><strong>Fumeur:</strong> {selectedContract.policyDetails.fumeur ? 'Oui' : 'Non'}</p>
                        {selectedContract.policyDetails.traitementsActuels && (
                          <p><strong>Traitements actuels:</strong> {selectedContract.policyDetails.traitementsActuels}</p>
                        )}
                      </Col>
                    )}
                    {selectedContract.policyType === 'voyage' && (
                      <Col md={12}>
                        <p className="mb-2"><strong>Destination:</strong> {selectedContract.policyDetails.destination}</p>
                        <p className="mb-2"><strong>Date de départ:</strong> {selectedContract.policyDetails.departureDate && new Date(selectedContract.policyDetails.departureDate).toLocaleDateString('fr-FR')}</p>
                        <p><strong>Date de retour:</strong> {selectedContract.policyDetails.returnDate && new Date(selectedContract.policyDetails.returnDate).toLocaleDateString('fr-FR')}</p>
                      </Col>
                    )}
                    {selectedContract.policyType === 'automobile' && (
                      <Col md={12}>
                        <p className="mb-2"><strong>Modèle de voiture:</strong> {selectedContract.policyDetails.carModel}</p>
                        <p className="mb-2"><strong>Numéro d'immatriculation:</strong> {selectedContract.policyDetails.registrationNumber}</p>
                        <p><strong>Usage:</strong> {selectedContract.policyDetails.usage}</p>
                      </Col>
                    )}
                    {selectedContract.policyType === 'responsabilité civile' && (
                      <Col md={12}>
                        <p className="mb-2"><strong>Activités couvertes:</strong> {selectedContract.policyDetails.coveredActivities}</p>
                        <p><strong>Limite de couverture:</strong> {selectedContract.policyDetails.coverageLimit} €</p>
                      </Col>
                    )}
                    {selectedContract.policyType === 'habitation' && (
                      <Col md={12}>
                        <p className="mb-2"><strong>Type de logement:</strong> {selectedContract.policyDetails.homeType}</p>
                        <p className="mb-2"><strong>Emplacement:</strong> {selectedContract.policyDetails.location}</p>
                        <p><strong>Système d'alarme:</strong> {selectedContract.policyDetails.alarmSystem ? 'Oui' : 'Non'}</p>
                      </Col>
                    )}
                    {selectedContract.policyType === 'professionnelle' && (
                      <Col md={12}>
                        <p className="mb-2"><strong>Profession:</strong> {selectedContract.policyDetails.profession}</p>
                        <p className="mb-2"><strong>Revenu annuel:</strong> {selectedContract.policyDetails.annualRevenue} €</p>
                        <p><strong>Nombre d'employés:</strong> {selectedContract.policyDetails.employeeCount}</p>
                      </Col>
                    )}
                    {selectedContract.policyType === 'transport' && (
                      <Col md={12}>
                        <p className="mb-2"><strong>Type de transport:</strong> {selectedContract.policyDetails.transportType}</p>
                        <p><strong>Valeur des biens:</strong> {selectedContract.policyDetails.goodsValue} €</p>
                      </Col>
                    )}
                  </Row>
                </>
              )}
              
              {selectedContract.claims && selectedContract.claims.length > 0 && (
                <>
                  <hr className="my-4"/>
                  <h5 className="fw-bold">Sinistres associés</h5>
                  <ul className="list-unstyled">
                    {selectedContract.claims.map((claim, index) => (
                      <li key={index} className="border-bottom pb-2 mb-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted">Sinistre #{claim}</span>
                          <Button 
                            variant="link" 
                            size="sm"
                            className="p-0"
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
            <Modal.Footer className="d-flex flex-column flex-md-row justify-content-between bg-light">
              {downloadMessage && (
                <Alert variant={downloadMessageType === 'success' ? 'success' : 'danger'} className="w-100 mb-2 rounded-pill">
                  {downloadMessage}
                </Alert>
              )}
              <Button variant="outline-secondary" onClick={handleCloseModal} className="mb-2 mb-md-0 rounded-pill">
                Fermer
              </Button>
              <div className="d-flex flex-column flex-md-row gap-2">
                <Button 
                  variant="primary" 
                  className="d-flex align-items-center rounded-pill"
                  onClick={() => handleDownloadContract(selectedContract)}
                >
                  <MdFileDownload className="me-2" /> Télécharger
                </Button>
                
                {selectedContract.status === 'active' && (
                  <Button 
                    variant="outline-secondary" 
                    className="d-flex align-items-center rounded-pill"
                    onClick={() => handleEditContract(selectedContract)}
                  >
                    <MdEdit className="me-2" /> Modifier
                  </Button>
                )}
                
                {selectedContract.status === 'expired' && (
                  <Button 
                    variant="success" 
                    className="d-flex align-items-center rounded-pill"
                    onClick={() => handlePrepareRenewal(selectedContract)}
                    disabled={renewalLoading}
                  >
                    {renewalLoading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <MdAutorenew className="me-2" /> Renouveler
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* Renewal Confirmation Modal */}
      <Modal 
        show={renewalModalShow} 
        onHide={() => setRenewalModalShow(false)} 
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Confirmer le renouvellement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {renewalError && (
            <Alert variant="danger" className="mb-3 rounded-pill">
              {renewalError}
            </Alert>
          )}
          
          {renewalSuccess ? (
            <Alert variant="success" className="rounded-pill">
              <Alert.Heading className="fs-5">Succès!</Alert.Heading>
              <p>Votre contrat a été renouvelé avec succès! Vous pouvez maintenant le voir dans votre liste de contrats.</p>
            </Alert>
          ) : contractToRenew && (
            <>
              <h5 className="fw-bold">Détails du renouvellement</h5>
              
              <Row className="mb-3">
                <Col md={6}>
                  <p className="mb-2"><strong>Type de contrat:</strong> {contractToRenew.policyType}</p>
                  <p className="mb-2"><strong>Ancienne date de fin:</strong> {new Date(contractToRenew.endDate).toLocaleDateString('fr-FR')}</p>
                  <p><strong>Ancienne prime:</strong> <span className="text-success">{contractToRenew.premiumAmount} €</span></p>
                </Col>
                <Col md={6}>
                  <p className="mb-2"><strong>Nouvelle prime:</strong> <span className="text-success">{contractToRenew.renewalData?.renewalPremium} €</span></p>
                  <p className="mb-2"><strong>Nouvelle date de fin:</strong> {calculateNewEndDate(contractToRenew.endDate)}</p>
                  <p><strong>Augmentation:</strong> {((contractToRenew.renewalData?.renewalPremium || 0) - contractToRenew.premiumAmount).toFixed(2)} € ({(((contractToRenew.renewalData?.renewalPremium || 0) / contractToRenew.premiumAmount - 1) * 100).toFixed(1)}%)</p>
                </Col>
              </Row>
              
              <h5 className="mt-4 fw-bold">Nouvelle couverture</h5>
              <p className="text-muted">{contractToRenew.renewalData?.renewalCoverage || contractToRenew.coverageDetails}</p>
              
              {contractToRenew.renewalData?.renewalPolicyDetails && Object.keys(contractToRenew.renewalData.renewalPolicyDetails).length > 0 && (
                <>
                  <h5 className="mt-4 fw-bold">Modifications des conditions</h5>
                  <div className="border p-3 rounded bg-light">
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                      {JSON.stringify(contractToRenew.renewalData.renewalPolicyDetails, null, 2)}
                    </pre>
                  </div>
                </>
              )}
              
              <Alert variant="info" className="mt-4 rounded-pill">
                <Alert.Heading className="fs-6">Information</Alert.Heading>
                <p>Le renouvellement sera effectué avec une carte de test pour cette démonstration.</p>
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setRenewalModalShow(false)}
            disabled={renewalLoading}
            className="rounded-pill"
          >
            Annuler
          </Button>
          <Button 
            variant="primary" 
            onClick={handleExecuteRenewal}
            disabled={renewalLoading || renewalSuccess}
            className="rounded-pill"
          >
            {renewalLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Traitement...
              </>
            ) : (
              'Confirmer le renouvellement'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Assurance Cache */}
      {activeContracts.length > 0 && (
        <div className="assurance-cache fixed-bottom bg-white shadow-lg p-3" style={{ width: '100%', zIndex: 1000 }}>
          <Container>
            <Row className="align-items-center">
              <Col md={4} className="text-center">
                <h6 className="mb-0 fw-bold text-primary">Contrats Actifs</h6>
                <p className="mb-0 text-muted">{activeContracts.length}</p>
              </Col>
              <Col md={4} className="text-center">
                <h6 className="mb-0 fw-bold text-success">Prime Totale</h6>
                <p className="mb-0 text-muted">{totalPremium.toFixed(2)} €/an</p>
              </Col>
              <Col md={4} className="text-center">
                <h6 className="mb-0 fw-bold text-info">Types de Couverture</h6>
                <p className="mb-0 text-muted">{totalCoverageTypes}</p>
              </Col>
            </Row>
          </Container>
        </div>
      )}
      <ChatBot isAuthenticated={true} initialMessages={[]} />
    </>
  );
};

export default MesContrats;