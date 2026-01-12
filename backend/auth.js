const crypto = require('crypto');
const { getDatabase } = require('./database');

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function registerUser(email, callback) {
  const db = getDatabase();
  
  db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return callback(err, null);
    }
    
    if (user) {
      return callback(new Error('User already exists'), null);
    }
    
    db.run('INSERT INTO users (email) VALUES (?)', [email], function(err) {
      if (err) {
        return callback(err, null);
      }
      callback(null, { userId: this.lastID, email });
    });
  });
}

function createMagicLink(email, callback) {
  const db = getDatabase();
  
  db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return callback(err, null);
    }
    
    if (!user) {
      return callback(new Error('User not found. Please register first.'), null);
    }
    
    createLinkForUser(user.id, email, callback);
  });
}

function createLinkForUser(userId, email, callback) {
  const db = getDatabase();
  const token = generateToken();
  
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  
  db.run(
    'INSERT INTO magic_links (token, user_id, expires_at) VALUES (?, ?, ?)',
    [token, userId, expiresAt.toISOString()],
    function(err) {
      if (err) {
        return callback(err, null);
      }
      
      const magicLink = `http://localhost:3000/api/verify/${token}`;
      callback(null, { magicLink, email });
    }
  );
}

function verifyToken(token, callback) {
  const db = getDatabase();
  
  db.get(
    `SELECT ml.*, u.email 
     FROM magic_links ml 
     JOIN users u ON ml.user_id = u.id 
     WHERE ml.token = ? AND ml.used = 0`,
    [token],
    (err, row) => {
      if (err) {
        return callback(err, null);
      }
      
      if (!row) {
        return callback(new Error('Token does not exist or has already been used'), null);
      }
      
      const now = new Date();
      const expiresAt = new Date(row.expires_at);
      
      if (now > expiresAt) {
        return callback(new Error('Token has expired'), null);
      }
      
      db.run('UPDATE magic_links SET used = 1 WHERE token = ?', [token], (err) => {
        if (err) {
          return callback(err, null);
        }
        
        callback(null, { userId: row.user_id, email: row.email });
      });
    }
  );
}

module.exports = { registerUser, createMagicLink, verifyToken };
