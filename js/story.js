import { boot } from './main.js';
import { pageHeroIn } from './animations.js';
import { renderArt } from './art.js';
import { byId, renderSpec, money, escapeHTML as e } from './data/menu-data.js';
import { renderSlot } from './components.js';

const CRAFT = [
  ['dry-aged-ribeye', 'The hearth', 'Forty days of ageing, four minutes over oak, one minute of rest.'],
  ['burrata-margherita', 'The oven', 'Seventy-two-hour dough and ninety seconds at 480°C.'],
  ['yuzu-tart', 'The pastry room', 'Butter-rich pastry, a bright curd and meringue piped by hand.'],
];

boot(async () => {
  renderArt();
  document.getElementById('craft-grid').innerHTML = CRAFT.map(([id, k, t]) => {
    const d = byId(id);
    return `<article class="craft-card" data-reveal>${renderSlot(d)}<p class="kicker">${k}</p><h3 class="h3"><a href="dish.html#${e(id)}">${e(d.name)}</a> <span class="price">${money(d.price)}</span></h3><p class="muted">${t}</p></article>`;
  }).join('');
  try {
    const three = await import('./three/food-scene.js');
    if (!three.webglAvailable()) throw new Error('no webgl');
    three.hydrateRenders(document, renderSpec);
  } catch {
    document.querySelectorAll('[data-render]').forEach(el => { el.classList.add('is-ready'); el.querySelector('img')?.remove(); el.insertAdjacentHTML('afterbegin', '<div class="webgl-fallback">3D renders need WebGL</div>'); });
  }
  return { intro: () => pageHeroIn() };
});
