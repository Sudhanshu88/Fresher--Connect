(function () {
  document.querySelectorAll('.sidebar nav a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(a.getAttribute('href').slice(1));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  const chips = document.querySelectorAll('.chip[data-filter]');
  const searchInput = document.getElementById('jobSearch');
  const cards = document.querySelectorAll('#jobCards .card');

  function filterCards() {
    const active = document.querySelector('.chip.active')?.dataset.filter || 'all';
    const text = (searchInput?.value || '').toLowerCase().trim();

    cards.forEach((card) => {
      const cat = card.dataset.category;
      const searchable = card.dataset.search || '';

      const catMatch = active === 'all' || cat === active;
      const textMatch = !text || searchable.includes(text);
      card.style.display = catMatch && textMatch ? '' : 'none';
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      filterCards();
    });
  });

  searchInput?.addEventListener('input', filterCards);

  document.querySelectorAll('.apply-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const jobId = Number(btn.dataset.id);
      btn.disabled = true;

      try {
        const response = await fetch('/api/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: jobId })
        });

        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || 'Unable to apply');

        btn.textContent = 'Applied';
      } catch (err) {
        alert(err.message || 'Something went wrong.');
        btn.disabled = false;
      }
    });
  });
})();
