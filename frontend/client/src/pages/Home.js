import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
    await axios.post('http://localhost:5000/api/atm/apply',{}, config);
    const res = await axios.get('http://localhost:5000/api/atm/status', config);
    setAtmStatus(res.data);
  };

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: '600px', margin: '20px auto' }}>
        <h2>Please log in to access your banking dashboard</h2>
        <button
          onClick={() => navigate('/login')}
          style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none' }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto' }}>
      <h2>Banking Dashboard</h2>

      {/* Account Details */}
      <h3>Account Details</h3>
      <p>Name: {account.name}</p>
      <p>Email: {account.email}</p>
      <p>Balance: ${account.balance}</p>

      {/* Transfer */}
      <h3>Transfer Money</h3>
      <input
        type="number"
        placeholder="Amount"
        value={transferAmount}
        onChange={(e) => setTransferAmount(e.target.value)}
        style={{ margin: '10px 0', padding: '8px' }}
      />
      <input
        type="email"
        placeholder="Recipient Email"
        value={toEmail}
        onChange={(e) => setToEmail(e.target.value)}
        style={{ margin: '10px 0', padding: '8px', width: '100%' }}
      />
      <button
        onClick={transfer}
        style={{ padding: '10px', width: '100%', background: '#007bff', color: 'white', border: 'none' }}
      >
        Transfer
      </button>

      {/* Loan Application */}
      <h3>Apply for Loan</h3>
      <input
        type="number"
        placeholder="Loan Amount"
        value={loanAmount}
        onChange={(e) => setLoanAmount(e.target.value)}
        style={{ margin: '10px 0', padding: '8px' }}
        disabled={loanStatus.loanStatus !== 'none'}
      />
      <button
        onClick={applyLoan}
        style={{ padding: '10px', margin: '5px', background: '#28a745', color: 'white', border: 'none' }}
        disabled={loanStatus.loanStatus !== 'none'}
      >
        Apply for Loan
      </button>
      <p>Loan Status: {loanStatus.loanStatus}</p>
      <p>Loan Amount: ${loanStatus.loanAmount || 0}</p>

      {/* Loan Payment */}
      {loanStatus.loanStatus === 'approved' && (
        <>
          <h3>Pay Loan</h3>
          <input
            type="number"
            placeholder="Payment Amount"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            style={{ margin: '10px 0', padding: '8px' }}
          />
          <button
            onClick={payLoan}
            style={{ padding: '10px', margin: '5px', background: '#dc3545', color: 'white', border: 'none' }}
          >
            Pay Loan
          </button>
        </>
      )}

      {/* ATM Card Application */}
      <h3>ATM Card Service</h3>
      <button
        onClick={applyATM}
        style={{ padding: '10px', margin: '5px', background: '#007bff', color: 'white', border: 'none' }}
        disabled={atmStatus.atmCardStatus !== 'none'}
      >
        Apply for ATM Card
      </button>
      <p>ATM Card Status: {atmStatus.atmCardStatus}</p>

      {/* Transactions */}
      <h3>Transactions</h3>
      <ul>
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