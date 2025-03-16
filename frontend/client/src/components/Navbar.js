import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Add useNavigate for redirection

const Navbar = () => {
  const navigate = useNavigate(); // For redirecting after logout
  const isLoggedIn = !!localStorage.getItem('token'); // Check if token exists

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the token
    navigate('/login'); // Redirect to login page
  };

  return (
    <nav style={{ background: '#333', padding: '10px', color: 'white' }}>
      <Link to="/" style={{ color: 'white', margin: '0 10px' }}>Home</Link>
      {!isLoggedIn ? (
        <>
          <Link to="/login" style={{ color: 'white', margin: '0 10px' }}>Login</Link>
          <Link to="/register" style={{ color: 'white', margin: '0 10px' }}>Register</Link>
        </>
      ) : (
        <button
          onClick={handleLogout}
          style={{
            background: '#dc3545', // Red color for logout
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            margin: '0 10px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      )}
    </nav>
  );
};

export default Navbar;