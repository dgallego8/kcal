// Kcal · app principal
import { POPULAR, foodById, searchFoods, localEstimate, emojiFor } from './foods.js';
import { ACTIVITY, PACES, computePlan, bmi, bmiLabel, healthyRange, eta, trend } from './nutrition.js';
import { mascotSVG, ACCESSORIES } from './mascot.js';
import { ring, weightChart, barChart } from './charts.js';
import { PROVIDERS, analyzeFood, suggestMealsAI, testAI, compressImage } from './ai.js';
import { SHARE, suggestIdeas } from './ideas.js';
import { computeGame, petState, CHEERS } from './game.js';
import {
  todayKey, addDays, dayNumber, fmt, fmt1, fmtIn, fmtQty, cap, fmtDateLong, fmtDateShort, fmtDateFull,
  weekdayShort, esc, uid, parseNum, clamp, scalePortion,
} from './util.js';

const APP_VERSION = '1.1.0';
const STORE_KEY = 'kcal:v1';

const MEALS = [
  { id: 'desayuno', label: 'Desayuno', e: '🌅' },
  { id: 'almuerzo', label: 'Almuerzo', e: '☀️' },
  { id: 'cena', label: 'Cena', e: '🌙' },
  { id: 'snack', label: 'Mecato', e: '🍪' },
];
const mealLabel = (id) => MEALS.find((m) => m.id === id)?.label || 'Comida';

const ICON = {
  left: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  glass: '<svg viewBox="0 0 24 32" aria-hidden="true"><path class="g-in" d="M5.2 12h13.6l-1.5 15.4a1.2 1.2 0 0 1-1.2 1.1H7.9a1.2 1.2 0 0 1-1.2-1.1z"/><path class="g-out" d="M3 3h18l-2.3 25.2a2 2 0 0 1-2 1.8H7.3a2 2 0 0 1-2-1.8z"/></svg>',
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const view = $('#view');
const sheetRoot = $('#sheet-root');

// ═════════════════════════ Estado ═════════════════════════
function defaultState() {
  return {
    v: 1,
    onboarded: false,
    profile: {
      name: '', sex: 'hombre', age: null, height: null, weight: null, startWeight: null, startDate: null,
      goalWeight: null, activity: 'ligero', pace: 0.5,
    },
    settings: {
      manual: null,
      glass: 250,
      ai: { provider: 'gemini', keys: { gemini: '', claude: '' }, model: { gemini: '', claude: '' }, resolved: { gemini: '', claude: '' } },
    },
    days: {},
    weights: [],
    customFoods: [],
    recents: [],
    favorites: [],
    pet: { name: 'Chigüi', acc: 'auto', lastLevel: null, badges: [] },
    stats: { photoLogs: 0 },
  };
}

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
function merge(base, src) {
  if (!isObj(src)) return base;
  const out = { ...base };
  for (const k of Object.keys(src)) out[k] = isObj(base[k]) && isObj(src[k]) ? merge(base[k], src[k]) : src[k];
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return merge(defaultState(), JSON.parse(raw));
  } catch (e) {
    console.warn('No se pudieron leer los datos', e);
  }
  return defaultState();
}

let state = load();
let saveTimer = 0;
function save(now = false) {
  clearTimeout(saveTimer);
  const run = () => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {
      toast('⚠️ No se pudo guardar en este dispositivo');
    }
  };
  if (now) run();
  else saveTimer = setTimeout(run, 120);
}

const newDraft = () => ({ name: '', sex: 'hombre', age: '', height: '', weight: '', activity: 'ligero', goal: '', pace: 0.5 });
const ui = {
  tab: 'hoy',
  day: todayKey(),
  onToday: true,
  ob: { step: 0, d: newDraft(), err: '' },
  ideas: { meal: null, seed: 0, ai: {}, loading: false, error: '' },
};
let sheet = null;
let G = null; // juego calculado en cada render

// ═════════════════════════ Cálculos ═════════════════════════
const latestWeight = () => (state.weights.length ? state.weights[state.weights.length - 1].kg : Number(state.profile.weight) || 0);

function plan() {
  const p = computePlan(state.profile, latestWeight());
  const m = state.settings.manual;
  if (m) {
    p.kcal = m.kcal || p.kcal;
    p.protein = m.protein || p.protein;
    p.carbs = m.carbs || p.carbs;
    p.fat = m.fat || p.fat;
    p.water = m.water || p.water;
    p.manual = true;
  }
  return p;
}
const snapshot = (p = plan()) => ({ kcal: p.kcal, protein: p.protein, carbs: p.carbs, fat: p.fat, water: p.water });

function goalsFor(k) {
  const d = state.days[k];
  if (k < todayKey() && d?.goal) return d.goal;
  return snapshot();
}

const dayOf = (k) => state.days[k] || { entries: [], water: 0 };
function ensureDay(k) {
  if (!state.days[k]) state.days[k] = { entries: [], water: 0 };
  return state.days[k];
}
function touch(k) {
  const d = ensureDay(k);
  if (k >= todayKey() || !d.goal) d.goal = snapshot();
}
const vals = (e) => {
  const q = e.q ?? 1;
  return { k: e.k * q, p: e.p * q, c: e.c * q, f: e.f * q };
};
function totals(k) {
  const d = dayOf(k);
  const t = { kcal: 0, p: 0, c: 0, f: 0, n: 0, water: d.water || 0 };
  for (const e of d.entries || []) {
    const v = vals(e);
    t.kcal += v.k;
    t.p += v.p;
    t.c += v.c;
    t.f += v.f;
    t.n++;
  }
  return t;
}

function game() {
  return computeGame({
    days: state.days,
    weights: state.weights,
    startWeight: Number(state.profile.startWeight),
    goalWeight: Number(state.profile.goalWeight),
    currentWeight: latestWeight(),
    today: todayKey(),
    totals,
    goals: goalsFor,
    photoLogs: state.stats.photoLogs || 0,
  });
}

function equippedAcc(level) {
  const pick = state.pet.acc;
  if (pick === 'none') return null;
  const unlocked = ACCESSORIES.filter((a) => level >= a.level);
  if (pick && pick !== 'auto' && unlocked.some((a) => a.id === pick)) return pick;
  return unlocked.length ? unlocked[unlocked.length - 1].id : null;
}

const aiCfg = () => state.settings.ai;
const aiReady = () => !!aiCfg().keys[aiCfg().provider];

function defaultMeal(d = new Date()) {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 4.5 && h < 10.75) return 'desayuno';
  if (h >= 11.25 && h < 15.5) return 'almuerzo';
  if (h >= 18 && h < 22.5) return 'cena';
  return 'snack';
}

function addEntry(k, entry) {
  const d = ensureDay(k);
  d.entries.push({ id: uid(), t: Date.now(), q: 1, ...entry });
  touch(k);
  pushRecent(entry);
}

function pushRecent(e) {
  const snap = { n: e.n, u: e.u, k: e.k, p: e.p, c: e.c, f: e.f, e: e.e };
  state.recents = [snap, ...state.recents.filter((r) => !(r.n === snap.n && r.u === snap.u))].slice(0, 20);
}
const isFav = (b) => state.favorites.some((x) => x.n === b.n && x.u === b.u);
function toggleFav(b) {
  if (isFav(b)) state.favorites = state.favorites.filter((x) => !(x.n === b.n && x.u === b.u));
  else state.favorites = [{ n: b.n, u: b.u, k: b.k, p: b.p, c: b.c, f: b.f, e: b.e }, ...state.favorites].slice(0, 40);
  save();
}

function findEntry(id) {
  for (const [k, d] of Object.entries(state.days)) {
    const e = (d.entries || []).find((x) => x.id === id);
    if (e) return { e, k, d };
  }
  return null;
}

// ═════════════════════════ Render ═════════════════════════
function render(keepScroll = false) {
  const y = window.scrollY;
  document.body.classList.toggle('onboarding', !state.onboarded);
  if (!state.onboarded) {
    view.innerHTML = viewOnboarding();
    return;
  }
  G = game();
  const views = { hoy: viewHoy, progreso: viewProgreso, chigui: viewChigui, ajustes: viewAjustes };
  view.innerHTML = (views[ui.tab] || viewHoy)();
  $$('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === ui.tab));
  if (keepScroll) window.scrollTo(0, y);
  celebrate();
}

function celebrate() {
  const pet = state.pet;
  const msgs = [];
  let changed = false;
  if (pet.lastLevel == null) {
    pet.lastLevel = G.level;
    changed = true;
  } else if (G.level > pet.lastLevel) {
    const un = ACCESSORIES.filter((a) => a.level > pet.lastLevel && a.level <= G.level);
    msgs.push(`🎉 ¡${pet.name} subió a nivel ${G.level}!${un.length ? ` Nuevo: ${un.map((a) => `${a.e} ${a.name}`).join(', ')}` : ''}`);
    pet.lastLevel = G.level;
    changed = true;
  } else if (G.level < pet.lastLevel) {
    pet.lastLevel = G.level;
    changed = true;
  }
  const ok = G.badges.filter((b) => b.ok).map((b) => b.id);
  const fresh = ok.filter((id) => !pet.badges.includes(id));
  if (fresh.length) {
    const b = G.badges.find((x) => x.id === fresh[0]);
    msgs.push(`🏅 Logro: ${b.e} ${b.name}`);
  }
  if (fresh.length || ok.length !== pet.badges.length) {
    pet.badges = ok;
    changed = true;
  }
  if (changed) save();
  if (msgs.length) toast(msgs.join(' · '), 4200);
}

const factorTxt = (f) => String(f).replace('.', ',');
const lvlPct = (g) => clamp(((g.xp - g.from) / (g.to - g.from)) * 100, 0, 100);

// ───────────── Hoy ─────────────
function viewHoy() {
  const k = ui.day;
  const today = todayKey();
  const isToday = k === today;
  ui.onToday = isToday;
  const t = totals(k);
  const g = goalsFor(k);
  const pet = petState({ t, g, hour: new Date().getHours(), isToday, name: state.profile.name, seed: dayNumber(k) });
  const left = Math.round(g.kcal - t.kcal);
  const title = isToday ? 'Hoy' : k === addDays(today, -1) ? 'Ayer' : cap(fmtDateShort(k));
  return `
  <header class="top">
    <button class="icon-btn" data-action="day" data-d="-1" aria-label="Día anterior">${ICON.left}</button>
    <button class="top-title" data-action="today" aria-label="Ir a hoy"><h1>${title}</h1><p>${cap(fmtDateLong(k))}</p></button>
    <button class="icon-btn" data-action="day" data-d="1" ${isToday ? 'disabled' : ''} aria-label="Día siguiente">${ICON.right}</button>
    <span class="streak" title="Días seguidos registrando">🔥 ${G.streak}</span>
  </header>

  <section class="card pet-card">
    <button class="pet" data-action="pet-tap" aria-label="${esc(state.pet.name)}">${mascotSVG({ mood: pet.mood, acc: equippedAcc(G.level) })}</button>
    <div class="pet-side">
      <div class="bubble">${esc(pet.msg)}</div>
      <div class="lvl"><span>Nivel ${G.level}</span><div class="bar xp"><i style="width:${lvlPct(G)}%"></i></div><small>${fmt(G.xp - G.from)}/${fmt(G.to - G.from)}</small></div>
    </div>
  </section>

  <section class="card summary">
    <div class="sum-top">
      <div class="ring-wrap">${ring(t.kcal, g.kcal)}
        <div class="ring-center"><b>${fmt(Math.abs(left))}</b><span>${left >= 0 ? 'kcal restantes' : 'kcal de más'}</span></div>
      </div>
      <div class="sum-stats">
        <div><span>Meta</span><b>${fmt(g.kcal)}</b></div>
        <div><span>Comido</span><b>${fmt(t.kcal)}</b></div>
        <div><span>Registros</span><b>${t.n}</b></div>
      </div>
    </div>
    <div class="macros">
      ${macroBar('Proteína', t.p, g.protein, 'prot')}
      ${macroBar('Carbohidratos', t.c, g.carbs, 'carb')}
      ${macroBar('Grasa', t.f, g.fat, 'fat')}
    </div>
  </section>

  ${isToday ? ideasCard() : ''}
  ${waterCard(t, g)}
  ${MEALS.map((m) => mealCard(k, m)).join('')}
  <p class="foot">Valores aproximados. Kcal no reemplaza la asesoría de un profesional de la salud.</p>`;
}

function macroBar(label, v, goal, cls) {
  const pct = goal ? clamp((v / goal) * 100, 0, 100) : 0;
  return `<div class="macro"><div class="mrow"><span>${label}</span><b>${fmt(v)}<small> / ${fmt(goal)} g</small></b></div><div class="bar ${cls}"><i style="width:${pct}%"></i></div></div>`;
}

function waterCard(t, g) {
  const glass = state.settings.glass || 250;
  const n = Math.max(1, Math.round(g.water / glass));
  const filled = Math.floor(t.water / glass + 1e-6);
  const total = Math.max(n, filled);
  const glasses = Array.from(
    { length: total },
    (_, i) => `<button class="glass ${i < filled ? 'on' : ''}" data-action="water" data-n="${i + 1}" aria-label="Vaso ${i + 1}">${ICON.glass}</button>`
  ).join('');
  return `<section class="card water">
    <div class="card-head"><h3>💧 Agua</h3><span class="muted">${fmt1(t.water / 1000)} / ${fmt1(g.water / 1000)} L</span>
      <button class="add-mini" data-action="water" data-n="${filled + 1}" aria-label="Agregar vaso">${ICON.plus}</button></div>
    <div class="glasses">${glasses}</div>
  </section>`;
}

function entryLabel(e) {
  const q = e.q ?? 1;
  return esc(scalePortion(e.u, q));
}

function mealCard(k, m) {
  const items = dayOf(k).entries.filter((e) => e.meal === m.id);
  const kc = items.reduce((s, e) => s + vals(e).k, 0);
  const rows = items
    .map(
      (e) => `<button class="entry" data-action="edit-entry" data-id="${e.id}">
        <span class="em">${e.e || '🍽️'}</span>
        <span class="en"><b>${esc(e.n)}</b><small>${entryLabel(e)}</small></span>
        <span class="ek">${fmt(vals(e).k)}</span></button>`
    )
    .join('');
  return `<section class="card meal">
    <div class="card-head"><h3>${m.e} ${m.label}</h3><span class="muted">${kc ? `${fmt(kc)} kcal` : ''}</span>
      <button class="add-mini" data-action="add" data-meal="${m.id}" aria-label="Agregar a ${m.label}">${ICON.plus}</button></div>
    ${items.length ? `<div class="entries">${rows}</div>` : `<button class="empty-meal" data-action="add" data-meal="${m.id}">Agregar ${m.label.toLowerCase()}</button>`}
  </section>`;
}

// ───────────── ¿Qué como? ─────────────
let ideaReg = [];
function nextMeal(d = new Date()) {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 22.5 || h < 4.5) return { meal: 'desayuno', tomorrow: true };
  if (h < 10.75) return { meal: 'desayuno', tomorrow: false };
  if (h < 15.5) return { meal: 'almuerzo', tomorrow: false };
  if (h < 18) return { meal: 'snack', tomorrow: false };
  return { meal: 'cena', tomorrow: false };
}
const MEAL_ORDER = ['desayuno', 'almuerzo', 'snack', 'cena'];
function ideaTarget() {
  if (ui.ideas.meal) return { meal: ui.ideas.meal, tomorrow: false };
  const nm = nextMeal();
  if (nm.tomorrow) return nm;
  // Si ya registraste esa comida, pasa a la siguiente que falte
  const logged = new Set(dayOf(todayKey()).entries.map((e) => e.meal));
  const order = MEAL_ORDER.slice(MEAL_ORDER.indexOf(nm.meal));
  return { meal: order.find((m) => !logged.has(m)) || nm.meal, tomorrow: false };
}

// Calorías y proteína para una comida, según lo que ya comiste hoy
function mealBudget(meal, tomorrow) {
  const k = todayKey();
  const g = goalsFor(k);
  const base = { kcal: g.kcal * SHARE[meal], p: g.protein * SHARE[meal], light: false };
  if (tomorrow) return base;
  const t = totals(k);
  const entries = dayOf(k).entries;
  const logged = new Set(entries.map((e) => e.meal));
  const inMeal = entries
    .filter((e) => e.meal === meal)
    .reduce((acc, e) => {
      const v = vals(e);
      return { k: acc.k + v.k, p: acc.p + v.p };
    }, { k: 0, p: 0 });
  // Comidas pendientes: las que aún no registras (si se te olvidó una, no se reparte su parte)
  const S = MEALS.filter((m) => m.id === meal || !logged.has(m.id)).reduce((sum, m) => sum + SHARE[m.id], 0);
  let kcal = ((g.kcal - (t.kcal - inMeal.k)) * SHARE[meal]) / S - inMeal.k;
  const p = Math.max(10, ((g.protein - (t.p - inMeal.p)) * SHARE[meal]) / S - inMeal.p);
  const dayLeft = g.kcal - t.kcal;
  const light = kcal < 150;
  kcal = clamp(kcal, 150, base.kcal * 1.3);
  return { kcal, p, light, covered: light && inMeal.k > 0 && dayLeft >= 150 };
}

function ideasCard() {
  const { meal, tomorrow } = ideaTarget();
  const b = mealBudget(meal, tomorrow);
  const aiOpts = ui.ideas.ai[meal];
  const opts = aiOpts || suggestIdeas({ meal, kcal: b.kcal, protein: b.p, seed: dayNumber(todayKey()) + ui.ideas.seed });
  ideaReg = opts.map((o) => ({ ...o, meal, tomorrow }));
  const label = mealLabel(meal).toLowerCase();
  const txt = tomorrow
    ? `Para tu desayuno de mañana: unas <b>${fmt(b.kcal)} kcal</b> con <b>${fmt(b.p)} g</b> de proteína.`
    : b.covered
      ? `Ya registraste tu ${label}. Si quieres algo más, que sea liviano:`
      : b.light
        ? 'Ya casi llegas a tu meta de hoy. Si te da hambre, algo liviano:'
      : `Para tu ${label} te quedan unas <b>${fmt(b.kcal)} kcal</b> y <b>${fmt(b.p)} g</b> de proteína.`;
  const list = opts
    .map(
      (o, i) => `<button class="idea" data-action="idea-open" data-i="${i}">
        <span class="idea-e">${o.items.slice(0, 4).map((x) => x.e || '🍽️').join('')}</span>
        <span class="idea-t"><b>${esc(o.title)}</b><small>${fmt(o.kcal)} kcal · ${fmt(o.p)} g de proteína${aiOpts ? ' · ✨ IA' : ''}</small></span>
        <span class="chev">${ICON.right}</span></button>`
    )
    .join('');
  return `<section class="card ideas">
    <div class="card-head"><h3>🍽️ ¿Qué como?</h3></div>
    <div class="chips">${MEALS.map((m) => `<button class="chip ${m.id === meal ? 'on' : ''}" data-action="ideas-meal" data-meal="${m.id}">${m.e} ${m.label}</button>`).join('')}</div>
    <p class="muted small idea-txt">${txt}</p>
    <div class="idea-list">${list || '<p class="muted small">No tengo ideas para esto todavía.</p>'}</div>
    ${ui.ideas.loading ? '<p class="idea-loading">✨ Pensando ideas… <span class="dots"><i></i><i></i><i></i></span></p>' : ''}
    ${ui.ideas.error ? errBox(ui.ideas.error) : ''}
    <div class="row idea-actions"><button class="btn ghost" data-action="ideas-more">↻ Otras ideas</button>${aiReady() ? '<button class="btn ghost" data-action="ideas-ai">✨ Ideas con IA</button>' : ''}</div>
  </section>`;
}

async function runIdeasAI() {
  if (ui.ideas.loading) return;
  const { meal, tomorrow } = ideaTarget();
  const b = mealBudget(meal, tomorrow);
  const ai = aiCfg();
  const provider = ai.provider;
  ui.ideas.loading = true;
  ui.ideas.error = '';
  render(true);
  try {
    const eaten = tomorrow ? '' : dayOf(todayKey()).entries.slice(-8).map((e) => e.n).join(', ');
    const res = await suggestMealsAI({
      provider,
      key: ai.keys[provider],
      model: ai.model[provider] || '',
      preferred: ai.resolved[provider] || '',
      meal: mealLabel(meal).toLowerCase(),
      kcal: Math.round(b.kcal),
      protein: Math.round(b.p),
      eaten,
    });
    if (res.model && !ai.model[provider] && ai.resolved[provider] !== res.model) {
      ai.resolved[provider] = res.model;
      save();
    }
    if (!res.options.length) throw new Error('La IA no devolvió ideas. Intenta de nuevo.');
    ui.ideas.ai[meal] = res.options.map((o) => ({ ...o, items: o.items.map((x) => ({ ...x, e: emojiFor(x.n) })) }));
  } catch (err) {
    ui.ideas.error = err.message || 'No se pudieron generar ideas.';
  }
  ui.ideas.loading = false;
  if (ui.tab === 'hoy') render(true);
}

// ───────────── Progreso ─────────────
function viewProgreso() {
  const p = state.profile;
  const pl = plan();
  const w = latestWeight();
  const start = Number(p.startWeight) || w;
  const goal = Number(p.goalWeight) || null;
  const losing = goal && start > goal;
  const lost = start - w;
  const prog = losing ? clamp(lost / (start - goal), 0, 1) : 0;
  const e = eta(w, goal, pl.weeklyChange);
  const tr = trend(state.weights);
  const b = bmi(w, p.height);
  const [lo, hi] = healthyRange(p.height);
  const pts = state.weights.map((x) => ({ x: dayNumber(x.d), y: x.kg, label: fmtDateShort(x.d) }));
  const today = todayKey();
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)).map((k) => ({ k, t: totals(k), g: goalsFor(k) }));
  const logged = week.filter((d) => d.t.n);
  const avg = logged.length ? logged.reduce((s, d) => s + d.t.kcal, 0) / logged.length : 0;
  const closed = logged.filter((d) => d.k < today);
  const inGoal = closed.filter((d) => d.t.kcal >= d.g.kcal * 0.75 && d.t.kcal <= d.g.kcal * 1.05).length;
  const hist = Object.keys(state.days)
    .filter((k) => k <= today && state.days[k].entries?.length)
    .sort()
    .reverse()
    .slice(0, 14);

  let trendTxt = '';
  if (tr) {
    const pw = tr.perWeek;
    const dir = pw < -0.05 ? `bajando ${fmt1(-pw)} kg por semana` : pw > 0.05 ? `subiendo ${fmt1(pw)} kg por semana` : 'estable';
    let when = '';
    if (goal && w > goal && pw < -0.05) {
      const d = new Date();
      d.setDate(d.getDate() + Math.round(((w - goal) / -pw) * 7));
      when = ` A ese ritmo llegarías el <b>${fmtDateFull(d)}</b>.`;
    }
    trendTxt = `<li>Tu tendencia real (últimas semanas): <b>${dir}</b>.${when}</li>`;
  }

  const reached = losing && w <= goal;
  return `
  <header class="top"><div class="top-title static"><h1>Progreso</h1><p>Inicio: ${fmt1(start)} kg · Meta: ${goal ? `${fmt1(goal)} kg` : '—'}</p></div></header>

  <section class="card weight-card">
    <div class="w-now"><b>${fmt1(w)}</b><span>kg</span></div>
    <p class="w-delta ${lost > 0 ? 'good' : ''}">${lost > 0.05 ? `−${fmt1(lost)} kg desde que empezaste` : lost < -0.05 ? `+${fmt1(-lost)} kg desde que empezaste` : 'Aún sin cambios: ¡ánimo, apenas comienzas!'}</p>
    ${losing ? `<div class="bar goal"><i style="width:${prog * 100}%"></i></div><p class="muted small">${Math.round(prog * 100)} % del camino · faltan ${fmt1(Math.max(0, w - goal))} kg</p>` : ''}
    <button class="btn primary" data-action="add-weight">⚖️ Registrar peso</button>
  </section>

  <section class="card">${weightChart(pts, { goal })}</section>

  <section class="card">
    <h3>${reached ? '🎉 ¡Llegaste a tu meta!' : 'Proyección'}</h3>
    <ul class="plan-list">
      ${reached ? `<li>Ahora tu meta diaria es mantener: <b>${fmt(pl.kcal)} kcal</b>. Si quieres seguir bajando, pon una meta nueva en Ajustes.</li>` : ''}
      ${e ? `<li>Con tu plan (${fmt1(pl.weeklyChange)} kg/semana) llegarías a ${fmt1(goal)} kg el <b>${fmtDateFull(e.date)}</b>, en unas ${Math.round(e.weeks)} semanas.</li>` : ''}
      ${trendTxt}
      <li>IMC actual: <b>${fmt1(b)}</b> (${bmiLabel(b)}). Rango saludable para tu estatura: ${fmt1(lo)}–${fmt1(hi)} kg.</li>
      ${!tr && state.weights.length < 3 ? '<li class="muted">Registra tu peso 1 o 2 veces por semana para ver tu tendencia real.</li>' : ''}
    </ul>
  </section>

  <section class="card">
    <div class="card-head"><h3>Últimos 7 días</h3><span class="muted">${logged.length ? `Prom. ${fmt(avg)} kcal` : ''}</span></div>
    ${barChart(week.map((d) => ({ label: d.k === today ? 'Hoy' : cap(weekdayShort(d.k)), value: Math.round(d.t.kcal), target: d.g.kcal, today: d.k === today })))}
    <p class="muted small">${closed.length ? `${inGoal} de ${closed.length} días cerrados dentro de tu meta.` : 'Cuando cierres días, aquí verás cuántos quedaron en tu meta.'} La línea marca tu meta de cada día.</p>
  </section>

  ${hist.length ? `<section class="card"><h3>Historial</h3><div class="hist">${hist
    .map((k) => {
      const t = totals(k);
      const g = goalsFor(k);
      const ok = t.kcal <= g.kcal * 1.05;
      return `<button class="hist-row" data-action="goto-day" data-d="${k}"><span>${cap(fmtDateLong(k))}</span><b>${fmt(t.kcal)}<small> / ${fmt(g.kcal)}</small></b><i class="${ok ? 'ok' : 'over'}">${ok ? '✓' : '↑'}</i></button>`;
    })
    .join('')}</div></section>` : ''}

  <section class="card">
    <h3>Pesos registrados</h3>
    <div class="wlist">${[...state.weights]
      .reverse()
      .slice(0, 12)
      .map((x) => `<div class="wrow"><span>${cap(fmtDateLong(x.d))}</span><b>${fmt1(x.kg)} kg</b><button class="icon-btn small" data-action="del-weight" data-d="${x.d}" aria-label="Borrar">${ICON.trash}</button></div>`)
      .join('')}</div>
  </section>`;
}

// ───────────── Chigüi ─────────────
function viewChigui() {
  const acc = equippedAcc(G.level);
  const opts = [{ id: 'none', name: 'Ninguno', e: '🚫', level: 1 }, ...ACCESSORIES];
  return `
  <header class="top"><div class="top-title static"><h1>${esc(state.pet.name)}</h1><p>Tu chigüiro · nivel ${G.level}</p></div></header>
  <section class="card pet-hero">
    <button class="pet big" data-action="pet-tap" aria-label="${esc(state.pet.name)}">${mascotSVG({ mood: G.streak >= 3 ? 'contento' : 'feliz', acc, cls: 'big' })}</button>
    <div class="lvl wide"><span>Nivel ${G.level}</span><div class="bar xp"><i style="width:${lvlPct(G)}%"></i></div><small>${fmt(G.to - G.xp)} XP para el nivel ${G.level + 1}</small></div>
    <div class="pet-stats">
      <div><b>🔥 ${G.streak}</b><span>racha</span></div>
      <div><b>🏅 ${G.maxStreak}</b><span>mejor racha</span></div>
      <div><b>⭐ ${fmt(G.xp)}</b><span>XP total</span></div>
    </div>
  </section>

  <section class="card"><h3>Accesorios</h3><div class="acc-grid">${opts
    .map((a) => {
      const unlocked = G.level >= a.level;
      const on = a.id === 'none' ? state.pet.acc === 'none' : acc === a.id;
      return `<button class="acc ${on ? 'on' : ''} ${unlocked ? '' : 'locked'}" data-action="acc" data-id="${a.id}" ${unlocked ? '' : 'disabled'}><span>${unlocked ? a.e : '🔒'}</span><small>${a.name}</small>${unlocked ? '' : `<em>Nivel ${a.level}</em>`}</button>`;
    })
    .join('')}</div></section>

  <section class="card"><h3>Logros</h3><div class="badges">${G.badges
    .map((b) => `<div class="badge ${b.ok ? 'ok' : ''}"><span>${b.e}</span><b>${b.name}</b><small>${b.desc}</small></div>`)
    .join('')}</div></section>

  <section class="card"><h3>Cómo gana XP ${esc(state.pet.name)}</h3><ul class="xp-list">
    <li><span>🍽️</span>+5 por cada comida registrada (hasta 6 al día)</li>
    <li><span>🎯</span>+20 por cada día cerrado dentro de tu meta</li>
    <li><span>💪</span>+10 por cumplir tu proteína</li>
    <li><span>💧</span>+5 por cumplir tu meta de agua</li>
    <li><span>⚖️</span>+15 por cada día que registras tu peso</li>
  </ul></section>

  <section class="card"><label class="field"><span>Nombre de tu mascota</span><input data-input="petname" value="${esc(state.pet.name)}" maxlength="20" autocomplete="off"></label></section>`;
}

// ───────────── Ajustes ─────────────
function viewAjustes() {
  const p = state.profile;
  const pl = plan();
  const ai = aiCfg();
  const prov = PROVIDERS[ai.provider];
  const m = state.settings.manual;
  const e = eta(latestWeight(), Number(p.goalWeight), pl.weeklyChange);
  const sel = (name, opts, cur) =>
    `<select name="${name}">${opts.map(([v, l]) => `<option value="${v}" ${String(v) === String(cur) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  return `
  <header class="top"><div class="top-title static"><h1>Ajustes</h1><p>Tu plan, la IA y tus datos</p></div></header>

  <form class="card" data-form="profile">
    <h3>Tu perfil</h3>
    <div class="grid2">
      <label class="field"><span>Nombre</span><input name="name" value="${esc(p.name)}" maxlength="24"></label>
      <label class="field"><span>Sexo</span>${sel('sex', [['hombre', 'Hombre'], ['mujer', 'Mujer']], p.sex)}</label>
      <label class="field"><span>Edad</span><input name="age" inputmode="numeric" value="${esc(p.age)}"></label>
      <label class="field"><span>Estatura (cm)</span><input name="height" inputmode="decimal" value="${fmtIn(p.height)}"></label>
      <label class="field"><span>Peso meta (kg)</span><input name="goalWeight" inputmode="decimal" value="${fmtIn(p.goalWeight)}"></label>
      <label class="field"><span>Ritmo por semana</span>${sel('pace', PACES.map((x) => [x.v, `${x.label} · ${x.desc}`]), p.pace)}</label>
    </div>
    <label class="field"><span>Actividad</span>${sel('activity', Object.entries(ACTIVITY).map(([id, a]) => [id, `${a.label} — ${a.desc}`]), p.activity)}</label>
    <p class="muted small">Tu peso actual (${fmt1(latestWeight())} kg) se actualiza cuando lo registras en Progreso.</p>
    <button class="btn primary" type="submit">Guardar perfil</button>
  </form>

  <section class="card plan-card">
    <h3>Tu plan diario</h3>
    <div class="plan-big small"><b>${fmt(pl.kcal)}</b><span>kcal al día${pl.manual ? ' (personalizado)' : ''}</span></div>
    <div class="macro-pills"><span class="pill prot">Proteína ${fmt(pl.protein)} g</span><span class="pill carb">Carbos ${fmt(pl.carbs)} g</span><span class="pill fat">Grasa ${fmt(pl.fat)} g</span><span class="pill water">Agua ${fmt1(pl.water / 1000)} L</span></div>
    <ul class="plan-list">
      <li>Metabolismo basal (Mifflin-St Jeor): <b>${fmt(pl.bmr)} kcal</b></li>
      <li>Gasto diario estimado (× ${factorTxt(pl.factor)}): <b>${fmt(pl.tdee)} kcal</b></li>
      ${pl.mode === 'bajar' ? `<li>Déficit: <b>${fmt(pl.deficit)} kcal</b> ≈ ${fmt1(pl.weeklyChange)} kg por semana</li>` : `<li>Modo: <b>${pl.mode === 'subir' ? 'subir de peso' : 'mantener tu peso'}</b></li>`}
      ${e ? `<li>Llegarías a tu meta hacia el <b>${fmtDateFull(e.date)}</b></li>` : ''}
      ${pl.capped ? `<li class="warn">Se ajustó al mínimo seguro de ${fmt(pl.floor)} kcal. Para ir más rápido, suma actividad.</li>` : ''}
    </ul>
    <details><summary>¿Cómo se calcula?</summary>
      <p class="muted small">Basal = 10 × peso + 6,25 × estatura − 5 × edad ${p.sex === 'mujer' ? '− 161' : '+ 5'}. Se multiplica por tu nivel de actividad y se resta el déficit (ritmo × 7.700 kcal ÷ 7 días). Nunca baja de 1.500 kcal en hombres ni de 1.200 en mujeres. La proteína es 1,6 g por kg, la grasa el 28 % y el resto carbohidratos. Todo se recalcula cuando registras un peso nuevo.</p>
    </details>
  </section>

  <form class="card" data-form="targets">
    <h3>Metas personalizadas</h3>
    <label class="check"><input type="checkbox" name="on" ${m ? 'checked' : ''}> Usar mis propias metas (por ejemplo, si te las dio tu nutricionista)</label>
    <div class="grid2">
      <label class="field"><span>kcal</span><input name="kcal" inputmode="numeric" value="${m?.kcal ?? pl.kcal}"></label>
      <label class="field"><span>Proteína (g)</span><input name="protein" inputmode="numeric" value="${m?.protein ?? pl.protein}"></label>
      <label class="field"><span>Carbohidratos (g)</span><input name="carbs" inputmode="numeric" value="${m?.carbs ?? pl.carbs}"></label>
      <label class="field"><span>Grasa (g)</span><input name="fat" inputmode="numeric" value="${m?.fat ?? pl.fat}"></label>
      <label class="field"><span>Agua (ml)</span><input name="water" inputmode="numeric" value="${m?.water ?? pl.water}"></label>
      <label class="field"><span>Tamaño del vaso (ml)</span><input name="glass" inputmode="numeric" value="${state.settings.glass || 250}"></label>
    </div>
    <button class="btn" type="submit">Guardar metas</button>
  </form>

  <form class="card" data-form="ai" id="ai-card">
    <h3>✨ Inteligencia artificial</h3>
    <p class="muted small">Para calcular calorías con una foto o una descripción. Es opcional: sin IA puedes buscar en la base de alimentos.</p>
    <label class="field"><span>Proveedor</span><select name="provider" data-change="ai-provider">${Object.entries(PROVIDERS)
      .map(([id, x]) => `<option value="${id}" ${ai.provider === id ? 'selected' : ''}>${x.name} — ${x.note}</option>`)
      .join('')}</select></label>
    <label class="field"><span>Clave de API</span><input name="key" type="password" value="${esc(ai.keys[ai.provider] || '')}" placeholder="${prov.keyHint}" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
    <details><summary>Modelo (opcional)</summary>
      <label class="field"><span>Nombre del modelo</span><input name="model" value="${esc(ai.model[ai.provider] || '')}" placeholder="${ai.provider === 'gemini' ? `Automático${ai.resolved.gemini ? ` (usando ${esc(ai.resolved.gemini)})` : ''}` : PROVIDERS.claude.defaultModel}" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
    </details>
    <div class="row"><button class="btn primary" type="submit">Guardar</button><button class="btn" type="button" data-action="ai-test">Probar conexión</button></div>
    <p class="ai-status muted small" id="ai-status"></p>
    ${ai.provider === 'gemini' ? howToGemini() : `<ol class="steps"><li>Entra a <a href="${prov.keyUrl}" target="_blank" rel="noopener">console.anthropic.com</a> y carga saldo.</li><li>Crea una clave en <b>API Keys</b> y pégala arriba.</li></ol>`}
    <p class="muted small">🔒 Tu clave y tus datos se quedan en este celular. Las fotos van directo a ${prov.name}. En el plan gratis de Gemini, Google puede usar lo que envías para mejorar sus productos: no subas fotos con datos personales.</p>
  </form>

  <section class="card">
    <h3>Tus datos</h3>
    <p class="muted small">Todo se guarda en este celular. Haz un respaldo de vez en cuando por si borras los datos de Safari o cambias de celular. El respaldo no incluye tu clave de IA.</p>
    <div class="stack">
      <button class="btn" data-action="export">📤 Exportar respaldo</button>
      <label class="btn" for="import-in">📥 Importar respaldo</label>
      <input id="import-in" class="vh" type="file" accept="application/json,.json" data-change="import">
      <button class="btn danger ghost" data-action="reset">Borrar todos mis datos</button>
    </div>
  </section>

  <section class="card about">
    <p><b>Kcal</b> v${APP_VERSION} · <a href="https://github.com/dgallego8/kcal" target="_blank" rel="noopener">Código en GitHub</a></p>
    <p class="muted small">Las calorías son estimaciones. Si tienes una condición de salud, estás en embarazo o tomas medicamentos, consulta a un profesional antes de hacer dieta.</p>
  </section>`;
}

function howToGemini() {
  return `<ol class="steps">
    <li>Abre <a href="${PROVIDERS.gemini.keyUrl}" target="_blank" rel="noopener">aistudio.google.com/apikey</a> e inicia sesión con tu cuenta de Google.</li>
    <li>Toca <b>Create API key</b> (Crear clave de API).</li>
    <li>Cópiala (empieza por <code>AIza</code>), pégala aquí y toca Guardar.</li>
  </ol>`;
}

// ───────────── Onboarding ─────────────
function draftProfile() {
  const d = ui.ob.d;
  return {
    name: String(d.name || '').trim().slice(0, 24),
    sex: d.sex,
    age: parseNum(d.age),
    height: parseNum(d.height),
    weight: parseNum(d.weight),
    goalWeight: parseNum(d.goal),
    activity: d.activity,
    pace: Number(d.pace) || 0.5,
  };
}

function viewOnboarding() {
  const { step, d, err } = ui.ob;
  const dots = `<div class="ob-dots">${[1, 2, 3, 4].map((i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>`;
  const head = step > 0 ? `<div class="ob-head"><button class="icon-btn" data-action="ob-back" aria-label="Atrás">${ICON.left}</button>${dots}<span></span></div>` : '';
  const error = err ? `<p class="error">${esc(err)}</p>` : '';

  if (step === 0)
    return `<div class="ob ob-welcome">
      <div class="ob-hero">${mascotSVG({ mood: 'contento', acc: 'mandarina', cls: 'big' })}</div>
      <h1>¡Hola! Soy Chigüi</h1>
      <p class="lead">Te ayudo a contar calorías sin estrés: tómale foto a tu comida, búscala o descríbela, y yo hago las cuentas.</p>
      <button class="btn primary big" data-action="ob-next">Empezar</button>
      <p class="muted small center">Tus datos se guardan solo en este celular.</p>
    </div>`;

  if (step === 1)
    return `<div class="ob">${head}
      <h2>Cuéntame de ti</h2>
      <p class="muted">Con esto calculo cuánta energía gastas al día.</p>
      <label class="field"><span>¿Cómo te llamo? (opcional)</span><input data-input="ob" data-k="name" value="${esc(d.name)}" autocomplete="given-name" maxlength="24"></label>
      <div class="field"><span>Sexo biológico</span><div class="seg2">${['hombre', 'mujer']
        .map((s) => `<button class="${d.sex === s ? 'on' : ''}" data-action="ob-set" data-k="sex" data-v="${s}">${s === 'hombre' ? 'Hombre' : 'Mujer'}</button>`)
        .join('')}</div></div>
      <div class="grid3">
        <label class="field"><span>Edad</span><input data-input="ob" data-k="age" inputmode="numeric" value="${esc(d.age)}" placeholder="Años"></label>
        <label class="field"><span>Estatura</span><input data-input="ob" data-k="height" inputmode="decimal" value="${esc(d.height)}" placeholder="cm"></label>
        <label class="field"><span>Peso</span><input data-input="ob" data-k="weight" inputmode="decimal" value="${esc(d.weight)}" placeholder="kg"></label>
      </div>
      ${error}
      <button class="btn primary big" data-action="ob-next">Siguiente</button>
    </div>`;

  if (step === 2)
    return `<div class="ob">${head}
      <h2>¿Qué tan activo eres?</h2>
      <p class="muted">Piensa en una semana normal.</p>
      <div class="options">${Object.entries(ACTIVITY)
        .map(([id, a]) => `<button class="option ${d.activity === id ? 'on' : ''}" data-action="ob-set" data-k="activity" data-v="${id}"><b>${a.label}</b><small>${a.desc}</small></button>`)
        .join('')}</div>
      <button class="btn primary big" data-action="ob-next">Siguiente</button>
    </div>`;

  const prof = draftProfile();
  if (step === 3) {
    const [lo, hi] = healthyRange(prof.height);
    const sug = prof.weight > hi ? Math.round(hi) : Math.round(prof.weight);
    const goalForPreview = prof.goalWeight || Math.min(prof.weight - 1, hi);
    const paces = PACES.map((x) => {
      const pl = computePlan({ ...prof, goalWeight: goalForPreview, pace: x.v }, prof.weight);
      return `<button class="option small ${Number(d.pace) === x.v ? 'on' : ''}" data-action="ob-set" data-k="pace" data-v="${x.v}"><b>${x.label} por semana</b><small>${x.desc} · ${fmt(pl.kcal)} kcal/día${pl.capped ? ' (mínimo seguro)' : ''}</small></button>`;
    }).join('');
    return `<div class="ob">${head}
      <h2>¿Cuál es tu meta?</h2>
      <p class="muted">Para tu estatura, el peso saludable va de ${fmt1(lo)} a ${fmt1(hi)} kg. Hoy tu IMC es ${fmt1(bmi(prof.weight, prof.height))} (${bmiLabel(bmi(prof.weight, prof.height))}).</p>
      <label class="field big-num"><span>Peso meta (kg)</span><input data-input="ob" data-k="goal" inputmode="decimal" value="${esc(d.goal)}" placeholder="Ej: ${sug}"></label>
      <div class="field"><span>¿A qué ritmo?</span><div class="options">${paces}</div></div>
      ${error}
      <button class="btn primary big" data-action="ob-next">Calcular mi plan</button>
    </div>`;
  }

  const pl = computePlan(prof, prof.weight);
  const e = eta(prof.weight, prof.goalWeight, pl.weeklyChange);
  return `<div class="ob">${head}
    <div class="ob-hero small">${mascotSVG({ mood: 'contento', cls: 'mid' })}</div>
    <h2>Tu plan${prof.name ? `, ${esc(prof.name)}` : ''}</h2>
    <div class="plan-big"><b>${fmt(pl.kcal)}</b><span>kcal al día</span></div>
    <div class="macro-pills"><span class="pill prot">Proteína ${pl.protein} g</span><span class="pill carb">Carbohidratos ${pl.carbs} g</span><span class="pill fat">Grasa ${pl.fat} g</span></div>
    <ul class="plan-list">
      <li>Gastas unas <b>${fmt(pl.tdee)} kcal</b> al día (basal ${fmt(pl.bmr)} × ${factorTxt(pl.factor)} por actividad).</li>
      ${pl.mode === 'bajar' ? `<li>Con un déficit de <b>${fmt(pl.deficit)} kcal</b> bajarías unos <b>${fmt1(pl.weeklyChange)} kg por semana</b>.</li>` : ''}
      ${e ? `<li>Llegarías a ${fmt1(prof.goalWeight)} kg hacia el <b>${fmtDateFull(e.date)}</b> (unas ${Math.round(e.weeks)} semanas).</li>` : ''}
      <li>Agua: unos <b>${fmt1(pl.water / 1000)} L</b> al día.</li>
      ${pl.capped ? `<li class="warn">Ajusté tu meta al mínimo seguro de ${fmt(pl.floor)} kcal. Para bajar más rápido, suma actividad en vez de comer menos.</li>` : ''}
    </ul>
    <button class="btn primary big" data-action="ob-finish">¡Empecemos!</button>
    <p class="muted small center">Es una estimación: si en 3–4 semanas no ves cambios, ajusta tu meta en Ajustes.</p>
  </div>`;
}

function obNext() {
  const ob = ui.ob;
  const p = draftProfile();
  ob.err = '';
  if (ob.step === 1) {
    if (!(p.age >= 14 && p.age <= 100)) ob.err = 'Escribe tu edad en años.';
    else if (p.age < 18) ob.err = 'Kcal está pensada para mayores de 18 años. A tu edad, lo mejor es que un profesional de la salud defina tu plan.';
    else if (!(p.height >= 120 && p.height <= 230)) ob.err = 'Escribe tu estatura en centímetros (ej: 165).';
    else if (!(p.weight >= 35 && p.weight <= 300)) ob.err = 'Escribe tu peso en kilos (ej: 70,5).';
  }
  if (ob.step === 3) {
    const [lo] = healthyRange(p.height);
    if (!(p.goalWeight >= 35 && p.goalWeight <= 300)) ob.err = 'Escribe tu peso meta en kilos.';
    else if (p.goalWeight < lo) ob.err = `Esa meta queda por debajo del peso saludable para tu estatura. Elige al menos ${fmt1(Math.ceil(lo))} kg.`;
  }
  if (!ob.err) ob.step = Math.min(4, ob.step + 1);
  render();
  window.scrollTo(0, 0);
}

function obFinish() {
  const p = draftProfile();
  const today = todayKey();
  state.profile = { ...state.profile, ...p, weight: p.weight, startWeight: p.weight, startDate: today };
  state.weights = [{ d: today, kg: p.weight }];
  state.onboarded = true;
  save(true);
  try {
    navigator.storage?.persist?.();
  } catch {
    /* no soportado */
  }
  ui.tab = 'hoy';
  ui.day = today;
  render();
  window.scrollTo(0, 0);
  setTimeout(() => toast('¡Listo! Toca ＋ para registrar tu primera comida'), 400);
}

// ═════════════════════════ Hojas (sheets) ═════════════════════════
function openSheet(s) {
  sheet = s;
  renderSheet(true);
  document.body.classList.add('sheet-open');
}
function closeSheet() {
  sheet = null;
  sheetRoot.innerHTML = '';
  document.body.classList.remove('sheet-open');
}
function renderSheet(fresh = false) {
  if (!sheet) return;
  const html = { add: sheetAdd, entry: sheetEntry, weight: sheetWeight }[sheet.kind]?.() || '';
  const inner = sheetRoot.querySelector('.sheet-inner');
  if (inner && !fresh) inner.innerHTML = html;
  else
    sheetRoot.innerHTML = `<div class="sheet-backdrop" data-action="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grabber"></div><div class="sheet-inner">${html}</div></div>`;
}

function openAdd(meal) {
  openSheet({ kind: 'add', meal: meal || defaultMeal(), mode: aiReady() ? 'foto' : 'buscar', query: '', text: '', note: '', image: null, items: null, loading: false, error: '' });
  if (sheet.mode === 'buscar') focusSearch();
}

function focusSearch() {
  setTimeout(() => $('.sheet .search')?.focus(), 60);
}

const MODES = [
  ['foto', '📸', 'Foto'],
  ['texto', '✍️', 'Describir'],
  ['buscar', '🔎', 'Buscar'],
  ['rapido', '⚡', 'Rápido'],
];

function sheetAdd() {
  const s = sheet;
  const dayTxt = ui.day === todayKey() ? '' : ` · ${cap(fmtDateShort(ui.day))}`;
  const head = `<div class="sheet-head"><h2>Agregar comida${dayTxt}</h2><button class="icon-btn" data-action="close-sheet" aria-label="Cerrar">${ICON.close}</button></div>
    <div class="chips">${MEALS.map((m) => `<button class="chip ${m.id === s.meal ? 'on' : ''}" data-action="set-meal" data-meal="${m.id}">${m.e} ${m.label}</button>`).join('')}</div>`;
  if (s.picked) return head + qtyView('add');
  if (s.mode === 'idea')
    return `${head}<h3 class="idea-title">${esc(s.title)}</h3>${s.viewOnly ? '<p class="muted small">Es para mañana: regístrala cuando la comas.</p>' : ''}${resultsAI()}`;
  const seg = `<div class="seg">${MODES.map(([id, e, l]) => `<button class="${s.mode === id ? 'on' : ''}" data-action="mode" data-mode="${id}"><span>${e}</span>${l}</button>`).join('')}</div>`;
  let body = '';
  if (s.loading) body = loadingHTML(s.mode === 'foto' ? 'Mirando tu plato…' : 'Calculando…');
  else if (s.items && (s.mode === 'foto' || s.mode === 'texto')) body = resultsAI();
  else if (s.mode === 'foto') body = aiReady() ? photoBody() : aiSetupInline();
  else if (s.mode === 'texto') body = textBody();
  else if (s.mode === 'rapido') body = quickBody();
  else body = `<input class="search" type="search" placeholder="Busca: arepa, pollo, tinto…" value="${esc(s.query)}" data-input="search" enterkeyhint="search" autocomplete="off" autocorrect="off"><div id="results">${resultsHTML()}</div>`;
  return head + seg + `<div class="sheet-body">${body}</div>`;
}

const errBox = (m) => `<div class="error-box">⚠️ ${esc(m)}</div>`;
const loadingHTML = (msg) => `<div class="loading">${mascotSVG({ mood: 'hambre', cls: 'sniff' })}<p>${msg}</p><div class="dots"><i></i><i></i><i></i></div></div>`;

function photoBody() {
  const s = sheet;
  return `<label class="photo-drop ${s.image ? 'has' : ''}" for="photo-in">${
    s.image
      ? `<img src="${s.image}" alt="Tu comida"><span class="retake">Cambiar foto</span>`
      : `<span class="pd-ico">📸</span><b>Tomar o elegir foto</b><small>Que se vea todo el plato, desde arriba si puedes</small>`
  }</label>
  <input id="photo-in" class="vh" type="file" accept="image/*" data-change="photo">
  ${s.image ? `<label class="field"><span>¿Algo que la foto no muestre? (opcional)</span><input data-input="note" value="${esc(s.note)}" placeholder="Ej: el jugo era sin azúcar, media porción de arroz"></label>
  <button class="btn primary big" data-action="analyze">✨ Calcular calorías</button>` : ''}
  ${s.error ? errBox(s.error) : ''}`;
}

function textBody() {
  const s = sheet;
  const ready = aiReady();
  return `<label class="field"><span>¿Qué comiste?</span><textarea data-input="text" rows="3" placeholder="Ej: 2 arepas con queso, 1 huevo frito y un tinto con azúcar">${esc(s.text)}</textarea></label>
  ${ready ? '<button class="btn primary big" data-action="analyze-text">✨ Calcular con IA</button>' : ''}
  <button class="btn ${ready ? 'ghost' : 'primary big'}" data-action="local-text">🔎 Calcular con la base${ready ? ' (sin IA)' : ''}</button>
  ${ready ? '' : '<p class="muted small center">¿Quieres más precisión? <button class="link" data-action="mode" data-mode="foto">Activa la IA gratis</button></p>'}
  ${s.error ? errBox(s.error) : ''}`;
}

function quickBody() {
  return `<form data-form="quick" class="stack">
    <label class="field"><span>Nombre</span><input name="n" placeholder="Ej: Almuerzo en la U" maxlength="60"></label>
    <div class="grid4">
      <label class="field"><span>kcal</span><input name="k" inputmode="decimal" placeholder="0"></label>
      <label class="field"><span>Prot. g</span><input name="p" inputmode="decimal" placeholder="0"></label>
      <label class="field"><span>Carb. g</span><input name="c" inputmode="decimal" placeholder="0"></label>
      <label class="field"><span>Grasa g</span><input name="f" inputmode="decimal" placeholder="0"></label>
    </div>
    <label class="check"><input type="checkbox" name="save"> Guardar en mis alimentos para buscarlo después</label>
    <button class="btn primary big" type="submit">Agregar</button>
  </form>`;
}

function aiSetupInline() {
  return `<div class="ai-setup">
    ${mascotSVG({ mood: 'feliz', cls: 'mini' })}
    <h3>Activa la IA gratis</h3>
    <p class="muted">Con una clave gratuita de Google Gemini calculo calorías desde fotos o descripciones.</p>
    ${howToGemini()}
    <form data-form="ai-inline" class="stack">
      <input name="key" placeholder="Pega tu clave (AIza…)" autocomplete="off" autocapitalize="off" spellcheck="false">
      <button class="btn primary" type="submit">Guardar clave</button>
    </form>
    <p class="muted small">¿Prefieres Claude? Cámbialo en Ajustes. Mientras tanto usa 🔎 Buscar o ✍️ Describir.</p>
  </div>`;
}

// Registro de filas para elegir alimentos sin meter datos en el HTML
const rowReg = new Map();
let rowSeq = 0;
function foodRow(f) {
  const rid = `r${++rowSeq}`;
  rowReg.set(rid, f);
  return `<button class="food-row" data-action="pick-food" data-rid="${rid}"><span class="fr-e">${f.e || '🍽️'}</span><span class="fr-t"><b>${esc(f.n)}</b><small>${esc(f.u)}</small></span><span class="fr-k">${fmt(f.k)}<small>kcal</small></span></button>`;
}

function resultsHTML() {
  rowReg.clear();
  const q = sheet.query.trim();
  if (!q) {
    const sec = (title, list) => (list.length ? `<h4 class="sec">${title}</h4>${list.map(foodRow).join('')}` : '');
    return (
      sec('⭐ Favoritos', state.favorites) +
      sec('🕘 Recientes', state.recents.slice(0, 10)) +
      sec('🔥 Populares', POPULAR.map(foodById).filter(Boolean))
    );
  }
  const res = searchFoods(q, state.customFoods);
  if (!res.length)
    return `<div class="empty">No encontré «${esc(q)}».
      <div class="row center"><button class="btn ghost" data-action="mode" data-mode="rapido">⚡ Agregar a mano</button><button class="btn ghost" data-action="search-to-text">✍️ Describirlo</button></div></div>`;
  return res.map(foodRow).join('');
}

function nutGrid(b, q) {
  return `<div class="nut"><div class="nk"><b>${fmt(b.k * q)}</b><span>kcal</span></div>
    <div class="np"><b>${fmt1(b.p * q)} g</b><span>Proteína</span></div>
    <div class="nc"><b>${fmt1(b.c * q)} g</b><span>Carbos</span></div>
    <div class="nf"><b>${fmt1(b.f * q)} g</b><span>Grasa</span></div></div>`;
}

function qtyView(kind) {
  const s = sheet;
  const b = s.base;
  const q = s.q;
  const fav = isFav(b);
  const top =
    kind === 'add'
      ? `<button class="back" data-action="unpick">${ICON.left} Volver</button>`
      : '';
  return `${top}
  <div class="pick-head"><span class="pick-emoji">${b.e || '🍽️'}</span><div><h3>${esc(b.n)}</h3><p class="muted">${esc(b.u)}</p></div>
    <button class="icon-btn star ${fav ? 'on' : ''}" data-action="fav" aria-label="Favorito">${fav ? '★' : '☆'}</button></div>
  <div class="qty"><button class="qbtn" data-action="qty" data-d="-0.25" aria-label="Menos">−</button>
    <input class="qin" inputmode="decimal" value="${fmtIn(q)}" data-input="qty" aria-label="Cantidad de porciones">
    <button class="qbtn" data-action="qty" data-d="0.25" aria-label="Más">+</button></div>
  <p class="muted small center">porciones de ${esc(b.u)}</p>
  <div class="qpresets">${[0.5, 1, 1.5, 2, 3].map((v) => `<button class="chip ${q === v ? 'on' : ''}" data-action="qty-set" data-v="${v}">${fmtQty(v)}</button>`).join('')}</div>
  <div id="nut">${nutGrid(b, q)}</div>
  ${kind === 'entry' ? `<details class="edit-vals"><summary>Corregir valores de 1 porción</summary><div class="grid4">
      ${['k', 'p', 'c', 'f'].map((f) => `<label class="field"><span>${{ k: 'kcal', p: 'Prot. g', c: 'Carb. g', f: 'Grasa g' }[f]}</span><input inputmode="decimal" value="${fmtIn(b[f])}" data-input="ebase" data-k="${f}"></label>`).join('')}
    </div></details>` : ''}
  <button class="btn primary big" data-action="${kind === 'add' ? 'confirm-pick' : 'entry-save'}" id="qty-btn">${kind === 'add' ? 'Agregar' : 'Guardar'} · ${fmt(b.k * q)} kcal</button>`;
}

function updateQtyUI(rewrite = true) {
  if (!sheet?.base) return;
  const { base: b, q } = sheet;
  const nut = $('#nut');
  if (nut) nut.innerHTML = nutGrid(b, q);
  const btn = $('#qty-btn');
  if (btn) btn.textContent = `${sheet.kind === 'entry' ? 'Guardar' : 'Agregar'} · ${fmt(b.k * q)} kcal`;
  if (rewrite) {
    const inp = $('.qin');
    if (inp) inp.value = fmtIn(q);
  }
  $$('[data-action="qty-set"]').forEach((x) => x.classList.toggle('on', Number(x.dataset.v) === q));
}
function setQty(v) {
  sheet.q = clamp(Math.round(v * 100) / 100, 0.25, 50);
  updateQtyUI();
}

function resultsAI() {
  const s = sheet;
  const items = s.items || [];
  const thumb = s.mode === 'foto' && s.image ? `<img class="ai-thumb" src="${s.image}" alt="">` : '';
  const miss = s.unmatched?.length
    ? `<p class="muted small">No encontré: ${s.unmatched.map((u) => `«${esc(u)}»`).join(', ')}. Búscalo en 🔎 o agrégalo en ⚡.</p>`
    : '';
  if (!items.length)
    return `${thumb}<div class="empty">No encontré comida para registrar. ${esc(s.comment || '')}</div>${miss}<button class="btn" data-action="ai-reset">Intentar de nuevo</button>`;
  const list = items
    .map(
      (it, i) => `<div class="ai-item ${it.off ? 'off' : ''}">
      <div class="ai-top"><span class="em">${it.e || '🍽️'}</span><input class="ai-name" value="${esc(it.n)}" data-input="ai" data-i="${i}" data-k="n" aria-label="Nombre">
        <button class="icon-btn small" data-action="ai-toggle" data-i="${i}" aria-label="${it.off ? 'Volver a incluir' : 'Quitar'}">${it.off ? '↺' : ICON.close}</button></div>
      <input class="ai-por" value="${esc(it.u)}" data-input="ai" data-i="${i}" data-k="u" aria-label="Porción">
      <div class="ai-nums">${['k', 'p', 'c', 'f']
        .map((f) => `<label><input inputmode="decimal" value="${fmtIn(it[f])}" data-input="ai" data-i="${i}" data-k="${f}"><span>${{ k: 'kcal', p: 'prot', c: 'carb', f: 'grasa' }[f]}</span></label>`)
        .join('')}</div>
    </div>`
    )
    .join('');
  return `${thumb}
  ${s.comment ? `<div class="bubble small">🐾 ${esc(s.comment)}</div>` : ''}
  <div class="ai-items">${list}</div>
  ${miss}
  <p class="muted small">${s.src === 'idea' ? 'Ajusta las porciones o quita lo que no vayas a comer.' : `Revisa y corrige lo que no cuadre.${s.conf ? ` Confianza de la IA: ${esc(s.conf)}.` : ''}${s.src === 'local' ? ' Estimado con la base de alimentos (sin IA).' : ''}`}</p>
  ${s.viewOnly ? '' : `<button class="btn primary big" data-action="ai-add" id="ai-add">${aiAddLabel()}</button>`}
  ${s.src === 'idea' ? '' : '<button class="btn ghost" data-action="ai-reset">Empezar de nuevo</button>'}`;
}

function aiAddLabel() {
  const list = (sheet.items || []).filter((it) => !it.off);
  const total = list.reduce((s, it) => s + (Number(it.k) || 0), 0);
  return `Agregar ${list.length} · ${fmt(total)} kcal`;
}

async function runAI(mode) {
  const s = sheet;
  const ai = aiCfg();
  const provider = ai.provider;
  if (mode === 'foto' && !s.image) return;
  if (mode === 'texto' && !s.text.trim()) {
    s.error = 'Escribe qué comiste.';
    renderSheet();
    return;
  }
  s.loading = true;
  s.error = '';
  renderSheet();
  try {
    const res = await analyzeFood({
      provider,
      key: ai.keys[provider],
      model: ai.model[provider] || '',
      preferred: ai.resolved[provider] || '',
      image: mode === 'foto' ? s.image : null,
      text: mode === 'foto' ? s.note.trim() : s.text.trim(),
      meal: mealLabel(s.meal),
    });
    if (res.model && !ai.model[provider] && ai.resolved[provider] !== res.model) {
      ai.resolved[provider] = res.model;
      save();
    }
    s.items = res.items.map((it) => ({ ...it, e: emojiFor(it.n) }));
    s.comment = res.comment;
    s.conf = res.confidence;
    s.src = 'ia';
    s.unmatched = [];
  } catch (err) {
    s.error = err.message || 'No se pudo analizar.';
  }
  s.loading = false;
  if (sheet === s) renderSheet();
}

function runLocal() {
  const s = sheet;
  if (!s.text.trim()) {
    s.error = 'Escribe qué comiste.';
    renderSheet();
    return;
  }
  const res = localEstimate(s.text, state.customFoods);
  s.items = res
    .filter((r) => r.food)
    .map((r) => ({
      n: r.food.n,
      u: scalePortion(r.food.u, r.q),
      k: Math.round(r.food.k * r.q),
      p: Math.round(r.food.p * r.q * 10) / 10,
      c: Math.round(r.food.c * r.q * 10) / 10,
      f: Math.round(r.food.f * r.q * 10) / 10,
      e: r.food.e,
    }));
  s.unmatched = res.filter((r) => !r.food).map((r) => r.query);
  s.src = 'local';
  s.comment = '';
  s.conf = '';
  s.error = '';
  renderSheet();
}

function addAIItems() {
  const s = sheet;
  const list = (s.items || []).filter((it) => !it.off && Number(it.k) > 0);
  if (!list.length) return;
  let total = 0;
  for (const it of list) {
    addEntry(ui.day, {
      meal: s.meal,
      n: String(it.n || 'Comida').trim() || 'Comida',
      u: String(it.u || '1 porción').trim(),
      k: Number(it.k) || 0,
      p: Number(it.p) || 0,
      c: Number(it.c) || 0,
      f: Number(it.f) || 0,
      e: it.e || '🍽️',
      src: s.src === 'ia' ? 'ia' : s.src === 'idea' ? 'idea' : 'base',
    });
    total += Number(it.k) || 0;
  }
  if (s.src === 'ia' && s.mode === 'foto') state.stats.photoLogs = (state.stats.photoLogs || 0) + 1;
  save();
  closeSheet();
  fed(total);
}

function fed(total) {
  if (ui.tab !== 'hoy') ui.tab = 'hoy';
  render(true);
  toast(`¡Ñam! +${fmt(total)} kcal`);
  const pet = $('.pet-card .chigui');
  if (pet) {
    pet.classList.add('eat');
    setTimeout(() => pet.classList.remove('eat'), 1300);
  }
}

function sheetEntry() {
  const s = sheet;
  const found = findEntry(s.id);
  if (!found) return '<p class="muted">Este registro ya no existe.</p>';
  return `<div class="sheet-head"><h2>Editar</h2><button class="icon-btn" data-action="close-sheet" aria-label="Cerrar">${ICON.close}</button></div>
  <div class="chips">${MEALS.map((m) => `<button class="chip ${m.id === s.meal ? 'on' : ''}" data-action="entry-meal" data-meal="${m.id}">${m.e} ${m.label}</button>`).join('')}</div>
  ${qtyView('entry')}
  <button class="btn danger ghost" data-action="entry-del">${ICON.trash} Eliminar</button>`;
}

function openEntry(id) {
  const found = findEntry(id);
  if (!found) return;
  const { e } = found;
  openSheet({ kind: 'entry', id, meal: e.meal, q: e.q ?? 1, base: { n: e.n, u: e.u, k: e.k, p: e.p, c: e.c, f: e.f, e: e.e } });
}

function sheetWeight() {
  const today = todayKey();
  return `<div class="sheet-head"><h2>⚖️ Registrar peso</h2><button class="icon-btn" data-action="close-sheet" aria-label="Cerrar">${ICON.close}</button></div>
  <form data-form="weight" class="stack">
    <label class="field big-num"><span>Peso (kg)</span><input name="kg" inputmode="decimal" value="${fmtIn(latestWeight())}"></label>
    <label class="field"><span>Fecha</span><input name="d" type="date" value="${today}" max="${today}"></label>
    <button class="btn primary big" type="submit">Guardar</button>
    <p class="muted small">Tip: pésate en ayunas, después de ir al baño y a la misma hora. El peso sube y baja de un día a otro por el agua: fíjate en la tendencia, no en un solo día.</p>
  </form>`;
}

// ═════════════════════════ Acciones ═════════════════════════
const actions = {
  'close-sheet': closeSheet,
  day: (el) => {
    const next = addDays(ui.day, Number(el.dataset.d));
    ui.day = next > todayKey() ? todayKey() : next;
    render();
  },
  today: () => {
    ui.day = todayKey();
    render();
  },
  add: (el) => openAdd(el.dataset.meal),
  water: (el) => {
    const n = Number(el.dataset.n);
    const glass = state.settings.glass || 250;
    const d = ensureDay(ui.day);
    const filled = Math.floor((d.water || 0) / glass + 1e-6);
    d.water = (n === filled ? n - 1 : n) * glass;
    touch(ui.day);
    save();
    render(true);
  },
  'pet-tap': (el) => {
    const svg = el.querySelector('.chigui');
    svg?.classList.remove('eat');
    void svg?.getBoundingClientRect();
    svg?.classList.add('eat');
    setTimeout(() => svg?.classList.remove('eat'), 1300);
    toast(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
  },
  'edit-entry': (el) => openEntry(el.dataset.id),
  'set-meal': (el) => {
    sheet.meal = el.dataset.meal;
    renderSheet();
  },
  mode: (el) => {
    sheet.mode = el.dataset.mode;
    sheet.error = '';
    sheet.items = null;
    sheet.picked = null;
    renderSheet();
    if (sheet.mode === 'buscar') focusSearch();
  },
  'search-to-text': () => {
    sheet.text = sheet.query;
    sheet.mode = 'texto';
    renderSheet();
  },
  'pick-food': (el) => {
    const f = rowReg.get(el.dataset.rid);
    if (!f) return;
    sheet.picked = f;
    sheet.base = { n: f.n, u: f.u, k: f.k, p: f.p, c: f.c, f: f.f, e: f.e };
    sheet.q = 1;
    renderSheet();
  },
  unpick: () => {
    sheet.picked = null;
    renderSheet();
    focusSearch();
  },
  qty: (el) => setQty(sheet.q + Number(el.dataset.d)),
  'qty-set': (el) => setQty(Number(el.dataset.v)),
  'confirm-pick': () => {
    const { base: b, q, meal } = sheet;
    addEntry(ui.day, { meal, n: b.n, u: b.u, k: b.k, p: b.p, c: b.c, f: b.f, e: b.e, q, src: 'base' });
    save();
    const total = b.k * q;
    closeSheet();
    fed(total);
  },
  fav: (el) => {
    toggleFav(sheet.base);
    const on = isFav(sheet.base);
    el.classList.toggle('on', on);
    el.textContent = on ? '★' : '☆';
    toast(on ? '⭐ Guardado en favoritos' : 'Quitado de favoritos');
  },
  analyze: () => runAI('foto'),
  'analyze-text': () => runAI('texto'),
  'local-text': runLocal,
  'ai-toggle': (el) => {
    const it = sheet.items[Number(el.dataset.i)];
    it.off = !it.off;
    renderSheet();
  },
  'ai-add': addAIItems,
  'ai-reset': () => {
    sheet.items = null;
    sheet.error = '';
    sheet.unmatched = [];
    if (sheet.mode === 'foto') {
      sheet.image = null;
      sheet.note = '';
    }
    renderSheet();
  },
  'entry-meal': (el) => {
    sheet.meal = el.dataset.meal;
    renderSheet();
  },
  'entry-save': () => {
    const found = findEntry(sheet.id);
    if (!found) return closeSheet();
    const { e, k } = found;
    Object.assign(e, { meal: sheet.meal, q: sheet.q, k: sheet.base.k, p: sheet.base.p, c: sheet.base.c, f: sheet.base.f });
    touch(k);
    save();
    closeSheet();
    render(true);
    toast('Cambios guardados');
  },
  'entry-del': () => {
    const found = findEntry(sheet.id);
    if (!found) return closeSheet();
    if (!confirm(`¿Eliminar «${found.e.n}»?`)) return;
    found.d.entries = found.d.entries.filter((x) => x.id !== sheet.id);
    save();
    closeSheet();
    render(true);
    toast('Registro eliminado');
  },
  'add-weight': () => openSheet({ kind: 'weight' }),
  'del-weight': (el) => {
    if (state.weights.length <= 1) return toast('Necesitas al menos un peso registrado');
    if (!confirm('¿Borrar este registro de peso?')) return;
    state.weights = state.weights.filter((w) => w.d !== el.dataset.d);
    save();
    render(true);
  },
  'goto-day': (el) => {
    ui.day = el.dataset.d;
    ui.tab = 'hoy';
    render();
    window.scrollTo(0, 0);
  },
  acc: (el) => {
    state.pet.acc = el.dataset.id;
    save();
    render(true);
  },
  'ai-test': async () => {
    const form = $('#ai-card');
    const status = $('#ai-status');
    const fd = new FormData(form);
    const provider = fd.get('provider');
    status.textContent = 'Probando…';
    try {
      const model = await testAI({ provider, key: String(fd.get('key') || '').trim(), model: String(fd.get('model') || '').trim() });
      status.textContent = `✅ Conexión correcta (modelo: ${model}). Toca Guardar.`;
    } catch (err) {
      status.textContent = `⚠️ ${err.message}`;
    }
  },
  export: exportData,
  reset: () => {
    if (!confirm('¿Borrar todos tus datos? Esto no se puede deshacer.')) return;
    if (!confirm('Última confirmación: se borrarán tus comidas, pesos y el progreso de tu mascota.')) return;
    localStorage.removeItem(STORE_KEY);
    state = defaultState();
    ui.tab = 'hoy';
    ui.day = todayKey();
    ui.ob = { step: 0, d: newDraft(), err: '' };
    render();
  },
  'ideas-meal': (el) => {
    ui.ideas.meal = el.dataset.meal;
    ui.ideas.error = '';
    render(true);
  },
  'ideas-more': () => {
    delete ui.ideas.ai[ideaTarget().meal];
    ui.ideas.seed++;
    ui.ideas.error = '';
    render(true);
  },
  'ideas-ai': runIdeasAI,
  'idea-open': (el) => {
    const o = ideaReg[Number(el.dataset.i)];
    if (!o) return;
    openSheet({
      kind: 'add', meal: o.meal, mode: 'idea', src: 'idea', title: o.title, viewOnly: o.tomorrow,
      items: o.items.map((x) => ({ ...x })), query: '', text: '', note: '', image: null, loading: false, error: '',
    });
  },
  'ob-next': obNext,
  'ob-back': () => {
    ui.ob.err = '';
    ui.ob.step = Math.max(0, ui.ob.step - 1);
    render();
  },
  'ob-set': (el) => {
    const k = el.dataset.k;
    ui.ob.d[k] = k === 'pace' ? Number(el.dataset.v) : el.dataset.v;
    render(true);
  },
  'ob-finish': obFinish,
};

// ═════════════════════════ Formularios ═════════════════════════
const num = (fd, k) => parseNum(fd.get(k));
const forms = {
  quick: (form, fd) => {
    const k = num(fd, 'k');
    if (!(k > 0 && k < 10000)) return toast('Escribe las calorías (kcal)');
    const n = String(fd.get('n') || '').trim() || 'Comida';
    const item = { n, u: '1 porción', k, p: num(fd, 'p') || 0, c: num(fd, 'c') || 0, f: num(fd, 'f') || 0, e: '🍽️' };
    if (fd.get('save')) {
      state.customFoods = [{ id: `c-${uid()}`, cat: 'mios', a: '', ...item, e: '⭐' }, ...state.customFoods.filter((x) => x.n !== n)].slice(0, 200);
      item.e = '⭐';
    }
    addEntry(ui.day, { meal: sheet.meal, ...item, src: 'manual' });
    save();
    closeSheet();
    fed(k);
  },
  profile: (form, fd) => {
    const p = state.profile;
    const age = num(fd, 'age');
    const height = num(fd, 'height');
    const goal = num(fd, 'goalWeight');
    if (!(age >= 18 && age <= 100)) return toast('Revisa la edad (18 a 100 años)');
    if (!(height >= 120 && height <= 230)) return toast('Revisa la estatura en cm');
    const [lo] = healthyRange(height);
    if (!(goal >= 35 && goal <= 300)) return toast('Revisa el peso meta');
    if (goal < lo) return toast(`La meta mínima saludable para tu estatura es ${fmt1(Math.ceil(lo))} kg`);
    Object.assign(p, {
      name: String(fd.get('name') || '').trim().slice(0, 24),
      sex: fd.get('sex') === 'mujer' ? 'mujer' : 'hombre',
      age,
      height,
      goalWeight: goal,
      pace: Number(fd.get('pace')) || 0.5,
      activity: ACTIVITY[fd.get('activity')] ? fd.get('activity') : 'ligero',
    });
    touch(todayKey());
    save();
    render(true);
    toast(`Perfil guardado · Meta: ${fmt(plan().kcal)} kcal/día`);
  },
  targets: (form, fd) => {
    const glass = num(fd, 'glass');
    state.settings.glass = glass >= 100 && glass <= 1000 ? Math.round(glass) : 250;
    if (fd.get('on')) {
      const v = (k, lo, hi) => {
        const x = num(fd, k);
        return x >= lo && x <= hi ? Math.round(x) : null;
      };
      const kcal = v('kcal', 1000, 6000);
      if (!kcal) return toast('Las calorías deben estar entre 1.000 y 6.000');
      state.settings.manual = { kcal, protein: v('protein', 20, 400), carbs: v('carbs', 20, 900), fat: v('fat', 10, 300), water: v('water', 500, 6000) };
    } else state.settings.manual = null;
    touch(todayKey());
    save();
    render(true);
    toast('Metas guardadas');
  },
  ai: (form, fd) => {
    const ai = aiCfg();
    const provider = fd.get('provider') === 'claude' ? 'claude' : 'gemini';
    ai.provider = provider;
    ai.keys[provider] = String(fd.get('key') || '').trim();
    ai.model[provider] = String(fd.get('model') || '').trim();
    save();
    render(true);
    toast(ai.keys[provider] ? '✨ IA lista: ya puedes usar fotos' : 'Clave borrada');
  },
  'ai-inline': (form, fd) => {
    const key = String(fd.get('key') || '').trim();
    if (key.length < 20) return toast('Esa clave parece incompleta');
    const ai = aiCfg();
    ai.provider = 'gemini';
    ai.keys.gemini = key;
    save();
    renderSheet();
    toast('✨ IA lista');
  },
  weight: (form, fd) => {
    const kg = num(fd, 'kg');
    const d = String(fd.get('d') || todayKey());
    if (!(kg >= 35 && kg <= 300)) return toast('Revisa el peso');
    if (d > todayKey()) return toast('La fecha no puede ser futura');
    state.weights = [...state.weights.filter((w) => w.d !== d), { d, kg: Math.round(kg * 10) / 10 }].sort((a, b) => (a.d < b.d ? -1 : 1));
    state.profile.weight = latestWeight();
    touch(todayKey());
    save();
    closeSheet();
    render(true);
    const lost = (Number(state.profile.startWeight) || kg) - latestWeight();
    toast(lost > 0.05 ? `⚖️ ¡Vas −${fmt1(lost)} kg!` : '⚖️ Peso guardado');
  },
};

// ═════════════════════════ Respaldo ═════════════════════════
async function exportData() {
  const clean = JSON.parse(JSON.stringify(state));
  clean.settings.ai.keys = { gemini: '', claude: '' };
  const json = JSON.stringify({ app: 'kcal', version: APP_VERSION, exportedAt: new Date().toISOString(), data: clean });
  const name = `kcal-respaldo-${todayKey()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Respaldo de Kcal' });
      return;
    }
  } catch (e) {
    if (e?.name === 'AbortError') return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1500);
  toast('📤 Respaldo descargado');
}

async function importData(file) {
  if (!file) return;
  try {
    const obj = JSON.parse(await file.text());
    const data = obj?.app === 'kcal' ? obj.data : null;
    if (!data?.profile) throw new Error('Ese archivo no es un respaldo de Kcal');
    if (!confirm('¿Reemplazar tus datos actuales con este respaldo?')) return;
    const keys = { ...state.settings.ai.keys };
    state = merge(defaultState(), data);
    state.settings.ai.keys = keys;
    save(true);
    render();
    toast('📥 Respaldo restaurado');
  } catch (e) {
    toast(`⚠️ ${e.message}`);
  }
}

// ═════════════════════════ Eventos ═════════════════════════
let toastTimer = 0;
function toast(msg, ms = 2600) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

document.addEventListener('click', (ev) => {
  const tab = ev.target.closest('[data-tab]');
  if (tab) {
    ui.tab = tab.dataset.tab;
    if (ui.tab === 'hoy' && ui.onToday) ui.day = todayKey();
    closeSheet();
    render();
    window.scrollTo(0, 0);
    return;
  }
  if (ev.target.closest('#fab')) {
    if (state.onboarded) openAdd();
    return;
  }
  const el = ev.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.action];
  if (fn) {
    ev.preventDefault();
    fn(el, ev);
  }
});

document.addEventListener('input', (ev) => {
  const el = ev.target;
  const kind = el.dataset?.input;
  if (!kind) return;
  if (kind === 'search' && sheet) {
    sheet.query = el.value;
    const box = $('#results');
    if (box) box.innerHTML = resultsHTML();
  } else if (kind === 'ob') ui.ob.d[el.dataset.k] = el.value;
  else if (kind === 'qty' && sheet) {
    const v = parseNum(el.value);
    if (v > 0 && v <= 50) {
      sheet.q = v;
      updateQtyUI(false);
    }
  } else if (kind === 'ai' && sheet?.items) {
    const it = sheet.items[Number(el.dataset.i)];
    const k = el.dataset.k;
    it[k] = k === 'n' || k === 'u' ? el.value : parseNum(el.value) || 0;
    const btn = $('#ai-add');
    if (btn) btn.textContent = aiAddLabel();
  } else if (kind === 'note' && sheet) sheet.note = el.value;
  else if (kind === 'text' && sheet) sheet.text = el.value;
  else if (kind === 'ebase' && sheet?.base) {
    sheet.base[el.dataset.k] = parseNum(el.value) || 0;
    updateQtyUI(false);
  } else if (kind === 'petname') {
    state.pet.name = el.value.trim().slice(0, 20) || 'Chigüi';
    save();
  }
});

document.addEventListener('change', async (ev) => {
  const el = ev.target;
  const kind = el.dataset?.change;
  if (!kind) return;
  if (kind === 'photo' && sheet) {
    const file = el.files?.[0];
    if (!file) return;
    try {
      sheet.image = await compressImage(file);
      sheet.error = '';
      sheet.items = null;
    } catch (err) {
      sheet.error = err.message;
    }
    renderSheet();
  } else if (kind === 'import') {
    await importData(el.files?.[0]);
    el.value = '';
  } else if (kind === 'ai-provider') {
    aiCfg().provider = el.value === 'claude' ? 'claude' : 'gemini';
    save();
    render(true);
  }
});

document.addEventListener('submit', (ev) => {
  const form = ev.target;
  const fn = forms[form.dataset?.form];
  if (!fn) return;
  ev.preventDefault();
  fn(form, new FormData(form));
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && sheet) closeSheet();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') save(true);
  else if (state.onboarded && ui.onToday && ui.day !== todayKey()) {
    ui.day = todayKey();
    render();
  }
});

render();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
