import React, { useState, useEffect, forwardRef } from 'react';
import axios from 'axios';
import { Form, Button, Alert, Container, Card, Spinner } from "react-bootstrap";
import "./ClaimForm.css";

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
    supportingFiles: [] as File[], // Support multiple files
  });

  const [activeContracts, setActiveContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString());
  const incidentTypes = ['accident', 'incendie', 'vol', 'maladie', 'dégât des eaux'];

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('authToken');

    if (userId && token) {
      setFormData((prevData) => ({ ...prevData, userId }));
      axios.get(`http://localhost:5000/api/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(response => {
          const user = response.data.data;
          if (user) {
            const now = new Date();
            const activeContracts = user.contracts.filter((contract: Contract) => {
              return contract.status === 'active' &&
                     new Date(contract.startDate) <= now &&
                     new Date(contract.endDate) >= now;
            });
            setActiveContracts(activeContracts);
            setFormData(prevData => ({
              ...prevData,
              firstName: user.name || '',
              lastName: user.lastname || '',
              email: user.email || '',
              contractId: activeContracts.length > 0 ? activeContracts[0]._id : '',
            }));
          }
        })
        .catch(error => {
          console.error('Error fetching user data:', error);
          setError('Impossible de charger les données utilisateur.');
        });
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === 'birthDate.day' || name === 'birthDate.month' || name === 'birthDate.year') {
      const field = name.split('.')[1];
      setFormData(prevData => ({
        ...prevData,
        birthDate: { ...prevData.birthDate, [field]: value },
      }));
    } else if (name.startsWith('thirdPartyDetails.')) {
      const field = name.split('.')[1];
      setFormData(prevData => ({
        ...prevData,
        thirdPartyDetails: { ...prevData.thirdPartyDetails, [field]: value },
      }));
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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

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
                >
                  <option value="">Sélectionnez un contrat</option>
                  {activeContracts.map((contract) => (
                    <option key={contract._id} value={contract._id}>
                      {contract.policyType} (Valide jusqu'au {new Date(contract.endDate).toLocaleDateString()})
                    </option>
                  ))}
                </Form.Select>
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
                />
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
                />
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
                />
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
                  >
                    <option value="">Année</option>
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </Form.Select>
                </div>
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
                />
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
                />
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
                />
              </Form.Group>

              <Form.Group controlId="incidentType">
                <Form.Label>Type de sinistre</Form.Label>
                <Form.Select
                  name="incidentType"
                  value={formData.incidentType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionnez un type</option>
                  {incidentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group controlId="incidentDate">
                <Form.Label>Date du sinistre</Form.Label>
                <Form.Control
                  type="date"
                  name="incidentDate"
                  value={formData.incidentDate}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group controlId="incidentTime">
                <Form.Label>Heure du sinistre</Form.Label>
                <Form.Control
                  type="time"
                  name="incidentTime"
                  value={formData.incidentTime}
                  onChange={handleChange}
                  required
                />
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
                />
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
                />
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
                />
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
                    />
                  </Form.Group>

                  <Form.Group controlId="thirdPartyDetails.contactInfo">
                    <Form.Label>Coordonnées du tiers</Form.Label>
                    <Form.Control
                      type="text"
                      name="thirdPartyDetails.contactInfo"
                      value={formData.thirdPartyDetails.contactInfo}
                      onChange={handleChange}
                      placeholder="Entrez les coordonnées du tiers"
                    />
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
                />
              </Form.Group>

              <div className="d-flex justify-content-center">
                <Button className="submit-button" type="submit" disabled={loading}>
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