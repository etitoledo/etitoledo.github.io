// תפריט לנייד, כניסה עדינה בגלילה, ושנה בכותרת התחתונה
(function () {
  const drawer = document.getElementById('drawer');
  const openBtn = document.querySelector('[data-open-drawer]');
  const closeBtns = document.querySelectorAll('[data-close-drawer]');
  const setOpen = open => {
    if (!drawer) return;
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    openBtn && openBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) drawer.querySelector('a, button')?.focus();
    else openBtn?.focus();
  };
  openBtn?.addEventListener('click', () => setOpen(true));
  closeBtns.forEach(b => b.addEventListener('click', () => setOpen(false)));
  drawer?.querySelectorAll('nav a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer?.classList.contains('is-open')) setOpen(false); });

  const items = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(el => io.observe(el));
  } else {
    items.forEach(el => el.classList.add('in'));
  }

  // החיפוש יחובר למרכז התוכן בשלב הבא
  document.querySelectorAll('[data-search]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const note = f.parentElement.querySelector('[data-search-note]');
    if (note) note.hidden = false;
  }));

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
