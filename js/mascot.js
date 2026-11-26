// Kcal · Chigüi, la mascota (un chigüiro dibujado en SVG)

export const ACCESSORIES = [
  { id: 'hoja', name: 'Hojita', level: 2, e: '🌿' },
  { id: 'mandarina', name: 'Mandarina', level: 3, e: '🍊' },
  { id: 'vueltiao', name: 'Sombrero vueltiao', level: 5, e: '👒' },
  { id: 'gafas', name: 'Gafas de sol', level: 7, e: '🕶️' },
  { id: 'corona', name: 'Corona', level: 10, e: '👑' },
];

const C = {
  body: '#AE7A51',
  head: '#BC8659',
  light: '#D7A982',
  dark: '#8A5737',
  ear: '#7E4F33',
  inner: '#5E3824',
  nose: '#3E2519',
  eye: '#24160E',
  cheek: '#F09A8A',
};

const stroke = (w = 4) => `stroke="${C.eye}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;

const OPEN_EYES = (dy = 0) => `
  <g class="eyes">
    <circle cx="77" cy="${70 + dy}" r="6" fill="${C.eye}"/>
    <circle cx="123" cy="${70 + dy}" r="6" fill="${C.eye}"/>
    <circle cx="79.2" cy="${67.8 + dy}" r="2.1" fill="#fff"/>
    <circle cx="125.2" cy="${67.8 + dy}" r="2.1" fill="#fff"/>
  </g>`;

const EYES = {
  feliz: OPEN_EYES(),
  neutral: OPEN_EYES(),
  hambre: OPEN_EYES(-3),
  contento: `<g><path d="M68 74 Q77 64 86 74" ${stroke(4.6)}/><path d="M114 74 Q123 64 132 74" ${stroke(4.6)}/></g>`,
  lleno: `<g><path d="M68 70 Q77 77 86 70" ${stroke(4.2)}/><path d="M114 70 Q123 77 132 70" ${stroke(4.2)}/></g>`,
  dormido: `<g><path d="M68 72 Q77 78 86 72" ${stroke(4)}/><path d="M114 72 Q123 78 132 72" ${stroke(4)}/></g>`,
  preocupado: `${OPEN_EYES(1)}<path d="M67 58 L85 53" ${stroke(3.6)}/><path d="M115 53 L133 58" ${stroke(3.6)}/>`,
};

const MOUTH = {
  feliz: `<path d="M100 102 L100 108 M90 109 Q100 117 110 109" stroke="${C.nose}" stroke-width="3" stroke-linecap="round" fill="none"/>`,
  neutral: `<path d="M100 102 L100 108 M93 111 L107 111" stroke="${C.nose}" stroke-width="3" stroke-linecap="round" fill="none"/>`,
  contento: `<path d="M100 102 L100 106" stroke="${C.nose}" stroke-width="3" stroke-linecap="round"/><path d="M88 107 Q100 124 112 107 Z" fill="#7A2E22"/><path d="M94 114.5 Q100 120.5 106 114.5 Q100 111.5 94 114.5Z" fill="#E87A6A"/>`,
  hambre: `<path d="M100 104 L100 107" stroke="${C.nose}" stroke-width="3" stroke-linecap="round"/><ellipse cx="100" cy="113" rx="4.6" ry="5.6" fill="#7A2E22"/><path d="M108 112 q3.5 6.5 0 10 q-3.5 -3.5 0 -10z" fill="#8FD0F0"/>`,
  lleno: `<path d="M100 104 L100 108" stroke="${C.nose}" stroke-width="3" stroke-linecap="round"/><path d="M90 111 Q95 107 100 111 Q105 115 110 111" stroke="${C.nose}" stroke-width="3" stroke-linecap="round" fill="none"/>`,
  dormido: `<ellipse cx="100" cy="111" rx="3.4" ry="3.8" fill="#7A2E22"/>`,
  preocupado: `<path d="M100 104 L100 108" stroke="${C.nose}" stroke-width="3" stroke-linecap="round"/><path d="M92 114 Q100 108 108 114" stroke="${C.nose}" stroke-width="3" stroke-linecap="round" fill="none"/>`,
};

function cheeks(mood) {
  const big = mood === 'lleno' || mood === 'contento';
  const rx = big ? 11 : 9;
  const ry = big ? 7 : 5.5;
  const op = big ? 0.75 : 0.55;
  return `<ellipse cx="57" cy="86" rx="${rx}" ry="${ry}" fill="${C.cheek}" opacity="${op}"/><ellipse cx="143" cy="86" rx="${rx}" ry="${ry}" fill="${C.cheek}" opacity="${op}"/>`;
}

const ACC = {
  hoja: `<g><path d="M100 37 C 91 22, 104 11, 117 15 C 115 28, 107 36, 100 37Z" fill="#5CB85C"/><path d="M100 37 C 104 29, 108 22, 115 17" stroke="#3E8E41" stroke-width="2" fill="none"/></g>`,
  mandarina: `<g><circle cx="100" cy="24" r="17" fill="#F7931E"/><circle cx="93.5" cy="17.5" r="5" fill="#FFC17A" opacity=".85"/><path d="M100 8 L100.8 4" stroke="#6B4A2B" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="108" cy="7.5" rx="7.5" ry="3.6" fill="#4CAF50" transform="rotate(-24 108 7.5)"/></g>`,
  vueltiao: `<g>
      <ellipse cx="100" cy="42" rx="66" ry="14" fill="#F3E6C8" stroke="#2B211B" stroke-width="2"/>
      <ellipse cx="100" cy="42" rx="54" ry="10.5" fill="none" stroke="#2B211B" stroke-width="3" stroke-dasharray="7 5"/>
      <path d="M72 42 C 72 13, 128 13, 128 42 Z" fill="#F3E6C8" stroke="#2B211B" stroke-width="2"/>
      <path d="M75 34 Q100 26 125 34" stroke="#2B211B" stroke-width="3" fill="none" stroke-dasharray="6 4"/>
      <path d="M78 25 Q100 17 122 25" stroke="#2B211B" stroke-width="2.6" fill="none" stroke-dasharray="5 4"/>
    </g>`,
  gafas: `<g><rect x="59" y="59" width="34" height="22" rx="9" fill="#1F1F1F"/><rect x="107" y="59" width="34" height="22" rx="9" fill="#1F1F1F"/><path d="M93 67 Q100 63 107 67" stroke="#1F1F1F" stroke-width="4" fill="none"/><path d="M65 65 L74 65" stroke="#fff" stroke-width="2.6" opacity=".55" stroke-linecap="round"/><path d="M113 65 L122 65" stroke="#fff" stroke-width="2.6" opacity=".55" stroke-linecap="round"/></g>`,
  corona: `<g><path d="M73 39 L77 14 L90 28 L100 7 L110 28 L123 14 L127 39 Z" fill="#F5C542" stroke="#D69E16" stroke-width="2.4" stroke-linejoin="round"/><circle cx="100" cy="27" r="4.2" fill="#E8665F"/><circle cx="85" cy="32" r="3" fill="#5B86E5"/><circle cx="115" cy="32" r="3" fill="#5B86E5"/></g>`,
};

function extras(mood) {
  if (mood === 'contento')
    return `<g class="sparks" fill="#F5C542"><path d="M28 52 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z"/><path d="M170 34 l2.4 5.6 5.6 2.4 -5.6 2.4 -2.4 5.6 -2.4 -5.6 -5.6 -2.4 5.6 -2.4z"/><path d="M166 96 l2 4.5 4.5 2 -4.5 2 -2 4.5 -2 -4.5 -4.5 -2 4.5 -2z"/></g>`;
  if (mood === 'dormido')
    return `<g fill="${C.dark}" font-family="ui-rounded, system-ui, sans-serif" font-weight="800"><text x="150" y="44" font-size="22">z</text><text x="166" y="26" font-size="15">z</text></g>`;
  return '';
}

export function mascotSVG({ mood = 'feliz', acc = null, cls = '' } = {}) {
  const eyes = acc === 'gafas' ? '' : EYES[mood] || EYES.feliz;
  const mouth = MOUTH[mood] || MOUTH.feliz;
  return `<svg class="chigui ${cls} mood-${mood}" viewBox="0 0 200 200" role="img" aria-label="Chigüi">
  <ellipse cx="100" cy="187" rx="58" ry="7" fill="#000" opacity=".10"/>
  <g class="chigui-body">
    <ellipse cx="100" cy="143" rx="66" ry="43" fill="${C.body}"/>
    <ellipse cx="100" cy="156" rx="42" ry="22" fill="${C.light}" opacity=".45"/>
    <ellipse cx="72" cy="182" rx="17" ry="7.5" fill="${C.dark}"/>
    <ellipse cx="128" cy="182" rx="17" ry="7.5" fill="${C.dark}"/>
    <g class="chigui-head">
      <ellipse cx="67" cy="40" rx="10.5" ry="8.5" fill="${C.ear}"/>
      <ellipse cx="67" cy="41" rx="5.5" ry="4.5" fill="${C.inner}"/>
      <ellipse cx="133" cy="40" rx="10.5" ry="8.5" fill="${C.ear}"/>
      <ellipse cx="133" cy="41" rx="5.5" ry="4.5" fill="${C.inner}"/>
      <rect x="44" y="33" width="112" height="100" rx="38" fill="${C.head}"/>
      <path d="M93 37 Q100 29 107 37" stroke="${C.dark}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <rect x="57" y="83" width="86" height="48" rx="24" fill="${C.light}"/>
      <path d="M78 93 Q100 83 122 93 Q122 101 100 102 Q78 101 78 93Z" fill="${C.nose}"/>
      <ellipse cx="90" cy="92.5" rx="3" ry="1.8" fill="#6B4433"/>
      <ellipse cx="110" cy="92.5" rx="3" ry="1.8" fill="#6B4433"/>
      ${cheeks(mood)}
      ${eyes}
      ${mouth}
    </g>
    ${acc && ACC[acc] ? ACC[acc] : ''}
  </g>
  ${extras(mood)}
</svg>`;
}
