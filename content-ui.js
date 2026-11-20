// רכיבי תצוגה משותפים לתכנים: כרטיס, כרטיס משפט, שיתוף
(function () {
  const C = window.EtiContent;
  const esc = C.esc;
  const ICON = id => `<svg class="ico"><use href="#${id}"/></svg>`;

  function card(it) {
    const isQuote = it.type === 'quote';
    const media = it.poster || it.image;
    const tag = [C.typeLabel(it.type), (it.topics || [])[0]].filter(Boolean).join(' · ');
    return `<a class="cc rv" href="${esc(C.link(it))}">
      <div class="cc__media ${media ? '' : 'cc__media--text'}">
        ${media ? `<img data-src="${esc(media)}" alt="${esc(it.alt || '')}" loading="lazy">` : `<span class="cc__quote">${esc((isQuote ? it.quote : it.title) || '')}</span>`}
        ${it.type === 'video' ? `<span class="cc__play">${ICON('i-play')}</span>` : ''}
        ${it.duration ? `<span class="cc__dur">${C.fmtDuration(it.duration)}</span>` : ''}
      </div>
      <div class="cc__body">
        <span class="cc__tag">${esc(tag)}</span>
        <h3>${esc(it.title || (isQuote ? 'משפט טוב לדרך' : ''))}</h3>
        ${it.summary ? `<p>${esc(it.summary)}</p>` : ''}
        <span class="cc__meta">${esc([(it.ages || []).join(', '), C.fmtDate(it.date)].filter(Boolean).join(' · '))}</span>
      </div>
    </a>`;
  }

  // כרטיס משפט בעיצוב המותג (כשאין תמונה מעוצבת)
  function quoteArt(it) {
    if (it.image) return `<img class="qa__img" data-src="${esc(it.image)}" alt="${esc(it.alt || it.quote || it.title || 'משפט טוב לדרך')}" loading="lazy">`;
    return `<div class="qa__art" role="img" aria-label="${esc(it.quote || '')}">
      <span class="qa__c1"></span><span class="qa__c2"></span>
      <img class="qa__pin" src="assets/pinwheel.png" alt="">
      <p class="qa__label">משפט טוב לדרך</p>
      <p class="qa__text">${esc(it.quote || '')}</p>
      <span class="qa__line"></span>
      <img class="qa__logo" src="assets/logo-white.png" alt="">
    </div>`;
  }

  async function hydrate(root = document) {
    root.querySelectorAll('img[data-src]').forEach(async img => {
      // תמונה שהצורה שלה שונה מהמסגרת (למשל ריבועית במסגרת רחבה) מוצגת שלמה, בלי לחתוך טקסט
      if (img.closest('.cc__media')) img.addEventListener('load', () => {
        const box = img.parentElement, r = img.naturalWidth / img.naturalHeight, b = box.clientWidth / box.clientHeight;
        if (Math.abs(r - b) / b > 0.12) { box.classList.add('cc__media--fit'); box.style.setProperty('--bgimg', `url("${img.src}")`); }
      }, { once: true });
      img.src = await C.resolve(img.dataset.src); img.removeAttribute('data-src');
    });
    root.querySelectorAll('.rv:not(.in)').forEach(el => {
      if (!('IntersectionObserver' in window)) return el.classList.add('in');
      const io = new IntersectionObserver(en => en.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .1 });
      io.observe(el);
    });
  }

  function shareLinks(title, url) {
    const wa = 'https://wa.me/?text=' + encodeURIComponent(`${title}\n${url}`);
    return `<div class="share">
      <span class="share__label">שיתוף:</span>
      <a class="btn btn--wa btn--sm" href="${wa}" target="_blank" rel="noopener">${ICON('i-wa')}וואטסאפ</a>
      <button class="btn btn--line btn--sm" type="button" data-copy="${esc(url)}">העתקת קישור</button>
    </div>`;
  }
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'הועתק ✓'; } catch { prompt('העתיקי את הקישור:', b.dataset.copy); }
  });

  const params = () => Object.fromEntries(new URLSearchParams(location.search));
  window.EtiUI = { card, quoteArt, hydrate, shareLinks, params, ICON };
})();
