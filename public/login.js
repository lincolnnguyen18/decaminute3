let loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  let username = document.getElementById('username').value;
  let password = document.getElementById('password').value;
  if (!username || !password) {
    alert('Please fill in all fields');
    return;
  }
  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  })
    .then(response => response.json())
    .then(data => {
      if (!data.error) {
        window.location.href = '/';
      } else {
        alert(data.error);
      }
    })
    .catch(err => {
      console.log(err);
    });
});