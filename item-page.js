// עמוד תוכן בודד: סרטון / מאמר, הסבר, כלי מעשי, שיתוף ותכנים קשורים
(async function () {
  const C = window.EtiContent, UI = window.EtiUI, esc = C.esc;
  const root = document.getElementById('item');
  const id = UI.params().id;
  let items = [];
  try { items = await C.list(); } catch { /* */ }
  let it = items.find(x => x.id === id);
  if (!it && id) it = await C.get(id).catch(() => null); // טיוטה – רק במצב הדגמה או למנהלת

  if (!it) {
    root.innerHTML = `<div class="empty-box"><h3>התוכן לא נמצא</h3><p>אולי הוא הוסר, או שהקישור לא שלם.</p><a class="btn btn--pink" href="content.html">למרכז התוכן</a></div>`;
    return;
  }
  if (it.type === 'quote') { location.replace(C.link(it)); return; }

  document.title = `${it.title} | תחנת כח לאמהות`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', it.summary || it.title);
  const url = location.href;
  const tags = [...(it.topics || []).map(t => `<a class="tag" href="content.html?topic=${encodeURIComponent(t)}">${esc(t)}</a>`),
    ...(it.ages || []).map(a => `<a class="tag" href="content.html?age=${encodeURIComponent(a)}">${esc(a)}</a>`),
    ...(it.months || []).map(m => `<a class="tag" href="content.html?month=${encodeURIComponent(m)}">${esc(m)}</a>`)].join('');
  const rel = C.related(it, items, 3);

  root.innerHTML = `
    <p class="crumbs" style="color:var(--muted)"><a href="content.html" style="color:var(--pink-d)">מרכז התוכן</a> · ${esc(C.typeLabel(it.type))}</p>
    <div class="item">
      <div>
        ${it.video ? `<video class="item__player" controls playsinline preload="metadata" data-v="${esc(it.video)}" ${it.poster ? `data-p="${esc(it.poster)}"` : ''}></video>` : ''}
        ${!it.video && it.image ? `<img class="item__img" data-src="${esc(it.image)}" alt="${esc(it.alt || '')}">` : ''}
        <h1 class="item__title">${esc(it.title)}</h1>
        <div class="item__meta">${tags}</div>
        ${it.summary && !(it.body || '').startsWith(it.summary.replace(/…$/, '')) ? `<p class="item__summary">${esc(it.summary)}</p>` : ''}
        ${it.body ? `<div class="item__section"><h2>${it.type === 'video' ? 'הסבר מקצועי' : ''}</h2><p>${esc(it.body)}</p></div>` : ''}
        ${it.tool ? `<div class="tool-box"><h2>${UI.ICON('i-bulb')}כלי מעשי ליישום בבית</h2><p>${esc(it.tool)}</p></div>` : ''}
        ${UI.shareLinks(it.title, url)}
      </div>
      <aside class="side-box">
        <h3>עוד באותו נושא</h3>
        ${rel.length ? `<div class="cc-grid" style="grid-template-columns:1fr">${rel.map(UI.card).join('')}</div>` : '<p>עוד תכנים בנושא יעלו בקרוב.</p>'}
        <a class="btn btn--line" href="content.html">לכל התכנים</a>
      </aside>
    </div>`;

  const v = root.querySelector('video[data-v]');
  if (v) { v.src = await C.resolve(v.dataset.v); if (v.dataset.p) v.poster = await C.resolve(v.dataset.p); }
  UI.hydrate(root);
})();
