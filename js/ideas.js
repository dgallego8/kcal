// Kcal · ideas de comidas que encajan en tu presupuesto de calorías
// Cada idea tiene un alimento "flexible" (arroz, arepa, fruta…) cuya cantidad
// se ajusta para acercarse a las calorías que te quedan para esa comida.
import { foodById } from './foods.js';
import { scalePortion } from './util.js';

// Reparto del día: desayuno 25 %, almuerzo 35 %, cena 25 %, mecato 15 %
export const SHARE = { desayuno: 0.25, almuerzo: 0.35, cena: 0.25, snack: 0.15 };

// T(comida, título, [[id, cantidad], …], índice flexible, paso)
const T = (meal, title, items, flex = null, step = 0.25) => ({ meal, title, items, flex, step });

export const TEMPLATES = [
  // ── Desayuno (~470 kcal en un plan de 1.880) ──
  T('desayuno', 'Pericos con arepa y café con leche', [['huevos-pericos', 1], ['arepa-blanca', 1], ['cafe-leche', 1]], 1, 0.5),
  T('desayuno', 'Arepa con queso, huevo y papaya', [['arepa-queso', 1], ['huevo-cocido', 1], ['papaya', 1], ['tinto-azucar', 1]], 2, 0.5),
  T('desayuno', 'Avena con banano y maní', [['avena-hojuelas', 1.5], ['leche-semi', 1], ['banano', 1], ['mani', 0.5]], 0, 0.5),
  T('desayuno', 'Yogur griego con granola y huevos', [['yogur-griego', 1], ['granola', 0.5], ['fresas', 1], ['huevo-cocido', 2]], 1, 0.5),
  T('desayuno', 'Sándwich de huevo y queso', [['pan-integral', 2], ['huevo-cocido', 2], ['queso-campesino', 1], ['jugo-naranja', 1]], 0, 1),
  T('desayuno', 'Changua con almojábana', [['changua', 1], ['almojabana', 1], ['mandarina', 1]], 2, 1),
  T('desayuno', 'Omelette con arepa y papaya', [['omelette', 1], ['arepa-delgada', 1], ['papaya', 1], ['tinto-azucar', 1]], 1, 1),
  T('desayuno', 'Huevos cocidos con pan y fruta', [['huevo-cocido', 2], ['pan-integral', 1], ['mandarina', 1]], 1, 1),

  // ── Almuerzo (~660 kcal) ──
  T('almuerzo', 'Pechuga con arroz y fríjoles', [['pechuga', 1], ['arroz-blanco', 1], ['frijoles', 0.5], ['ensalada', 1], ['maduro-asado', 0.5], ['jugo-sin-azucar', 1]], 1),
  T('almuerzo', 'Carne asada con papa criolla', [['carne-asada', 1], ['arroz-blanco', 0.75], ['papa-criolla', 1], ['ensalada', 1], ['aguacate', 0.5], ['jugo-sin-azucar', 1]], 1),
  T('almuerzo', 'Sancocho con arroz y aguacate', [['sancocho', 1], ['arroz-blanco', 0.5], ['aguacate', 0.5], ['jugo-sin-azucar', 1]], 1),
  T('almuerzo', 'Lentejas con carne molida y arroz', [['lentejas', 1], ['carne-molida', 1], ['arroz-blanco', 1], ['ensalada', 1]], 2),
  T('almuerzo', 'Pescado con patacones', [['pescado-plancha', 1], ['arroz-blanco', 1], ['patacon', 2], ['ensalada', 1], ['jugo-sin-azucar', 1]], 1),
  T('almuerzo', 'Ajiaco con arroz y aguacate', [['ajiaco', 1], ['arroz-blanco', 0.5], ['aguacate', 0.5]], 1),
  T('almuerzo', 'Pasta boloñesa con ensalada', [['pasta-bolonesa', 1], ['ensalada', 1], ['jugo-sin-azucar', 1], ['mandarina', 1]], 0),
  T('almuerzo', 'Arroz con pollo y ensalada', [['arroz-pollo', 1], ['ensalada', 1], ['aguacate', 0.5], ['jugo-sin-azucar', 1]], 0),

  // ── Cena (~470 kcal) ──
  T('cena', 'Pollo a la plancha con papa y aguacate', [['pechuga', 1], ['papa-cocida', 1], ['ensalada', 1], ['aguacate', 1]], 1, 0.5),
  T('cena', 'Carne asada con arepa y verduras', [['carne-asada', 1], ['arepa-delgada', 1], ['verduras-salteadas', 1]], 1, 1),
  T('cena', 'Atún con ensalada, galletas y yogur', [['atun-agua', 1], ['ensalada', 1], ['aguacate', 1], ['galletas-soda', 1], ['yogur-griego', 1]], 3, 0.5),
  T('cena', 'Pericos con arepa y queso', [['huevos-pericos', 1], ['arepa-blanca', 1], ['queso-campesino', 1]], 1, 0.5),
  T('cena', 'Crema de verduras con pollo', [['crema-verduras', 1], ['pollo-desmechado', 1.5], ['pan-integral', 1]], 2, 1),
  T('cena', 'Sándwich de jamón, queso y huevo', [['pan-integral', 2], ['jamon', 2], ['queso-mozzarella', 1], ['huevo-cocido', 1], ['tomate', 1], ['mandarina', 1]], 5, 1),
  T('cena', 'Pescado con yuca y guacamole', [['pescado-plancha', 1], ['yuca-cocida', 1], ['ensalada', 1], ['guacamole', 1]], 1),
  T('cena', 'Cena liviana de huevo y ensalada', [['huevo-cocido', 2], ['ensalada', 1], ['tomate', 1]], 0, 1),
  T('cena', 'Atún con ensalada fresca', [['atun-agua', 1], ['ensalada', 1], ['pepino', 1]]),

  // ── Mecato (~280 kcal) ──
  T('snack', 'Manzana con maní', [['manzana', 1], ['mani', 1]], 1, 0.5),
  T('snack', 'Yogur griego con banano y granola', [['yogur-griego', 1], ['banano', 1], ['granola', 0.5]], 1, 0.5),
  T('snack', 'Almendras y mandarina', [['almendras', 1], ['mandarina', 1]], 0, 0.5),
  T('snack', 'Huevos cocidos con galletas', [['huevo-cocido', 2], ['galletas-soda', 1]], 1, 0.5),
  T('snack', 'Queso con bocadillo', [['queso-campesino', 1], ['bocadillo', 1], ['galletas-soda', 0.5]], 2, 0.5),
  T('snack', 'Batido de proteína con banano', [['proteina', 1], ['banano', 1]], 1, 0.5),
  T('snack', 'Papaya con yogur y granola', [['papaya', 1], ['yogur-griego', 1], ['granola', 0.5]], 0, 0.5),
  T('snack', 'Kumis con pandebono', [['kumis', 1], ['pandebono', 1]]),
  T('snack', 'Fruta picada', [['papaya', 1], ['fresas', 1]], 0, 0.5),
];

const round1 = (v) => Math.round(v * 10) / 10;

export function buildIdea(t, budget) {
  const items = t.items.map(([id, q]) => ({ food: foodById(id), q })).filter((x) => x.food);
  if (t.flex != null && budget > 0 && items[t.flex]) {
    const it = items[t.flex];
    const others = items.reduce((s, x, i) => (i === t.flex ? s : s + x.food.k * x.q), 0);
    const step = t.step || 0.25;
    const lo = Math.max(step, Math.ceil(it.q / 2 / step) * step);
    const hi = it.q * 2;
    let best = it.q;
    let bestDiff = Math.abs(others + it.food.k * it.q - budget);
    for (let q = lo; q <= hi + 1e-9; q += step) {
      const diff = Math.abs(others + it.food.k * q - budget);
      if (diff < bestDiff - 0.5) {
        best = q;
        bestDiff = diff;
      }
    }
    it.q = Math.round(best * 100) / 100;
  }
  const list = items.map(({ food, q }) => ({
    n: food.n,
    u: scalePortion(food.u, q),
    k: Math.round(food.k * q),
    p: round1(food.p * q),
    c: round1(food.c * q),
    f: round1(food.f * q),
    e: food.e,
  }));
  return {
    title: t.title,
    items: list,
    kcal: list.reduce((s, x) => s + x.k, 0),
    p: list.reduce((s, x) => s + x.p, 0),
  };
}

// Devuelve `count` ideas que se acerquen a las kcal y proteína pedidas; `seed` las rota
export function suggestIdeas({ meal, kcal, protein = 0, seed = 0, count = 3 }) {
  const built = TEMPLATES.filter((t) => t.meal === meal).map((t) => buildIdea(t, kcal));
  if (!built.length) return [];
  const score = (o) => Math.abs(o.kcal - kcal) / kcal + (protein ? (Math.max(0, protein - o.p) / protein) * 0.4 : 0);
  const good = built.filter((o) => Math.abs(o.kcal - kcal) / kcal <= 0.2);
  const pool = good.length >= count ? good : [...built].sort((a, b) => score(a) - score(b)).slice(0, Math.max(count, 4));
  const start = ((seed % pool.length) + pool.length) % pool.length;
  return Array.from({ length: Math.min(count, pool.length) }, (_, i) => pool[(start + i) % pool.length]);
}
