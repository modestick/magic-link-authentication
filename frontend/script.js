  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const logoutBtn = document.querySelector('.logout');
  const navbar = document.querySelector('.navbar');
  const loginStatus = document.getElementById('loginStatus');
  const signupBox = document.querySelector('.signup');
  const loginBox = document.querySelector('.login');
  const myNotesBtn = document.querySelector('.my-notes');



  function loginUser(email) {
    navbar.style.display = 'flex';       
    loginStatus.textContent = `Logged in as ${email}`;
    loginBox.style.display = 'none';
    signupBox.style.display = 'none';
  }


  function logoutUser() {
    navbar.style.display = 'none';     
    loginBox.style.display = 'block';
    signupBox.style.display = 'block';
    loginStatus.textContent = 'You are not logged in';
  }

  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = loginForm.email.value;
    loginUser(email);
    loginForm.reset();
    document.getElementById('loginMessage').textContent = '';
  });

  signupForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = signupForm.email.value;
    loginUser(email); 
    signupForm.reset();
    document.getElementById('signupMessage').textContent = '';

  });

  myNotesBtn.addEventListener('click', function() {
    alert('Coming soon!');
  });


  logoutBtn.addEventListener('click', logoutUser);
