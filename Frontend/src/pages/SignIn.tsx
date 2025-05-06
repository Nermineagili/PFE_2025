import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./SignIn.css";

const SignIn: React.FC = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
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
                placeholder="Votre adresse email"
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                value={credentials.email}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                placeholder="Votre mot de passe"
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                value={credentials.password}
                required
              />
            </div>

            <div className="forgot-password">
              <Link to="/forgot-password">Mot de passe oublié ?</Link>
            </div>

            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={isLoading}
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