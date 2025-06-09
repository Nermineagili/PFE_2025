import React, { useState, ChangeEvent, FormEvent, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PolicyType from '../pages/PolicyTypes';
import './SubscribeForm.css';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import ChatBot from './ChatBot/ChatBot';
import SignaturePad from 'signature_pad';

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

const DEFAULT_POLICY_DETAILS: Record<PolicyTypeValue, PolicyDetails> = {
  'santé': { maladiesPreexistantes: '', fumeur: false, traitementsActuels: '', groupeSanguin: '' },
  'voyage': { destination: '', dureeEnJours: 7, activitesAHautRisque: false, nombreDeVoyageurs: 1 },
  'automobile': { marqueModele: '', annee: new Date().getFullYear(), numeroDImmatriculation: '', usageProfessionnel: false },
  'responsabilité civile': { activitesCouvertes: '', limiteDeCouverture: 100000, nombreDePersonnes: 1 },
  'habitation': { typeLogement: '', adresse: '', systemeAlarme: false, valeurContenu: 0 },
  'professionnelle': { profession: '', chiffreAffaires: 0, nombreEmployes: 0, secteurActivite: '' },
  'transport': { typeMarchandise: '', valeurDeclaree: 0, destination: '', modeDExpedition: 'routier', securiteSupplementaire: false },
};

interface ContractFormData {
  userId?: string;
  policyType: PolicyTypeValue | '';
  startDate: string;
  endDate: string;
  premiumAmount: string;
  coverageDetails: string;
  policyDetails: PolicyDetails;
  signature?: string;
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
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sigPadRef = useRef<SignaturePad | null>(null);

  const [showPolicySelection, setShowPolicySelection] = useState(true);
  const [formData, setFormData] = useState<ContractFormData>({
    policyType: '',
    startDate: '',
    endDate: '',
    premiumAmount: '',
    coverageDetails: '',
    policyDetails: {},
    signature: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [useTestMode, setUseTestMode] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

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

  useEffect(() => {
    if (canvasRef.current && !sigPadRef.current) {
      sigPadRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgba(0, 0, 0, 0)',
        penColor: 'rgb(0, 0, 0)',
      });
      console.log('Signature pad initialized:', sigPadRef.current);
      if (sigPadRef.current) {
        console.log('Canvas dimensions:', canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [showPolicySelection]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePolicyDetailsChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      policyDetails: {
        ...prev.policyDetails,
        [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
      },
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePolicyTypeSelect = (type: PolicyTypeValue) => {
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setFormData(prev => ({
      ...prev,
      policyType: type,
      premiumAmount: POLICY_PREMIUMS[type].toString(),
      startDate,
      endDate,
      policyDetails: DEFAULT_POLICY_DETAILS[type],
    }));

    setShowPolicySelection(false);
  };

  const toggleTestMode = () => {
    setUseTestMode(prev => !prev);
  };

  const clearSignature = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
      setFormData(prev => ({ ...prev, signature: '' }));
      setSignaturePreview(null);
      setErrors(prev => ({ ...prev, signature: '' }));
    }
  };

  const saveSignature = () => {
    if (sigPadRef.current) {
      if (sigPadRef.current.isEmpty()) {
        setErrors(prev => ({ ...prev, signature: 'Veuillez fournir une signature.' }));
        return;
      }
      const dataUrl = sigPadRef.current.toDataURL('image/png');
      setFormData(prev => ({ ...prev, signature: dataUrl }));
      setSignaturePreview(dataUrl);
      setErrors(prev => ({ ...prev, signature: '' }));
    }
  };

  const validatePolicyDetails = (): ValidationErrors => {
    const policyErrors: ValidationErrors = {};
    switch (formData.policyType) {
      case 'santé':
        const santeDetails = formData.policyDetails as SanteDetails;
        if (!santeDetails.groupeSanguin) policyErrors.groupeSanguin = 'Le groupe sanguin est requis.';
        break;
      case 'voyage':
        const voyageDetails = formData.policyDetails as VoyageDetails;
        if (!voyageDetails.destination) policyErrors.destination = 'La destination est requise.';
        if (voyageDetails.dureeEnJours <= 0) policyErrors.dureeEnJours = 'La durée doit être supérieure à 0.';
        if (voyageDetails.nombreDeVoyageurs <= 0) policyErrors.nombreDeVoyageurs = 'Le nombre de voyageurs doit être supérieur à 0.';
        break;
      case 'automobile':
        const automobileDetails = formData.policyDetails as AutomobileDetails;
        if (!automobileDetails.marqueModele) policyErrors.marqueModele = 'La marque et le modèle sont requis.';
        if (!automobileDetails.numeroDImmatriculation) policyErrors.numeroDImmatriculation = "Le numéro d'immatriculation est requis.";
        if (automobileDetails.annee < 1900 || automobileDetails.annee > new Date().getFullYear()) policyErrors.annee = 'Année invalide.';
        break;
      case 'responsabilité civile':
        const rcDetails = formData.policyDetails as ResponsabiliteCivileDetails;
        if (!rcDetails.activitesCouvertes) policyErrors.activitesCouvertes = 'Les activités couvertes sont requises.';
        if (rcDetails.limiteDeCouverture <= 0) policyErrors.limiteDeCouverture = 'La limite de couverture doit être supérieure à 0.';
        if (rcDetails.nombreDePersonnes <= 0) policyErrors.nombreDePersonnes = 'Le nombre de personnes doit être supérieur à 0.';
        break;
      case 'habitation':
        const habitationDetails = formData.policyDetails as HabitationDetails;
        if (!habitationDetails.typeLogement) policyErrors.typeLogement = 'Le type de logement est requis.';
        if (!habitationDetails.adresse) policyErrors.adresse = "L'adresse est requise.";
        if (habitationDetails.valeurContenu < 0) policyErrors.valeurContenu = 'La valeur du contenu ne peut pas être négative.';
        break;
      case 'professionnelle':
        const proDetails = formData.policyDetails as ProfessionnelleDetails;
        if (!proDetails.profession) policyErrors.profession = 'La profession est requise.';
        if (!proDetails.secteurActivite) policyErrors.secteurActivite = "Le secteur d'activité est requis.";
        if (proDetails.chiffreAffaires < 0) policyErrors.chiffreAffaires = 'Le chiffre d’affaires ne peut pas être négatif.';
        if (proDetails.nombreEmployes < 0) policyErrors.nombreEmployes = 'Le nombre d’employés ne peut pas être négatif.';
        break;
      case 'transport':
        const transportDetails = formData.policyDetails as TransportDetails;
        if (!transportDetails.typeMarchandise) policyErrors.typeMarchandise = 'Le type de marchandise est requis.';
        if (!transportDetails.destination) policyErrors.destination = 'La destination est requise.';
        if (transportDetails.valeurDeclaree < 0) policyErrors.valeurDeclaree = 'La valeur déclarée ne peut pas être négative.';
        break;
      default:
        break;
    }
    return policyErrors;
  };

  const renderPolicyDetailsFields = () => {
    if (!formData.policyType) return null;

    switch (formData.policyType) {
      case 'santé':
        return (
          <div className="policy-details-fields">
            <h3>Détails de santé</h3>
            <div className="form-group">
              <label>Maladies préexistantes</label>
              <textarea name="maladiesPreexistantes" value={(formData.policyDetails as SanteDetails).maladiesPreexistantes || ''} onChange={handlePolicyDetailsChange} />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" name="fumeur" checked={(formData.policyDetails as SanteDetails).fumeur || false} onChange={handlePolicyDetailsChange} />
                Fumeur
              </label>
            </div>
            <div className="form-group">
              <label>Traitements actuels</label>
              <textarea name="traitementsActuels" value={(formData.policyDetails as SanteDetails).traitementsActuels || ''} onChange={handlePolicyDetailsChange} />
            </div>
            <div className="form-group">
              <label>Groupe sanguin <span className="required">*</span></label>
              <select name="groupeSanguin" value={(formData.policyDetails as SanteDetails).groupeSanguin || ''} onChange={handlePolicyDetailsChange}>
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
              {errors.groupeSanguin && <span className="error">{errors.groupeSanguin}</span>}
            </div>
          </div>
        );
      case 'voyage':
        return (
          <div className="policy-details-fields">
            <h3>Détails du voyage</h3>
            <div className="form-group">
              <label>Destination <span className="required">*</span></label>
              <input type="text" name="destination" value={(formData.policyDetails as VoyageDetails).destination || ''} onChange={handlePolicyDetailsChange} />
              {errors.destination && <span className="error">{errors.destination}</span>}
            </div>
            <div className="form-group">
              <label>Durée en jours <span className="required">*</span></label>
              <input type="number" name="dureeEnJours" value={(formData.policyDetails as VoyageDetails).dureeEnJours || 0} onChange={handlePolicyDetailsChange} />
              {errors.dureeEnJours && <span className="error">{errors.dureeEnJours}</span>}
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" name="activitesAHautRisque" checked={(formData.policyDetails as VoyageDetails).activitesAHautRisque || false} onChange={handlePolicyDetailsChange} />
                Activités à haut risque
              </label>
            </div>
            <div className="form-group">
              <label>Nombre de voyageurs <span className="required">*</span></label>
              <input type="number" name="nombreDeVoyageurs" value={(formData.policyDetails as VoyageDetails).nombreDeVoyageurs || 1} onChange={handlePolicyDetailsChange} />
              {errors.nombreDeVoyageurs && <span className="error">{errors.nombreDeVoyageurs}</span>}
            </div>
          </div>
        );
      case 'automobile':
        return (
          <div className="policy-details-fields">
            <h3>Détails du véhicule</h3>
            <div className="form-group">
              <label>Marque et modèle <span className="required">*</span></label>
              <input type="text" name="marqueModele" value={(formData.policyDetails as AutomobileDetails).marqueModele || ''} onChange={handlePolicyDetailsChange} />
              {errors.marqueModele && <span className="error">{errors.marqueModele}</span>}
            </div>
            <div className="form-group">
              <label>Année <span className="required">*</span></label>
              <input type="number" name="annee" value={(formData.policyDetails as AutomobileDetails).annee || new Date().getFullYear()} onChange={handlePolicyDetailsChange} />
              {errors.annee && <span className="error">{errors.annee}</span>}
            </div>
            <div className="form-group">
              <label>Numéro d'immatriculation <span className="required">*</span></label>
              <input type="text" name="numeroDImmatriculation" value={(formData.policyDetails as AutomobileDetails).numeroDImmatriculation || ''} onChange={handlePolicyDetailsChange} />
              {errors.numeroDImmatriculation && <span className="error">{errors.numeroDImmatriculation}</span>}
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" name="usageProfessionnel" checked={(formData.policyDetails as AutomobileDetails).usageProfessionnel || false} onChange={handlePolicyDetailsChange} />
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
              <label>Activités couvertes <span className="required">*</span></label>
              <textarea name="activitesCouvertes" value={(formData.policyDetails as ResponsabiliteCivileDetails).activitesCouvertes || ''} onChange={handlePolicyDetailsChange} />
              {errors.activitesCouvertes && <span className="error">{errors.activitesCouvertes}</span>}
            </div>
            <div className="form-group">
              <label>Limite de couverture (€) <span className="required">*</span></label>
              <input type="number" name="limiteDeCouverture" value={(formData.policyDetails as ResponsabiliteCivileDetails).limiteDeCouverture || 100000} onChange={handlePolicyDetailsChange} />
              {errors.limiteDeCouverture && <span className="error">{errors.limiteDeCouverture}</span>}
            </div>
            <div className="form-group">
              <label>Nombre de personnes couvertes <span className="required">*</span></label>
              <input type="number" name="nombreDePersonnes" value={(formData.policyDetails as ResponsabiliteCivileDetails).nombreDePersonnes || 1} onChange={handlePolicyDetailsChange} />
              {errors.nombreDePersonnes && <span className="error">{errors.nombreDePersonnes}</span>}
            </div>
          </div>
        );
      case 'habitation':
        return (
          <div className="policy-details-fields">
            <h3>Détails du logement</h3>
            <div className="form-group">
              <label>Type de logement <span className="required">*</span></label>
              <select name="typeLogement" value={(formData.policyDetails as HabitationDetails).typeLogement || ''} onChange={handlePolicyDetailsChange}>
                <option value="">Sélectionner</option>
                <option value="appartement">Appartement</option>
                <option value="maison">Maison</option>
                <option value="studio">Studio</option>
                <option value="loft">Loft</option>
              </select>
              {errors.typeLogement && <span className="error">{errors.typeLogement}</span>}
            </div>
            <div className="form-group">
              <label>Adresse <span className="required">*</span></label>
              <textarea name="adresse" value={(formData.policyDetails as HabitationDetails).adresse || ''} onChange={handlePolicyDetailsChange} />
              {errors.adresse && <span className="error">{errors.adresse}</span>}
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" name="systemeAlarme" checked={(formData.policyDetails as HabitationDetails).systemeAlarme || false} onChange={handlePolicyDetailsChange} />
                Système d'alarme
              </label>
            </div>
            <div className="form-group">
              <label>Valeur du contenu (€)</label>
              <input type="number" name="valeurContenu" value={(formData.policyDetails as HabitationDetails).valeurContenu || 0} onChange={handlePolicyDetailsChange} />
              {errors.valeurContenu && <span className="error">{errors.valeurContenu}</span>}
            </div>
          </div>
        );
      case 'professionnelle':
        return (
          <div className="policy-details-fields">
            <h3>Détails professionnels</h3>
            <div className="form-group">
              <label>Profession <span className="required">*</span></label>
              <input type="text" name="profession" value={(formData.policyDetails as ProfessionnelleDetails).profession || ''} onChange={handlePolicyDetailsChange} />
              {errors.profession && <span className="error">{errors.profession}</span>}
            </div>
            <div className="form-group">
              <label>Chiffre d'affaires annuel (€)</label>
              <input type="number" name="chiffreAffaires" value={(formData.policyDetails as ProfessionnelleDetails).chiffreAffaires || 0} onChange={handlePolicyDetailsChange} />
              {errors.chiffreAffaires && <span className="error">{errors.chiffreAffaires}</span>}
            </div>
            <div className="form-group">
              <label>Nombre d'employés</label>
              <input type="number" name="nombreEmployes" value={(formData.policyDetails as ProfessionnelleDetails).nombreEmployes || 0} onChange={handlePolicyDetailsChange} />
              {errors.nombreEmployes && <span className="error">{errors.nombreEmployes}</span>}
            </div>
            <div className="form-group">
              <label>Secteur d'activité <span className="required">*</span></label>
              <input type="text" name="secteurActivite" value={(formData.policyDetails as ProfessionnelleDetails).secteurActivite || ''} onChange={handlePolicyDetailsChange} />
              {errors.secteurActivite && <span className="error">{errors.secteurActivite}</span>}
            </div>
          </div>
        );
      case 'transport':
        return (
          <div className="policy-details-fields">
            <h3>Détails du transport</h3>
            <div className="form-group">
              <label>Type de marchandise <span className="required">*</span></label>
              <input type="text" name="typeMarchandise" value={(formData.policyDetails as TransportDetails).typeMarchandise || ''} onChange={handlePolicyDetailsChange} />
              {errors.typeMarchandise && <span className="error">{errors.typeMarchandise}</span>}
            </div>
            <div className="form-group">
              <label>Valeur déclarée (€)</label>
              <input type="number" name="valeurDeclaree" value={(formData.policyDetails as TransportDetails).valeurDeclaree || 0} onChange={handlePolicyDetailsChange} />
              {errors.valeurDeclaree && <span className="error">{errors.valeurDeclaree}</span>}
            </div>
            <div className="form-group">
              <label>Destination <span className="required">*</span></label>
              <input type="text" name="destination" value={(formData.policyDetails as TransportDetails).destination || ''} onChange={handlePolicyDetailsChange} />
              {errors.destination && <span className="error">{errors.destination}</span>}
            </div>
            <div className="form-group">
              <label>Mode d'expédition</label>
              <select name="modeDExpedition" value={(formData.policyDetails as TransportDetails).modeDExpedition || 'routier'} onChange={handlePolicyDetailsChange}>
                <option value="routier">Transport routier</option>
                <option value="maritime">Transport maritime</option>
                <option value="aerien">Transport aérien</option>
                <option value="ferroviaire">Transport ferroviaire</option>
                <option value="multimodal">Transport multimodal</option>
              </select>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" name="securiteSupplementaire" checked={(formData.policyDetails as TransportDetails).securiteSupplementaire || false} onChange={handlePolicyDetailsChange} />
                Sécurité supplémentaire
              </label>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const checkContractStatus = async (token: string, paymentIntentId: string): Promise<boolean> => {
    try {
      const response = await axios.get(`http://localhost:5000/api/contracts/${formData.userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return !!response.data.find((contract: any) => contract.paymentIntentId === paymentIntentId);
    } catch (error) {
      console.error('Error checking contract status:', error);
      return false;
    }
  };

  const finalizeContract = async (token: string, paymentIntentId: string): Promise<boolean> => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/contracts/finalize-payment',
        { paymentIntentId, userId: formData.userId, policyType: formData.policyType },
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      return response.data.success || !!response.data.contract;
    } catch (error: any) {
      console.error('Error finalizing contract:', error.response?.data || error.message);
      return false;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setMessage('');
    setMessageType('');

    const validationErrors: ValidationErrors = {};
    if (!formData.userId) validationErrors.userId = "L'ID utilisateur est requis.";
    if (!formData.policyType) validationErrors.policyType = "Le type de police est requis.";
    if (!formData.startDate) validationErrors.startDate = "La date de début est requise.";
    if (!formData.endDate) validationErrors.endDate = "La date de fin est requise.";
    if (!formData.coverageDetails) validationErrors.coverageDetails = "Les détails de couverture sont requise.";
    if (!formData.signature || (sigPadRef.current && sigPadRef.current.isEmpty())) validationErrors.signature = "Une signature valide est requise.";

    const policyDetailErrors = validatePolicyDetails();
    const allErrors = { ...validationErrors, ...policyDetailErrors };

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setIsProcessing(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const apiUrl = `http://localhost:5000/api/contracts/subscribe${useTestMode ? '?testing=true' : ''}`;
      const requestParams = {
        ...formData,
        premiumAmount: Number(formData.premiumAmount),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        signature: formData.signature,
      };

      setMessage('Création du contrat en cours...');
      const response = await axios.post(apiUrl, requestParams, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (response.data.contract) {
        setPaymentIntentId(response.data.paymentIntentId);
        setMessage('Contrat créé avec succès ! Vous pouvez consulter vos contrats.');
        setMessageType('success');
        setTimeout(() => navigate('/mes-contrats'), 3000);
      } else {
        throw new Error(response.data.message || 'Erreur lors de la création du contrat');
      }
    } catch (error: any) {
      console.error('Submission error:', error.response?.data || error.message);
      setMessage(error.response?.data?.message || error.message || 'Une erreur est survenue lors de la création du contrat.');
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
          <label>Date de début <span className="required">*</span></label>
          <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} />
          {errors.startDate && <span className="error">{errors.startDate}</span>}
        </div>

        <div className="form-group">
          <label>Date de fin <span className="required">*</span></label>
          <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} />
          {errors.endDate && <span className="error">{errors.endDate}</span>}
        </div>

        <div className="form-group">
          <label>Montant de la prime (€)</label>
          <input type="number" name="premiumAmount" value={formData.premiumAmount} readOnly />
        </div>

        <div className="form-group">
          <label>Détails de couverture <span className="required">*</span></label>
          <textarea name="coverageDetails" value={formData.coverageDetails} onChange={handleChange} placeholder="Décrivez les détails de couverture souhaités..." />
          {errors.coverageDetails && <span className="error">{errors.coverageDetails}</span>}
        </div>

        {renderPolicyDetailsFields()}

        <div className="form-group">
          <label>Votre signature <span className="required">*</span></label>
          <div style={{ border: '1px solid #ccc', width: '300px', height: '150px' }}>
            <canvas ref={canvasRef} className="signature-canvas" width={300} height={150} />
          </div>
          <div className="signature-buttons">
            <button type="button" onClick={clearSignature} disabled={isProcessing}>Effacer</button>
            <button type="button" onClick={saveSignature} disabled={isProcessing}>Sauvegarder</button>
          </div>
          {signaturePreview && (
            <div className="signature-preview">
              <img src={signaturePreview} alt="Signature Preview" style={{ maxWidth: '300px', border: '1px solid #ccc' }} />
            </div>
          )}
          {errors.signature && <span className="error">{errors.signature}</span>}
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input type="checkbox" checked={useTestMode} onChange={toggleTestMode} disabled={isProcessing} />
            Utiliser le mode test (carte de test automatique)
          </label>
        </div>

        {!useTestMode && (
          <div className="form-group payment-section">
            <label>Détails de paiement</label>
            <div className="card-element-container">
              <CardElement
                options={{
                  style: {
                    base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
                    invalid: { color: '#9e2146' },
                  },
                }}
              />
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="payment-processing">
            <div className="spinner"></div>
            <p>{message || 'Veuillez patienter pendant le traitement de votre demande...'}</p>
          </div>
        )}

        {!isProcessing && message && (
          <p className={`message ${messageType === 'success' ? 'success-message' : 'error-message'}`}>
            {message}
          </p>
        )}

        <button type="submit" className="submit-but" disabled={isProcessing || (!useTestMode && !stripe)}>
          {isProcessing ? 'Traitement en cours...' : 'Soumettre le contrat'}
        </button>
      </form>
      <ChatBot isAuthenticated={true} initialMessages={[]} />
    </div>
  );
};

export default SubscribeForm;