(function () {
  const form = document.getElementById('registerForm');
  const toggle = document.getElementById('toggleRegPass');
  const pwd = document.getElementById('regPassword');
  const meter = document.getElementById('passStrength');

  if (toggle && pwd) {
    toggle.addEventListener('click', () => {
      const isText = pwd.type === 'text';
      pwd.type = isText ? 'password' : 'text';
      toggle.textContent = isText ? 'Show' : 'Hide';
    });
  }

  function getStrength(value) {
    let score = 0;
    if (value.length >= 6) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    if (score <= 1) return 'Weak';
    if (score <= 3) return 'Medium';
    return 'Strong';
  }

  if (pwd && meter) {
    pwd.addEventListener('input', () => {
      meter.textContent = `Strength: ${pwd.value ? getStrength(pwd.value) : '-'}`;
    });
  }

  if (!form) return;
  form.addEventListener('submit', (e) => {
    let ok = true;
    const requiredFields = ['name', 'email', 'password', 'role', 'education', 'grad_year'];

    requiredFields.forEach((field) => {
      const input = form[field];
      const err = form.querySelector(`[data-for="${field}"]`);
      if (err) err.textContent = '';

      const value = (input?.value || '').trim();
      if (!value) {
        if (err) err.textContent = 'This field is required.';
        ok = false;
        return;
      }

      if (field === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
        if (err) err.textContent = 'Enter valid email address.';
        ok = false;
      }

      if (field === 'password' && value.length < 6) {
        if (err) err.textContent = 'Password must be at least 6 characters.';
        ok = false;
      }

      if (field === 'grad_year' && !/^\d{4}$/.test(value)) {
        if (err) err.textContent = 'Enter a valid 4-digit year.';
        ok = false;
      }
    });

    if (!ok) e.preventDefault();
  });
})();
