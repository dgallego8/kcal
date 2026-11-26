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

// "1 taza (160 g)" × 0,5 → "½ taza (80 g)"; "2 huevos" × 1,5 → "3 huevos"
const FRACV = { '½': 0.5, '¼': 0.25, '¾': 0.75 };
const pluralize = (w) => {
  const m = w.match(/^([a-záéíóúñ]+)(.*)$/i);
  if (!m) return w;
  let [, base, rest] = m;
  if (/s$/i.test(base)) return w;
  if (/ón$/i.test(base)) base = base.replace(/ón$/i, 'ones');
  else if (/[aeiouáéíóú]$/i.test(base)) base += 's';
  else if (/z$/i.test(base)) base = `${base.slice(0, -1)}ces`;
  else base += 'es';
  return base + rest;
};
const singularize = (w) => {
  const m = w.match(/^([a-záéíóúñ]+)(.*)$/i);
  if (!m) return w;
  let [, base, rest] = m;
  if (/dades$/i.test(base)) base = base.replace(/des$/i, 'd');
  else if (/ones$/i.test(base)) base = base.replace(/ones$/i, 'ón');
  else if (/s$/i.test(base)) base = base.slice(0, -1);
  return base + rest;
};
export function scalePortion(u, q) {
  if (Math.abs(q - 1) < 1e-9) return u;
  const m = String(u).match(/^(\d+(?:[.,]\d+)?|½|¼|¾)\s+(.*)$/);
  if (!m) return `${fmtQty(q)} × ${u}`;
  const n0 = FRACV[m[1]] ?? Number(m[1].replace(',', '.'));
  const n = Math.round(n0 * q * 100) / 100;
  let rest = m[2].replace(/\((\d+(?:[.,]\d+)?)\s*(g|ml)\b([^)]*)\)/, (_, v, unit, tail) => `(${fmt(Number(v.replace(',', '.')) * q)} ${unit}${tail})`);
  const [first, ...others] = rest.split(' ');
  if (first !== 'de') {
    if (n > 1 && n0 <= 1) rest = [pluralize(first), ...others].join(' ');
    else if (n <= 1 && n0 > 1) rest = [singularize(first), ...others].join(' ');
  }
  return `${fmtQty(n)} ${rest}`;
}
