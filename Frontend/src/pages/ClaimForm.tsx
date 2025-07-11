import React, { useState, useEffect, forwardRef } from 'react';
import axios from 'axios';
import { Form, Button, Alert, Container, Card, Spinner, FormText } from "react-bootstrap";
import "./ClaimForm.css";
import { useAuth } from '../context/AuthContext'; // Import useAuth

interface Contract {
  _id: string;
  policyType: string;
  startDate: string;
  endDate: string;
  status: string;
}

const ClaimForm = forwardRef<HTMLDivElement>((_props, ref) => {
  const [formData, setFormData] = useState({
    userId: '',
    contractId: '',
    firstName: '',
    lastName: '',
    email: '',
    birthDate: { day: '', month: '', year: '' },
    profession: '',
    phone: '',
    postalAddress: '',
    incidentType: '',
    incidentDate: '',
    incidentTime: '',
    incidentLocation: '',
    incidentDescription: '',
    damages: '',
    thirdPartyInvolved: false,
    thirdPartyDetails: { name: '', contactInfo: '', registrationId: '', insurerContact: '' },
    supportingFiles: [] as File[],
  });

  const [activeContracts, setActiveContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString());
  const incidentTypes = ['accident', 'incendie', 'vol', 'maladie', 'dégât des eaux'];

  const { user, updateUserContext } = useAuth(); // Access user from AuthContext

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('authToken');

    if (userId && token) {
      setFormData((prevData) => ({ ...prevData, userId }));

      // Fetch contracts
      axios.get(`http://localhost:5000/api/contracts/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(response => {
          const contracts = response.data;
          const now = new Date();
          const activeContracts = contracts.filter((contract: Contract) => {
            return contract.status === 'active' &&
                   new Date(contract.startDate) <= now &&
                   new Date(contract.endDate) >= now;
          });
          setActiveContracts(activeContracts);
          setFormData(prevData => ({
            ...prevData,
            contractId: activeContracts.length > 0 ? activeContracts[0]._id : '',
          }));
        })
        .catch(error => {
          console.error('Error fetching contracts:', error);
          setError('Impossible de charger les contrats.');
        });

      // Fetch user details if not in AuthContext or to ensure freshness
      if (!user || !user.name || !user.lastname) {
        axios.get(`http://localhost:5000/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(response => {
            const fetchedUser = response.data.data;
            if (fetchedUser) {
              setFormData(prevData => ({
                ...prevData,
                firstName: fetchedUser.name || '',
                lastName: fetchedUser.lastname || '',
                email: fetchedUser.email || '',
              }));
              updateUserContext({ name: fetchedUser.name, lastname: fetchedUser.lastname, email: fetchedUser.email });
            }
          })
          .catch(error => {
            console.error('Error fetching user details:', error);
            setError('Impossible de charger les détails de l\'utilisateur.');
          });
      } else {
        setFormData(prevData => ({
          ...prevData,
          firstName: user.name || '',
          lastName: user.lastname || '',
          email: user.email || '',
        }));
      }
    }
  }, [user, updateUserContext]);

const validateField = (name: string, value: string) => {
  const newErrors = { ...errors };
  const [mainField, subField] = name.split('.');

  if (mainField === 'birthDate' && subField) {
    const { day, month, year } = formData.birthDate;
    if (!day || !month || !year) newErrors['birthDate'] = 'Date de naissance complète requise.';
    else if (parseInt(year) > new Date().getFullYear() - 18) newErrors['birthDate'] = 'Vous devez avoir au moins 18 ans.';
    else delete newErrors['birthDate'];
  } else if (mainField === 'thirdPartyDetails' && subField) {
    if (formData.thirdPartyInvolved) {
      if (subField === 'name' && !value.trim()) newErrors[name] = 'Nom du tiers requis.';
      else if (subField === 'contactInfo' && !value.trim()) newErrors[name] = 'Coordonnées du tiers requises.';
      else delete newErrors[name];
    } else {
      delete newErrors[name];
    }
  } else {
    switch (mainField) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) newErrors[mainField] = `${mainField === 'firstName' ? 'Prénom' : 'Nom'} requis.`;
        else if (!/^[a-zA-ZÀ-ÿ\s-]+$/.test(value)) newErrors[mainField] = `${mainField === 'firstName' ? 'Prénom' : 'Nom'} doit contenir uniquement des lettres.`;
        else delete newErrors[mainField];
        break;
      case 'email':
        if (!value.trim()) newErrors[mainField] = 'Email requis.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors[mainField] = 'Email invalide.';
        else delete newErrors[mainField];
        break;
      case 'profession':
        if (!value.trim()) newErrors[mainField] = 'Profession requise.';
        else if (!/^[a-zA-ZÀ-ÿ\s-]+$/.test(value)) newErrors[mainField] = 'Profession doit contenir uniquement des lettres.';
        else delete newErrors[mainField];
        break;
      case 'phone':
        if (!value.trim()) newErrors[mainField] = 'Téléphone requis.';
        else if (!/^0[6-7]\d{8}$/.test(value)) newErrors[mainField] = 'Numéro de téléphone français invalide (ex: 0612345678).';
        else delete newErrors[mainField];
        break;
      case 'postalAddress':
        if (!value.trim()) newErrors[mainField] = 'Adresse postale requise.';
        else delete newErrors[mainField];
        break;
      case 'incidentType':
        if (!value) newErrors[mainField] = 'Type de sinistre requis.';
        else delete newErrors[mainField];
        break;
      case 'incidentDate':
        if (!value) newErrors[mainField] = 'Date du sinistre requise.';
        else if (new Date(value) > new Date()) newErrors[mainField] = 'Date ne peut être dans le futur.';
        else delete newErrors[mainField];
        break;
      case 'incidentTime':
        if (!value) newErrors[mainField] = 'Heure du sinistre requise.';
        else delete newErrors[mainField];
        break;
      case 'incidentLocation':
        if (!value.trim()) newErrors[mainField] = 'Lieu du sinistre requis.';
        else delete newErrors[mainField];
        break;
      case 'incidentDescription':
      case 'damages':
        if (!value.trim()) newErrors[mainField] = `${mainField === 'incidentDescription' ? 'Circonstances' : 'Dommages'} requis.`;
        else if (value.length < 10) newErrors[mainField] = `${mainField === 'incidentDescription' ? 'Circonstances' : 'Dommages'} doit contenir au moins 10 caractères.`;
        else delete newErrors[mainField];
        break;
      default:
        delete newErrors[mainField];
    }
  }
  setErrors(newErrors);
};

const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value, type } = e.target;
  if (name === 'birthDate.day' || name === 'birthDate.month' || name === 'birthDate.year') {
    const field = name.split('.')[1];
    setFormData(prevData => ({
      ...prevData,
      birthDate: { ...prevData.birthDate, [field]: value },
    }));
    validateField(name, value);
  } else if (name.startsWith('thirdPartyDetails.')) {
    const field = name.split('.')[1];
    setFormData(prevData => ({
      ...prevData,
      thirdPartyDetails: { ...prevData.thirdPartyDetails, [field]: value },
    }));
    validateField(name, value);
  } else if (name === 'thirdPartyInvolved') {
    setFormData(prevData => ({
      ...prevData,
      thirdPartyInvolved: (e.target as HTMLInputElement).checked,
    }));
  } else if (name === 'supportingFiles') {
    const files = (e.target as HTMLInputElement).files;
    setFormData(prevData => ({
      ...prevData,
      supportingFiles: files ? Array.from(files) : [],
    }));
  } else {
    setFormData(prevData => ({ ...prevData, [name]: value }));
    validateField(name, value);
  }
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  setSuccess(null);

  // Validate all fields before submission
  const allFields = [
    'firstName', 'lastName', 'email', 'birthDate.day', 'birthDate.month', 'birthDate.year',
    'profession', 'phone', 'postalAddress', 'incidentType', 'incidentDate', 'incidentTime',
    'incidentLocation', 'incidentDescription', 'damages',
    ...(formData.thirdPartyInvolved ? ['thirdPartyDetails.name', 'thirdPartyDetails.contactInfo'] : [])
  ];
  let hasErrors = false;
  allFields.forEach(field => {
    const [mainField, subField] = field.split('.');
    let value = '';
    if (subField) {
      if (mainField === 'birthDate') {
        value = (formData.birthDate as { [key: string]: string })[subField] || '';
      } else if (mainField === 'thirdPartyDetails') {
        value = (formData.thirdPartyDetails as { [key: string]: string })[subField] || '';
      }
    } else {
      const fieldValue = formData[mainField as keyof typeof formData];
      // Type guard to ensure value is a string
      if (typeof fieldValue === 'string') {
        value = fieldValue || '';
      } else if (typeof fieldValue === 'boolean') {
        value = fieldValue.toString(); // Convert boolean to string if needed
      } else {
        value = ''; // Default to empty string for other types (e.g., File[])
      }
    }
    validateField(field, value);
  });
  if (Object.keys(errors).length > 0) {
    hasErrors = true;
  }

  if (hasErrors) {
    setError('Veuillez corriger les erreurs dans le formulaire.');
    setLoading(false);
    return;
  }

  try {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('authToken');
    if (!userId || !token) {
      setError("L'identifiant utilisateur ou le token est manquant. Veuillez vous reconnecter.");
      setLoading(false);
      return;
    }

    const dataToSubmit = new FormData();
    dataToSubmit.append('userId', userId);
    dataToSubmit.append('contractId', formData.contractId);
    dataToSubmit.append('firstName', formData.firstName);
    dataToSubmit.append('lastName', formData.lastName);
    dataToSubmit.append('email', formData.email);
    dataToSubmit.append('birthDate[day]', formData.birthDate.day);
    dataToSubmit.append('birthDate[month]', formData.birthDate.month);
    dataToSubmit.append('birthDate[year]', formData.birthDate.year);
    dataToSubmit.append('profession', formData.profession);
    dataToSubmit.append('phone', formData.phone);
    dataToSubmit.append('postalAddress', formData.postalAddress);
    dataToSubmit.append('incidentType', formData.incidentType);
    dataToSubmit.append('incidentDate', formData.incidentDate);
    dataToSubmit.append('incidentTime', formData.incidentTime);
    dataToSubmit.append('incidentLocation', formData.incidentLocation);
    dataToSubmit.append('incidentDescription', formData.incidentDescription);
    dataToSubmit.append('damages', formData.damages);
    dataToSubmit.append('thirdPartyInvolved', formData.thirdPartyInvolved.toString());
    if (formData.thirdPartyInvolved) {
      dataToSubmit.append('thirdPartyDetails[name]', formData.thirdPartyDetails.name);
      dataToSubmit.append('thirdPartyDetails[contactInfo]', formData.thirdPartyDetails.contactInfo);
      dataToSubmit.append('thirdPartyDetails[registrationId]', formData.thirdPartyDetails.registrationId);
      dataToSubmit.append('thirdPartyDetails[insurerContact]', formData.thirdPartyDetails.insurerContact);
    }
    formData.supportingFiles.forEach((file, index) => {
      dataToSubmit.append('supportingFiles', file);
    });

    const response = await axios.post(
      'http://localhost:5000/api/claims/submit',
      dataToSubmit,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      setSuccess('Sinistre soumis avec succès !');
      setFormData({
        userId: '',
        contractId: activeContracts.length > 0 ? activeContracts[0]._id : '',
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        birthDate: { day: '', month: '', year: '' },
        profession: '',
        phone: '',
        postalAddress: '',
        incidentType: '',
        incidentDate: '',
        incidentTime: '',
        incidentLocation: '',
        incidentDescription: '',
        damages: '',
        thirdPartyInvolved: false,
        thirdPartyDetails: { name: '', contactInfo: '', registrationId: '', insurerContact: '' },
        supportingFiles: [],
      });
      setErrors({});
    } else {
      setError('Échec de la soumission du sinistre. Veuillez réessayer.');
    }
  } catch (error: any) {
    console.error('Erreur lors de la soumission du sinistre :', error);
    if (axios.isAxiosError(error) && error.response) {
      switch (error.response.status) {
        case 400:
          setError(error.response.data.message || 'Données invalides.');
          break;
        case 403:
          setError("Vous n'avez pas de contrat actif pour déclarer un sinistre.");
          break;
        case 404:
          setError("Utilisateur introuvable.");
          break;
        default:
          setError(error.response.data?.message || 'Une erreur est survenue lors de l’envoi du formulaire.');
      }
    } else {
      setError('Une erreur inconnue est survenue.');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <section ref={ref} id="claim-form-section" className="claim-form-section">
      <Container className="claim-container">
        <Card className="claim-card">
          <Card.Body>
            <h2 className="text-center claim-title">DÉCLARATION DE SINISTRE</h2>
            <p className="text-center claim-subtitle">
              Remplissez le formulaire ci-dessous et nous reviendrons vers vous rapidement pour plus de mises à jour.
            </p>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Form onSubmit={handleSubmit} className="claim-form">
              <Form.Group controlId="contractId">
                <Form.Label>Contrat</Form.Label>
                <Form.Select
                  name="contractId"
                  value={formData.contractId}
                  onChange={handleChange}
                  required
                  disabled={activeContracts.length === 0}
                  isInvalid={!!errors.contractId}
                >
                  <option value="">Sélectionnez un contrat</option>
                  {activeContracts.map((contract) => (
                    <option key={contract._id} value={contract._id}>
                      {contract.policyType} (Valide jusqu'au {new Date(contract.endDate).toLocaleDateString()})
                    </option>
                  ))}
                </Form.Select>
                {activeContracts.length === 0 && (
                  <Alert variant="warning">Aucun contrat actif trouvé. Contactez le support.</Alert>
                )}
                <FormText className="text-danger">{errors.contractId}</FormText>
              </Form.Group>

              <Form.Group controlId="firstName">
                <Form.Label>Prénom</Form.Label>
                <Form.Control
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Entrez votre prénom"
                  required
                  readOnly
                  isInvalid={!!errors.firstName}
                />
                <FormText className="text-danger">{errors.firstName}</FormText>
              </Form.Group>

              <Form.Group controlId="lastName">
                <Form.Label>Nom</Form.Label>
                <Form.Control
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Entrez votre nom"
                  required
                  readOnly
                  isInvalid={!!errors.lastName}
                />
                <FormText className="text-danger">{errors.lastName}</FormText>
              </Form.Group>

              <Form.Group controlId="email">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Entrez votre email"
                  required
                  readOnly
                  isInvalid={!!errors.email}
                />
                <FormText className="text-danger">{errors.email}</FormText>
              </Form.Group>

              <Form.Group controlId="birthDate">
                <Form.Label>Date de naissance</Form.Label>
                <div className="birth-date-container">
                  <Form.Select
                    name="birthDate.day"
                    value={formData.birthDate.day}
                    onChange={handleChange}
                    required
                    className="birth-date-select"
                    isInvalid={!!errors.birthDate}
                  >
                    <option value="">Jour</option>
                    {days.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </Form.Select>
                  <Form.Select
                    name="birthDate.month"
                    value={formData.birthDate.month}
                    onChange={handleChange}
                    required
                    className="birth-date-select"
                    isInvalid={!!errors.birthDate}
                  >
                    <option value="">Mois</option>
                    {months.map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </Form.Select>
                  <Form.Select
                    name="birthDate.year"
                    value={formData.birthDate.year}
                    onChange={handleChange}
                    required
                    className="birth-date-select"
                    isInvalid={!!errors.birthDate}
                  >
                    <option value="">Année</option>
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </Form.Select>
                </div>
                <FormText className="text-danger">{errors.birthDate}</FormText>
              </Form.Group>

              <Form.Group controlId="profession">
                <Form.Label>Profession</Form.Label>
                <Form.Control
                  type="text"
                  name="profession"
                  value={formData.profession}
                  onChange={handleChange}
                  placeholder="Entrez votre profession"
                  required
                  isInvalid={!!errors.profession}
                />
                <FormText className="text-danger">{errors.profession}</FormText>
              </Form.Group>

              <Form.Group controlId="phone">
                <Form.Label>Téléphone</Form.Label>
                <Form.Control
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Entrez votre numéro de téléphone"
                  required
                  isInvalid={!!errors.phone}
                />
                <FormText className="text-danger">{errors.phone}</FormText>
              </Form.Group>

              <Form.Group controlId="postalAddress">
                <Form.Label>Adresse postale</Form.Label>
                <Form.Control
                  type="text"
                  name="postalAddress"
                  value={formData.postalAddress}
                  onChange={handleChange}
                  placeholder="Entrez votre adresse postale"
                  required
                  isInvalid={!!errors.postalAddress}
                />
                <FormText className="text-danger">{errors.postalAddress}</FormText>
              </Form.Group>

              <Form.Group controlId="incidentType">
                <Form.Label>Type de sinistre</Form.Label>
                <Form.Select
                  name="incidentType"
                  value={formData.incidentType}
                  onChange={handleChange}
                  required
                  isInvalid={!!errors.incidentType}
                >
                  <option value="">Sélectionnez un type</option>
                  {incidentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </Form.Select>
                <FormText className="text-danger">{errors.incidentType}</FormText>
              </Form.Group>

              <Form.Group controlId="incidentDate">
                <Form.Label>Date du sinistre</Form.Label>
                <Form.Control
                  type="date"
                  name="incidentDate"
                  value={formData.incidentDate}
                  onChange={handleChange}
                  required
                  isInvalid={!!errors.incidentDate}
                />
                <FormText className="text-danger">{errors.incidentDate}</FormText>
              </Form.Group>

              <Form.Group controlId="incidentTime">
                <Form.Label>Heure du sinistre</Form.Label>
                <Form.Control
                  type="time"
                  name="incidentTime"
                  value={formData.incidentTime}
                  onChange={handleChange}
                  required
                  isInvalid={!!errors.incidentTime}
                />
                <FormText className="text-danger">{errors.incidentTime}</FormText>
              </Form.Group>

              <Form.Group controlId="incidentLocation">
                <Form.Label>Lieu du sinistre</Form.Label>
                <Form.Control
                  type="text"
                  name="incidentLocation"
                  value={formData.incidentLocation}
                  onChange={handleChange}
                  placeholder="Entrez le lieu du sinistre"
                  required
                  isInvalid={!!errors.incidentLocation}
                />
                <FormText className="text-danger">{errors.incidentLocation}</FormText>
              </Form.Group>

              <Form.Group controlId="incidentDescription">
                <Form.Label>Circonstances détaillées du sinistre</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="incidentDescription"
                  value={formData.incidentDescription}
                  onChange={handleChange}
                  placeholder="Décrivez le sinistre en détail"
                  required
                  isInvalid={!!errors.incidentDescription}
                />
                <FormText className="text-danger">{errors.incidentDescription}</FormText>
              </Form.Group>

              <Form.Group controlId="damages">
                <Form.Label>Dommages subis</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="damages"
                  value={formData.damages}
                  onChange={handleChange}
                  placeholder="Décrivez les dommages subis"
                  required
                  isInvalid={!!errors.damages}
                />
                <FormText className="text-danger">{errors.damages}</FormText>
              </Form.Group>

              <Form.Group controlId="thirdPartyInvolved">
                <Form.Check
                  type="checkbox"
                  label="Tiers impliqué ?"
                  name="thirdPartyInvolved"
                  checked={formData.thirdPartyInvolved}
                  onChange={handleChange}
                />
              </Form.Group>

              {formData.thirdPartyInvolved && (
                <>
                  <Form.Group controlId="thirdPartyDetails.name">
                    <Form.Label>Nom du tiers</Form.Label>
                    <Form.Control
                      type="text"
                      name="thirdPartyDetails.name"
                      value={formData.thirdPartyDetails.name}
                      onChange={handleChange}
                      placeholder="Entrez le nom du tiers"
                      isInvalid={!!errors['thirdPartyDetails.name']}
                    />
                    <FormText className="text-danger">{errors['thirdPartyDetails.name']}</FormText>
                  </Form.Group>

                  <Form.Group controlId="thirdPartyDetails.contactInfo">
                    <Form.Label>Coordonnées du tiers</Form.Label>
                    <Form.Control
                      type="text"
                      name="thirdPartyDetails.contactInfo"
                      value={formData.thirdPartyDetails.contactInfo}
                      onChange={handleChange}
                      placeholder="Entrez les coordonnées du tiers"
                      isInvalid={!!errors['thirdPartyDetails.contactInfo']}
                    />
                    <FormText className="text-danger">{errors['thirdPartyDetails.contactInfo']}</FormText>
                  </Form.Group>

                  <Form.Group controlId="thirdPartyDetails.registrationId">
                    <Form.Label>N° d'immatriculation/Identité</Form.Label>
                    <Form.Control
                      type="text"
                      name="thirdPartyDetails.registrationId"
                      value={formData.thirdPartyDetails.registrationId}
                      onChange={handleChange}
                      placeholder="Entrez le numéro d'immatriculation ou l'identité"
                    />
                  </Form.Group>

                  <Form.Group controlId="thirdPartyDetails.insurerContact">
                    <Form.Label>Coordonnées de l'assureur du tiers</Form.Label>
                    <Form.Control
                      type="text"
                      name="thirdPartyDetails.insurerContact"
                      value={formData.thirdPartyDetails.insurerContact}
                      onChange={handleChange}
                      placeholder="Entrez les coordonnées de l'assureur"
                    />
                  </Form.Group>
                </>
              )}

              <Form.Group controlId="supportingFiles">
                <Form.Label>Fichiers à l'appui (plusieurs fichiers possibles)</Form.Label>
                <Form.Control
                  type="file"
                  name="supportingFiles"
                  onChange={handleChange}
                  accept="image/jpeg,image/png,application/pdf"
                  multiple
                  isInvalid={!!errors.supportingFiles}
                />
                <FormText className="text-danger">{errors.supportingFiles}</FormText>
              </Form.Group>

              <div className="d-flex justify-content-center">
                <Button className="submit-button" type="submit" disabled={loading || Object.keys(errors).length > 0}>
                  {loading ? <Spinner animation="border" size="sm" /> : "Soumettre"}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </section>
  );
});

ClaimForm.displayName = 'ClaimForm';

export default ClaimForm;