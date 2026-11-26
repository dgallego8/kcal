// Kcal · cálculos de metas
// Metabolismo basal: Mifflin-St Jeor. Gasto total = basal × factor de actividad.
// Déficit: ritmo (kg/semana) × 7.700 kcal ÷ 7 días. Se recalcula con tu último peso.
import { dayNumber } from './util.js';

export const ACTIVITY = {
  sedentario: { f: 1.2, label: 'Sedentario', desc: 'Estudias o trabajas sentado y casi no haces ejercicio' },
  ligero: { f: 1.375, label: 'Ligero', desc: 'Ejercicio 1–3 días por semana o caminas bastante' },
  moderado: { f: 1.55, label: 'Moderado', desc: 'Ejercicio 3–5 días por semana' },
  activo: { f: 1.725, label: 'Muy activo', desc: 'Ejercicio intenso casi a diario o trabajo físico' },
  atleta: { f: 1.9, label: 'Atleta', desc: 'Entrenas fuerte dos veces al día' },
};

export const PACES = [
  { v: 0.25, label: '0,25 kg', desc: 'Suave' },
  { v: 0.5, label: '0,5 kg', desc: 'Recomendado' },
  { v: 0.75, label: '0,75 kg', desc: 'Exigente' },
  { v: 1, label: '1 kg', desc: 'Muy exigente' },
];

export const KCAL_PER_KG = 7700;
export const MIN_KCAL = { hombre: 1500, mujer: 1200 };

export function bmr({ sex, age, height, weight }) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === 'mujer' ? base - 161 : base + 5;
}

export const bmi = (weight, height) => weight / (height / 100) ** 2;

export function bmiLabel(v) {
  if (v < 18.5) return 'Bajo peso';
  if (v < 25) return 'Saludable';
  if (v < 30) return 'Sobrepeso';
  return 'Obesidad';
}

export const healthyRange = (height) => {
  const m2 = (height / 100) ** 2;
  return [18.5 * m2, 24.9 * m2];
};

export function computePlan(profile, currentWeight) {
  const w = Number(currentWeight ?? profile.weight);
  const sex = profile.sex === 'mujer' ? 'mujer' : 'hombre';
  const b = bmr({ sex, age: Number(profile.age), height: Number(profile.height), weight: w });
  const factor = ACTIVITY[profile.activity]?.f ?? 1.375;
  const tdee = b * factor;
  const goal = Number(profile.goalWeight) || null;
  const pace = Number(profile.pace) || 0.5;
  const floor = MIN_KCAL[sex];

  let mode = 'mantener';
  let delta = 0; // kcal por día: positivo = déficit
  if (goal && w > goal + 0.2) {
    mode = 'bajar';
    delta = (pace * KCAL_PER_KG) / 7;
  } else if (goal && w < goal - 0.5) {
    mode = 'subir';
    delta = -Math.min((pace * KCAL_PER_KG) / 7, 500);
  }

  let kcal = tdee - delta;
  let capped = false;
  if (kcal < floor) {
    kcal = floor;
    capped = true;
  }
  const kcalR = Math.round(kcal / 10) * 10;
  const deficit = tdee - kcal;

  // Proteína 1,6 g/kg (con tope para pesos altos), grasa 28 %, carbohidratos el resto
  const refW = goal ? Math.min(w, goal + 10) : w;
  const protein = Math.round(1.6 * refW);
  const fatKcal = kcalR * 0.28;
  const fat = Math.round(fatKcal / 9);
  const carbs = Math.max(0, Math.round((kcalR - protein * 4 - fatKcal) / 4));
  const water = Math.max(1500, Math.round((w * 30) / 250) * 250);

  return {
    bmr: Math.round(b),
    tdee: Math.round(tdee),
    factor,
    kcal: kcalR,
    protein,
    carbs,
    fat,
    water,
    deficit: Math.round(deficit),
    weeklyChange: (deficit * 7) / KCAL_PER_KG,
    capped,
    floor,
    mode,
  };
}

export function eta(current, goal, weeklyChange, from = new Date()) {
  if (!goal || !(weeklyChange > 0) || current <= goal) return null;
  const weeks = (current - goal) / weeklyChange;
  const date = new Date(from);
  date.setDate(date.getDate() + Math.round(weeks * 7));
  return { weeks, date };
}

// Tendencia real (regresión lineal de los pesos de las últimas 4 semanas)
export function trend(weights) {
  if (!weights || weights.length < 2) return null;
  const pts = weights.map((w) => ({ x: dayNumber(w.d), y: w.kg }));
  const last = pts[pts.length - 1].x;
  const recent = pts.filter((p) => p.x >= last - 28);
  if (recent.length < 2) return null;
  const span = recent[recent.length - 1].x - recent[0].x;
  if (span < 6) return null;
  const mx = recent.reduce((s, p) => s + p.x, 0) / recent.length;
  const my = recent.reduce((s, p) => s + p.y, 0) / recent.length;
  let num = 0;
  let den = 0;
  for (const p of recent) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  }
  if (!den) return null;
  return { perWeek: (num / den) * 7, n: recent.length, span };
}
