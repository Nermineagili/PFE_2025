import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext"; // assuming you have AuthContext for global state
import "./SignIn.css";

const SignIn: React.FC = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth(); // Assuming login method sets the user state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Sending a POST request to the backend for login
      const response = await axios.post("http://localhost:5000/api/auth/login", credentials);

      // Call the login function to set token and user in global context (AuthContext)
      login(response.data.token, response.data.user);
      // Store userId in localStorage
      localStorage.setItem('userId', response.data.user._id);
      console.log('User ID stored:', response.data.user._id); // Log to check

      // Redirect based on user role
      if (response.data.user.role === "user") {
        navigate("/clienthome");
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
          <button className="btn-submit" type="submit" style={{ padding: "10px 15px", marginTop: "10px" }}>Se connecter</button>
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
