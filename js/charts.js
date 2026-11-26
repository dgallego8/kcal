// Kcal · gráficas SVG livianas (sin librerías)
import { fmt, fmt1 } from './util.js';

export function ring(value, target, { size = 156, stroke = 15 } = {}) {
  const c = size / 2;
  const r = (size - stroke) / 2;
  const L = 2 * Math.PI * r;
  const pct = target > 0 ? value / target : 0;
  const main = Math.min(pct, 1);
  const over = Math.min(Math.max(pct - 1, 0), 1);
  const color = pct > 1.05 ? 'var(--over)' : pct >= 0.9 ? 'var(--ok)' : 'var(--brand)';
  const arc = (len, col, extra = '') =>
    `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${col}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${len.toFixed(1)} ${L.toFixed(1)}" transform="rotate(-90 ${c} ${c})" ${extra}/>`;
  return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="var(--track)" stroke-width="${stroke}"/>
    ${main > 0.004 ? arc(L * main, color, 'class="ring-main"') : ''}
    ${over > 0.004 ? arc(L * over, 'var(--over)', 'opacity=".85"') : ''}
  </svg>`;
}

function niceStep(range) {
  const raw = range / 4;
  const p = 10 ** Math.floor(Math.log10(raw || 1));
  const m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}

// points: [{x: númeroDeDía, y: kg, label}]
export function weightChart(points, { goal = null, width = 340, height = 190 } = {}) {
  if (!points.length) return '<p class="muted center">Registra tu peso para ver la gráfica.</p>';
  const pad = { l: 36, r: 14, t: 16, b: 26 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y).concat(goal ? [goal] : []);
  let x0 = Math.min(...xs);
  let x1 = Math.max(...xs);
  if (x1 - x0 < 7) x1 = x0 + 7;
  let y0 = Math.floor(Math.min(...ys) - 0.8);
  let y1 = Math.ceil(Math.max(...ys) + 0.8);
  if (y1 - y0 < 4) {
    y0 -= 1;
    y1 += 1;
  }
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;
  const X = (x) => pad.l + ((x - x0) / (x1 - x0)) * W;
  const Y = (y) => pad.t + ((y1 - y) / (y1 - y0)) * H;
  const step = niceStep(y1 - y0);
  let grid = '';
  for (let v = Math.ceil(y0 / step) * step; v <= y1 + 1e-9; v += step) {
    grid += `<line x1="${pad.l}" x2="${width - pad.r}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="${pad.l - 6}" y="${Y(v) + 4}" text-anchor="end" class="axis">${fmt1(v)}</text>`;
  }
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ');
  const area = `${path} L${X(points[points.length - 1].x).toFixed(1)} ${pad.t + H} L${X(points[0].x).toFixed(1)} ${pad.t + H} Z`;
  const goalLine = goal
    ? `<line x1="${pad.l}" x2="${width - pad.r}" y1="${Y(goal)}" y2="${Y(goal)}" class="goal-line"/><text x="${width - pad.r}" y="${Y(goal) - 6}" text-anchor="end" class="goal-label">Meta ${fmt1(goal)} kg</text>`
    : '';
  const dots = points
    .map((p, i) => `<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${i === points.length - 1 ? 5 : 3.2}" class="${i === points.length - 1 ? 'dot last' : 'dot'}"/>`)
    .join('');
  const first = points[0];
  const last = points[points.length - 1];
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Gráfica de peso">
    <defs><linearGradient id="wfill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--brand)" stop-opacity=".22"/><stop offset="1" stop-color="var(--brand)" stop-opacity="0"/></linearGradient></defs>
    ${grid}${goalLine}
    ${points.length > 1 ? `<path d="${area}" fill="url(#wfill)"/><path d="${path}" class="line"/>` : ''}
    ${dots}
    <text x="${X(first.x)}" y="${height - 6}" class="axis" text-anchor="start">${first.label}</text>
    ${points.length > 1 ? `<text x="${X(last.x)}" y="${height - 6}" class="axis" text-anchor="end">${last.label}</text>` : ''}
  </svg>`;
}

// items: [{label, value, target}]
export function barChart(items, { width = 340, height = 170 } = {}) {
  const pad = { l: 8, r: 8, t: 22, b: 24 };
  const max = Math.max(1, ...items.map((i) => Math.max(i.value, i.target || 0))) * 1.12;
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;
  const bw = (W / items.length) * 0.56;
  const Y = (v) => pad.t + H - (v / max) * H;
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Calorías de los últimos días">
    ${items
      .map((it, i) => {
        const cx = pad.l + (W / items.length) * (i + 0.5);
        const h = (it.value / max) * H;
        const cls = !it.value ? 'empty' : it.value > it.target * 1.05 ? 'over' : it.value >= it.target * 0.75 ? 'ok' : 'low';
        const tgt = it.target ? `<line x1="${cx - bw / 2 - 3}" x2="${cx + bw / 2 + 3}" y1="${Y(it.target)}" y2="${Y(it.target)}" class="tgt"/>` : '';
        return `<rect x="${(cx - bw / 2).toFixed(1)}" y="${(pad.t + H - Math.max(h, 2)).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(h, 2).toFixed(1)}" rx="6" class="bar-${cls}"/>${tgt}
        ${it.value ? `<text x="${cx}" y="${(pad.t + H - h - 6).toFixed(1)}" text-anchor="middle" class="val">${fmt(it.value)}</text>` : ''}
        <text x="${cx}" y="${height - 6}" text-anchor="middle" class="axis ${it.today ? 'today' : ''}">${it.label}</text>`;
      })
      .join('')}
  </svg>`;
}
