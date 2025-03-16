import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [atmCards, setAtmCards] = useState([]);
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      try {
        const usersRes = await axios.get('http://localhost:5000/api/admin/users', config);
        setUsers(usersRes.data);
        const loansRes = await axios.get('http://localhost:5000/api/admin/loans', config);
        setLoans(loansRes.data);
        const atmRes = await axios.get('http://localhost:5000/api/admin/atm', config);
        setAtmCards(atmRes.data);
      } catch (err) {
        if (err.response?.status === 403 || err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };
    fetchData();
  }, [isLoggedIn, navigate]);

  const handleLoanAction = async (loanId, status) => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    await axios.post(`http://localhost:5000/api/admin/loan/${loanId}`, { status }, config);
    setLoans(loans.map(loan => loan._id === loanId ? { ...loan, status } : loan));
  };

  const handleATMAction = async (atmId, status) => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    await axios.post(`http://localhost:5000/api/admin/atm/${atmId}`, { status }, config);
    setAtmCards(atmCards.map(atm => atm._id === atmId ? { ...atm, status } : atm));
  };

  if (!isLoggedIn) return null;

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto' }}>
      <h2>Admin Panel</h2>

      {/* User Management */}
      <h3>All Users</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Name</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Email</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Balance</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Loan Status</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>ATM Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.email}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>${user.balance}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.loanStatus}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.atmCardStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Loan Requests */}
      <h3>Loan Requests</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>User</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Amount</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loans.map(loan => (
            <tr key={loan._id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{loan.userId.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>${loan.amount}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{loan.status}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {loan.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleLoanAction(loan._id, 'approved')}
                      style={{ background: '#28a745', color: 'white', border: 'none', padding: '5px', margin: '0 5px' }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleLoanAction(loan._id, 'rejected')}
                      style={{ background: '#dc3545', color: 'white', border: 'none', padding: '5px', margin: '0 5px' }}
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ATM Card Requests */}
      <h3>ATM Card Requests</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>User</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {atmCards.map(atm => (
            <tr key={atm._id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{atm.userId.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{atm.status}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {atm.status === 'applied' && (
                  <>
                    <button
                      onClick={() => handleATMAction(atm._id, 'issued')}
                      style={{ background: '#28a745', color: 'white', border: 'none', padding: '5px', margin: '0 5px' }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleATMAction(atm._id, 'rejected')}
                      style={{ background: '#dc3545', color: 'white', border: 'none', padding: '5px', margin: '0 5px' }}
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPanel;