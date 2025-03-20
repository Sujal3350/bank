const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const ATMCard = require('../models/ATMCard');
const FixedDeposit = require('../models/FixedDeposit');
const CreditCard = require('../models/CreditCard');

// Hardcoded admin credentials (for simplicity; in production, store in DB)
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123'; // In production, hash this and store securely

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Add token expiration
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password); // Compare hashed password
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Add token expiration
    res.json({ token });
  } catch (err) {
    console.error(err.message);
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

// Apply for Fixed Deposit (User)
router.post('/fixed-deposit/apply', auth, async (req, res) => {
  const { amount, interestRate, duration } = req.body;
  try {
    const user = await User.findById(req.user);
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + duration);

    const fixedDeposit = new FixedDeposit({
      userId: req.user,
      amount,
      interestRate,
      duration,
      maturityDate,
    });

    await fixedDeposit.save();
    res.json({ msg: 'Fixed Deposit application submitted', fixedDeposit });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get Fixed Deposits (User)
router.get('/fixed-deposits', auth, async (req, res) => {
  const fixedDeposits = await FixedDeposit.find({ userId: req.user });
  res.json(fixedDeposits);
});

// Apply for Credit Card (User)
router.post('/credit-card/apply', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (user.creditCardStatus !== 'none') return res.status(400).json({ msg: 'You already have a credit card request' });

    const creditCard = new CreditCard({ userId: req.user });
    await creditCard.save();
    user.creditCardStatus = 'applied';
    await user.save();
    res.json({ msg: 'Credit card application submitted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get Credit Card Status (User)
router.get('/credit-card/status', auth, async (req, res) => {
  try {
    const creditCard = await CreditCard.findOne({ userId: req.user });
    const user = await User.findById(req.user);
    res.json({ creditCard, creditCardStatus: user.creditCardStatus });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Admin: Get All Users
router.get('/admin/users', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Ensure no sensitive data is returned
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ msg: 'Failed to fetch users' });
  }
});

// Admin: Get All Loan Requests
router.get('/admin/loans', auth, adminAuth, async (req, res) => {
  try {
    const loans = await Loan.find().populate('userId', 'name email'); // Populate user details
    res.json(loans);
  } catch (err) {
    console.error('Error fetching loans:', err.message);
    res.status(500).json({ msg: 'Failed to fetch loans' });
  }
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
  try {
    const atmCards = await ATMCard.find().populate('userId', 'name email'); // Populate user details
    res.json(atmCards);
  } catch (err) {
    console.error('Error fetching ATM card requests:', err.message);
    res.status(500).json({ msg: 'Failed to fetch ATM card requests' });
  }
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

// Admin: Get All Credit Card Requests
router.get('/admin/credit-cards', auth, adminAuth, async (req, res) => {
  try {
    const creditCards = await CreditCard.find().populate('userId', 'name email'); // Populate user details
    res.json(creditCards);
  } catch (err) {
    console.error('Error fetching credit card requests:', err.message);
    res.status(500).json({ msg: 'Failed to fetch credit card requests' });
  }
});

// Admin: Accept/Reject Credit Card Request
router.post('/admin/credit-card/:id', auth, adminAuth, async (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  try {
    const creditCard = await CreditCard.findById(req.params.id);
    if (!creditCard || creditCard.status !== 'applied') {
      return res.status(400).json({ msg: 'Invalid credit card request' });
    }

    const user = await User.findById(creditCard.userId);
    creditCard.status = status;
    user.creditCardStatus = status;
    if (status === 'approved') creditCard.approvedDate = Date.now();
    await creditCard.save();
    await user.save();
    res.json({ msg: `Credit card ${status}` });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Generate Account Report (Admin)
router.get('/account/report/:id', auth, adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      console.error('User ID is missing in the request');
      return res.status(400).json({ msg: 'User ID is required' });
    }

    // Fetch user details
    const user = await User.findById(userId).select('-password');
    if (!user) {
      console.error(`User with ID ${userId} not found`);
      return res.status(404).json({ msg: 'User not found' });
    }

    // Fetch transactions
    const transactions = await Transaction.find({ userId }).lean();

    // Fetch loans
    const loans = await Loan.find({ userId }).lean();

    // Fetch fixed deposits
    const fixedDeposits = await FixedDeposit.find({ userId }).lean();

    // Fetch ATM card details
    const atmCards = await ATMCard.find({ userId }).lean();

    // Fetch credit card details
    const creditCards = await CreditCard.find({ userId }).lean();

    // Construct the report
    const report = {
      user: {
        name: user.name,
        email: user.email,
        balance: user.balance,
        loanStatus: user.loanStatus,
        atmCardStatus: user.atmCardStatus,
        creditCardStatus: user.creditCardStatus,
      },
      transactions: transactions.map(t => ({
        type: t.type,
        amount: t.amount,
        date: t.date ? t.date.toISOString() : null,
        toUserId: t.toUserId,
      })),
      loans: loans.map(l => ({
        amount: l.amount,
        status: l.status,
        date: l.date ? l.date.toISOString() : null,
      })),
      fixedDeposits: fixedDeposits.map(fd => ({
        amount: fd.amount,
        interestRate: fd.interestRate,
        duration: fd.duration,
        maturityDate: fd.maturityDate ? fd.maturityDate.toISOString() : null,
      })),
      atmCards: atmCards.map(atm => ({
        status: atm.status,
        issuedDate: atm.issuedDate ? atm.issuedDate.toISOString() : null,
      })),
      creditCards: creditCards.map(cc => ({
        status: cc.status,
        approvedDate: cc.approvedDate ? cc.approvedDate.toISOString() : null,
      })),
    };

    res.status(200).json(report);
  } catch (err) {
    console.error('Error generating report:', err.message);
    res.status(500).json({ msg: 'Failed to generate report' });
  }
});

module.exports = router;