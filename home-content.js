// דף הבית: התכנים האחרונים (קודם אלה שסומנו "להציג בדף הבית")
(async function () {
  const C = window.EtiContent, UI = window.EtiUI;
  const box = document.getElementById('home-latest');
  if (!box) return;
  let items = [];
  try { items = (await C.list()).filter(i => i.type !== 'quote'); } catch { /* */ }
  const pick = [...items.filter(i => i.featured), ...items.filter(i => !i.featured)].slice(0, 3);
  if (!pick.length) { box.innerHTML = '<div class="empty-box" style="grid-column:1/-1"><h3>הסרטונים והמאמרים הראשונים יעלו כאן בקרוב</h3></div>'; return; }
  box.innerHTML = pick.map(UI.card).join('');
  UI.hydrate(box);
})();
