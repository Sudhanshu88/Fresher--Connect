(function () {
  // Smooth scroll for sidebar links
  document.querySelectorAll('.sidebar nav a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Apply action
  document.querySelectorAll('.apply-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      btn.disabled = true;
      try {
        const r = await fetch('/api/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: Number(id) })
        });
        const data = await r.json();
        if (data.ok) {
          btn.textContent = 'Applied';
        } else {
          alert(data.error || 'Unable to apply.');
          btn.disabled = false;
        }
      } catch (e) {
        alert('Network error.');
        btn.disabled = false;
      }
    });
  });
})();
