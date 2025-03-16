const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const ATMCard = require('../models/ATMCard');

// Hardcoded admin credentials (for simplicity; in production, store in DB)
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123'; // In production, hash this and store securely

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    user = new User({ name, email, password: await bcrypt.hash(password, 10) });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(400).json({ msg: 'Invalid admin credentials' });
  }
  const token = jwt.sign({ id: 'admin', isAdmin: true }, process.env.JWT_SECRET);
  res.json({ token });
});

// Middleware to verify token
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    req.isAdmin = decoded.isAdmin || false;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Admin Middleware
const adminAuth = (req, res, next) => {
  if (!req.isAdmin) return res.status(403).json({ msg: 'Admin access required' });
  next();
};

// Get Account Details (User)
router.get('/account', auth, async (req, res) => {
  const user = await User.findById(req.user).select('-password');
  res.json(user);
});

// Transfer (User)
router.post('/transfer', auth, async (req, res) => {
  const { toEmail, amount } = req.body;
  try {
    const sender = await User.findById(req.user);
    const receiver = await User.findOne({ email: toEmail });
    if (!receiver) return res.status(400).json({ msg: 'Receiver not found' });
    if (sender.balance < amount) return res.status(400).json({ msg: 'Insufficient funds' });

    sender.balance -= amount;
    receiver.balance += amount;
    await sender.save();
    await receiver.save();
    await new Transaction({ userId: req.user, type: 'transfer', amount, toUserId: receiver._id }).save();
    res.json({ balance: sender.balance });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get Transactions (User)
router.get('/transactions', auth, async (req, res) => {
  const transactions = await Transaction.find({ userId: req.user });
  res.json(transactions);
});

// Apply for Loan (User)
router.post('/loan/apply', auth, async (req, res) => {
  const { amount } = req.body;
  try {
    const user = await User.findById(req.user);
    if (user.loanStatus !== 'none') return res.status(400).json({ msg: 'You already have a loan request' });

    const loan = new Loan({ userId: req.user, amount });
    await loan.save();
    user.loanStatus = 'pending';
    await user.save();
    res.json({ msg: 'Loan application submitted', loan });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get Loan Status (User)
router.get('/loan/status', auth, async (req, res) => {
  const loans = await Loan.find({ userId: req.user });
  const user = await User.findById(req.user);
  res.json({ loans, loanAmount: user.loanAmount, loanStatus: user.loanStatus });
});

// Pay Loan (User)
router.post('/loan/pay', auth, async (req, res) => {
  const { amount } = req.body;
  try {
    const user = await User.findById(req.user);
    if (user.loanStatus !== 'approved' || user.loanAmount <= 0) {
      return res.status(400).json({ msg: 'No active loan to pay' });
    }
    if (user.balance < amount) return res.status(400).json({ msg: 'Insufficient funds' });

    user.balance -= amount;
    user.loanAmount -= amount;
    if (user.loanAmount <= 0) {
      user.loanStatus = 'none';
      await Loan.updateOne({ userId: req.user, status: 'approved' }, { status: 'paid' });
    }
    await user.save();
    res.json({ balance: user.balance, loanAmount: user.loanAmount });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Apply for ATM Card (User)
router.post('/atm/apply', auth, async (req, res) => {
  const user = await User.findById(req.user);
  if (user.atmCardStatus !== 'none') return res.status(400).json({ msg: 'You already have an ATM card request' });

  const atmCard = new ATMCard({ userId: req.user });
  await atmCard.save();
  user.atmCardStatus = 'applied';
  await user.save();
  res.json({ msg: 'ATM card application submitted' });
});

// Get ATM Card Status (User)
router.get('/atm/status', auth, async (req, res) => {
  const atmCards = await ATMCard.find({ userId: req.user });
  const user = await User.findById(req.user);
  res.json({ atmCards, atmCardStatus: user.atmCardStatus });
});

// Admin: Get All Users
router.get('/admin/users', auth, adminAuth, async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

// Admin: Get All Loan Requests
router.get('/admin/loans', auth, adminAuth, async (req, res) => {
  const loans = await Loan.find().populate('userId', 'name email');
  res.json(loans);
});

// Admin: Accept/Reject Loan Request
router.post('/admin/loan/:id', auth, adminAuth, async (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan || loan.status !== 'pending') return res.status(400).json({ msg: 'Invalid loan request' });

    const user = await User.findById(loan.userId);
    loan.status = status;
    if (status === 'approved') {
      user.loanStatus = 'approved';
      user.loanAmount = loan.amount;
      user.balance += loan.amount; // Add loan amount to balance
    } else {
      user.loanStatus = 'rejected';
    }
    await loan.save();
    await user.save();
    res.json({ msg: `Loan ${status}` });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Admin: Get All ATM Card Requests
router.get('/admin/atm', auth, adminAuth, async (req, res) => {
  const atmCards = await ATMCard.find().populate('userId', 'name email');
  res.json(atmCards);
});

// Admin: Accept/Reject ATM Card Request
router.post('/admin/atm/:id', auth, adminAuth, async (req, res) => {
  const { status } = req.body; // 'issued' or 'rejected'
  try {
    const atmCard = await ATMCard.findById(req.params.id);
    if (!atmCard || atmCard.status !== 'applied') return res.status(400).json({ msg: 'Invalid ATM card request' });

    const user = await User.findById(atmCard.userId);
    atmCard.status = status;
    user.atmCardStatus = status;
    if (status === 'issued') atmCard.issuedDate = Date.now();
    await atmCard.save();
    await user.save();
    res.json({ msg: `ATM card ${status}` });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;