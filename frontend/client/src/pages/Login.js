import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (form.email === 'admin@example.com') {
        res = await axios.post('http://localhost:5000/api/admin/login', form);
        navigate('/admin'); // Redirect to admin panel
      } else {
        res = await axios.post('http://localhost:5000/api/login', form);
        navigate('/'); // Redirect to home
      }
      localStorage.setItem('token', res.data.token);
      alert('Login successful!');
    } catch (err) {
      alert(err.response?.data?.msg || 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '20px auto' }}>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
      />
      <button
        type="submit"
        style={{
          padding: '10px',
          width: '100%',
          background: '#007bff',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Login
      </button>
      <p style={{ marginTop: '10px' }}>Admin login: admin@example.com / admin123</p>
    </form>
  );
};

export default Login;