// הכי חם עכשיו + חלון קופץ בכניסה
(() => {
  const isOn = key => (document.querySelector(`[data-edit="${key}"]`)?.textContent || 'פועל').trim() !== 'כבוי';
  window.__etiIsOn = isOn;
  const load = v => { if (v && !v.src && v.dataset.src) v.src = v.dataset.src; };

  // הרילס בכרטיס הפודקאסט מתנגן בלי קול רק כשרואים אותו
  const hotVid = document.querySelector('.hot-card__reel video');
  if (hotVid && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { load(hotVid); hotVid.play().catch(() => {}); } else hotVid.pause();
    }, { threshold: .35 }).observe(hotVid);
  }

  // החלון הקופץ: פעם אחת ביום, 3 שניות אחרי הכניסה. לא נפתח בתוך אזור הניהול.
  const pop = document.getElementById('welcome-pop');
  if (!pop) return;
  const vid = pop.querySelector('video');
  const sound = pop.querySelector('.pop__sound');
  const KEY = 'eti-pop-seen';
  const DAY = 24 * 60 * 60 * 1000;
  let lastFocus = null;

  const seenRecently = () => { try { return Date.now() - Number(localStorage.getItem(KEY) || 0) < DAY; } catch { return false; } };
  const markSeen = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch {} };

  const open = () => {
    if (!isOn('pop.on') && !forced) return;
    lastFocus = document.activeElement;
    pop.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => pop.classList.add('is-open')));
    load(vid); vid.muted = true; vid.play().catch(() => {});
    pop.querySelector('.pop__x').focus({ preventScroll: true });
    markSeen();
  };
  const close = () => {
    pop.classList.remove('is-open');
    vid.pause();
    setTimeout(() => { pop.hidden = true; }, 380);
    lastFocus?.focus?.({ preventScroll: true });
  };

  pop.querySelectorAll('[data-pop-close]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) close(); });
  sound.addEventListener('click', () => {
    vid.muted = !vid.muted;
    if (!vid.muted) { vid.currentTime = 0; vid.play().catch(() => {}); }
    sound.setAttribute('aria-pressed', String(!vid.muted));
    sound.querySelector('span').textContent = vid.muted ? 'להפעלת הקול' : 'להשתקה';
  });

  const inAdmin = window.self !== window.top;
  const forced = /[?&]popup=1\b/.test(location.search);
  if (forced || (!inAdmin && !seenRecently())) setTimeout(open, forced ? 300 : 3000);
})();

// בועת וידאו צפה: מופיעה אחרי שגוללים קצת, נעלמת כשהפודקאסט עצמו על המסך או כשהחלון הקופץ פתוח
(() => {
  const bub = document.getElementById('pod-bubble');
  if (!bub) return;
  const vid = bub.querySelector('video');
  const pop = document.getElementById('welcome-pop');
  const podSec = document.getElementById('podcast');
  const KEY = 'eti-bub-off';
  let off = false; try { off = sessionStorage.getItem(KEY) === '1'; } catch {}
  if (off) return;
  bub.hidden = false;
  let podVisible = false;

  const update = () => {
    const show = (window.__etiIsOn ? window.__etiIsOn('bub.on') : true) && scrollY > innerHeight * 0.6 && !podVisible && (!pop || pop.hidden);
    bub.classList.toggle('is-on', show);
    if (show) { if (!vid.src) vid.src = vid.dataset.src; vid.play().catch(() => {}); } else vid.pause();
  };
  if (podSec && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { podVisible = e.isIntersecting; update(); }, { threshold: .15 }).observe(podSec);
  }
  if (pop) new MutationObserver(update).observe(pop, { attributes: true, attributeFilter: ['hidden'] });
  addEventListener('scroll', update, { passive: true });
  bub.querySelector('.bub__x').addEventListener('click', () => {
    bub.classList.remove('is-on'); vid.pause();
    setTimeout(() => { bub.hidden = true; }, 400);
    try { sessionStorage.setItem(KEY, '1'); } catch {}
  });
  update();
})();
