const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending' },
  appliedDate: { type: Date, default: Date.now },
  approvedDate: { type: Date },
});

module.exports = mongoose.model('Loan', loanSchema);