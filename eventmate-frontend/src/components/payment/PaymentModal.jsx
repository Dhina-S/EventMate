import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import api from '../../services/api'; 
import { FaTimes } from 'react-icons/fa';


const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_51TmTl6JAQSCOJhc8ldgvycO7gxDF8ATc6Txw2WVvff5WDh1AInRB4pB5oci1c3W3xqJB2JHBBfe8bnVXBWl9lQUC00rBLq8t6L";
const stripePromise = loadStripe(stripeKey, {
  developerTools: {
    assistant: {
      enabled: false, 
    }
  }
});

const PaymentModal = ({ bookingId, amount, onClose, onPaymentSuccess }) => {
  const [clientSecret, setClientSecret] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchClientSecret = async () => {
      try {
        console.log("Initializing payment for amount:", amount); // Debug log
        const res = await api.post("/api/payment/create-payment-intent", { amount });
        setClientSecret(res.data.clientSecret);
      } catch (err) {
        console.error("Failed to init payment:", err.response ? err.response.data : err.message);
        setErrorMsg("Failed to load payment. Check console for details.");
        // Do not verify alert immediately so user can see the error message in UI if needed
      }
    };

    if (amount > 0) fetchClientSecret();
  }, [amount]);

  const handleSuccess = async (_paymentIntent) => {
    try {
      await api.put(`/api/bookings/confirm/${bookingId}`);
      onPaymentSuccess(); 
    } catch (err) {
      console.error("Confirmation failed", err);
      alert("Payment successful! Redirecting...");
      onPaymentSuccess(); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl relative my-auto">
        
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white rounded-t-2xl sticky top-0 z-10">
          <h3 className="font-bold text-lg">Secure Payment</h3>
          <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded">
            <FaTimes />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="mb-6 text-center">
            <p className="text-gray-500 text-sm">Total Amount</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">₹{amount}</p>
          </div>

          {errorMsg ? (
            <div className="text-red-500 text-center p-4 bg-red-50 rounded">
              {errorMsg} <br/>
              <button onClick={onClose} className="mt-2 text-sm underline">Close</button>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm onSuccess={handleSuccess} onCancel={onClose} />
            </Elements>
          ) : (
            <div className="text-center py-10">Loading Payment Gateway...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;