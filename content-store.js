// מאגר התכנים: סרטונים, משפטים ומאמרים.
// מצב הדגמה (לפני החיבור לענן): הכל נשמר בדפדפן – רשימת התכנים ב-localStorage והסרטונים ב-IndexedDB.
// מצב חי: התכנים ב-Supabase (טבלה content_items), והסרטונים והתמונות ב-Cloudflare R2 דרך ה-Worker שב-cloud/.
(function () {
  const CFG = window.SITE_CONFIG || {};
  const LIVE = Boolean(CFG.supabaseUrl && CFG.supabaseKey);
  const KEY = 'eti-content-items';

  // ---------- רשימות קבועות ----------
  const TYPES = [
    { id: 'video', label: 'סרטון' },
    { id: 'quote', label: 'משפט טוב לדרך' },
    { id: 'tip', label: 'טיפים וכלים' },
    { id: 'article', label: 'תוכן ומאמרים' },
    { id: 'drawing', label: 'מקשיבים לציור' },
    { id: 'journal', label: 'מהלב שלי' }
  ];
  // תכנים קבועים שמגיעים עם האתר (content-seed.js). שינוי או מחיקה שלהם נשמרים כ"עקיפה" לפי אותו מזהה
  const SEED = Array.isArray(window.ETI_SEED) ? window.ETI_SEED : [];
  const merge = stored => {
    const byId = new Map(SEED.map(x => [x.id, x]));
    for (const x of stored) byId.set(x.id, x);
    return [...byId.values()].filter(x => !x.deleted);
  };
  const TOPICS = [
    'גבולות וסמכות הורית', 'כעסים וויסות רגשי', 'תקשורת הורים וילדים', 'יחסים בין אחים',
    'עצמאות ואחריות', 'התמודדות עם פחדים', 'שייכות וביטחון עצמי', 'אתגרים חברתיים',
    'גיל ההתבגרות', 'חינוך ומשפחה בראייה יהודית'
  ];
  const AGES = ['הגיל הרך', 'גיל בית הספר', 'גיל ההתבגרות'];
  const MONTHS = ['אלול', 'תשרי', 'חשוון', 'כסלו', 'טבת', 'שבט', 'אדר', 'ניסן', 'אייר', 'סיוון', 'תמוז', 'אב'];

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const readJSON = (k, f) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? f; } catch { return f; } };
  const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

  // ---------- IndexedDB לקבצים במצב הדגמה ----------
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open('eti-media', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('files');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }
  async function idbPut(key, blob) {
    const d = await db();
    return new Promise((res, rej) => { const tx = d.transaction('files', 'readwrite'); tx.objectStore('files').put(blob, key); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
  }
  async function idbGet(key) {
    const d = await db();
    return new Promise((res, rej) => { const r = d.transaction('files').objectStore('files').get(key); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  }
  async function idbDel(key) {
    const d = await db();
    return new Promise(res => { const tx = d.transaction('files', 'readwrite'); tx.objectStore('files').delete(key); tx.oncomplete = res; tx.onerror = res; });
  }

  // ---------- מצב חי ----------
  let sbp = null;
  function supabase() {
    if (sbp) return sbp;
    sbp = new Promise((resolve, reject) => {
      if (window.supabase?.createClient) return resolve(window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey));
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
      s.onload = () => resolve(window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey));
      s.onerror = reject;
      document.head.append(s);
    });
    return sbp;
  }
  const rest = (path, init = {}) => fetch(`${CFG.supabaseUrl}/rest/v1/${path}`, {
    ...init, headers: { apikey: CFG.supabaseKey, 'Content-Type': 'application/json', ...(init.headers || {}) }
  });

  // ---------- ממשק אחיד ----------
  const sortItems = items => items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const Store = {
    LIVE, TYPES, TOPICS, AGES, MONTHS,
    typeLabel: id => (TYPES.find(t => t.id === id) || {}).label || '',

    // כל התכנים. ציבורי: רק מה שפורסם
    async list({ all = false } = {}) {
      let items;
      if (!LIVE) items = readJSON(KEY, []);
      else {
        const res = await rest('content_items?select=data&order=updated_at.desc');
        if (!res.ok) throw new Error('content ' + res.status);
        items = (await res.json()).map(r => r.data);
        if (all) {
          const sb = await supabase();
          const { data, error } = await sb.from('content_items').select('data');
          if (!error) items = data.map(r => r.data);
        }
      }
      items = merge(items);
      if (!all) items = items.filter(i => i.status === 'published');
      return sortItems(items);
    },

    async get(id) {
      const items = await this.list({ all: true }).catch(() => this.list());
      return items.find(i => i.id === id) || null;
    },

    async save(item) {
      item.id = item.id || uid();
      item.date = item.date || new Date().toISOString().slice(0, 10);
      item.updated = new Date().toISOString();
      if (!LIVE) {
        const items = readJSON(KEY, []);
        const i = items.findIndex(x => x.id === item.id);
        if (i >= 0) items[i] = item; else items.unshift(item);
        if (!writeJSON(KEY, items)) throw new Error('הדפדפן לא הצליח לשמור');
        return item;
      }
      const sb = await supabase();
      const { error } = await sb.from('content_items').upsert({ id: item.id, data: item, status: item.status, updated_at: item.updated });
      if (error) throw error;
      return item;
    },

    async remove(id) {
      // תוכן קבוע: שומרים סימון מחיקה במקום למחוק
      if (SEED.some(x => x.id === id)) return this.save({ id, deleted: true, status: 'draft' });
      if (!LIVE) {
        const items = readJSON(KEY, []);
        const it = items.find(x => x.id === id);
        for (const u of [it?.video, it?.poster, it?.image]) if (u?.startsWith('idb:')) await idbDel(u.slice(4));
        writeJSON(KEY, items.filter(x => x.id !== id));
        return;
      }
      const sb = await supabase();
      const { error } = await sb.from('content_items').delete().eq('id', id);
      if (error) throw error;
    },

    // שמירת קובץ (סרטון או תמונה). מחזיר כתובת לשמירה בתוכן
    async putMedia(blob, ext, onProgress) {
      const key = `${uid()}.${ext}`;
      if (!LIVE) { await idbPut(key, blob); onProgress?.(1); return 'idb:' + key; }
      const sb = await supabase();
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('צריך להיכנס מחדש לאזור הניהול');
      const url = `${CFG.mediaWorker}/upload/${key}`;
      await new Promise((resolve, reject) => {
        const x = new XMLHttpRequest();
        x.open('PUT', url);
        x.setRequestHeader('Authorization', 'Bearer ' + token);
        x.setRequestHeader('Content-Type', blob.type || 'application/octet-stream');
        x.upload.onprogress = e => e.lengthComputable && onProgress?.(e.loaded / e.total);
        x.onload = () => (x.status < 300 ? resolve() : reject(new Error('העלאה נכשלה (' + x.status + ')')));
        x.onerror = () => reject(new Error('העלאה נכשלה. בדקי את החיבור לאינטרנט'));
        x.send(blob);
      });
      return `${CFG.mediaWorker}/media/${key}`;
    },

    // כתובת שאפשר להציג בדף
    async resolve(u) {
      if (!u) return '';
      if (!u.startsWith('idb:')) return u;
      const blob = await idbGet(u.slice(4)).catch(() => null);
      return blob ? URL.createObjectURL(blob) : '';
    },

    // תכנים קשורים: הכי הרבה נושאים משותפים
    related(item, items, n = 3) {
      const score = x => (x.topics || []).filter(t => (item.topics || []).includes(t)).length * 2
        + (x.months || []).filter(m => (item.months || []).includes(m)).length
        + (x.ages || []).filter(a => (item.ages || []).includes(a)).length;
      return items.filter(x => x.id !== item.id).map(x => [score(x), x]).filter(([s]) => s > 0)
        .sort((a, b) => b[0] - a[0]).slice(0, n).map(([, x]) => x);
    },

    // קישורים
    link: item => (item.type === 'quote' ? `quotes.html#q-${item.id}` : `item.html?id=${encodeURIComponent(item.id)}`),
    fmtDuration: s => (s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : ''),
    fmtDate: d => { try { return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return d; } },
    esc: s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  };

  window.EtiContent = Store;
})();
