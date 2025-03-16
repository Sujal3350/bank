const mongoose = require('mongoose');

const atmCardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['applied', 'issued', 'rejected'], default: 'applied' },
  appliedDate: { type: Date, default: Date.now },
  issuedDate: { type: Date },
});

module.exports = mongoose.model('ATMCard', atmCardSchema);