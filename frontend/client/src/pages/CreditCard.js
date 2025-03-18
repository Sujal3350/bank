import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CreditCard.css';

const CreditCard = () => {
  const [creditCardStatus, setCreditCardStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const config = { headers: { 'x-auth-token': token } };
      try {
        const res = await axios.get('http://localhost:5000/api/credit-card/status', config);
        setCreditCardStatus(res.data.creditCardStatus);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setError('Failed to fetch credit card status'); // Set error message
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, [navigate]);

  const applyCreditCard = async () => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    try {
      await axios.post('http://localhost:5000/api/credit-card/apply', {}, config);
      setCreditCardStatus('applied');
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to apply for credit card'); // Set error message
      }
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="credit-card-container">
      <h2 className="credit-card-title">Credit Card Application</h2>
      {error && <p className="error-message">{error}</p>} {/* Display error message */}
      {creditCardStatus === 'none' ? (
        <button onClick={applyCreditCard} className="credit-card-button">
          Apply for Credit Card
        </button>
      ) : (
        <p>Your credit card application status: {creditCardStatus}</p>
      )}
    </div>
  );
};

export default CreditCard;
