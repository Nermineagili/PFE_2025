import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const confirmPayment = async () => {
      const query = new URLSearchParams(location.search);
      const paymentIntentId = query.get('payment_intent');
      
      if (!paymentIntentId) {
        navigate('/');
        return;
      }

      try {
        const token = localStorage.getItem('authToken');
        await axios.post('http://localhost:5000/api/contracts/confirm-payment', {
          paymentIntentId
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Show success message or redirect
      } catch (error) {
        console.error('Erreur lors de la confirmation du paiement:', error);
        navigate('/');
      }
    };

    confirmPayment();
  }, [location, navigate]);

  return (
    <div className="payment-success">
      <h2>Paiement réussi !</h2>
      <p>Votre contrat a été créé avec succès.</p>
    </div>
  );
};

export default PaymentSuccess;