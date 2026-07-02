import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import InputField from '../../components/common/InputField';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Call Backend
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data); // "If an account exists..."
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-center text-blue-600 dark:text-blue-400 mb-4">Reset Password</h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6 text-sm">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {message ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm text-center">
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <InputField 
              label="Email Address" 
              type="email" 
              placeholder="Enter your registered email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
            
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className={`w-full mt-4 text-white font-bold py-2 px-4 rounded transition duration-300 ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;