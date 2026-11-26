// Kcal · mascota, XP, rachas y logros
import { addDays, fmt } from './util.js';

export const levelThreshold = (n) => 50 * (n - 1) * n; // XP total para llegar al nivel n

export function levelFromXp(xp) {
  let level = 1;
  while (xp >= levelThreshold(level + 1)) level++;
  return { level, from: levelThreshold(level), to: levelThreshold(level + 1) };
}

export const BADGES = [
  { id: 'primer', e: '🍽️', name: 'Primer bocado', desc: 'Registra tu primera comida', test: (s) => s.firstEntry },
  { id: 'racha3', e: '🔥', name: 'En racha', desc: '3 días seguidos registrando', test: (s) => s.maxStreak >= 3 },
  { id: 'racha7', e: '📅', name: 'Semana completa', desc: '7 días seguidos', test: (s) => s.maxStreak >= 7 },
  { id: 'racha30', e: '🏆', name: 'Mes imparable', desc: '30 días seguidos', test: (s) => s.maxStreak >= 30 },
  { id: 'meta10', e: '🎯', name: 'Puntería', desc: '10 días dentro de tu meta', test: (s) => s.daysInGoal >= 10 },
  { id: 'prote5', e: '💪', name: 'Proteína pro', desc: 'Cumple tu proteína 5 días', test: (s) => s.proteinDays >= 5 },
  { id: 'agua7', e: '💧', name: 'Bien hidratado', desc: 'Cumple tu meta de agua 7 días', test: (s) => s.waterDays >= 7 },
  { id: 'foto', e: '📸', name: 'Ojo de chigüiro', desc: 'Registra una comida con foto', test: (s) => s.photoLogs >= 1 },
  { id: 'kilo1', e: '⚖️', name: 'Primer kilo', desc: 'Baja 1 kg', test: (s) => s.lost >= 1 },
  { id: 'kilo5', e: '🌟', name: '5 kg menos', desc: 'Baja 5 kg', test: (s) => s.lost >= 5 },
  { id: 'meta', e: '👑', name: '¡Meta lograda!', desc: 'Llega a tu peso meta', test: (s) => s.reached },
];

// Se calcula siempre desde los datos, así editar o borrar nunca duplica XP
export function computeGame({ days, weights, startWeight, goalWeight, currentWeight, today, totals, goals, photoLogs = 0 }) {
  const keys = Object.keys(days).sort();
  let xp = 0;
  let daysInGoal = 0;
  let proteinDays = 0;
  let waterDays = 0;
  const logged = new Set();
  for (const k of keys) {
    if (k > today) continue;
    const t = totals(k);
    const g = goals(k);
    if (t.n > 0) {
      logged.add(k);
      xp += Math.min(t.n, 6) * 5;
      if (g.protein && t.p >= g.protein * 0.9) {
        xp += 10;
        proteinDays++;
      }
      if (k < today && g.kcal && t.kcal >= g.kcal * 0.75 && t.kcal <= g.kcal * 1.05) {
        xp += 20;
        daysInGoal++;
      }
    }
    if (g.water && t.water >= g.water) {
      xp += 5;
      waterDays++;
    }
  }
  xp += new Set((weights || []).map((w) => w.d)).size * 15;

  let streak = 0;
  let d = logged.has(today) ? today : addDays(today, -1);
  while (logged.has(d)) {
    streak++;
    d = addDays(d, -1);
  }
  let maxStreak = 0;
  let run = 0;
  let prev = null;
  for (const k of [...logged].sort()) {
    run = prev && addDays(prev, 1) === k ? run + 1 : 1;
    maxStreak = Math.max(maxStreak, run);
    prev = k;
  }

  const lost = startWeight && currentWeight ? startWeight - currentWeight : 0;
  const reached = !!(goalWeight && currentWeight && startWeight > goalWeight && currentWeight <= goalWeight);
  const s = { firstEntry: logged.size > 0, maxStreak, daysInGoal, proteinDays, waterDays, photoLogs, lost, reached };
  const badges = BADGES.map((b) => ({ id: b.id, e: b.e, name: b.name, desc: b.desc, ok: !!b.test(s) }));
  return { xp, ...levelFromXp(xp), streak, maxStreak, daysInGoal, proteinDays, waterDays, badges };
}

const TIPS = [
  'Incluye proteína en cada comida: te deja lleno por más tiempo.',
  'Llena medio plato con verduras: llenan mucho y suman poco.',
  'Un jugo en agua con azúcar suma unas 110 kcal; pruébalo sin azúcar.',
  'Caminar 30 minutos quema unas 120–150 kcal.',
  'Toma agua antes de comer: a veces la sed se confunde con hambre.',
  'Lo frito puede duplicar las calorías: prefiere asado, al horno o a la plancha.',
  'Pésate en ayunas, a la misma hora, una o dos veces por semana.',
  'Dormir 7–8 horas ayuda a controlar el apetito.',
  'Si hoy tienes un plan especial, deja espacio con comidas más ligeras.',
  'Media taza de arroz menos ahorra unas 100 kcal.',
  'Sirve en plato pequeño: ayuda a no repetir sin darte cuenta.',
  'El mecato de paquete suma rápido; ten frutas o maní a la mano.',
];

export const tipFor = (seed) => TIPS[Math.abs(seed) % TIPS.length];

// Estado de ánimo de la mascota según el día
export function petState({ t, g, hour, isToday, name, seed = 0 }) {
  const n = name ? `, ${name}` : '';
  const left = Math.round(g.kcal - t.kcal);
  const pct = g.kcal ? t.kcal / g.kcal : 0;

  if (!isToday) {
    if (!t.n) return { mood: 'dormido', msg: 'Ese día no tiene registros. Puedes agregarlos ahora si quieres.' };
    if (pct <= 1.05) return { mood: 'feliz', msg: `Ese día comiste ${fmt(t.kcal)} de ${fmt(g.kcal)} kcal. ¡Bien hecho!` };
    return { mood: 'lleno', msg: `Ese día te pasaste ${fmt(-left)} kcal. Lo que cuenta es la semana, no un día.` };
  }
  if (hour < 5 && !t.n) return { mood: 'dormido', msg: 'Zzz… dormir bien también ayuda a bajar de peso.' };
  if (!t.n) {
    if (hour < 11) return { mood: 'feliz', msg: `¡Buenos días${n}! ¿Qué vas a desayunar? Tómale foto y yo hago las cuentas.` };
    return { mood: 'hambre', msg: `¡Tengo hambre${n}! Registra lo que has comido hoy para alimentarme 🍽️` };
  }
  if (pct > 1.2) return { mood: 'lleno', msg: `Hoy vamos ${fmt(-left)} kcal arriba. No pasa nada: un día no define tu progreso 💛` };
  if (pct > 1.05) return { mood: 'lleno', msg: `Nos pasamos un poquito (${fmt(-left)} kcal). Una caminata de 30 minutos ayuda a compensar.` };
  if (pct >= 0.9) return { mood: 'contento', msg: `¡Día perfecto${n}! Estás justo en tu meta 🎉` };
  if (hour >= 20 && pct < 0.6)
    return { mood: 'preocupado', msg: `Hoy has comido poco (${fmt(t.kcal)} kcal). Comer muy poco da más hambre mañana; una cena ligera con proteína está bien.` };
  if (hour >= 15 && g.protein && t.p < g.protein * 0.5)
    return { mood: 'feliz', msg: `Te quedan ${fmt(left)} kcal. Te falta proteína (${fmt(t.p)} de ${fmt(g.protein)} g): huevo, pollo, atún o yogur griego ayudan.` };
  return { mood: 'feliz', msg: `Te quedan ${fmt(left)} kcal. ${tipFor(seed)}` };
}

export const CHEERS = [
  '¡Hey! 🐾',
  '¿Ya tomaste agua? 💧',
  'Vamos bien, paso a paso 💪',
  'Me encantan las mandarinas 🍊',
  'Un día a la vez 💛',
  'Registrar es la mitad del trabajo ✨',
];
