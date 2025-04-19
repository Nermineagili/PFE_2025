import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PolicyType from '../pages/PolicyTypes'; // Import as component
import './SubscribeForm.css';

interface SanteDetails {
  maladiesPreexistantes?: string;
  fumeur?: boolean;
  traitementsActuels?: string;
}

interface VoyageDetails {
  destination?: string;
  departureDate?: string;
  returnDate?: string;
}

interface AutomobileDetails {
  carModel?: string;
  registrationNumber?: string;
  usage?: string;
}

interface ResponsabiliteCivileDetails {
  coveredActivities?: string;
  coverageLimit?: number;
}

interface HabitationDetails {
  homeType?: string;
  location?: string;
  alarmSystem?: boolean;
}

interface ProfessionnelleDetails {
  profession?: string;
  annualRevenue?: number;
  employeeCount?: number;
}

interface TransportDetails {
  transportType?: string;
  goodsValue?: number;
  destination?: string;
}

// Define it as a type
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
  | Record<string, any>; // fallback for any unexpected policy types

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
  useEffect(() => {
    if (existingContract) {
      setFormData({
        policyType: existingContract.policyType,
        startDate: existingContract.startDate.split('T')[0], // Format date if needed
        endDate: existingContract.endDate.split('T')[0],
        premiumAmount: existingContract.premiumAmount.toString(),
        coverageDetails: existingContract.coverageDetails,
        policyDetails: existingContract.policyDetails,
        userId: existingContract.userId
      });
      setShowPolicySelection(false);
    }
  }, [existingContract]);
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

  useEffect(() => {
    const fetchUserId = () => {
      try {
        // Check for both 'user' object and direct 'userId'
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = currentUser?.id || localStorage.getItem('userId');
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        
        if (!userId || !token) {
          navigate('/signin');
          return;
        }
  
        setFormData((prev) => ({
          ...prev,
          userId: userId.toString(), // Ensure it's a string
        }));
  
      } catch (error) {
        console.error('Error checking authentication:', error);
        navigate('/signin');
      }
    };
  
    fetchUserId();
  
    if (location.state?.policyType) {
      setFormData((prev) => ({
        ...prev,
        policyType: location.state.policyType,
      }));
      setShowPolicySelection(false);
    }
  }, [location.state, navigate]);
  
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePolicyDetailsChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, type, value, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      policyDetails: {
        ...prev.policyDetails,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handlePolicyTypeSelect = (type: PolicyTypeValue) => {
    let emptyPolicyDetails: PolicyDetails = {};
    switch (type) {
      case 'santé':
        emptyPolicyDetails = {} as SanteDetails;
        break;
      case 'voyage':
        emptyPolicyDetails = {} as VoyageDetails;
        break;
      case 'automobile':
        emptyPolicyDetails = {} as AutomobileDetails;
        break;
      case 'responsabilité civile':
        emptyPolicyDetails = {} as ResponsabiliteCivileDetails;
        break;
      case 'habitation':
        emptyPolicyDetails = {} as HabitationDetails;
        break;
      case 'professionnelle':
        emptyPolicyDetails = {} as ProfessionnelleDetails;
        break;
      case 'transport':
        emptyPolicyDetails = {} as TransportDetails;
        break;
    }
  
    setFormData((prev) => ({
      ...prev,
      policyType: type,
      policyDetails: emptyPolicyDetails,
    }));
    setShowPolicySelection(false);
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors: ValidationErrors = {};

    // Validate user ID
    if (!formData.userId) validationErrors.userId = 'User ID is required. Please log in.';
    if (!formData.policyType) validationErrors.policyType = 'Policy type is required';
    if (!formData.startDate) validationErrors.startDate = 'Start date is required';
    if (!formData.endDate) validationErrors.endDate = 'End date is required';
    if (!formData.premiumAmount || isNaN(Number(formData.premiumAmount))) {
      validationErrors.premiumAmount = 'Premium amount must be a number';
    }
    if (!formData.coverageDetails) validationErrors.coverageDetails = 'Coverage details are required';

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      // Focus on the first field with an error
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        (element as HTMLElement).focus();
      }
      return;
    }

    try {
      // Get authentication token (rename to match what's in your localStorage)
      const token = localStorage.getItem('authToken') ;
      
      if (!token) {
        setMessage('Authentication error: No token found. Please log in again.');
        return;
      }
      
      // Set up complete payload and config
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      };

      // Make the API request
      const response = await axios.post(
        'http://localhost:5000/api/contracts/subscribe',
        formData, // formData already includes userId from useEffect
        config
      );

      // Handle success
      setMessage(response.data.message || 'Contract created successfully. A confirmation email has been sent to your inbox!');
      
      // Optional: Navigate after successful submission
      // setTimeout(() => navigate('/contracts'), 1500);
      
    } catch (error: any) {
      console.error('Error creating contract:', error);
      
      // Better error handling with more specific messages
      if (error.response) {
        if (error.response.status === 401) {
          setMessage('Authentication error: Your session may have expired. Please log in again.');
          // Optionally redirect to login
          // setTimeout(() => navigate('/login'), 2000);
        } else if (error.response.data?.message) {
          setMessage(`Error: ${error.response.data.message}`);
        } else {
          setMessage(`Error: Server responded with status code ${error.response.status}`);
        }
      } else if (error.request) {
        setMessage('Network error: No response received from server. Please check your connection.');
      } else {
        setMessage(`Error: ${error.message}`);
      }
    }
  };

  const renderPolicyDetailsFields = () => {
    switch (formData.policyType) {
      case 'santé':
        return (
          <div className="policy-details-fields">
            <div className="form-group">
              <label>Maladies préexistantes</label>
              <input 
                type="text" 
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
              <input 
                type="text" 
                name="traitementsActuels" 
                value={(formData.policyDetails as SanteDetails).traitementsActuels || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
          </div>
        );

      case 'voyage':
        return (
          <div className="policy-details-fields">
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
              <label>Date de départ</label>
              <input 
                type="date" 
                name="departureDate" 
                value={(formData.policyDetails as VoyageDetails).departureDate || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group">
              <label>Date de retour</label>
              <input 
                type="date" 
                name="returnDate" 
                value={(formData.policyDetails as VoyageDetails).returnDate || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
          </div>
        );

      case 'automobile':
        return (
          <div className="policy-details-fields">
            <div className="form-group">
              <label>Modèle de voiture</label>
              <input 
                type="text" 
                name="carModel" 
                value={(formData.policyDetails as AutomobileDetails).carModel || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group">
              <label>Numéro d'immatriculation</label>
              <input 
                type="text" 
                name="registrationNumber" 
                value={(formData.policyDetails as AutomobileDetails).registrationNumber || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group">
              <label>Usage</label>
              <input 
                type="text" 
                name="usage" 
                value={(formData.policyDetails as AutomobileDetails).usage || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
          </div>
        );

      case 'responsabilité civile':
        return (
          <div className="policy-details-fields">
            <div className="form-group">
              <label>Activités couvertes</label>
              <input 
                type="text" 
                name="coveredActivities" 
                value={(formData.policyDetails as ResponsabiliteCivileDetails).coveredActivities || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group">
              <label>Limite de couverture</label>
              <input 
                type="number" 
                name="coverageLimit" 
                value={(formData.policyDetails as ResponsabiliteCivileDetails).coverageLimit || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
          </div>
        );

      case 'habitation':
        return (
          <div className="policy-details-fields">
            <div className="form-group">
              <label>Type de logement</label>
              <input 
                type="text" 
                name="homeType" 
                value={(formData.policyDetails as HabitationDetails).homeType || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group">
              <label>Localisation</label>
              <input 
                type="text" 
                name="location" 
                value={(formData.policyDetails as HabitationDetails).location || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  name="alarmSystem" 
                  checked={(formData.policyDetails as HabitationDetails).alarmSystem || false} 
                  onChange={handlePolicyDetailsChange} 
                />
                Système d'alarme installé ?
              </label>
            </div>
          </div>
        );

      case 'professionnelle':
        return (
          <div className="policy-details-fields">
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
              <label>Revenu annuel</label>
              <input 
                type="number" 
                name="annualRevenue" 
                value={(formData.policyDetails as ProfessionnelleDetails).annualRevenue || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group">
              <label>Nombre d'employés</label>
              <input 
                type="number" 
                name="employeeCount" 
                value={(formData.policyDetails as ProfessionnelleDetails).employeeCount || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
          </div>
        );

      case 'transport':
        return (
          <div className="policy-details-fields">
            <div className="form-group">
              <label>Type de transport</label>
              <input 
                type="text" 
                name="transportType" 
                value={(formData.policyDetails as TransportDetails).transportType || ''} 
                onChange={handlePolicyDetailsChange} 
              />
            </div>
            <div className="form-group">
              <label>Valeur des marchandises</label>
              <input 
                type="number" 
                name="goodsValue" 
                value={(formData.policyDetails as TransportDetails).goodsValue || ''} 
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
          </div>
        );

      default:
        return null;
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
      
      <button className="back-button" type="button" onClick={handleBackToSelection}>
        Changer de type d'assurance
      </button>
      
      <form onSubmit={handleSubmit} className="subscribe-form">
        {/* Hidden userId field */}
        <input type="hidden" name="userId" value={formData.userId || ''} />
        
        {/* For debugging only - can be removed in production */}
        {!formData.userId && (
          <div className="form-group error-message">
            <p>Vous devez être connecté pour souscrire à une assurance.</p>
          </div>
        )}

        <div className="form-group">
          <label>Date de début</label>
          <input 
            type="date" 
            name="startDate" 
            value={formData.startDate} 
            onChange={handleChange} 
          />
          {errors.startDate && <span className="error">{errors.startDate}</span>}
        </div>

        <div className="form-group">
          <label>Date de fin</label>
          <input 
            type="date" 
            name="endDate" 
            value={formData.endDate} 
            onChange={handleChange} 
          />
          {errors.endDate && <span className="error">{errors.endDate}</span>}
        </div>

        <div className="form-group">
          <label>Montant de la prime</label>
          <input 
            type="number" 
            name="premiumAmount" 
            value={formData.premiumAmount} 
            onChange={handleChange} 
          />
          {errors.premiumAmount && <span className="error">{errors.premiumAmount}</span>}
        </div>

        <div className="form-group">
          <label>Détails de couverture</label>
          <textarea 
            name="coverageDetails" 
            value={formData.coverageDetails} 
            onChange={handleChange} 
          />
          {errors.coverageDetails && <span className="error">{errors.coverageDetails}</span>}
        </div>

        {renderPolicyDetailsFields()}

        <button type="submit" className="submit-but" >Soumettre</button>
        
        {message && (
          <p className={`message ${message.includes('Error') || message.includes('error') ? 'error-message' : 'success-message'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default SubscribeForm;