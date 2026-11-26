// Kcal · utilidades (fechas, formato, texto)

export const pad = (n) => String(n).padStart(2, '0');

// Fechas en hora local (no UTC), formato AAAA-MM-DD
export const keyOf = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => keyOf(new Date());
export const keyToDate = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};
export const addDays = (k, n) => {
  const d = keyToDate(k);
  d.setDate(d.getDate() + n);
  return keyOf(d);
};
export const dayNumber = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
};
export const dayDiff = (a, b) => dayNumber(b) - dayNumber(a);

const nf0 = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });
export const fmt = (n) => nf0.format(Math.round(Number(n) || 0));
export const fmt1 = (n) => nf1.format(Math.round((Number(n) || 0) * 10) / 10);

export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
export const fmtDateLong = (k) => keyToDate(k).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
export const fmtDateShort = (k) => keyToDate(k).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
export const fmtDateFull = (d) => d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
export const weekdayShort = (k) => keyToDate(k).toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', '');

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Texto sin tildes, en minúsculas, para buscar
export const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9½\s./]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Acepta "82,5" y "82.5"
export const parseNum = (v) => {
  if (v === null || v === undefined) return NaN;
  const s = String(v).trim().replace(',', '.');
  return s === '' ? NaN : Number(s);
};

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const FRAC = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
export const fmtQty = (q) => {
  const whole = Math.floor(q + 1e-9);
  const rest = Math.round((q - whole) * 100) / 100;
  if (FRAC[rest]) return (whole ? whole : '') + FRAC[rest];
  return fmt1(q);
};
export const fmtIn = (n) => {
  const v = Math.round((Number(n) || 0) * 10) / 10;
  return String(v).replace('.', ',');
};
