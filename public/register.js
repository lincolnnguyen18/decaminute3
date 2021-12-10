const form = document.querySelector('#register-form')

form.addEventListener('submit', function(e) {
  const username = document.querySelector('#username').value
  const password1 = document.querySelector('#password').value;
  const password2 = document.querySelector('#password2').value;
  if (!username || !password1 || !password2) {
    e.preventDefault()
    alert('Please fill in all fields')
  } else if (password1 !== password2) {
    e.preventDefault();
    alert('Passwords do not match');
  } else  {
    e.preventDefault();
    fetch(`/api/register`, {
      method: 'POST',
      body: JSON.stringify({
        username: username,
        password: password1
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        window.location.href = '/'
      } else {
        alert(data.error);
      }
    })
  }
})