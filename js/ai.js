// Kcal · IA para estimar calorías desde una foto o una descripción.
// Las solicitudes van directo desde tu celular a Google o a Anthropic con TU clave.
// Nada pasa por otro servidor.

export const PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    note: 'Gratis con límite diario',
    keyHint: 'AIza…',
    keyUrl: 'https://aistudio.google.com/apikey',
  },
  claude: {
    name: 'Claude (Anthropic)',
    note: 'De pago, se cobra por uso',
    keyHint: 'sk-ant-…',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    defaultModel: 'claude-haiku-5-5',
  },
};

const SYSTEM = `Eres un nutricionista experto en comida colombiana y latinoamericana.
Identifica cada alimento y bebida de la foto y/o la descripción, estima la porción (en gramos o ml) y calcula calorías y macronutrientes con valores de referencia realistas (USDA y tablas colombianas del ICBF).
Ten en cuenta el aceite de lo frito, las salsas y las bebidas que se vean. Si la descripción del usuario contradice la foto, manda la descripción.
Responde SOLO con JSON válido, sin texto adicional ni bloques de código, con esta forma exacta:
{"items":[{"nombre":"Arroz blanco","porcion":"1 taza (160 g)","gramos":160,"kcal":208,"proteina_g":4.3,"carbohidratos_g":45,"grasa_g":0.5}],"confianza":"alta|media|baja","comentario":"una frase corta, amable y útil en español"}
Si no hay comida, devuelve {"items":[],"confianza":"baja","comentario":"No vi comida en la imagen"}.
Usa nombres de comida en español de Colombia. No juzgues lo que la persona come.`;

class AIError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.status = status;
  }
}

async function apiError(res, provider) {
  let msg = '';
  try {
    const j = await res.json();
    msg = j?.error?.message || j?.message || '';
  } catch {
    /* sin cuerpo */
  }
  const s = res.status;
  const low = msg.toLowerCase();
  if (provider === 'gemini' && (low.includes('api key not valid') || low.includes('api_key_invalid')))
    return new AIError('La clave de Gemini no es válida. Revísala en Ajustes.', s);
  if (low.includes('credit balance')) return new AIError('Tu cuenta de Anthropic no tiene saldo.', s);
  if (s === 401 || s === 403) return new AIError('La clave no es válida o no tiene permiso para este modelo.', s);
  if (s === 404) return new AIError('Ese modelo no existe o ya no está disponible.', s);
  if (s === 429)
    return new AIError(
      provider === 'gemini'
        ? 'Llegaste al límite gratis de Gemini por ahora. Se reinicia cada día; mientras tanto usa la búsqueda.'
        : 'Demasiadas solicitudes seguidas. Intenta en un momento.',
      s
    );
  if (s >= 500) return new AIError('El servicio de IA está saturado. Intenta de nuevo en un momento.', s);
  return new AIError(msg ? `La IA rechazó la solicitud: ${msg}` : `Error ${s} de la IA.`, s);
}

async function call(url, opts, provider) {
  let res;
  try {
    res = await fetch(url, opts);
  } catch {
    throw new AIError('Sin conexión a internet (o la solicitud fue bloqueada).');
  }
  if (!res.ok) throw await apiError(res, provider);
  return res.json();
}

// ── Gemini ────────────────────────────────────────────────────────────
let modelCache = null;

export function rankGeminiModels(names) {
  const ver = (n) => parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [0, 0])[1]);
  return names
    .filter((n) => /^gemini-/.test(n) && /flash/.test(n) && !/(tts|live|image|audio|embed|thinking|exp|robotics|computer|native|transcribe)/.test(n))
    .sort((a, b) => {
      const la = /lite/.test(a);
      const lb = /lite/.test(b);
      if (la !== lb) return la ? 1 : -1;
      const pa = /preview/.test(a);
      const pb = /preview/.test(b);
      if (pa !== pb) return pa ? 1 : -1;
      return ver(b) - ver(a);
    });
}

async function geminiModels(key) {
  if (modelCache?.key === key) return modelCache.list;
  const j = await call(
    'https://generativelanguage.googleapis.com/v1beta/models?pageSize=200',
    { headers: { 'x-goog-api-key': key } },
    'gemini'
  );
  const names = (j.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => String(m.name).replace(/^models\//, ''));
  const list = rankGeminiModels(names);
  modelCache = { key, list };
  return list;
}

async function gemini({ key, model, preferred, image, prompt, system = SYSTEM }) {
  let candidates;
  if (model) candidates = [model];
  else {
    const list = await geminiModels(key);
    candidates = preferred && list.includes(preferred) ? [preferred, ...list.filter((m) => m !== preferred)] : list;
    if (!candidates.length) throw new AIError('Tu clave no tiene modelos Gemini Flash disponibles.');
  }
  const parts = [];
  if (image) parts.push({ inlineData: { mimeType: 'image/jpeg', data: image.split(',')[1] } });
  parts.push({ text: prompt });
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts }],
    generationConfig: { temperature: 0.2, responseMimeType: 'application/json', maxOutputTokens: 8192 },
  });
  let lastErr;
  for (const m of candidates.slice(0, 4)) {
    try {
      const j = await call(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`,
        { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body },
        'gemini'
      );
      const text = (j.candidates?.[0]?.content?.parts || [])
        .filter((p) => !p.thought && typeof p.text === 'string')
        .map((p) => p.text)
        .join('');
      if (!text) throw new AIError('La IA no devolvió respuesta. Intenta con otra foto.');
      return { text, model: m };
    } catch (e) {
      lastErr = e;
      // Con modelo automático, probar el siguiente si este no existe o se acabó su cuota
      if (model || ![404, 429].includes(e.status)) break;
    }
  }
  throw lastErr;
}

// ── Claude ────────────────────────────────────────────────────────────
async function claude({ key, model, image, prompt, maxTokens = 1500, system = SYSTEM }) {
  const content = [];
  if (image) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image.split(',')[1] } });
  content.push({ type: 'text', text: prompt });
  const m = model || PROVIDERS.claude.defaultModel;
  const j = await call(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model: m, max_tokens: maxTokens, system, messages: [{ role: 'user', content }] }),
    },
    'claude'
  );
  const text = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  return { text, model: m };
}

// ── Utilidades ────────────────────────────────────────────────────────
export function extractJSON(text) {
  const cleaned = String(text || '').replace(/```(?:json)?/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const s = cleaned.indexOf('{');
    const e = cleaned.lastIndexOf('}');
    if (s >= 0 && e > s) {
      try {
        return JSON.parse(cleaned.slice(s, e + 1));
      } catch {
        /* sigue abajo */
      }
    }
  }
  throw new AIError('La IA respondió algo que no entendí. Intenta de nuevo.');
}

const num = (v) => {
  const n = Number(String(v ?? 0).replace(',', '.').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? Math.min(Math.round(n * 10) / 10, 5000) : 0;
};

export function normalizeResult(obj) {
  const arr = Array.isArray(obj) ? obj : obj?.items || obj?.alimentos || [];
  const items = arr
    .map((it) => {
      const p = num(it.proteina_g ?? it.proteina ?? it.protein);
      const c = num(it.carbohidratos_g ?? it.carbohidratos ?? it.carbs);
      const f = num(it.grasa_g ?? it.grasa ?? it.fat);
      let k = num(it.kcal ?? it.calorias ?? it.calories);
      if (!k && (p || c || f)) k = Math.round(p * 4 + c * 4 + f * 9);
      const g = num(it.gramos ?? it.grams);
      return {
        n: String(it.nombre ?? it.name ?? 'Alimento').slice(0, 80),
        u: String(it.porcion ?? it.portion ?? (g ? `${Math.round(g)} g` : '1 porción')).slice(0, 60),
        k,
        p,
        c,
        f,
      };
    })
    .filter((it) => it.k > 0);
  return {
    items,
    confidence: String(obj?.confianza ?? obj?.confidence ?? ''),
    comment: String(obj?.comentario ?? obj?.comment ?? '').slice(0, 240),
  };
}

export async function analyzeFood({ provider, key, model, preferred, image, text, meal }) {
  if (!key) throw new AIError('Falta tu clave de IA. Agrégala en Ajustes.');
  const prompt = image
    ? `Foto de mi comida (${meal}).${text ? ` Nota: ${text}` : ''}`
    : `Esto fue lo que comí (${meal}): ${text}`;
  const out = provider === 'claude' ? await claude({ key, model, image, prompt }) : await gemini({ key, model, preferred, image, prompt });
  return { ...normalizeResult(extractJSON(out.text)), model: out.model };
}

const IDEAS_SYSTEM = `Eres un nutricionista colombiano. Propón comidas reales, sabrosas y fáciles de conseguir en Colombia (en casa, en un corrientazo o en una cafetería) que encajen en las calorías y la proteína pedidas. Usa porciones concretas (tazas, unidades o gramos) y valores nutricionales realistas.
Responde SOLO con JSON válido, sin texto adicional ni bloques de código:
{"opciones":[{"titulo":"nombre corto del plato","items":[{"nombre":"Arroz blanco","porcion":"1 taza (160 g)","kcal":208,"proteina_g":4.3,"carbohidratos_g":45,"grasa_g":0.5}]}]}`;

export async function suggestMealsAI({ provider, key, model, preferred, meal, kcal, protein, eaten }) {
  if (!key) throw new AIError('Falta tu clave de IA. Agrégala en Ajustes.');
  const prompt = `Dame 3 opciones distintas de ${meal} de unas ${kcal} kcal cada una (±10 %), con al menos ${protein} g de proteína.${eaten ? ` Hoy ya comí: ${eaten}. Evita repetir lo mismo.` : ''}`;
  const out =
    provider === 'claude'
      ? await claude({ key, model, prompt, system: IDEAS_SYSTEM, maxTokens: 2500 })
      : await gemini({ key, model, preferred, prompt, system: IDEAS_SYSTEM });
  const obj = extractJSON(out.text);
  const raw = Array.isArray(obj) ? obj : obj?.opciones || obj?.options || [];
  const options = raw
    .map((o) => {
      const { items } = normalizeResult({ items: o?.items || o?.alimentos || [] });
      return {
        title: String(o?.titulo ?? o?.title ?? 'Opción').slice(0, 60),
        items,
        kcal: items.reduce((s, x) => s + x.k, 0),
        p: items.reduce((s, x) => s + x.p, 0),
      };
    })
    .filter((o) => o.items.length)
    .slice(0, 3);
  return { options, model: out.model };
}

export async function testAI({ provider, key, model }) {
  if (!key) throw new AIError('Escribe tu clave primero.');
  if (provider === 'claude') {
    const r = await claude({ key, model, prompt: 'Responde solo: {"items":[]}', maxTokens: 20 });
    return r.model;
  }
  if (model) return model;
  const list = await geminiModels(key);
  if (!list.length) throw new AIError('Tu clave no tiene modelos Gemini Flash disponibles.');
  return list[0];
}

// Reduce la foto (máx. 1024 px) para que viaje rápido y gaste menos
export async function compressImage(file, max = 1024, quality = 0.82) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('No pude leer esa imagen. Prueba con otra.'));
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    cv.getContext('2d').drawImage(img, 0, 0, w, h);
    return cv.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
