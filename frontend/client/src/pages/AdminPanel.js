import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [atmCards, setAtmCards] = useState([]);
  const [creditCards, setCreditCards] = useState([]); // Add state for credit card requests
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

        const creditCardRes = await axios.get('http://localhost:5000/api/admin/credit-cards', config);
        setCreditCards(creditCardRes.data);
      } catch (err) {
        console.error('Error fetching admin data:', err.response?.data?.msg || err.message);
        alert(`Failed to fetch admin data: ${err.response?.data?.msg || 'Unknown error'}`);
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

  const handleCreditCardAction = async (creditCardId, status) => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    await axios.post(`http://localhost:5000/api/admin/credit-card/${creditCardId}`, { status }, config);
    setCreditCards(creditCards.map(card => card._id === creditCardId ? { ...card, status } : card));
  };

  const generateReport = async (userId) => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };

    try {
      const res = await axios.get(`http://localhost:5000/api/account/report/${userId}`, config);
      const reportData = res.data;

      // Convert the report data to a JSON string
      const reportBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const reportUrl = URL.createObjectURL(reportBlob);

      // Create a link to download the report
      const link = document.createElement('a');
      link.href = reportUrl;
      link.download = `user_report_${userId}.json`;
      link.click();

      // Clean up the URL object
      URL.revokeObjectURL(reportUrl);
    } catch (err) {
      console.error('Failed to generate report:', err.response?.data?.msg || err.message);
      alert(`Failed to generate report: ${err.response?.data?.msg || 'Unknown error'}`);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="admin-container">
      <h2 className="admin-title">Admin Panel</h2>

      {/* User Management */}
      <h3 className="admin-subtitle">All Users</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th className="admin-th">Name</th>
            <th className="admin-th">Email</th>
            <th className="admin-th">Balance</th>
            <th className="admin-th">Loan Status</th>
            <th className="admin-th">ATM Status</th>
            <th className="admin-th">Actions</th> {/* Add Actions column */}
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <td className="admin-td">{user.name}</td>
              <td className="admin-td">{user.email}</td>
              <td className="admin-td">${user.balance}</td>
              <td className="admin-td">{user.loanStatus}</td>
              <td className="admin-td">{user.atmCardStatus}</td>
              <td className="admin-td">
                <button
                  onClick={() => generateReport(user._id)}
                  className="admin-button"
                >
                  Generate Report
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Loan Requests */}
      <h3 className="admin-subtitle">Loan Requests</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th className="admin-th">User</th>
            <th className="admin-th">Amount</th>
            <th className="admin-th">Status</th>
            <th className="admin-th">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loans.map(loan => (
            <tr key={loan._id}>
              <td className="admin-td">{loan.userId.name}</td>
              <td className="admin-td">${loan.amount}</td>
              <td className="admin-td">{loan.status}</td>
              <td className="admin-td">
                {loan.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleLoanAction(loan._id, 'approved')}
                      className="admin-button-green"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleLoanAction(loan._id, 'rejected')}
                      className="admin-button-red"
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
      <h3 className="admin-subtitle">ATM Card Requests</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th className="admin-th">User</th>
            <th className="admin-th">Status</th>
            <th className="admin-th">Actions</th>
          </tr>
        </thead>
        <tbody>
          {atmCards.map(atm => (
            <tr key={atm._id}>
              <td className="admin-td">{atm.userId.name}</td>
              <td className="admin-td">{atm.status}</td>
              <td className="admin-td">
                {atm.status === 'applied' && (
                  <>
                    <button
                      onClick={() => handleATMAction(atm._id, 'issued')}
                      className="admin-button-green"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleATMAction(atm._id, 'rejected')}
                      className="admin-button-red"
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

      {/* Credit Card Requests */}
      <h3 className="admin-subtitle">Credit Card Requests</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th className="admin-th">User</th>
            <th className="admin-th">Status</th>
            <th className="admin-th">Actions</th>
          </tr>
        </thead>
        <tbody>
          {creditCards.map(card => (
            <tr key={card._id}>
              <td className="admin-td">{card.userId.name}</td>
              <td className="admin-td">{card.status}</td>
              <td className="admin-td">
                {card.status === 'applied' && (
                  <>
                    <button
                      onClick={() => handleCreditCardAction(card._id, 'approved')}
                      className="admin-button-green"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleCreditCardAction(card._id, 'rejected')}
                      className="admin-button-red"
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