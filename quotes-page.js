// גלריית "משפט טוב לדרך": סינון לפי נושא, משפט נבחר, שיתוף, שמירת תמונה והסבר
(async function () {
  const C = window.EtiContent, UI = window.EtiUI, esc = C.esc;
  const grid = document.getElementById('q-grid');
  const pills = document.getElementById('q-topics');
  let items = [];
  try { items = (await C.list()).filter(i => i.type === 'quote'); } catch { /* */ }
  let topic = UI.params().topic || '';

  const used = C.TOPICS.filter(t => items.some(i => (i.topics || []).includes(t)));
  pills.innerHTML = used.length ? [`<button class="pill ${topic ? '' : 'pill--on'}" data-t="">הכל</button>`, ...used.map(t => `<button class="pill ${t === topic ? 'pill--on' : ''}" data-t="${esc(t)}">${esc(t)}</button>`)].join('') : '';
  pills.addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (!b) return; topic = b.dataset.t; pills.querySelectorAll('.pill').forEach(p => p.classList.toggle('pill--on', p === b)); render(); });

  function qcard(it) {
    const url = location.origin + location.pathname + '#q-' + it.id;
    return `<article class="qcard rv" id="q-${esc(it.id)}">
      ${UI.quoteArt(it)}
      <div class="qcard__body">
        ${it.title ? `<h3>${esc(it.title)}</h3>` : ''}
        ${it.summary ? `<p class="qcard__text">${esc(it.summary)}</p>` : ''}
        ${UI.shareLinks(it.quote || it.title || 'משפט טוב לדרך', url)}
        ${it.image ? `<a class="link-arrow" data-dl="${esc(it.image)}" href="#" download="משפט-טוב-לדרך.jpg">שמירת התמונה</a>` : ''}
      </div>
    </article>`;
  }

  function render() {
    const list = items.filter(i => !topic || (i.topics || []).includes(topic));
    grid.innerHTML = list.length ? list.map(qcard).join('') : `<div class="empty-box" style="grid-column:1/-1"><h3>המשפטים הראשונים יעלו כאן בקרוב</h3><p>בינתיים, המשפט שמלווה אותי:</p><p style="font:700 20px/1.5 var(--font-head);color:var(--ink)">״להיות הורה זה להבין שלכל ילד יש את השביל המדויק לו, מתוך אמונה שאנו ההורים קיבלנו את הכח להוביל אותם בבטחה״</p></div>`;
    UI.hydrate(grid);
    grid.querySelectorAll('[data-dl]').forEach(async a => { a.href = await C.resolve(a.dataset.dl); });
    if (location.hash) document.querySelector(location.hash)?.scrollIntoView({ block: 'center' });
  }
  render();
})();
