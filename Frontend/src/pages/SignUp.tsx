import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import './SignUp.css'; // Custom CSS for styling
import axios from 'axios';  // Import axios and AxiosError
import { useNavigate } from 'react-router-dom';  // Import useNavigate for navigation

function SignUp() {
  const [user, setUser] = useState({
    name: '',         // 'nom' changed to 'name'
    lastname: '',     // 'prenom' changed to 'lastname'
    email: '',
    phone: '',
    password: '',
  });
  
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();  // Initialize the navigate function

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', user);  // Adjust URL to your backend
      console.log('Registration successful:', response.data);

      // You can also check response.data for specific success status or data if needed
      if (response.data.success) {
        // If the backend returns a success field or similar, you can use it to verify.
        // Assuming you want to navigate to the clienthome after successful signup
        navigate('/clienthome');  // Redirect to ClientHome if the user is a regular user
      } else {
        // Handle cases where there may be an issue with registration.
        setErrorMessage(response.data.message || 'Registration failed');
      }
      
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error(error.response?.data);
        setErrorMessage(error.response?.data.error || "Registration failed");
      } else {
        console.error('An unexpected error occurred:', error);
        setErrorMessage('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="signup-background d-flex justify-content-center align-items-center">
      <Form onSubmit={handleSubmit} className="signup-form p-4">
        <h2 className="text-center mb-4">S'inscrire</h2>
        
        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
        
        {/* Name */}
        <Form.Group className="mb-3">
          <Form.Control
            type="text"
            name="name"  // Changed 'nom' to 'name'
            placeholder="Nom"
            value={user.name}
            onChange={handleChange}
            required
          />
        </Form.Group>
        
        {/* Lastname */}
        <Form.Group className="mb-3">
          <Form.Control
            type="text"
            name="lastname"  // Changed 'prenom' to 'lastname'
            placeholder="Prénom"
            value={user.lastname}
            onChange={handleChange}
            required
          />
        </Form.Group>

        {/* Email */}
        <Form.Group className="mb-3">
          <Form.Control
            type="email"
            name="email"
            placeholder="Email"
            value={user.email}
            onChange={handleChange}
            required
          />
        </Form.Group>

        {/* Phone */}
        <Form.Group className="mb-3">
          <Form.Control
            type="tel"
            name="phone"
            placeholder="Téléphone"
            value={user.phone}
            onChange={handleChange}
            required
          />
        </Form.Group>

        {/* Password */}
        <Form.Group className="mb-3">
          <Form.Control
            type="password"
            name="password"
            placeholder="Mot de passe"
            value={user.password}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Button type="submit" className="w-100 mt-3 btn-submit">
          Soumettre
        </Button>

        <div className="text-center mt-3">
          <span className="existing-account">
            Vous avez déjà un compte ? <a href="/signin">Se connecter</a>.
          </span>
        </div>
      </Form>
    </div>
  );
}

export default SignUp;
