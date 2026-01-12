const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { initDatabase } = require('./database');
const { registerUser, createMagicLink, verifyToken } = require('./auth');

const app = express();
const PORT = 3000;

const sessions = {};

initDatabase();

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.post('/api/register', (req, res) => {
  const { email } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  
  registerUser(email, (err, result) => {
    if (err) {
      if (err.message === 'User already exists') {
        return res.status(409).json({ error: 'User already exists' });
      }
      return res.status(500).json({ error: 'Server error' });
    }
    
    createMagicLink(email, (err, linkResult) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }
      
      res.json({ 
        message: 'User registered. Magic link generated.',
        magicLink: linkResult.magicLink,
        email: linkResult.email
      });
    });
  });
});

app.post('/api/login', (req, res) => {
  const { email } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  
  createMagicLink(email, (err, result) => {
    if (err) {
      if (err.message === 'User not found. Please register first.') {
        return res.status(404).json({ error: 'User not found. Please register first.' });
      }
      return res.status(500).json({ error: 'Server error' });
    }
    
    res.json({ 
      message: 'Magic link generated',
      magicLink: result.magicLink,
      email: result.email
    });
  });
});

app.get('/api/verify/:token', (req, res) => {
  const { token } = req.params;
  
  verifyToken(token, (err, user) => {
    if (err) {
      return res.status(401).json({ error: err.message });
    }
    
    const sessionToken = crypto.randomBytes(32).toString('hex');
    sessions[sessionToken] = { userId: user.userId, email: user.email };
    
    res.redirect(`/?session=${sessionToken}`);
  });
});

function requireAuth(req, res, next) {
  const sessionToken = req.headers['authorization'] || req.body.sessionToken || req.query.sessionToken;
  
  if (!sessionToken || !sessions[sessionToken]) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.user = sessions[sessionToken];
  next();
}

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ email: req.user.email, userId: req.user.userId });
});

app.post('/api/logout', (req, res) => {
  const { sessionToken } = req.body;
  
  if (sessionToken && sessions[sessionToken]) {
    delete sessions[sessionToken];
  }
  
  res.json({ message: 'Logged out successfully' });
});

app.use(express.static(path.join(__dirname, '../frontend')));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
