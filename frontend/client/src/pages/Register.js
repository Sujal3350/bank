import React, { useState } from 'react';
import axios from 'axios';
import './Register.css';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/register', form);
      localStorage.setItem('token', res.data.token);
      alert('Registration successful!');
    } catch (err) {
      alert(err.response.data.msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2 className="form-title">Register</h2>
      <input
        type="text"
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="form-input"
      />
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
      <button type="submit" className="form-button">
        Register
      </button>
    </form>
  );
};

export default Register;