import { boot, icons } from './main.js';
import { prefersReduced } from './animations.js';
import { DISHES, byId, money, renderSpec, categoryLabel, escapeHTML as e } from './data/menu-data.js';
import { dishCard, dietTags } from './components.js';

let three = null, viewer = null, relIO = null;

boot(async () => {
  try { three = await import('./three/food-scene.js'); if (!three.webglAvailable()) three = null; } catch { three = null; }
  wireControls();
  await show(location.hash.slice(1) || 'signature-burger');
  window.addEventListener('hashchange', () => { show(location.hash.slice(1)); window.lenis ? window.lenis.scrollTo(0, { immediate: true }) : scrollTo(0, 0); });
  window.addEventListener('pagehide', () => viewer?.dispose());
  return {};
});

async function show(id) {
  const d = byId(id);
  const page = document.getElementById('dish-page');
  const missing = document.getElementById('dish-missing');
  page.hidden = !d; missing.hidden = !!d;
  if (!d) { document.title = 'Dish not found — SAVORA'; renderRelated(DISHES.filter(x => x.signature)); return; }

  document.title = `${d.name} — SAVORA`;
  document.getElementById('dish-cat').textContent = categoryLabel(d.category);
  const crumb = document.getElementById('crumb-cat'); crumb.textContent = categoryLabel(d.category); crumb.href = `menu.html#${d.category}`;
  document.getElementById('back-menu').href = `menu.html#${d.category}`;
  document.getElementById('dish-name').textContent = d.name;
  document.getElementById('dish-price').textContent = money(d.price);
  document.getElementById('dish-desc').textContent = d.description;
  document.getElementById('dish-tags').innerHTML = `<span class="tag">${e(categoryLabel(d.category))}</span>${dietTags(d)}${d.chef ? '<span class="tag">Chef’s selection</span>' : ''}`;
  document.getElementById('dish-ing').innerHTML = d.ingredients.map(i => `<li><i data-lucide="leaf"></i>${e(i)}</li>`).join('');
  document.getElementById('dish-story').textContent = d.story;
  icons(page);

  const g = window.gsap;
  if (g && !prefersReduced()) g.from(['#dish-cat', '#dish-name', '#dish-price', '#dish-desc', '#dish-tags', '.dish-actions'], { opacity: 0, y: 24, duration: 1.1, ease: 'expo.out', stagger: 0.07 });

  // 3D model
  const box = document.getElementById('dish-viewer');
  const loading = box.querySelector('.viewer-loading');
  const layers = document.getElementById('dish-layers');
  if (!three) {
    loading.innerHTML = '<p>Interactive 3D needs WebGL, which is unavailable in this browser.</p>';
    layers.innerHTML = '<li>3D model unavailable</li>';
  } else {
    loading.classList.remove('is-done');
    viewer ||= new three.DishViewer(box, { controls: true, autoRotate: !prefersReduced(), floatMotion: !prefersReduced() });
    const dish = await viewer.load(d.model.type, d.model.params, 'threeQuarter');
    document.querySelectorAll('.seg [data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === 'threeQuarter')));
    document.querySelector('[data-act="layers"]').setAttribute('aria-pressed', 'false');
    loading.classList.add('is-done');
    viewer.visibleCheck();
    layers.innerHTML = [...dish.layers].reverse().map(l => `<li>${e(l.label.charAt(0).toUpperCase() + l.label.slice(1))}</li>`).join('');
  }

  const related = DISHES.filter(x => x.category === d.category && x.id !== d.id);
  const extra = DISHES.filter(x => x.chef && x.id !== d.id && x.category !== d.category);
  renderRelated([...related, ...extra].slice(0, 3));
}

function renderRelated(list) {
  const wrap = document.getElementById('related');
  wrap.innerHTML = list.map(d => dishCard(d, { reveal: false })).join('');
  if (three) { relIO?.disconnect(); relIO = three.hydrateRenders(wrap, renderSpec); }
  else wrap.querySelectorAll('[data-render]').forEach(el => { el.classList.add('is-ready'); el.querySelector('img')?.remove(); });
}

function wireControls() {
  const views = [...document.querySelectorAll('.seg [data-view]')];
  views.forEach(b => b.addEventListener('click', () => { views.forEach(x => x.setAttribute('aria-pressed', String(x === b))); viewer?.setView(b.dataset.view); }));
  document.querySelector('[data-act="in"]').addEventListener('click', () => viewer?.zoom(0.8));
  document.querySelector('[data-act="out"]').addEventListener('click', () => viewer?.zoom(1.25));
  const lb = document.querySelector('[data-act="layers"]');
  lb.addEventListener('click', () => { const on = lb.getAttribute('aria-pressed') !== 'true'; lb.setAttribute('aria-pressed', String(on)); viewer?.setExplode(on ? 1 : 0); });
  document.getElementById('dish-viewer').addEventListener('keydown', ev => {
    if (!viewer?.controls || !three) return;
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
      ev.preventDefault();
      const c = viewer.controls; const off = viewer.camera.position.clone().sub(c.target);
      off.applyAxisAngle(new three.THREE.Vector3(0, 1, 0), ev.key === 'ArrowLeft' ? -0.2 : 0.2);
      viewer.camera.position.copy(c.target).add(off);
    }
    if (ev.key === '+' || ev.key === '=') viewer.zoom(0.85);
    if (ev.key === '-') viewer.zoom(1.18);
  });
}
