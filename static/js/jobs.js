(function () {
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const grid = document.getElementById('jobsGrid');
  if (!grid) return;

  function visibleCards() {
    return [...grid.querySelectorAll('.card')];
  }

  function applySearch() {
    const q = (searchInput?.value || '').toLowerCase().trim();
    visibleCards().forEach((card) => {
      const title = card.dataset.title || '';
      const company = card.dataset.company || '';
      card.style.display = !q || title.includes(q) || company.includes(q) ? '' : 'none';
    });
  }

  function applySort() {
    const value = sortSelect?.value || 'default';
    if (value === 'default') return;

    const sorted = visibleCards().sort((a, b) => {
      const key = value === 'title' ? 'title' : 'company';
      return (a.dataset[key] || '').localeCompare(b.dataset[key] || '');
    });

    sorted.forEach((card) => grid.appendChild(card));
  }

  searchInput?.addEventListener('input', () => {
    applySearch();
    applySort();
  });

  sortSelect?.addEventListener('change', applySort);
})();
