const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true }, // Ensure email is stored in lowercase
  password: { type: String, required: true, minlength: 6 }, // Add minimum password length
  balance: { type: Number, default: 0 },
  loanAmount: { type: Number, default: 0 }, // Total loan amount taken
  loanStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' }, // Loan application status
  atmCardStatus: { type: String, enum: ['none', 'applied', 'issued', 'rejected'], default: 'none' }, // ATM card status
  creditCardStatus: { type: String, enum: ['none', 'applied', 'approved', 'rejected'], default: 'none' }, // Credit card status
});

module.exports = mongoose.model('User', userSchema);