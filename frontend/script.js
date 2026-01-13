const API_URL = '/api';

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const logoutBtn = document.querySelector('.logout');
const navbar = document.querySelector('.navbar');
const loginStatus = document.getElementById('loginStatus');
const signupBox = document.querySelector('.signup');
const loginBox = document.querySelector('.login');
const myNotesBtn = document.querySelector('.my-notes');
const loginMessage = document.getElementById('loginMessage');
const signupMessage = document.getElementById('signupMessage');

let sessionToken = null;
let currentUser = null;

function saveSession(token) {
  sessionToken = token;
  localStorage.setItem('sessionToken', token);
}

function loadSession() {
  const token = localStorage.getItem('sessionToken');
  if (token) {
    sessionToken = token;
    checkSession();
  }
}

function checkSession() {
  if (!sessionToken) return;
  
  fetch(`${API_URL}/me`, {
    headers: {
      'Authorization': sessionToken
    }
  })
  .then(res => {
    if (res.ok) {
      return res.json();
    } else {
      throw new Error('Session expired');
    }
  })
  .then(data => {
    currentUser = data;
    loginUser(data.email);
  })
  .catch(err => {
    sessionToken = null;
    localStorage.removeItem('sessionToken');
    logoutUser();
  });
}

function loginUser(email) {
  navbar.style.display = 'flex';
  loginStatus.textContent = `Logged in as ${email}`;
  loginBox.style.display = 'none';
  signupBox.style.display = 'none';
}

function logoutUser() {
  if (sessionToken) {
    fetch(`${API_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionToken })
    });
  }
  
  sessionToken = null;
  localStorage.removeItem('sessionToken');
  currentUser = null;
  navbar.style.display = 'none';
  loginBox.style.display = 'block';
  signupBox.style.display = 'block';
  loginStatus.textContent = 'You are not logged in';
}

function handleMagicLink() {
  const urlParams = new URLSearchParams(window.location.search);
  const session = urlParams.get('session');
  
  if (session) {
    saveSession(session);
    checkSession();
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

loginForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const email = loginForm.email.value.trim();
  
  if (!email || !email.includes('@')) {
    loginMessage.textContent = 'Invalid email';
    loginMessage.style.color = 'red';
    return;
  }
  
  loginMessage.textContent = 'Generating magic link...';
  loginMessage.style.color = 'blue';
  
  fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      loginMessage.textContent = data.error;
      loginMessage.style.color = 'red';
    } else {
      loginMessage.innerHTML = `Magic link generated!<br><a href="${data.magicLink}" target="_blank">Click here to login</a><br><small>Or copy link: ${data.magicLink}</small>`;
      loginMessage.style.color = 'green';
    }
  })
  .catch(err => {
    loginMessage.textContent = 'Server connection error';
    loginMessage.style.color = 'red';
  });
  
  loginForm.reset();
});

signupForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const email = signupForm.email.value.trim();
  
  if (!email || !email.includes('@')) {
    signupMessage.textContent = 'Invalid email';
    signupMessage.style.color = 'red';
    return;
  }
  
  signupMessage.textContent = 'Registering and generating magic link...';
  signupMessage.style.color = 'blue';
  
  fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      signupMessage.textContent = data.error;
      signupMessage.style.color = 'red';
    } else {
      signupMessage.innerHTML = `User registered! Magic link generated.<br><a href="${data.magicLink}" target="_blank">Click here to login</a><br><small>Or copy link: ${data.magicLink}</small>`;
      signupMessage.style.color = 'green';
    }
  })
  .catch(err => {
    signupMessage.textContent = 'Server connection error';
    signupMessage.style.color = 'red';
  });
  
  signupForm.reset();
});

logoutBtn.addEventListener('click', logoutUser);

myNotesBtn.addEventListener('click', function() {
  if (sessionToken) {
    window.location.href = 'my-notes.html';
  }
});

window.addEventListener('DOMContentLoaded', function() {
  handleMagicLink();
  loadSession();
});
