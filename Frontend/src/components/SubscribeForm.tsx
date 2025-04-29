import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PolicyType from '../pages/PolicyTypes';
import './SubscribeForm.css';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

// Policy type interfaces - keeping all existing interfaces the same
interface SanteDetails {
  maladiesPreexistantes: string;
  fumeur: boolean;
  traitementsActuels: string;
  groupeSanguin: string;
}

interface VoyageDetails {
  destination: string;
  dureeEnJours: number;
  activitesAHautRisque: boolean;
  nombreDeVoyageurs: number;
}

interface AutomobileDetails {
  marqueModele: string;
  annee: number;
  numeroDImmatriculation: string;
  usageProfessionnel: boolean;
}

interface ResponsabiliteCivileDetails {
  activitesCouvertes: string;
  limiteDeCouverture: number;
  nombreDePersonnes: number;
}

interface HabitationDetails {
  typeLogement: string;
  adresse: string;
  systemeAlarme: boolean;
  valeurContenu: number;
}

interface ProfessionnelleDetails {
  profession: string;
  chiffreAffaires: number;
  nombreEmployes: number;
  secteurActivite: string;
}

interface TransportDetails {
  typeMarchandise: string;
  valeurDeclaree: number;
  destination: string;
  modeDExpedition: string;
  securiteSupplementaire: boolean;
}

type PolicyTypeValue =
  | 'santé'
  | 'voyage'
  | 'automobile'
  | 'responsabilité civile'
  | 'habitation'
  | 'professionnelle'
  | 'transport';

type PolicyDetails =
  | SanteDetails
  | VoyageDetails
  | AutomobileDetails
  | ResponsabiliteCivileDetails
  | HabitationDetails
  | ProfessionnelleDetails
  | TransportDetails
  | Record<string, any>;

const POLICY_PREMIUMS: Record<PolicyTypeValue, number> = {
  'santé': 2000,
  'voyage': 500,
  'automobile': 1000,
  'responsabilité civile': 800,
  'habitation': 1200,
  'professionnelle': 1500,
  'transport': 1300,
};

// Default values for each policy type
const DEFAULT_POLICY_DETAILS: Record<PolicyTypeValue, PolicyDetails> = {
  'santé': {
    maladiesPreexistantes: '',
    fumeur: false,
    traitementsActuels: '',
    groupeSanguin: ''
  },
  'voyage': {
    destination: '',
    dureeEnJours: 7,
    activitesAHautRisque: false,
    nombreDeVoyageurs: 1
  },
  'automobile': {
    marqueModele: '',
    annee: new Date().getFullYear(),
    numeroDImmatriculation: '',
    usageProfessionnel: false
  },
  'responsabilité civile': {
    activitesCouvertes: '',
    limiteDeCouverture: 100000,
    nombreDePersonnes: 1
  },
  'habitation': {
    typeLogement: '',
    adresse: '',
    systemeAlarme: false,
    valeurContenu: 0
  },
  'professionnelle': {
    profession: '',
    chiffreAffaires: 0,
    nombreEmployes: 0,
    secteurActivite: ''
  },
  'transport': {
    typeMarchandise: '',
    valeurDeclaree: 0,
    destination: '',
    modeDExpedition: 'routier',
    securiteSupplementaire: false
  }
};

interface ContractFormData {
  userId?: string;
  policyType: PolicyTypeValue | '';
  startDate: string;
  endDate: string;
  premiumAmount: string;
  coverageDetails: string;
  policyDetails: PolicyDetails;
}

interface ValidationErrors {
  [key: string]: string;
}

interface SubscribeFormProps {
  existingContract?: ContractFormData;
}

const SubscribeForm: React.FC<SubscribeFormProps> = ({ existingContract }) => {
  const stripe = useStripe();
  const elements = useElements();
  const location = useLocation();
  const navigate = useNavigate();

  const [showPolicySelection, setShowPolicySelection] = useState(true);
  const [formData, setFormData] = useState<ContractFormData>({
    policyType: '',
    startDate: '',
    endDate: '',
    premiumAmount: '',
    coverageDetails: '',
    policyDetails: {},
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState('');
  // Add an option for test mode
  const [useTestMode, setUseTestMode] = useState(false);
  // Add retry counter
  const [finalizationAttempts, setFinalizationAttempts] = useState(0);
  const MAX_FINALIZATION_ATTEMPTS = 3;

  useEffect(() => {
    if (existingContract) {
      setFormData({
        ...existingContract,
        startDate: existingContract.startDate.split('T')[0],
        endDate: existingContract.endDate.split('T')[0],
        premiumAmount: existingContract.premiumAmount.toString(),
      });
      setShowPolicySelection(false);
    }
  }, [existingContract]);

  useEffect(() => {
    const fetchUserId = () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user?.id || localStorage.getItem('userId');
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');

        if (!userId || !token) {
          navigate('/signin');
          return;
        }

        setFormData(prev => ({
          ...prev,
          userId: userId.toString(),
        }));

        const state = location.state as { policyType?: PolicyTypeValue };
        if (state?.policyType) {
          handlePolicyTypeSelect(state.policyType);
        }
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/signin');
      }
    };

    fetchUserId();
  }, [location.state, navigate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePolicyDetailsChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      policyDetails: {
        ...prev.policyDetails,
        [name]: type === 'checkbox' 
          ? checked 
          : type === 'number' 
            ? parseFloat(value) || 0 
            : value,
      },
    }));
  };

  const handlePolicyTypeSelect = (type: PolicyTypeValue) => {
    // Set the default end date to 1 year from start date
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    setFormData(prev => ({
      ...prev,
      policyType: type,
      premiumAmount: POLICY_PREMIUMS[type].toString(),
      startDate: startDate,
      endDate: endDate,
      policyDetails: DEFAULT_POLICY_DETAILS[type],
    }));
    
    setShowPolicySelection(false);
  };

  // Add a toggle handler for test mode
  const toggleTestMode = () => {
    setUseTestMode(prev => !prev);
  };


  // Keep the existing renderPolicyDetailsFields function

  const renderPolicyDetailsFields = () => {
    if (!formData.policyType) return null;
  
    switch(formData.policyType) {
      case 'santé':
        return (
          <div className="policy-details-fields">
            <h3>Détails de santé</h3>
            <div className="form-group">
              <label>Maladies préexistantes</label>
              <textarea 
                name="maladiesPreexistantes" 
                value={(formData.policyDetails as SanteDetails).maladiesPreexistantes || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  name="fumeur" 
                  checked={(formData.policyDetails as SanteDetails).fumeur || false} 
                  onChange={handlePolicyDetailsChange} 
                />
                Fumeur
              </label>
            </div>
            <div className="form-group">
              <label>Traitements actuels</label>
              <textarea 
                name="traitementsActuels" 
                value={(formData.policyDetails as SanteDetails).traitementsActuels || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group">
              <label>Groupe sanguin</label>
              <select 
                name="groupeSanguin" 
                value={(formData.policyDetails as SanteDetails).groupeSanguin || ''} 
                onChange={handlePolicyDetailsChange}
              >
                <option value="">Sélectionner</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>
        );
      
      case 'voyage':
        return (
          <div className="policy-details-fields">
            <h3>Détails du voyage</h3>
            <div className="form-group">
              <label>Destination</label>
              <input 
                type="text" 
                name="destination" 
                value={(formData.policyDetails as VoyageDetails).destination || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group">
              <label>Durée en jours</label>
              <input 
                type="number" 
                name="dureeEnJours" 
                value={(formData.policyDetails as VoyageDetails).dureeEnJours || 0} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  name="activitesAHautRisque" 
                  checked={(formData.policyDetails as VoyageDetails).activitesAHautRisque || false} 
                  onChange={handlePolicyDetailsChange} 
                />
                Activités à haut risque
              </label>
            </div>
            <div className="form-group">
              <label>Nombre de voyageurs</label>
              <input 
                type="number" 
                name="nombreDeVoyageurs" 
                value={(formData.policyDetails as VoyageDetails).nombreDeVoyageurs || 1} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
          </div>
        );
      
      case 'automobile':
        return (
          <div className="policy-details-fields">
            <h3>Détails du véhicule</h3>
            <div className="form-group">
              <label>Marque et modèle</label>
              <input 
                type="text" 
                name="marqueModele" 
                value={(formData.policyDetails as AutomobileDetails).marqueModele || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group">
              <label>Année</label>
              <input 
                type="number" 
                name="annee" 
                value={(formData.policyDetails as AutomobileDetails).annee || new Date().getFullYear()} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group">
              <label>Numéro d'immatriculation</label>
              <input 
                type="text" 
                name="numeroDImmatriculation" 
                value={(formData.policyDetails as AutomobileDetails).numeroDImmatriculation || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  name="usageProfessionnel" 
                  checked={(formData.policyDetails as AutomobileDetails).usageProfessionnel || false} 
                  onChange={handlePolicyDetailsChange} 
                />
                Usage professionnel
              </label>
            </div>
          </div>
        );
      
      case 'responsabilité civile':
        return (
          <div className="policy-details-fields">
            <h3>Détails de responsabilité civile</h3>
            <div className="form-group">
              <label>Activités couvertes</label>
              <textarea 
                name="activitesCouvertes" 
                value={(formData.policyDetails as ResponsabiliteCivileDetails).activitesCouvertes || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group">
              <label>Limite de couverture (€)</label>
              <input 
                type="number" 
                name="limiteDeCouverture" 
                value={(formData.policyDetails as ResponsabiliteCivileDetails).limiteDeCouverture || 100000} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group">
              <label>Nombre de personnes couvertes</label>
              <input 
                type="number" 
                name="nombreDePersonnes" 
                value={(formData.policyDetails as ResponsabiliteCivileDetails).nombreDePersonnes || 1} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
          </div>
        );
      
      case 'habitation':
        return (
          <div className="policy-details-fields">
            <h3>Détails du logement</h3>
            <div className="form-group">
              <label>Type de logement</label>
              <select 
                name="typeLogement" 
                value={(formData.policyDetails as HabitationDetails).typeLogement || ''} 
                onChange={handlePolicyDetailsChange}
              >
                <option value="">Sélectionner</option>
                <option value="appartement">Appartement</option>
                <option value="maison">Maison</option>
                <option value="studio">Studio</option>
                <option value="loft">Loft</option>
              </select>
            </div>
            <div className="form-group">
              <label>Adresse</label>
              <textarea 
                name="adresse" 
                value={(formData.policyDetails as HabitationDetails).adresse || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  name="systemeAlarme" 
                  checked={(formData.policyDetails as HabitationDetails).systemeAlarme || false} 
                  onChange={handlePolicyDetailsChange} 
                />
                Système d'alarme
              </label>
            </div>
            <div className="form-group">
              <label>Valeur du contenu (€)</label>
              <input 
                type="number" 
                name="valeurContenu" 
                value={(formData.policyDetails as HabitationDetails).valeurContenu || 0} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
          </div>
        );
      
      case 'professionnelle':
        return (
          <div className="policy-details-fields">
            <h3>Détails professionnels</h3>
            <div className="form-group">
              <label>Profession</label>
              <input 
                type="text" 
                name="profession" 
                value={(formData.policyDetails as ProfessionnelleDetails).profession || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group">
              <label>Chiffre d'affaires annuel (€)</label>
              <input 
                type="number" 
                name="chiffreAffaires" 
                value={(formData.policyDetails as ProfessionnelleDetails).chiffreAffaires || 0} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group">
              <label>Nombre d'employés</label>
              <input 
                type="number" 
                name="nombreEmployes" 
                value={(formData.policyDetails as ProfessionnelleDetails).nombreEmployes || 0} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group">
              <label>Secteur d'activité</label>
              <input 
                type="text" 
                name="secteurActivite" 
                value={(formData.policyDetails as ProfessionnelleDetails).secteurActivite || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
          </div>
        );
      
      case 'transport':
        return (
          <div className="policy-details-fields">
            <h3>Détails du transport</h3>
            <div className="form-group">
              <label>Type de marchandise</label>
              <input 
                type="text" 
                name="typeMarchandise" 
                value={(formData.policyDetails as TransportDetails).typeMarchandise || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group">
              <label>Valeur déclarée (€)</label>
              <input 
                type="number" 
                name="valeurDeclaree" 
                value={(formData.policyDetails as TransportDetails).valeurDeclaree || 0} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group">
              <label>Destination</label>
              <input 
                type="text" 
                name="destination" 
                value={(formData.policyDetails as TransportDetails).destination || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group">
              <label>Mode d'expédition</label>
              <select 
                name="modeDExpedition" 
                value={(formData.policyDetails as TransportDetails).modeDExpedition || 'routier'} 
                onChange={handlePolicyDetailsChange}
              >
                <option value="routier">Transport routier</option>
                <option value="maritime">Transport maritime</option>
                <option value="aerien">Transport aérien</option>
                <option value="ferroviaire">Transport ferroviaire</option>
                <option value="multimodal">Transport multimodal</option>
              </select>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  name="securiteSupplementaire" 
                  checked={(formData.policyDetails as TransportDetails).securiteSupplementaire || false} 
                  onChange={handlePolicyDetailsChange} 
                />
                Sécurité supplémentaire
              </label>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Update the handleSubmit function to work with the new backend:
  // Helper function to check contract status
  const checkContractStatus = async (token: string, paymentIntentId: string): Promise<boolean> => {
    try {
      console.log('Checking for existing contracts...');
      const userContractsResponse = await axios.get(
        `http://localhost:5000/api/contracts/${formData.userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      console.log('User contracts received:', userContractsResponse.data.length);
      
      const matchingContract = userContractsResponse.data.find(
        (contract: any) => contract.paymentIntentId === paymentIntentId
      );
      
      if (matchingContract) {
        console.log('Found matching contract:', matchingContract);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking contract status:', error);
      return false;
    }
  };

  // Helper function to finalize contract
  const finalizeContract = async (token: string, paymentIntentId: string): Promise<boolean> => {
    try {
      console.log('Making finalize-payment request...');
      // Send more information that might be needed by the backend
      const finalizeResponse = await axios.post(
        'http://localhost:5000/api/contracts/finalize-payment',
        { 
          paymentIntentId,
          userId: formData.userId,
          policyType: formData.policyType
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Finalize response:', finalizeResponse.data);
      return finalizeResponse.data.success || !!finalizeResponse.data.contract;
    } catch (error: any) {
      // Log more detailed error information
      console.error('Error finalizing contract:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      }
      return false;
    }
  };

  // Update the handleSubmit function to work with the new backend:
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setMessage('');
    setMessageType('');
    setFinalizationAttempts(0);
  
    // Log initial state
    console.log('=== Form Submission Started ===');
    console.log('Form Data:', formData);
    console.log('Use Test Mode:', useTestMode);
  
    // Validate form
    const validationErrors: ValidationErrors = {};
    if (!formData.userId) validationErrors.userId = "L'ID utilisateur est requis";
    if (!formData.policyType) validationErrors.policyType = "Le type de police est requis";
    if (!formData.startDate) validationErrors.startDate = "La date de début est requise";
    if (!formData.endDate) validationErrors.endDate = "La date de fin est requise";
    if (!formData.coverageDetails) validationErrors.coverageDetails = "Les détails de couverture sont requis";
  
    if (Object.keys(validationErrors).length > 0) {
      console.log('Validation errors:', validationErrors);
      setErrors(validationErrors);
      setIsProcessing(false);
      return;
    }
  
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
  
      // Log token (be careful with this in production)
      console.log('Auth token found:', token.substring(0, 10) + '...');
  
      let apiUrl = 'http://localhost:5000/api/contracts/subscribe';
      let requestParams = {
        ...formData,
        premiumAmount: Number(formData.premiumAmount),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };
      
      // Log request parameters
      console.log('Request params:', requestParams);
      
      if (useTestMode) {
        apiUrl += '?testing=true';
        console.log('Using test mode endpoint:', apiUrl);
      }
      
      setMessage("Création de la demande de paiement...");
      
      console.log('Making initial subscription request to:', apiUrl);
      const response = await axios.post(
        apiUrl,
        requestParams,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Subscription response:', response.data);
  
      if (useTestMode) {
        if (response.data.contract) {
          console.log('Test mode contract created successfully');
          setIsProcessing(false);
          setMessage("Contrat créé avec succès en mode test ! Un email de confirmation vous a été envoyé.");
          setMessageType('success');
          setTimeout(() => {
            navigate('/mes-contrats');
          }, 3000);
          return;
        }
      }
      
      const { clientSecret, paymentIntentId } = response.data;
      setPaymentIntentId(paymentIntentId);
      
      console.log('Received clientSecret and paymentIntentId:', { clientSecret, paymentIntentId });
      setMessage("Traitement du paiement...");
      
      if (!stripe || !elements) {
        console.error('Stripe not initialized');
        setMessage("Stripe n'est pas initialisé");
        setMessageType('error');
        setIsProcessing(false);
        return;
      }
      
      console.log('Confirming card payment with Stripe...');
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: 'Client',
          },
        }
      });
  
      if (error) {
        console.error('Stripe payment error:', error);
        throw new Error(error.message);
      }
  
      console.log('Payment intent status:', paymentIntent.status);
      if (paymentIntent.status === 'succeeded') {
        setMessage("Paiement réussi ! Vérification du contrat...");
        
        // Check if contract already exists first
        const contractExists = await checkContractStatus(token, paymentIntent.id);
        
        if (contractExists) {
          console.log('Contract already exists for payment intent:', paymentIntent.id);
          setMessage("Contrat créé avec succès ! Un email de confirmation vous a été envoyé.");
          setMessageType('success');
          setTimeout(() => {
            navigate('/mes-contrats');
          }, 3000);
          return;
        }
        
        // Implement retry logic for contract finalization
        const attemptFinalization = async (): Promise<boolean> => {
          setMessage(`Finalisation du contrat... (tentative ${finalizationAttempts + 1}/${MAX_FINALIZATION_ATTEMPTS})`);
          
          // Add an artificial delay to give backend time to process
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if contract already exists first (it might have been created in the meantime)
          const contractNowExists = await checkContractStatus(token, paymentIntent.id);
          if (contractNowExists) {
            return true;
          }
          
          // If not, try to create it
          return await finalizeContract(token, paymentIntent.id);
        };
        
        // Start finalization attempts
        let finalizationSuccess = false;
        let attempts = 0;
        
        while (!finalizationSuccess && attempts < MAX_FINALIZATION_ATTEMPTS) {
          setFinalizationAttempts(attempts + 1);
          finalizationSuccess = await attemptFinalization();
          attempts++;
          
          if (finalizationSuccess) {
            console.log(`Contract finalized successfully on attempt ${attempts}`);
            break;
          } else if (attempts < MAX_FINALIZATION_ATTEMPTS) {
            console.log(`Finalization attempt ${attempts} failed, retrying...`);
            // Wait longer between each retry
            await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
          }
        }
        
        if (finalizationSuccess) {
          setMessage("Contrat créé avec succès ! Un email de confirmation vous a été envoyé.");
          setMessageType('success');
          setTimeout(() => {
            navigate('/mes-contrats');
          }, 3000);
        } else {
          // If all finalization attempts failed but payment succeeded, 
          // instruct user to contact support with payment ID
          setMessage(`Paiement réussi mais nous n'avons pas pu finaliser votre contrat automatiquement. Veuillez contacter le support avec votre ID de paiement: ${paymentIntent.id}`);
          setMessageType('error');
        }
      } else {
        throw new Error("Le statut du paiement est: " + paymentIntent.status);
      }
    } catch (error: any) {
      console.error('Global error handler:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      setIsProcessing(false);
      setMessage(error.response?.data?.message || error.message || "Une erreur s'est produite");
      setMessageType('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToSelection = () => {
    setShowPolicySelection(true);
  };

  if (showPolicySelection) {
    return <PolicyType onSelectPolicyType={handlePolicyTypeSelect} standalone={false} />;
  }

  return (
    <div className="subscribe-form-container">
      <h2>Formulaire de souscription - {formData.policyType}</h2>
      <button className="back-button" onClick={handleBackToSelection}>Changer le type</button>

      <form onSubmit={handleSubmit} className="subscribe-form">
        <input type="hidden" name="userId" value={formData.userId || ''} />

        <div className="form-group">
          <label>Date de début</label>
          <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} />
          {errors.startDate && <span className="error">{errors.startDate}</span>}
        </div>

        <div className="form-group">
          <label>Date de fin</label>
          <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} />
          {errors.endDate && <span className="error">{errors.endDate}</span>}
        </div>

        <div className="form-group">
          <label>Montant de la prime (€)</label>
          <input type="number" name="premiumAmount" value={formData.premiumAmount} readOnly />
        </div>

        <div className="form-group">
          <label>Détails de couverture</label>
          <textarea name="coverageDetails" value={formData.coverageDetails} onChange={handleChange} placeholder="Décrivez les détails de couverture souhaités..." />
          {errors.coverageDetails && <span className="error">{errors.coverageDetails}</span>}
        </div>

        {renderPolicyDetailsFields()}

        {/* Add a toggle for test mode */}
        <div className="form-group checkbox-group">
          <label>
            <input 
              type="checkbox" 
              checked={useTestMode} 
              onChange={toggleTestMode} 
            />
            Utiliser le mode test (carte de test automatique)
          </label>
        </div>

        {/* Only show card element if not using test mode */}
        {!useTestMode && (
          <div className="form-group">
            <label>Détails de paiement</label>
            <div className="card-element-container">
              <CardElement 
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="payment-processing">
            <div className="spinner"></div>
            <p>{message || "Veuillez patienter pendant le traitement de votre demande..."}</p>
          </div>
        )}

        {!isProcessing && message && (
          <p className={`message ${messageType === 'success' ? 'success-message' : messageType === 'error' ? 'error-message' : ''}`}>
            {message}
          </p>
        )}
        
        <button type="submit" className="submit-but" disabled={isProcessing || (!useTestMode && !stripe)}>
          {isProcessing ? 'Traitement en cours...' : 'Souscrire et payer'}
        </button>
      </form>
    </div>
  );
};

export default SubscribeForm;