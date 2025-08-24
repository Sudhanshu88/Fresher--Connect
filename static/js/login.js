(function () {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    // Simple client validation
    const email = form.email.value.trim();
    const password = form.password.value.trim();
    let ok = true;

    const emailErr = form.querySelector('[data-for="email"]');
    const passErr = form.querySelector('[data-for="password"]');

    emailErr.textContent = '';
    passErr.textContent = '';

    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      emailErr.textContent = 'Please enter a valid email.';
      ok = false;
    }
    if (!password || password.length < 6) {
      passErr.textContent = 'Password must be at least 6 characters.';
      ok = false;
    }

    if (!ok) e.preventDefault();
  });
})();
