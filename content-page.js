// מרכז התוכן: מדפים לפי סוג (פוסטים, טיפים, משפטים, פינות), עם חיפוש וסינון לפי נושא, גיל וחודש
(async function () {
  const C = window.EtiContent, UI = window.EtiUI, esc = C.esc;
  const grid = document.getElementById('lib-grid');
  const count = document.getElementById('lib-count');
  const form = document.getElementById('lib-form');
  const tabs = document.getElementById('lib-tabs');
  const sel = n => form.querySelector(`[name="${n}"]`);

  // כל מדף מקבל עיצוב אחיד משלו, כדי שלא יתערבבו תמונות בגדלים שונים
  const SHELVES = [
    // כל פוסט מעוצב (רקע כחול עם כותרת) נכנס לפוסטים ומאמרים – גם אם הוא טיפ, ואז הוא מופיע גם בטיפים
    { id: 'article', types: ['article'], title: 'פוסטים ומאמרים', look: 'post', also: it => it.post },
    { id: 'tip', types: ['tip'], title: 'טיפים וכלים', look: 'post' },
    { id: 'quote', types: ['quote'], title: 'משפט טוב לדרך', look: 'quote' },
    { id: 'corner', types: ['drawing', 'journal', 'video'], title: 'מהפינות שלי', look: 'post' }
  ];
  const PREVIEW = { post: 6, quote: 8 };

  const fill = (name, list) => sel(name).insertAdjacentHTML('beforeend', list.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join(''));
  fill('topic', C.TOPICS);
  fill('age', C.AGES);
  fill('month', C.MONTHS);

  const p = UI.params();
  // קישורים ישנים עם type=journal וכו' – ממפים למדף המתאים
  if (p.type) p.type = (SHELVES.find(s => s.id === p.type || s.types.includes(p.type)) || {}).id || '';
  for (const k of ['q', 'type', 'topic', 'age', 'month']) if (p[k]) sel(k).value = p[k];

  let items = [];
  try { items = await C.list(); } catch { /* נשאר ריק */ }
  const inShelf = (it, s) => s.types.includes(it.type) || Boolean(s.also && s.also(it));

  function matches(it) {
    const q = sel('q').value.trim(), topic = sel('topic').value, age = sel('age').value, month = sel('month').value;
    const words = q.split(/\s+/).filter(Boolean);
    return (!topic || (it.topics || []).includes(topic)) &&
      (!age || (it.ages || []).includes(age)) &&
      (!month || (it.months || []).includes(month)) &&
      words.every(w => [it.title, it.summary, it.quote, it.alt, it.body, it.tool, ...(it.topics || []), ...(it.months || [])].join(' ').includes(w));
  }

  function render() {
    const type = sel('type').value;
    const hits = items.filter(matches);
    const by = Object.fromEntries(SHELVES.map(s => [s.id, hits.filter(it => inShelf(it, s))]));

    // לשוניות: רק מדפים שיש בהם תוכן בכלל, עם מספר התכנים אחרי הסינון
    tabs.innerHTML = [`<button type="button" role="tab" data-tab="" aria-selected="${!type}">הכל <small>${hits.length}</small></button>`,
      ...SHELVES.filter(s => items.some(it => inShelf(it, s))).map(s =>
        `<button type="button" role="tab" data-tab="${s.id}" aria-selected="${type === s.id}">${esc(s.title)} <small>${by[s.id].length}</small></button>`)].join('');

    const shown = type ? SHELVES.filter(s => s.id === type) : SHELVES;
    const filtered = sel('q').value.trim() || sel('topic').value || sel('age').value || sel('month').value;
    const total = type ? by[type].length : hits.length;
    count.innerHTML = `${total} תכנים ${filtered || type ? '<button type="button" class="lib-clear" data-clear>ניקוי הסינון</button>' : ''}`;

    const html = shown.filter(s => by[s.id].length).map(s => {
      const list = by[s.id];
      const max = type ? list.length : PREVIEW[s.look];
      const more = list.length > max ? `<button type="button" class="shelf__more" data-tab="${s.id}">לכל ${esc(s.title)} (${list.length}) ←</button>` : '';
      return `<section class="shelf shelf--${s.look}">
        <div class="shelf__head"><h2>${esc(s.title)}</h2>${more}</div>
        <div class="cc-grid cc-grid--${s.look}">${list.slice(0, max).map(UI.card).join('')}</div>
      </section>`;
    }).join('');

    grid.innerHTML = html || `<div class="empty-box">
      <h3>${items.length ? 'לא מצאתי תכנים שמתאימים לחיפוש' : 'התכנים הראשונים יעלו כאן בקרוב'}</h3>
      <p>${items.length ? 'נסי מילה אחרת, או נקי את הסינון.' : 'רוצה לקבל אותם ראשונה? הצטרפי לקהילה בוואטסאפ.'}</p>
      ${items.length ? '' : '<a class="btn btn--wa" href="https://chat.whatsapp.com/KLcxTEYWqjWKX0vAD19I10" target="_blank" rel="noopener">להצטרפות לקהילה</a>'}</div>`;
    UI.hydrate(grid);
    const u = new URLSearchParams();
    for (const k of ['q', 'type', 'topic', 'age', 'month']) if (sel(k).value) u.set(k, sel(k).value);
    history.replaceState(null, '', (u.toString() ? '?' + u : location.pathname) + location.hash);
  }

  function setTab(id, scroll) {
    sel('type').value = id;
    render();
    if (scroll) tabs.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  form.addEventListener('input', render);
  form.addEventListener('submit', e => { e.preventDefault(); render(); });
  tabs.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) setTab(b.dataset.tab); });
  grid.addEventListener('click', e => { const b = e.target.closest('.shelf__more'); if (b) setTab(b.dataset.tab, true); });
  count.addEventListener('click', e => { if (e.target.closest('[data-clear]')) { form.reset(); sel('type').value = ''; render(); } });
  render();
})();
