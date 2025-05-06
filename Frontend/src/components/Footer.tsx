// src/components/Footer.tsx
import React from 'react';
import './Footer.css';
import { FaFacebookF, FaTwitter, FaLinkedinIn } from 'react-icons/fa'; // Importing the icons

// Import the logo image
import logo from '../assets/logo.png'; // Adjust the path as needed

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">


        <nav className="footer-nav">
          <a href="#homepage" className="footer-link">Acceuil</a>
          <a href="#about" className="footer-link">A propos</a>
          <a href="#services" className="footer-link">Services</a>
          <a href="#contact" className="footer-link">Contact</a>
        </nav>
        

        <div className="footer-social">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer-social-link">
            <FaFacebookF className="footer-icon" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer-social-link">
            <FaTwitter className="footer-icon" />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="footer-social-link">
            <FaLinkedinIn className="footer-icon" />
          </a>
        </div>
                {/* Logo in the Footer */}
                <div className="footer-logo">
          <img src={logo} alt="Insurance App Logo" className="footer-logo-img" />
        </div>
        <div className="footer-copy">
          <p>&copy; {new Date().getFullYear()} YOMI Assurance. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
