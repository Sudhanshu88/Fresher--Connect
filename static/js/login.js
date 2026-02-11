(function () {
  const form = document.getElementById('loginForm');
  const toggle = document.getElementById('togglePass');
  const password = document.getElementById('password');

  if (toggle && password) {
    toggle.addEventListener('click', () => {
      const isText = password.type === 'text';
      password.type = isText ? 'password' : 'text';
      toggle.textContent = isText ? 'Show' : 'Hide';
    });
  }

  if (!form) return;
  form.addEventListener('submit', (e) => {
    const email = form.email.value.trim();
    const pass = form.password.value.trim();
    let ok = true;

    const emailErr = form.querySelector('[data-for="email"]');
    const passErr = form.querySelector('[data-for="password"]');
    emailErr.textContent = '';
    passErr.textContent = '';

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      emailErr.textContent = 'Please enter a valid email.';
      ok = false;
    }
    if (!pass || pass.length < 6) {
      passErr.textContent = 'Password must be at least 6 characters.';
      ok = false;
    }

    if (!ok) e.preventDefault();
  });
})();
