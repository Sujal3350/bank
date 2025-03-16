import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

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
    <form onSubmit={handleSubmit} className="form-container">
      <h2 className="form-title">Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="form-input"
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="form-input"
      />
      <button
        type="submit"
        className="form-button"
      >
        Login
      </button>
      {/* <p className="form-note">Admin login: admin@example.com / admin123</p> */}
    </form>
  );
};

export default Login;