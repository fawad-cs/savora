// Small shared UI builders.
import { DIET, money, escapeHTML as e, categoryLabel } from './data/menu-data.js';

export const renderSlot = (d, { view = 'threeQuarter', cls = '', tag = '3D render' } = {}) =>
  `<figure class="frame frame--render render-slot ${cls}" data-render="${e(d.id)}" data-view="${view}">
     <img alt="${e(d.name)} — real-time 3D render" loading="lazy" decoding="async"><div class="spinner" aria-hidden="true"></div>
     <span class="frame-tag">${tag}</span>
   </figure>`;

export const dietTags = d => d.diet.map(k => `<span class="tag${k === 'S' ? ' tag--spicy' : ''}" title="${DIET[k]}">${DIET[k]}</span>`).join('');

export const dishCard = (d, { reveal = true } = {}) => `
  <article class="dish-card"${reveal ? ' data-reveal' : ''}>
    ${renderSlot(d)}
    <div class="dish-card__row"><h3><a class="dish-card__link" href="dish.html#${e(d.id)}">${e(d.name)}</a></h3><span class="price">${money(d.price)}</span></div>
    <p>${e(d.short)}</p>
    <div class="tags"><span class="tag">${e(categoryLabel(d.category))}</span>${dietTags(d)}</div>
  </article>`;

/** Simple line-art burger used when WebGL is unavailable (clearly an illustration). */
export const burgerIllustration = (exploded = true) => {
  const gap = exploded ? 46 : 0;
  const L = [
    ['<path d="M60 0 H340 Q352 0 352 14 V22 Q352 36 338 36 H62 Q48 36 48 22 V14 Q48 0 60 0Z" fill="#c47a36"/>', 36],
    ['<rect x="46" y="0" width="308" height="34" rx="16" fill="#4a2414"/>', 34],
    ['<path d="M40 0 H360 L330 22 L300 6 L260 24 L220 6 L180 22 L140 6 L100 24 L70 6 Z" fill="#f0a21b"/>', 22],
    ['<ellipse cx="120" cy="10" rx="60" ry="10" fill="#c3271c"/><ellipse cx="200" cy="10" rx="60" ry="10" fill="#d5372a"/><ellipse cx="280" cy="10" rx="60" ry="10" fill="#c3271c"/>', 20],
    ['<path d="M34 14 Q60 -6 90 12 Q120 -6 150 12 Q180 -6 210 12 Q240 -6 270 12 Q300 -6 330 12 Q356 -4 366 14 Q200 30 34 14Z" fill="#6fa63c"/>', 22],
    ['<path d="M52 70 Q52 0 200 0 Q348 0 348 70 Z" fill="#b8682a"/><g fill="#f3e3c0">' + Array.from({ length: 16 }, (_, i) => `<ellipse cx="${90 + (i % 8) * 30}" cy="${22 + (i > 7 ? 22 : 0) + (i % 2) * 6}" rx="5" ry="2.5"/>`).join('') + '</g>', 70],
  ];
  let y = 520; let out = '';
  L.forEach(([shape, h]) => { y -= h; out += `<g transform="translate(0 ${y})">${shape}</g>`; y -= gap; });
  return `<svg viewBox="0 ${y - 10} 400 ${540 - y + 10}" role="img" aria-label="Illustration of the Savora Signature burger's six layers">${out}</svg>`;
};
