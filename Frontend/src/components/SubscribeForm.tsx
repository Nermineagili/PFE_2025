import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from './Footer';
import { Calendar, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import './SubscribeForm.css';

interface FormData {
    userId: string;
    policyType: string;
    startDate: string;
    endDate: string;
    premiumAmount: string;
    coverageDetails: string;
  }
  
  const SubscribeForm = () => {
    const { isLoggedIn, user } = useAuth();
    const [formData, setFormData] = useState<FormData>({
      userId: '',
      policyType: '',
      startDate: '',
      endDate: '',
      premiumAmount: '',
      coverageDetails: '',
    });
  
    const policyOptions = [
      'santé',
      'voyage',
      'automobile',
      'responsabilité civile',
      'habitation',
      'professionnelle',
    ];
  
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
  
    useEffect(() => {
      if (user) {
        setFormData(prev => ({ ...prev, userId: user._id }));
      }
    }, [user]);
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };
  
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
  
      try {
        const token = localStorage.getItem('authToken');
  
        const res = await axios.post(
          'http://localhost:5000/api/contracts/subscribe',
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
  
        setMessageType('success');
        setMessage('Contrat souscrit avec succès !');
        
        // Reset form
        setFormData({
          userId: user?._id || '',
          policyType: '',
          startDate: '',
          endDate: '',
          premiumAmount: '',
          coverageDetails: '',
        });
      } catch (error: any) {
        console.error(error.response?.data || error.message);
        setMessageType('error');
        setMessage(error.response?.data?.message || 'Une erreur est survenue lors de la souscription');
      } finally {
        setIsSubmitting(false);
      }
    };
  
    if (!isLoggedIn) {
      return <Navigate to="/signin" replace />;
    }
  
    const policyIcons: Record<string, string> = {
      'santé': '🏥',
      'voyage': '✈️',
      'automobile': '🚗',
      'responsabilité civile': '⚖️',
      'habitation': '🏠',
      'professionnelle': '💼'
    };
  
    const formatLabel = (option: string): string => {
      return `${policyIcons[option]} ${option.charAt(0).toUpperCase() + option.slice(1)}`;
    };
  return (
    <div className="subscribe-page">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="subscribe-form-card">
              <div className="form-header">
                <h2 className="text-center mb-4">Souscrire à un Contrat</h2>
                <p className="text-center text-muted mb-4">
                  Complétez le formulaire ci-dessous pour souscrire à une assurance Yomi
                </p>
              </div>

              {message && (
                <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} d-flex align-items-center`} role="alert">
                  {messageType === 'success' ? 
                    <CheckCircle size={20} className="me-2" /> : 
                    <AlertCircle size={20} className="me-2" />
                  }
                  <div>{message}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="subscription-form">
                <div className="row">
                  <div className="col-md-12 mb-4">
                    <label htmlFor="policyType" className="form-label">Type d'assurance</label>
                    <div className="policy-select-wrapper">
                      <select
                        id="policyType"
                        name="policyType"
                        className="form-select"
                        value={formData.policyType}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Choisissez un type de police</option>
                        {policyOptions.map((option) => (
                          <option key={option} value={option}>
                            {formatLabel(option)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6 mb-4">
                    <label htmlFor="startDate" className="form-label">
                      <Calendar size={18} className="icon-inline" /> Date de début
                    </label>
                    <input 
                      type="date" 
                      id="startDate"
                      name="startDate" 
                      className="form-control" 
                      value={formData.startDate}
                      onChange={handleChange} 
                      required 
                    />
                  </div>

                  <div className="col-md-6 mb-4">
                    <label htmlFor="endDate" className="form-label">
                      <Calendar size={18} className="icon-inline" /> Date de fin
                    </label>
                    <input 
                      type="date" 
                      id="endDate"
                      name="endDate" 
                      className="form-control" 
                      value={formData.endDate}
                      onChange={handleChange} 
                      required 
                    />
                  </div>

                  <div className="col-md-12 mb-4">
                    <label htmlFor="premiumAmount" className="form-label">Montant de la prime (€)</label>
                    <div className="input-group">
                      <input 
                        type="number" 
                        id="premiumAmount"
                        name="premiumAmount" 
                        className="form-control" 
                        placeholder="ex: 250" 
                        value={formData.premiumAmount}
                        onChange={handleChange} 
                        required 
                      />
                      <span className="input-group-text">€</span>
                    </div>
                  </div>

                  <div className="col-md-12 mb-4">
                    <label htmlFor="coverageDetails" className="form-label">
                      <Shield size={18} className="icon-inline" /> Détails de la couverture
                    </label>
                    <textarea 
                      id="coverageDetails"
                      name="coverageDetails" 
                      className="form-control" 
                      placeholder="Décrivez les détails de couverture souhaités..." 
                      rows={4}
                      value={formData.coverageDetails}
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>

                <div className="info-text mb-4">
                  <p>
                    <strong>Note :</strong> En souscrivant à ce contrat, vous acceptez les conditions générales de Yomi Assurance.
                  </p>
                </div>

                <div className="d-grid">
                  <button 
                    type="submit" 
                    className="btn btn-primary subscribe-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Traitement en cours...' : 'Souscrire maintenant'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SubscribeForm;