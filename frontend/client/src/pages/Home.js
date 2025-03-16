import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [account, setAccount] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [transferAmount, setTransferAmount] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanStatus, setLoanStatus] = useState({});
  const [paymentAmount, setPaymentAmount] = useState('');
  const [atmStatus, setAtmStatus] = useState({});
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      try {
        const accountRes = await axios.get('http://localhost:5000/api/account', config);
        setAccount(accountRes.data);
        const transRes = await axios.get('http://localhost:5000/api/transactions', config);
        setTransactions(transRes.data);
        const loanRes = await axios.get('http://localhost:5000/api/loan/status', config);
        setLoanStatus(loanRes.data);
        const atmRes = await axios.get('http://localhost:5000/api/atm/status', config);
        setAtmStatus(atmRes.data);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };
    fetchData();
  }, [isLoggedIn, navigate]);

  const transfer = async () => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    const res = await axios.post('http://localhost:5000/api/transfer', { toEmail, amount: Number(transferAmount) }, config);
    setAccount({ ...account, balance: res.data.balance });
    setTransferAmount('');
    setToEmail('');
  };

  const applyLoan = async () => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    await axios.post('http://localhost:5000/api/loan/apply', { amount: Number(loanAmount) }, config);
    const res = await axios.get('http://localhost:5000/api/loan/status', config);
    setLoanStatus(res.data);
    setLoanAmount('');
  };

  const payLoan = async () => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    const res = await axios.post('http://localhost:5000/api/loan/pay', { amount: Number(paymentAmount) }, config);
    setAccount({ ...account, balance: res.data.balance });
    setLoanStatus({ ...loanStatus, loanAmount: res.data.loanAmount });
    setPaymentAmount('');
  };

  const applyATM = async () => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    await axios.post('http://localhost:5000/api/atm/apply', {}, config);
    const res = await axios.get('http://localhost:5000/api/atm/status', config);
    setAtmStatus(res.data);
  };

  if (!isLoggedIn) {
    return (
      <div className="container">
        <h2 className="title">Please log in to access your banking dashboard</h2>
        <button
          onClick={() => navigate('/login')}
          className="button"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <h2 className="title">Banking Dashboard</h2>

      {/* Account Details */}
      <h3 className="subtitle">Account Details</h3>
      <p>Name: {account.name}</p>
      <p>Email: {account.email}</p>
      <p>Balance: ${account.balance}</p>

      {/* Transfer */}
      <h3 className="subtitle">Transfer Money</h3>
      <input
        type="number"
        placeholder="Amount"
        value={transferAmount}
        onChange={(e) => setTransferAmount(e.target.value)}
        className="input"
      />
      <input
        type="email"
        placeholder="Recipient Email"
        value={toEmail}
        onChange={(e) => setToEmail(e.target.value)}
        className="input"
      />
      <button
        onClick={transfer}
        className="button"
      >
        Transfer
      </button>

      {/* Loan Application */}
      <h3 className="subtitle">Apply for Loan</h3>
      <input
        type="number"
        placeholder="Loan Amount"
        value={loanAmount}
        onChange={(e) => setLoanAmount(e.target.value)}
        className="input"
        disabled={loanStatus.loanStatus !== 'none'}
      />
      <button
        onClick={applyLoan}
        className="button-green"
        disabled={loanStatus.loanStatus !== 'none'}
      >
        Apply for Loan
      </button>
      <p>Loan Status: {loanStatus.loanStatus}</p>
      <p>Loan Amount: ${loanStatus.loanAmount || 0}</p>

      {/* Loan Payment */}
      {loanStatus.loanStatus === 'approved' && (
        <>
          <h3 className="subtitle">Pay Loan</h3>
          <input
            type="number"
            placeholder="Payment Amount"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            className="input"
          />
          <button
            onClick={payLoan}
            className="button-red"
          >
            Pay Loan
          </button>
        </>
      )}

      {/* ATM Card Application */}
      <h3 className="subtitle">ATM Card Service</h3>
      <button
        onClick={applyATM}
        className="button"
        disabled={atmStatus.atmCardStatus !== 'none'}
      >
        Apply for ATM Card
      </button>
      <p>ATM Card Status: {atmStatus.atmCardStatus}</p>

      {/* Transactions */}
      <h3 className="subtitle">Transactions</h3>
      <ul className="list">
        {transactions.map((t) => (
          <li key={t._id}>
            {t.type} - ${t.amount} - {new Date(t.date).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;