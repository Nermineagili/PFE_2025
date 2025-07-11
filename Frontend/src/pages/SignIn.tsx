import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./SignIn.css";

const SignIn: React.FC = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };
    switch (name) {
      case "email":
        if (!value.trim()) newErrors[name] = "Email requis.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors[name] = "Email invalide.";
        else delete newErrors[name];
        break;
      case "password":
        if (!value.trim()) newErrors[name] = "Mot de passe requis.";
        else if (value.length < 8) newErrors[name] = "Mot de passe doit contenir au moins 8 caractères.";
        else if (!/(?=.*[A-Z])(?=.*[0-9])/.test(value)) newErrors[name] = "Mot de passe doit inclure une majuscule et un chiffre.";
        else delete newErrors[name];
        break;
      default:
        delete newErrors[name];
    }
    setErrors(newErrors);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(""); // Clear previous server error on new submit

    // Final validation before submission
    validateField("email", credentials.email);
    validateField("password", credentials.password);
    if (Object.keys(errors).length > 0) {
      setErrorMessage("Veuillez corriger les erreurs dans le formulaire.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", credentials);
      login(response.data.token, response.data.user);
      localStorage.setItem("userId", response.data.user._id);
      console.log("User ID stored:", response.data.user._id);

      // Role-based redirect
      const userRole = response.data.user.role;
      if (userRole === "user") {
        navigate("/clienthome");
      } else if (userRole === "supervisor") {
        navigate("/supervisorhome");
      } else {
        navigate("/adminhome");
      }
    } catch (error) {
      setErrorMessage("Identifiants incorrects. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-background">
      <div className="auth-container">
        <div className="auth-form signin-form">
          <div className="auth-header">
            <h2>Se connecter</h2>
            <p className="auth-subtitle">Accédez à votre compte</p>
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
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email" // Added name for handleChange
                placeholder="Votre adresse email"
                onChange={handleChange}
                value={credentials.email}
                required
                className={errors.email ? "input-error" : ""}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                name="password" // Added name for handleChange
                placeholder="Votre mot de passe"
                onChange={handleChange}
                value={credentials.password}
                required
                className={errors.password ? "input-error" : ""}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="forgot-password">
              <Link to="/forgot-password">Mot de passe oublié ?</Link>
            </div>

            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={isLoading || Object.keys(errors).length > 0}
            >
              {isLoading ? (
                <span className="loading-spinner"></span>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Pas encore de compte ? <Link to="/signup" className="auth-alt-link">S'inscrire</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;