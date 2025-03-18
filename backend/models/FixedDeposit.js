const mongoose = require('mongoose');

const fixedDepositSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  duration: { type: Number, required: true }, // in months
  startDate: { type: Date, default: Date.now },
  maturityDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'matured'], default: 'active' },
});

module.exports = mongoose.model('FixedDeposit', fixedDepositSchema);
