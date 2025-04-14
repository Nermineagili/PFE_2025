import React, { useState, useEffect, forwardRef } from 'react';
import axios from 'axios';
import { Form, Button, Alert, Container, Card, Spinner } from "react-bootstrap";
import "./ClaimForm.css";

const ClaimForm = forwardRef<HTMLDivElement>((_props, ref) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastname: '',
    email: '',
    birthDate: { day: '', month: '', year: '' },
    sexe: '',
    phone: '',
    address: '',
    postalAddress: '',
    city: '',
    postalCode: '',
    incidentDescription: '',
    stateProvince: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const monthMap: { [key: string]: number } = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
  };

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString());

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('authToken');

    if (userId && token) {
      axios.get(`http://localhost:5000/api/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(response => {
        const user = response.data.data;
        if (user) {
          setFormData(prevData => ({
            ...prevData,
            firstName: user.name,
            lastname: user.lastname,
            email: user.email,
          }));
        }
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
      });
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'day' || name === 'month' || name === 'year') {
      setFormData(prevData => ({
        ...prevData,
        birthDate: { ...prevData.birthDate, [name]: value },
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
      if (!userId) {
        setError("L'identifiant utilisateur est manquant. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      const birthDate = {
        ...formData.birthDate,
        month: monthMap[formData.birthDate.month] || formData.birthDate.month,
      };

      const dataToSubmit = { ...formData, userId, birthDate };

      const response = await axios.post(
        'http://localhost:5000/api/claims/submit',
        dataToSubmit,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.success) {
        setSuccess('Sinistre soumis avec succès !');
        setFormData({
          firstName: '',
          lastname: '',
          email: '',
          birthDate: { day: '', month: '', year: '' },
          sexe: '',
          phone: '',
          address: '',
          postalAddress: '',
          city: '',
          postalCode: '',
          stateProvince: '',
          incidentDescription: '',
        });
      } else {
        setError('Échec de la soumission du sinistre. Veuillez réessayer.');
      }
    } catch (error: any) {
      console.error('Erreur lors de la soumission du sinistre :', error);

      if (axios.isAxiosError(error) && error.response) {
        switch (error.response.status) {
          case 403:
            setError("Vous n'avez pas de contrat actif pour déclarer un sinistre.");
            break;
          case 404:
            setError("Utilisateur introuvable.");
            break;
          default:
            setError(error.response.data?.error || 'Une erreur est survenue lors de l’envoi du formulaire.');
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
            <h2 className="text-center claim-title">DECLARATION DE SINISTRE</h2>
            <p className="text-center claim-subtitle">
              Remplissez le formulaire ci-dessous et nous reviendrons vers vous rapidement pour plus de mises à jour.
            </p>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Form onSubmit={handleSubmit} className="claim-form">
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

              <Form.Group controlId="lastname">
                <Form.Label>Nom</Form.Label>
                <Form.Control
                  type="text"
                  name="lastname"
                  value={formData.lastname}
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
                    name="day"
                    value={formData.birthDate.day}
                    onChange={handleChange}
                    required
                    className="birth-date-select"
                  >
                    <option value="">Jour</option>
                    {days.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </Form.Select>

                  <Form.Select
                    name="month"
                    value={formData.birthDate.month}
                    onChange={handleChange}
                    required
                    className="birth-date-select"
                  >
                    <option value="">Mois</option>
                    {months.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </Form.Select>

                  <Form.Select
                    name="year"
                    value={formData.birthDate.year}
                    onChange={handleChange}
                    required
                    className="birth-date-select"
                  >
                    <option value="">Année</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              </Form.Group>

              <Form.Group controlId="sexe">
                <Form.Label>Sexe</Form.Label>
                <Form.Select
                  name="sexe"
                  value={formData.sexe}
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionnez</option>
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                </Form.Select>
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

              <Form.Group controlId="address">
                <Form.Label>Adresse</Form.Label>
                <Form.Control
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Entrez votre adresse"
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

              <Form.Group controlId="city">
                <Form.Label>Ville</Form.Label>
                <Form.Control
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Entrez votre ville"
                  required
                />
              </Form.Group>

              <Form.Group controlId="postalCode">
                <Form.Label>Code postal</Form.Label>
                <Form.Control
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="Entrez votre code postal"
                  required
                />
              </Form.Group>

              <Form.Group controlId="stateProvince">
                <Form.Label>État/Province</Form.Label>
                <Form.Control
                  type="text"
                  name="stateProvince"
                  value={formData.stateProvince}
                  onChange={handleChange}
                  placeholder="Entrez votre état/province"
                  required
                />
              </Form.Group>

              <Form.Group controlId="incidentDescription">
                <Form.Label>Description du sinistre</Form.Label>
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