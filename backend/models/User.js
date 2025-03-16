const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  loanAmount: { type: Number, default: 0 }, // Total loan amount taken
  loanStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' }, // Loan application status
  atmCardStatus: { type: String, enum: ['none', 'applied', 'issued', 'rejected'], default: 'none' }, // ATM card status
});

module.exports = mongoose.model('User', userSchema);