// עמוד סדנאות והרצאות: שתי ה"דלתות", סינון לפי קהל, וכפתורי הזמנה לוואטסאפ עם הודעה מוכנה
(function () {
  const doors = document.querySelectorAll('[data-door]');
  const panels = { process: document.getElementById('process'), oneoff: document.getElementById('oneoff') };
  function open(id, focus) {
    if (!panels[id]) return;
    doors.forEach(d => d.setAttribute('aria-selected', String(d.dataset.door === id)));
    for (const [k, p] of Object.entries(panels)) p.hidden = k !== id;
    panels[id].querySelectorAll('.rv').forEach(e => e.classList.add('in'));
    if (focus) document.querySelector('.doors').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  doors.forEach(d => d.addEventListener('click', () => { open(d.dataset.door); history.replaceState(null, '', '#' + d.dataset.door); }));
  const fromHash = () => {
    const h = location.hash.slice(1);
    if (panels[h]) return open(h, true);
    const el = h && document.getElementById(h);
    const panel = el && el.closest('.panel');
    if (panel) { open(panel.id); if (el.tagName === 'DETAILS') el.open = true; setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60); }
  };
  window.addEventListener('hashchange', fromHash);
  fromHash();

  // סינון לפי קהל
  document.querySelectorAll('[data-aud]').forEach(b => {
    if (b.tagName !== 'BUTTON') return;
    b.addEventListener('click', () => {
      document.querySelectorAll('.aud .pill').forEach(p => p.classList.toggle('pill--on', p === b));
      document.querySelectorAll('.lect').forEach(c => { c.hidden = b.dataset.aud !== 'all' && c.dataset.aud !== b.dataset.aud; });
    });
  });

  // מספר הוואטסאפ – מאותו מקום שאזור הניהול משנה
  const waNum = () => {
    const meta = document.querySelector('meta[name="lazy:whatsapp"]');
    let d = String(meta ? meta.content : '058-4455680').replace(/\D/g, '');
    if (d.startsWith('0')) d = '972' + d.slice(1);
    return d;
  };
  const wa = text => `https://wa.me/${waNum()}?text=${encodeURIComponent(text)}`;
  document.querySelectorAll('[data-book]').forEach(a => {
    a.target = '_blank'; a.rel = 'noopener';
    const forGroup = a.closest('.lect, .flag, .flag-end, .lect-note');
    a.href = wa(forGroup
      ? `היי אתי, הגעתי מהאתר ואשמח לפרטים על "${a.dataset.book}" עבור הקבוצה / המוסד שלנו.`
      : `היי אתי, הגעתי מהאתר ואשמח לפרטים על "${a.dataset.book}".`);
  });
  document.querySelectorAll('[data-book-proc]').forEach(a => {
    a.target = '_blank'; a.rel = 'noopener';
    const t = { wait: 'היי אתי, אשמח להיכנס לרשימת ההמתנה לסדנת הבסיס.', private: 'היי אתי, אשמח לשמוע על הדרכה אישית בקליניקה.' };
    a.href = wa(t[a.dataset.bookProc] || 'היי אתי, אשמח לשמוע על סדנת הבסיס.');
  });

  // כפתור צף בטלפון – מופיע רק כשגוללים בתוך הסדנה התהליכית
  const sticky = document.querySelector('.sticky-cta');
  const proc = document.getElementById('process');
  if (sticky && proc && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { sticky.hidden = !(e.isIntersecting && !proc.hidden); }, { rootMargin: '-35% 0px -35% 0px' }).observe(proc);
    doors.forEach(d => d.addEventListener('click', () => { if (d.dataset.door !== 'process') sticky.hidden = true; }));
  }
})();
