import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./SignIn.css";

const SignIn: React.FC = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setErrorMessage("Login failed, please check your credentials");
    }
  };

  return (
    <div className="signin-background">
      <div className="signin-form">
        <h2>Se connecter</h2>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <form onSubmit={handleSubmit}>
          <input
            className="form-control"
            type="email"
            name="email"
            placeholder="Email"
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
            value={credentials.email}
            style={{ marginBottom: "15px", padding: "10px" }}
          />
          <input
            className="form-control"
            type="password"
            name="password"
            placeholder="Mot de passe"
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            value={credentials.password}
            style={{ marginBottom: "15px", padding: "10px" }}
          />
          <button className="btn-submit" type="submit" style={{ padding: "10px 15px", marginTop: "10px" }}>
            Se connecter
          </button>
        </form>
        <div className="existing-account" style={{ marginTop: "15px" }}>
          <span>Pas encore de compte ? </span>
          <a href="/signup">S'inscrire</a>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
