const API_URL = '/api';

const logoutBtn = document.querySelector('.logout');
const navbar = document.querySelector('.navbar');
const loginStatus = document.getElementById('loginStatus');
const notesSection = document.getElementById('notesSection');

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
  } else {
    window.location.href = 'index.html';
  }
}

function checkSession() {
  if (!sessionToken) {
    window.location.href = 'index.html';
    return;
  }
  
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
    loginStatus.textContent = `Logged in as ${data.email}`;
    navbar.style.display = 'flex';
    loadItems();
  })
  .catch(err => {
    sessionToken = null;
    localStorage.removeItem('sessionToken');
    window.location.href = 'index.html';
  });
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
  window.location.href = 'index.html';
}

function loadItems() {
  if (!sessionToken) return;
  
  fetch(`${API_URL}/my-items`, {
    headers: {
      'Authorization': sessionToken
    }
  })
  .then(res => {
    if (res.status === 401) {
      window.location.href = 'index.html';
      throw new Error('Session expired');
    }
    return res.json();
  })
  .then(items => {
    displayItems(items);
  })
  .catch(err => {
    console.error('Error loading items:', err);
  });
}

function displayItems(items) {
  const list = document.getElementById('itemsList');
  if (!list) return;
  
  if (items.length === 0) {
    list.innerHTML = '<p>No notes yet. Add your first note!</p>';
    return;
  }
  
  list.innerHTML = '<h3>Your notes:</h3>';
  items.forEach(item => {
    const itemDiv = document.createElement('div');
    itemDiv.style.border = '2px solid black';
    itemDiv.style.borderRadius = '8px';
    itemDiv.style.padding = '15px';
    itemDiv.style.margin = '10px 0';
    itemDiv.innerHTML = `
      <h4>${escapeHtml(item.title)}</h4>
      <p>${escapeHtml(item.content || '')}</p>
      <button class="btn edit-item" data-id="${item.id}">Edit</button>
      <button class="btn delete-item" data-id="${item.id}">Delete</button>
    `;
    list.appendChild(itemDiv);
  });
  
  list.querySelectorAll('.edit-item').forEach(btn => {
    btn.addEventListener('click', function() {
      const itemId = this.getAttribute('data-id');
      editItem(itemId);
    });
  });
  
  list.querySelectorAll('.delete-item').forEach(btn => {
    btn.addEventListener('click', function() {
      const itemId = this.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this note?')) {
        deleteItem(itemId);
      }
    });
  });
}

function editItem(id) {
  fetch(`${API_URL}/my-items`, {
    headers: {
      'Authorization': sessionToken
    }
  })
  .then(res => res.json())
  .then(items => {
    const item = items.find(i => i.id == id);
    if (item) {
      document.getElementById('itemTitle').value = item.title;
      document.getElementById('itemContent').value = item.content || '';
      document.getElementById('itemId').value = item.id;
      document.getElementById('cancelEdit').style.display = 'inline-block';
      document.getElementById('itemForm').scrollIntoView({ behavior: 'smooth' });
    }
  });
}

function deleteItem(id) {
  fetch(`${API_URL}/my-items/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': sessionToken
    }
  })
  .then(res => {
    if (res.status === 401) {
      window.location.href = 'index.html';
      throw new Error('Session expired');
    }
    return res.json();
  })
  .then(data => {
    loadItems();
  })
  .catch(err => {
    console.error('Error deleting item:', err);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.getElementById('itemForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const title = document.getElementById('itemTitle').value.trim();
  const content = document.getElementById('itemContent').value.trim();
  const itemId = document.getElementById('itemId').value;
  
  if (!title) {
    alert('Title is required');
    return;
  }
  
  if (itemId) {
    updateItem(itemId, title, content);
  } else {
    createItem(title, content);
  }
});

document.getElementById('cancelEdit').addEventListener('click', function() {
  document.getElementById('itemForm').reset();
  document.getElementById('itemId').value = '';
  document.getElementById('cancelEdit').style.display = 'none';
});

function createItem(title, content) {
  fetch(`${API_URL}/my-items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': sessionToken
    },
    body: JSON.stringify({ title, content })
  })
  .then(res => {
    if (res.status === 401) {
      window.location.href = 'index.html';
      throw new Error('Session expired');
    }
    return res.json();
  })
  .then(data => {
    document.getElementById('itemForm').reset();
    loadItems();
  })
  .catch(err => {
    console.error('Error creating item:', err);
    alert('Error creating note');
  });
}

function updateItem(id, title, content) {
  fetch(`${API_URL}/my-items/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': sessionToken
    },
    body: JSON.stringify({ title, content })
  })
  .then(res => {
    if (res.status === 401) {
      window.location.href = 'index.html';
      throw new Error('Session expired');
    }
    return res.json();
  })
  .then(data => {
    document.getElementById('itemForm').reset();
    document.getElementById('itemId').value = '';
    document.getElementById('cancelEdit').style.display = 'none';
    loadItems();
  })
  .catch(err => {
    console.error('Error updating item:', err);
    alert('Error updating note');
  });
}

logoutBtn.addEventListener('click', logoutUser);

window.addEventListener('DOMContentLoaded', function() {
  loadSession();
});
