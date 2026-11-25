import { boot, icons } from './main.js';
import { pageHeroIn, prefersReduced } from './animations.js';
import { CATEGORIES, DISHES, byId, money, renderSpec, categoryLabel, DIET, escapeHTML as e } from './data/menu-data.js';
import { renderSlot, dietTags } from './components.js';

let three = null;
let hydrateIO = null;

boot(async () => {
  const grid = document.getElementById('menu-grid');
  const filter = document.getElementById('cat-filter');
  const q = document.getElementById('menu-q');
  const clear = document.getElementById('menu-clear');
  const count = document.getElementById('menu-count');
  const empty = document.getElementById('menu-empty');

  const validCat = id => CATEGORIES.some(c => c.id === id);
  let cat = validCat(location.hash.slice(1)) ? location.hash.slice(1) : 'all';
  let term = '';

  filter.innerHTML = CATEGORIES.map(c => `<button role="tab" type="button" data-cat="${c.id}" aria-selected="${c.id === cat}">${c.label}<sup>${c.id === 'all' ? DISHES.length : DISHES.filter(d => d.category === c.id).length}</sup></button>`).join('');

  // Render every card once; filtering hides/shows them so renders are reused.
  grid.innerHTML = DISHES.map(d => `
    <article class="menu-card" data-id="${e(d.id)}" data-cat="${d.category}" data-text="${e([d.name, d.short, d.ingredients.join(' '), categoryLabel(d.category), d.diet.map(k => DIET[k]).join(' ')].join(' ').toLowerCase())}">
      ${renderSlot(d)}
      <div class="menu-card__body">
        <div class="menu-card__row"><h2 class="menu-card__name">${e(d.name)}</h2><span class="menu-card__dots" aria-hidden="true"></span><span class="price">${money(d.price)}</span></div>
        <p>${e(d.short)}</p>
        <div class="menu-card__foot">
          <div class="tags">${dietTags(d)}</div>
          <button class="link-arrow" type="button" data-open="${e(d.id)}" aria-haspopup="dialog">View details <i data-lucide="arrow-up-right"></i></button>
        </div>
      </div>
    </article>`).join('');
  icons(grid);

  const cards = [...grid.querySelectorAll('.menu-card')];
  const apply = (animate = true) => {
    const t = term.trim().toLowerCase();
    const show = cards.filter(c => (cat === 'all' || c.dataset.cat === cat) && (!t || t.split(/\s+/).every(w => c.dataset.text.includes(w))));
    const hide = cards.filter(c => !show.includes(c));
    const g = window.gsap;
    const reveal = () => {
      hide.forEach(c => { c.hidden = true; });
      show.forEach(c => { c.hidden = false; });
      empty.hidden = show.length > 0;
      count.textContent = `${show.length} ${show.length === 1 ? 'dish' : 'dishes'}${cat !== 'all' ? ` in ${categoryLabel(cat)}` : ''}${t ? ` matching “${term.trim()}”` : ''}`;
      window.ScrollTrigger?.refresh();
      if (g && animate && show.length && !prefersReduced()) g.fromTo(show, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.05, overwrite: true });
    };
    if (g && animate && !prefersReduced()) {
      const visible = cards.filter(c => !c.hidden);
      if (!visible.length) { reveal(); return; }
      g.to(visible, { opacity: 0, y: -12, duration: 0.25, ease: 'power2.in', stagger: 0.015, overwrite: true, onComplete: reveal });
    } else reveal();
  };

  filter.addEventListener('click', ev => {
    const b = ev.target.closest('[data-cat]'); if (!b) return;
    cat = b.dataset.cat;
    filter.querySelectorAll('[data-cat]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    history.replaceState(null, '', cat === 'all' ? location.pathname : `#${cat}`);
    apply();
  });
  filter.addEventListener('keydown', ev => {
    if (!['ArrowLeft', 'ArrowRight'].includes(ev.key)) return;
    const tabs = [...filter.querySelectorAll('[data-cat]')];
    const i = tabs.indexOf(document.activeElement);
    const n = tabs[(i + (ev.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    n.focus(); n.click();
  });
  let tmr;
  q.addEventListener('input', () => { term = q.value; clear.hidden = !q.value; clearTimeout(tmr); tmr = setTimeout(() => apply(), 180); });
  clear.addEventListener('click', () => { q.value = ''; term = ''; clear.hidden = true; q.focus(); apply(); });
  document.getElementById('menu-reset').addEventListener('click', () => { q.value = ''; term = ''; clear.hidden = true; cat = 'all'; filter.querySelectorAll('[data-cat]').forEach(x => x.setAttribute('aria-selected', String(x.dataset.cat === 'all'))); history.replaceState(null, '', location.pathname); apply(); });
  window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (validCat(h)) filter.querySelector(`[data-cat="${h}"]`)?.click(); });

  apply(false);

  try {
    three = await import('./three/food-scene.js');
    if (three.webglAvailable()) hydrateIO = three.hydrateRenders(document, renderSpec);
    else throw new Error('WebGL unavailable');
  } catch (err) {
    three = null;
    document.querySelectorAll('[data-render]').forEach(el => { el.classList.add('is-ready'); el.querySelector('img')?.remove(); el.insertAdjacentHTML('afterbegin', '<div class="webgl-fallback">3D renders need WebGL</div>'); });
  }

  initDialog(grid);
  return { intro: () => pageHeroIn() };
});

/* -------- Quick view dialog with a live, rotatable model -------- */
function initDialog(grid) {
  const dlg = document.getElementById('dish-dialog');
  const box = document.getElementById('dlg-viewer');
  const loading = box.querySelector('.viewer-loading');
  const layersBtn = dlg.querySelector('[data-dlg="layers"]');
  let viewer = null, opener = null, exploded = false;

  async function open(id) {
    const d = byId(id); if (!d) return;
    document.getElementById('dlg-cat').textContent = categoryLabel(d.category);
    document.getElementById('dlg-name').textContent = d.name;
    document.getElementById('dlg-price').textContent = money(d.price);
    document.getElementById('dlg-desc').textContent = d.description;
    document.getElementById('dlg-tags').innerHTML = dietTags(d);
    document.getElementById('dlg-ing').innerHTML = d.ingredients.map(i => `<li>${e(i)}</li>`).join('');
    document.getElementById('dlg-link').href = `dish.html#${d.id}`;
    exploded = false; layersBtn.setAttribute('aria-pressed', 'false');
    dlg.showModal();
    window.lenis?.stop?.();
    if (window.gsap && !prefersReduced()) window.gsap.fromTo(dlg.querySelector('.dialog__inner'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' });
    if (!three || !three.webglAvailable()) { loading.innerHTML = '<p>3D viewing needs WebGL, which is unavailable here.</p>'; return; }
    loading.classList.remove('is-done');
    if (!viewer) viewer = new three.DishViewer(box, { controls: true, autoRotate: !prefersReduced() });
    await viewer.load(d.model.type, d.model.params, 'threeQuarter');
    viewer.resize(); viewer.setView('threeQuarter', 0);
    viewer.start();
    loading.classList.add('is-done');
  }
  function close() {
    dlg.close();
  }
  dlg.addEventListener('close', () => {
    if (viewer) { viewer.dispose(); viewer = null; } // free GPU memory between dishes
    window.lenis?.start?.();
    opener?.focus();
  });
  grid.addEventListener('click', ev => {
    const b = ev.target.closest('[data-open]');
    const card = ev.target.closest('.menu-card');
    if (!b && !card) return;
    opener = b || card.querySelector('[data-open]');
    open((b || opener).dataset.open);
  });
  document.getElementById('dlg-close').addEventListener('click', close);
  dlg.addEventListener('click', ev => { if (ev.target === dlg) close(); });
  layersBtn.addEventListener('click', () => { exploded = !exploded; layersBtn.setAttribute('aria-pressed', String(exploded)); viewer?.setExplode(exploded ? 1 : 0); });
  dlg.querySelector('[data-dlg="top"]').addEventListener('click', () => viewer?.setView('top'));
  dlg.querySelector('[data-dlg="front"]').addEventListener('click', () => viewer?.setView('front'));
}
void hydrateIO;
