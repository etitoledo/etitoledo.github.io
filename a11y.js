// תפריט נגישות: כפתור צף בכל עמוד, עם הגדלת טקסט, ניגודיות, הדגשת קישורים, גופן קריא ועצירת תנועה.
// ההעדפות נשמרות בדפדפן של המבקרת (אם אפשר), כדי שיישארו גם במעבר בין עמודים.
(function () {
  const KEY = 'eti-a11y';
  const root = document.documentElement;
  const OPTIONS = [
    { id: 'contrast', label: 'ניגודיות גבוהה' },
    { id: 'mono', label: 'גווני אפור' },
    { id: 'links', label: 'הדגשת קישורים' },
    { id: 'font', label: 'גופן קריא' },
    { id: 'still', label: 'עצירת אנימציות' }
  ];
  let state = { size: 0 };
  try { state = Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* בלי שמירה */ }

  function apply() {
    root.classList.remove('a11y-t1', 'a11y-t2', 'a11y-t3');
    if (state.size > 0) root.classList.add('a11y-t' + state.size);
    for (const o of OPTIONS) root.classList.toggle('a11y-' + o.id, Boolean(state[o.id]));
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* בלי שמירה */ }
    if (panel) {
      panel.querySelector('[data-size-label]').textContent = ['רגיל', 'גדול', 'גדול מאוד', 'הכי גדול'][state.size];
      panel.querySelectorAll('[data-opt]').forEach(b => b.setAttribute('aria-pressed', String(Boolean(state[b.dataset.opt]))));
    }
  }

  let panel, btn;
  function build() {
    const wrap = document.createElement('div');
    wrap.className = 'a11y';
    wrap.innerHTML = `
      <button class="a11y__btn" type="button" aria-expanded="false" aria-controls="a11y-panel" title="תפריט נגישות">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4" r="2"/><path d="M4 8.5c2.6.8 5.3 1.2 8 1.2s5.4-.4 8-1.2M12 9.7V15m0 0-3 6m3-6 3 6"/></svg>
        <span class="sr">תפריט נגישות</span>
      </button>
      <div class="a11y__panel" id="a11y-panel" role="dialog" aria-label="תפריט נגישות" hidden>
        <div class="a11y__head"><strong>נגישות</strong><button type="button" class="a11y__close" aria-label="סגירת תפריט הנגישות">✕</button></div>
        <div class="a11y__size">
          <span>גודל טקסט: <b data-size-label></b></span>
          <div><button type="button" data-size="-1" aria-label="הקטנת טקסט">א−</button><button type="button" data-size="1" aria-label="הגדלת טקסט">א+</button></div>
        </div>
        <div class="a11y__opts">${OPTIONS.map(o => `<button type="button" data-opt="${o.id}" aria-pressed="false">${o.label}</button>`).join('')}</div>
        <button type="button" class="a11y__reset">איפוס הגדרות</button>
        <a class="a11y__link" href="accessibility.html">להצהרת הנגישות</a>
      </div>`;
    document.body.appendChild(wrap);
    panel = wrap.querySelector('.a11y__panel');
    btn = wrap.querySelector('.a11y__btn');

    const open = show => {
      panel.hidden = !show;
      btn.setAttribute('aria-expanded', String(show));
      if (show) panel.querySelector('button').focus(); else btn.focus();
    };
    btn.addEventListener('click', () => open(panel.hidden));
    wrap.querySelector('.a11y__close').addEventListener('click', () => open(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) open(false); });
    document.addEventListener('click', e => { if (!panel.hidden && !wrap.contains(e.target)) { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); } });
    panel.addEventListener('click', e => {
      const s = e.target.closest('[data-size]');
      const o = e.target.closest('[data-opt]');
      if (s) state.size = Math.max(0, Math.min(3, state.size + Number(s.dataset.size)));
      else if (o) state[o.dataset.opt] = !state[o.dataset.opt];
      else if (e.target.closest('.a11y__reset')) state = { size: 0 };
      else return;
      apply();
    });
    apply();
  }

  apply();
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
