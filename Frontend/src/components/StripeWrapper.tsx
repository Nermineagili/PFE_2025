// StripeWrapper.tsx
import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import SubscribeForm from './SubscribeForm';

// Make sure to replace with your actual publishable key from your Stripe Dashboard
const stripePromise = loadStripe('pk_test_51RGfyVP1ptjuDMivnyvEdnXY9jdu6OVzAwINhHCIh2A7X2yPIMQwaRl8y3TficshmOy5L9axQfZRl7wpBSqmGVPW00XwIi3q0L');

const StripeWrapper: React.FC = () => {
  const options = {
    // Properly typed appearance options
    appearance: {
      theme: 'stripe' as const, // Use 'as const' to ensure TypeScript interprets this as a literal
      variables: {
        colorPrimary: '#153a64',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'Roboto, Open Sans, Segoe UI, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <SubscribeForm />
    </Elements>
  );
};

export default StripeWrapper;