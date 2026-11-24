// ספירת כניסות עם Google Analytics.
// מספר המעקב נשמר ב-config.js (gaId). כל עוד הוא ריק, לא נספר כלום.
// לא סופרים במחשב המקומי ובתוך אזור הניהול, כדי שהבדיקות של אתי לא ייספרו.
(() => {
  const id = (window.SITE_CONFIG || {}).gaId;
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (!id || local || window.self !== window.top) return;

  // מי שהגיעה מוואטסאפ בלי קישור מסומן: מוסיפים לכתובת את הסימן לפני שגוגל קוראת אותה
  const params = new URLSearchParams(location.search);
  let refHost = ''; try { refHost = new URL(document.referrer).hostname; } catch {}
  if (/(^|\.)(whatsapp\.com|wa\.me|l\.wl\.co)$/i.test(refHost) && !params.has('utm_source')) {
    params.set('utm_source', 'whatsapp'); params.set('utm_medium', 'social');
    try { history.replaceState(history.state, '', location.pathname + '?' + params.toString() + location.hash); } catch {}
  }

  // תג גוגל: מספר שמתחיל ב-GTM- (התג החדש של גוגל) או ב-G- (מספר מדידה רגיל)
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('js', new Date());
  const isGtm = /^GTM-/i.test(id);
  if (!isGtm) gtag('config', id);
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/' + (isGtm ? 'gtm.js' : 'gtag/js') + '?id=' + encodeURIComponent(id);
  document.head.appendChild(s);

  // לחיצות שחשוב לדעת עליהן: וואטסאפ, חיוג, הזמנת הרצאה, ומה נלחץ בחלון הקופץ ובפס "הכי חם"
  document.addEventListener('click', e => {
    const a = e.target.closest('a, button');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    let name = null, label = (a.textContent || '').trim().slice(0, 80);
    if (/wa\.me|whatsapp/.test(href)) name = 'לחיצה_וואטסאפ';
    else if (href.startsWith('tel:')) name = 'לחיצה_חיוג';
    else if (a.hasAttribute('data-book')) { name = 'בקשת_הזמנה'; label = a.dataset.book; }
    else if (a.closest('#welcome-pop')) name = 'חלון_קופץ';
    else if (a.closest('#hot')) name = 'הכי_חם_עכשיו';
    else if (a.closest('#pod-bubble')) name = 'בועת_פודקאסט';
    if (name) gtag('event', name, { label, page: location.pathname });
  }, true);
})();
