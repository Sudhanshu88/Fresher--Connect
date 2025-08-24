(function () {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    let ok = true;
    const fields = ['name','email','password','role'];
    const validators = {
      email: v => /^[^@]+@[^@]+\.[^@]+$/.test(v),
      password: v => v.length >= 6
    };

    fields.forEach((f) => {
      const input = form[f];
      const err = form.querySelector(`[data-for="${f}"]`);
      if (err) err.textContent = '';

      const val = (input?.value || '').trim();
      if (!val) { if (err) err.textContent = 'Required'; ok = false; }
      if (validators[f] && !validators[f](val)) { if (err) err.textContent = 'Invalid value'; ok = false; }
    });

    if (!ok) e.preventDefault();
  });
})();
