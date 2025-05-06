import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SignUp.css';

const SignUp: React.FC = () => {
  const [user, setUser] = useState({
    name: '',
    lastname: '',
    email: '',
    phone: '',
    password: '',
  });
  
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', user);
      console.log('Registration successful:', response.data);

      if (response.data.success) {
        navigate('/clienthome');
      } else {
        setErrorMessage(response.data.message || 'Inscription échouée');
      }
      
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error(error.response?.data);
        setErrorMessage(error.response?.data.error || "L'inscription a échoué");
      } else {
        console.error('Une erreur inattendue est survenue:', error);
        setErrorMessage('Une erreur inattendue est survenue');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-background">
      <div className="auth-container">
        <div className="auth-form signup-form">
          <div className="auth-header">
            <h2>S'inscrire</h2>
            <p className="auth-subtitle">Créez votre compte</p>
          </div>
          
          {errorMessage && (
            <div className="auth-error-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form-fields">
            <div className="form-group">
              <label htmlFor="name">Nom</label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Votre nom"
                value={user.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastname">Prénom</label>
              <input
                id="lastname"
                type="text"
                name="lastname"
                placeholder="Votre prénom"
                value={user.lastname}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Votre adresse email"
                value={user.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Téléphone</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                placeholder="Votre numéro de téléphone"
                value={user.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Choisissez un mot de passe sécurisé"
                value={user.password}
                onChange={handleChange}
                required
              />
            </div>

            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-spinner"></span>
              ) : (
                "S'inscrire"
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Vous avez déjà un compte ? <Link to="/signin" className="auth-alt-link">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;