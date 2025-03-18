const mongoose = require('mongoose');

const creditCardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['applied', 'approved', 'rejected'], default: 'applied' },
  appliedDate: { type: Date, default: Date.now },
  approvedDate: { type: Date },
});

module.exports = mongoose.model('CreditCard', creditCardSchema);
