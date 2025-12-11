require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const app = express();

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Database
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Models
const User = require('./models/User');
const Message = require('./models/Message');
const VIP = require('./models/VIP');

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword
    });
    await user.save();
    res.redirect('/login');
  } catch (err) {
    res.send('Error registering user.');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user && await bcrypt.compare(req.body.password, user.password)) {
    req.session.userId = user._id;
    res.redirect('/message');
  } else {
    res.send('Invalid credentials.');
  }
});

app.get('/message', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  res.render('message');
});

app.post('/message', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const message = new Message({
    userId: req.session.userId,
    content: req.body.content,
    email: req.body.email
  });
  await message.save();
  res.send('Message sent!');
});

app.get('/vip', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  res.render('vip');
});

app.post('/vip', multer({ dest: 'public/uploads/' }).single('giftcard'), async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const vip = new VIP({
    userId: req.session.userId,
    giftcard: req.file.filename,
    name: req.body.name,
    email: req.body.email
  });
  await vip.save();
  res.send('VIP request submitted!');
});

// Admin Routes (hidden)
app.get('/admin', (req, res) => {
  if (!req.session.admin) return res.redirect('/login');
  res.render('admin/dashboard');
});

app.post('/admin/login', async (req, res) => {
  if (req.body.username === 'THEROCK' && req.body.password === 'dwayne2020') {
    req.session.admin = true;
    res.redirect('/admin');
  } else {
    res.send('Invalid admin credentials.');
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
