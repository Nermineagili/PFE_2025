import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button, Modal } from 'react-bootstrap';
import { useAuth } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import { MdAssignment, MdFileDownload, MdInfo, MdAutorenew, MdEdit } from 'react-icons/md';
import CustomNavbar from '../components/navbar';
import { jsPDF } from 'jspdf';
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
}

const MesContrats: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [renewalModalShow, setRenewalModalShow] = useState(false);
  const [contractToRenew, setContractToRenew] = useState<Contract | null>(null);
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [renewalError, setRenewalError] = useState('');
  const [renewalSuccess, setRenewalSuccess] = useState(false);

  // Get policy color based on type
  const getPolicyColor = (type: string) => {
    const colors: {[key: string]: string} = {
      'santé': 'success',
      'voyage': 'primary',
      'automobile': 'danger',
      'responsabilité civile': 'warning',
      'habitation': 'info',
      'professionnelle': 'dark',
      'transport': 'secondary'
    };
    return colors[type] || 'secondary';
  };

  // Get status badge variant
  const getStatusVariant = (status: string | undefined) => {
    const variants: Record<string, string> = {
      'active': 'success',
      'expired': 'danger',
      'pending': 'warning',
      'pending_payment': 'warning',
      'cancelled': 'secondary',
      'pending_renewal': 'info'
    };
    return variants[status || ''] || 'secondary';
  };
  // Get remaining days
  const getRemainingDays = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate new end date for renewal
  const calculateNewEndDate = (endDate: string): string => {
    const endDateObj = new Date(endDate);
    endDateObj.setFullYear(endDateObj.getFullYear() + 1);
    return endDateObj.toLocaleDateString('fr-FR');
  };

  const handleDownloadContract = async (contract: Contract) => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('CONTRAT D\'ASSURANCE', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Type: ${contract.policyType}`, 20, 40);
      doc.text(`Numéro de police: ${contract.policyNumber}`, 20, 50);
      doc.text(`Statut: ${contract.status === 'active' ? 'Actif' : contract.status === 'expired' ? 'Expiré' : 'En attente'}`, 20, 60);
      doc.text(`Date de début: ${new Date(contract.startDate).toLocaleDateString('fr-FR')}`, 20, 70);
      doc.text(`Date de fin: ${new Date(contract.endDate).toLocaleDateString('fr-FR')}`, 20, 80);
      doc.text(`Prime annuelle: ${contract.premiumAmount} dt`, 20, 90);
      
      doc.text('Détails de couverture:', 20, 110);
      const splitText = doc.splitTextToSize(contract.coverageDetails, 170);
      doc.text(splitText, 20, 120);
      
      doc.save(`Contrat_${contract.policyType}_${contract.policyNumber}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Une erreur est survenue lors de la génération du contrat.');
    }
  };

  const handleViewDetails = (contract: Contract) => {
    setSelectedContract(contract);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
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
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to prepare renewal');
      }
  
      setContractToRenew({
        ...contract,
        renewalData: response.data.renewalData
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
        { paymentMethodId: 'pm_card_visa' }, // Test card
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setRenewalSuccess(true);
      fetchContracts();
      
      // Close the renewal modal after 2 seconds on success
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
  
      // Add showArchived parameter to the API call
      const response = await axios.get(`http://localhost:5000/api/contracts/${user._id}`, {
        params: { showArchived },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Process contracts with proper status handling
      const contractsWithStatus = response.data
        .filter((contract: Contract) => showArchived || contract.status !== 'archived')
        .map((contract: Contract) => {
          // Determine status with priority:
          // 1. Existing status if present
          // 2. 'archived' if replacedBy exists
          // 3. Calculated based on dates
          let status = contract.status;
          
          if (!status) {
            if (contract.replacedBy) {
              status = 'archived';
            } else {
              const endDate = new Date(contract.endDate);
              const today = new Date();
              status = today > endDate ? 'expired' : 'active';
            }
          }
  
          return {
            ...contract,
            status,
            // Generate policy number if missing
            policyNumber: contract.policyNumber || `POL-${Math.floor(100000 + Math.random() * 900000)}`,
            // Format dates for consistent display
            formattedStartDate: new Date(contract.startDate).toLocaleDateString('fr-FR'),
            formattedEndDate: new Date(contract.endDate).toLocaleDateString('fr-FR')
          };
        })
        // Sort by status: active first, then expired, then archived
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

  // Handle editing a contract
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

  return (
    <>
      <CustomNavbar />
      <Container className="mc-container" style={{ marginTop: '70px' }}>
  <Row className="mb-4">
    <Col>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
        <h2 className="mc-page-title mb-3 mb-md-0"></h2>
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
                           contract.status === 'expired' ? 'Expiré' : 
                           contract.status === 'pending_payment' ? 'Paiement en attente' :
                           contract.status === 'pending_renewal' ? 'Renouvellement en attente' :
                           contract.status === 'cancelled' ? 'Annulé' : 'En attente'}
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
                      
                      <div className="contract-actions mt-3">
                        <Button 
                          variant="outline-primary" 
                          className="w-100 mb-2"
                          onClick={() => handleViewDetails(contract)}
                        >
                          <MdInfo className="me-2" /> Voir les détails
                        </Button>
                        
                        {contract.status === 'expired' && (
                          <Button 
                            variant="outline-success" 
                            className="w-100"
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
            <Modal.Header closeButton className={`bg-${getPolicyColor(selectedContract.policyType)} text-white`}>
              <Modal.Title className="modal-title">Détails du contrat - {selectedContract.policyType.toUpperCase()}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row>
                <Col md={6} className="mb-3">
                  <h5>Informations générales</h5>
                  <p><strong>Numéro de police:</strong> {selectedContract.policyNumber}</p>
                  <p><strong>Type:</strong> {selectedContract.policyType}</p>
                  <p><strong>Statut:</strong>// Example in your modal
<Badge bg={getStatusVariant(selectedContract.status)}>
  {selectedContract.status === 'active' ? 'Actif' : 
   selectedContract.status === 'expired' ? 'Expiré' : 
   selectedContract.status === 'pending_payment' ? 'Paiement en attente' :
   selectedContract.status === 'pending_renewal' ? 'Renouvellement en attente' :
   selectedContract.status === 'cancelled' ? 'Annulé' : 'En attente'}
</Badge></p>
                  <p><strong>Prime annuelle:</strong> {selectedContract.premiumAmount} dt</p>
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
              
              {/* Policy-specific details */}
              {selectedContract.policyDetails && Object.keys(selectedContract.policyDetails).length > 0 && (
                <>
                  <hr/>
                  <h5>Détails spécifiques</h5>
                  <Row>
                    {selectedContract.policyType === 'santé' && (
                      <Col md={12}>
                        {selectedContract.policyDetails.maladiesPreexistantes && (
                          <p><strong>Maladies préexistantes:</strong> {selectedContract.policyDetails.maladiesPreexistantes}</p>
                        )}
                        <p><strong>Fumeur:</strong> {selectedContract.policyDetails.fumeur ? 'Oui' : 'Non'}</p>
                        {selectedContract.policyDetails.traitementsActuels && (
                          <p><strong>Traitements actuels:</strong> {selectedContract.policyDetails.traitementsActuels}</p>
                        )}
                      </Col>
                    )}
                    
                    {selectedContract.policyType === 'voyage' && (
                      <Col md={12}>
                        <p><strong>Destination:</strong> {selectedContract.policyDetails.destination}</p>
                        <p><strong>Date de départ:</strong> {selectedContract.policyDetails.departureDate && new Date(selectedContract.policyDetails.departureDate).toLocaleDateString('fr-FR')}</p>
                        <p><strong>Date de retour:</strong> {selectedContract.policyDetails.returnDate && new Date(selectedContract.policyDetails.returnDate).toLocaleDateString('fr-FR')}</p>
                      </Col>
                    )}
                    
                    {selectedContract.policyType === 'automobile' && (
                      <Col md={12}>
                        <p><strong>Modèle de voiture:</strong> {selectedContract.policyDetails.carModel}</p>
                        <p><strong>Numéro d'immatriculation:</strong> {selectedContract.policyDetails.registrationNumber}</p>
                        <p><strong>Usage:</strong> {selectedContract.policyDetails.usage}</p>
                      </Col>
                    )}
                    
                    {selectedContract.policyType === 'responsabilité civile' && (
                      <Col md={12}>
                        <p><strong>Activités couvertes:</strong> {selectedContract.policyDetails.coveredActivities}</p>
                        <p><strong>Limite de couverture:</strong> {selectedContract.policyDetails.coverageLimit} dt</p>
                      </Col>
                    )}
                    
                    {selectedContract.policyType === 'habitation' && (
                      <Col md={12}>
                        <p><strong>Type de logement:</strong> {selectedContract.policyDetails.homeType}</p>
                        <p><strong>Emplacement:</strong> {selectedContract.policyDetails.location}</p>
                        <p><strong>Système d'alarme:</strong> {selectedContract.policyDetails.alarmSystem ? 'Oui' : 'Non'}</p>
                      </Col>
                    )}
                    
                    {selectedContract.policyType === 'professionnelle' && (
                      <Col md={12}>
                        <p><strong>Profession:</strong> {selectedContract.policyDetails.profession}</p>
                        <p><strong>Revenu annuel:</strong> {selectedContract.policyDetails.annualRevenue} dt</p>
                        <p><strong>Nombre d'employés:</strong> {selectedContract.policyDetails.employeeCount}</p>
                      </Col>
                    )}
                    
                    {selectedContract.policyType === 'transport' && (
                      <Col md={12}>
                        <p><strong>Type de transport:</strong> {selectedContract.policyDetails.transportType}</p>
                        <p><strong>Valeur des biens:</strong> {selectedContract.policyDetails.goodsValue} dt</p>
                      </Col>
                    )}
                  </Row>
                </>
              )}
              
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
                <Button 
                  variant="primary" 
                  className="d-flex align-items-center"
                  onClick={() => handleDownloadContract(selectedContract)}
                >
                  <MdFileDownload className="me-2" /> Télécharger
                </Button>
                
                {selectedContract.status === 'active' && (
                  <Button 
                    variant="outline-secondary" 
                    className="d-flex align-items-center"
                    onClick={() => handleEditContract(selectedContract)}
                  >
                    <MdEdit className="me-2" /> Modifier
                  </Button>
                )}
                
                {selectedContract.status === 'expired' && (
                  <Button 
                    variant="success" 
                    className="d-flex align-items-center"
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
          <Modal.Title>Confirmer le renouvellement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {renewalError && (
            <Alert variant="danger" className="mb-3">
              {renewalError}
            </Alert>
          )}
          
          {renewalSuccess ? (
            <Alert variant="success">
              <Alert.Heading>Succès!</Alert.Heading>
              <p>Votre contrat a été renouvelé avec succès! Vous pouvez maintenant le voir dans votre liste de contrats.</p>
            </Alert>
          ) : contractToRenew && (
            <>
              <h5>Détails du renouvellement</h5>
              
              <Row className="mb-3">
                <Col md={6}>
                  <p><strong>Type de contrat:</strong> {contractToRenew.policyType}</p>
                  <p><strong>Ancienne date de fin:</strong> {new Date(contractToRenew.endDate).toLocaleDateString('fr-FR')}</p>
                  <p><strong>Ancienne prime:</strong> {contractToRenew.premiumAmount} dt</p>
                </Col>
                <Col md={6}>
                  <p><strong>Nouvelle prime:</strong> {contractToRenew.renewalData?.renewalPremium} dt</p>
                  <p><strong>Nouvelle date de fin:</strong> {calculateNewEndDate(contractToRenew.endDate)}</p>
                  <p><strong>Augmentation:</strong> {((contractToRenew.renewalData?.renewalPremium || 0) - contractToRenew.premiumAmount).toFixed(2)} dt ({(((contractToRenew.renewalData?.renewalPremium || 0) / contractToRenew.premiumAmount - 1) * 100).toFixed(1)}%)</p>
                </Col>
              </Row>
              
              <h5 className="mt-4">Nouvelle couverture</h5>
              <p>{contractToRenew.renewalData?.renewalCoverage || contractToRenew.coverageDetails}</p>
              
              {contractToRenew.renewalData?.renewalPolicyDetails && Object.keys(contractToRenew.renewalData.renewalPolicyDetails).length > 0 && (
                <>
                  <h5 className="mt-4">Modifications des conditions</h5>
                  <div className="border p-3 rounded bg-light">
                    <pre style={{ whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(contractToRenew.renewalData.renewalPolicyDetails, null, 2)}
                    </pre>
                  </div>
                </>
              )}
              
              <Alert variant="info" className="mt-4">
                <Alert.Heading>Information</Alert.Heading>
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
          >
            Annuler
          </Button>
          <Button 
            variant="primary" 
            onClick={handleExecuteRenewal}
            disabled={renewalLoading || renewalSuccess}
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
      <ChatBot />
    </>
  );
};

export default MesContrats;