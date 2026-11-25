import { boot, icons } from './main.js';
import { prefersReduced, splitLines } from './animations.js';
import { renderArt } from './art.js';
import { DISHES, byId, money, renderSpec, escapeHTML as e } from './data/menu-data.js';
import { dishCard, burgerIllustration } from './components.js';

const lazyThree = () => import('./three/food-scene.js');
const nearViewport = (el, margin = '600px') => new Promise(res => {
  const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { io.disconnect(); res(); } }, { rootMargin: margin });
  io.observe(el);
});

boot(async () => {
  renderArt();
  document.getElementById('signature-grid').innerHTML = ['dry-aged-ribeye', 'chocolate-entremet', 'truffle-bianca'].map(id => dishCard(byId(id))).join('');
  buildChefList();
  initTestimonials();

  let three = null;
  let webgl = false;
  try { three = await lazyThree(); webgl = three.webglAvailable(); } catch (err) { console.warn('3D library unavailable', err); }

  const hero = webgl ? initHero(three) : heroFallback();
  const film = initSignature(three, webgl);

  if (webgl) {
    three.hydrateRenders(document, renderSpec);
    nearViewport(document.getElementById('showcase')).then(() => initShowcase(three));
  } else {
    document.querySelectorAll('[data-render]').forEach(el => { el.classList.add('is-ready'); el.querySelector('img')?.remove(); el.insertAdjacentHTML('afterbegin', '<div class="webgl-fallback">3D rendering is unavailable on this device.</div>'); });
    document.getElementById('showcase-viewer').innerHTML = '<div class="webgl-fallback"><p>3D viewing needs WebGL, which is unavailable in this browser. <a class="link-arrow" href="menu.html">Browse the menu instead</a></p></div>';
  }
  initPrepHorizontal();

  return {
    ready: Promise.all([hero, film]).catch(() => {}),
    intro: heroIntro,
  };
});

/* ---------------- Hero ---------------- */
async function initHero(three) {
  const box = document.getElementById('hero-media');
  const viewer = new three.DishViewer(box, { controls: false, floatMotion: true, dprCap: 1.75 });
  await viewer.load('plated', { protein: 'steak', dark: true }, 'hero');
  box.querySelector('.viewer-loading')?.classList.add('is-done');
  const base = viewer.camTarget('hero');
  const close = three.cameraFor({ theta: 0.15, phi: 1.05, dist: 0.62 }, viewer.frame, viewer.aspect, 0, viewer.dish);
  const cam = { ...base };
  // Slow, controlled orbit + pointer parallax. No random motion.
  let px = 0, py = 0;
  if (!prefersReduced()) window.addEventListener('pointermove', ev => { px = ev.clientX / innerWidth - 0.5; py = ev.clientY / innerHeight - 0.5; }, { passive: true });
  const target = new three.THREE.Vector3(0, base.ty, 0);
  viewer.onFrame = t => {
    const a = prefersReduced() ? 0 : t * 0.08;
    const r = Math.hypot(cam.x, cam.z);
    const ang = Math.atan2(cam.x, cam.z) + Math.sin(a) * 0.35 + px * 0.12;
    viewer.camera.position.set(Math.sin(ang) * r, cam.y - py * 0.4, Math.cos(ang) * r);
    viewer.camera.lookAt(target.set(0, cam.ty, 0));
  };
  viewer.onResize = () => { Object.assign(base, viewer.camTarget('hero')); };
  // Cinematic entrance: start close and pull back to the hero framing.
  if (window.gsap && !prefersReduced()) {
    Object.assign(cam, close);
    window.gsap.to(cam, { x: base.x, y: base.y, z: base.z, ty: base.ty, duration: 3.2, ease: 'expo.out', delay: 0.4 });
    window.gsap.to(box, { scale: 1.08, yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }
  viewer.start();
}

function heroFallback() {
  const box = document.getElementById('hero-media');
  box.innerHTML = '';
  box.classList.add('frame');
  box.dataset.art = 'dining';
  box.dataset.alt = 'Illustration of the Savora dining room';
  renderArt(box.parentElement);
  const badge = document.querySelector('.hero__meta .badge-3d');
  if (badge) badge.textContent = 'Illustration · 3D unavailable on this device';
  return Promise.resolve();
}

function heroIntro() {
  const g = window.gsap;
  if (!g || prefersReduced()) return;
  const lines = document.querySelectorAll('.hero__title .split-line > span');
  g.timeline()
    .from('.hero-pre', { opacity: 0, y: 20, duration: 1.1, ease: 'expo.out' })
    .from(lines, { yPercent: 115, duration: 1.5, ease: 'expo.out', stagger: 0.12 }, '-=0.8')
    .from('.hero-post', { opacity: 0, y: 26, duration: 1.2, ease: 'expo.out', stagger: 0.12 }, '-=1.1')
    .from('#hero-media', { opacity: 0, duration: 2, ease: 'power2.out' }, 0);
}

/* ---------------- Signature film ---------------- */
async function initSignature(three, webgl) {
  const section = document.getElementById('signature');
  if (!webgl || prefersReduced() || !window.gsap) return staticSignature(section, three, webgl);
  try {
    const mod = await import('./three/scroll-experience.js');
    await mod.initSignatureFilm(section);
  } catch (err) {
    console.error('Signature film failed, using static version', err);
    return staticSignature(section, three, webgl);
  }
}

async function staticSignature(section, three, webgl) {
  section.classList.add('is-static');
  const canvasBox = section.querySelector('.sig-canvas');
  const text = document.createElement('div');
  text.className = 'sig-text';
  ['.sig-intro', '.sig-captions', '.sig-final'].forEach(s => text.appendChild(section.querySelector(s)));
  section.querySelector('.sig-stage').appendChild(text);
  section.querySelector('.sig-intro .muted').textContent = 'Each layer, separated so you can see how the burger is built.';
  if (webgl && three) {
    canvasBox.innerHTML = '<div class="viewer-loading"><div class="spinner"></div></div>';
    const url = await three.renderDishImage('burger', { explode: 1 }, { w: 800, h: 1000, view: { theta: 0.6, phi: 1.25, dist: 0.72 } });
    canvasBox.innerHTML = `<img src="${url}" alt="The Savora Signature burger with its six layers separated — 3D render">`;
  } else {
    canvasBox.innerHTML = burgerIllustration(true);
  }
  section.querySelector('.sig-tag').textContent = webgl ? '3D render' : 'Illustration — 3D unavailable';
}

/* ---------------- 3D showcase ---------------- */
async function initShowcase(three) {
  const box = document.getElementById('showcase-viewer');
  const viewer = new three.DishViewer(box, { controls: true, autoRotate: !prefersReduced(), floatMotion: !prefersReduced() });
  const loading = box.querySelector('.viewer-loading');
  const viewBtns = [...document.querySelectorAll('.seg [data-view]')];
  const layersBtn = document.querySelector('[data-action="layers"]');
  const spinBtn = document.querySelector('[data-action="spin"]');
  if (prefersReduced()) spinBtn.setAttribute('aria-pressed', 'false');
  let exploded = false;

  const setPressed = (btns, active) => btns.forEach(b => b.setAttribute('aria-pressed', String(b === active)));
  async function show(id) {
    const d = byId(id);
    loading.classList.remove('is-done');
    exploded = false; layersBtn.setAttribute('aria-pressed', 'false');
    const dish = await viewer.load(d.model.type, d.model.params, 'threeQuarter');
    setPressed(viewBtns, viewBtns.find(b => b.dataset.view === 'threeQuarter'));
    loading.classList.add('is-done');
    viewer.visibleCheck();
    document.getElementById('show-name').textContent = d.name;
    document.getElementById('show-price').textContent = money(d.price);
    document.getElementById('show-desc').textContent = d.description;
    document.getElementById('show-link').href = `dish.html#${d.id}`;
    const list = document.getElementById('show-layers');
    list.classList.remove('is-open');
    list.innerHTML = [...dish.layers].reverse().filter(l => l.h > 0.001 || dish.name !== 'drink').map((l, i) => `<li data-n="${i + 1}">${e(l.label)}</li>`).join('');
  }

  document.querySelectorAll('.tabs [role="tab"]').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('.tabs [role="tab"]').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    show(tab.dataset.dish);
  }));
  // Arrow-key navigation between tabs
  document.querySelector('.tabs').addEventListener('keydown', ev => {
    if (!['ArrowLeft', 'ArrowRight'].includes(ev.key)) return;
    const tabs = [...document.querySelectorAll('.tabs [role="tab"]')];
    const i = tabs.indexOf(document.activeElement);
    const next = tabs[(i + (ev.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    next.focus(); next.click();
  });
  viewBtns.forEach(b => b.addEventListener('click', () => { setPressed(viewBtns, b); viewer.setView(b.dataset.view); }));
  document.querySelector('[data-action="zoom-in"]').addEventListener('click', () => viewer.zoom(0.8));
  document.querySelector('[data-action="zoom-out"]').addEventListener('click', () => viewer.zoom(1.25));
  layersBtn.addEventListener('click', () => {
    exploded = !exploded;
    layersBtn.setAttribute('aria-pressed', String(exploded));
    document.getElementById('show-layers').classList.toggle('is-open', exploded);
    viewer.setExplode(exploded ? 1 : 0);
  });
  spinBtn.addEventListener('click', () => {
    const on = spinBtn.getAttribute('aria-pressed') !== 'true';
    spinBtn.setAttribute('aria-pressed', String(on)); viewer.setAutoRotate(on);
  });
  // Keyboard: arrows orbit when the viewer is focused, +/- zoom.
  box.addEventListener('keydown', ev => {
    const c = viewer.controls; if (!c) return;
    const step = 0.18;
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') { ev.preventDefault(); const off = viewer.camera.position.clone().sub(c.target); off.applyAxisAngle(new three.THREE.Vector3(0, 1, 0), ev.key === 'ArrowLeft' ? -step : step); viewer.camera.position.copy(c.target).add(off); }
    if (ev.key === '+' || ev.key === '=') viewer.zoom(0.85);
    if (ev.key === '-') viewer.zoom(1.18);
  });
  await show('signature-burger');
}

/* ---------------- Chef's selection with hover preview ---------------- */
function buildChefList() {
  const list = document.getElementById('chef-list');
  const picks = DISHES.filter(d => d.chef).slice(0, 6);
  list.innerHTML = picks.map(d => `<li data-reveal><a href="dish.html#${e(d.id)}" data-id="${e(d.id)}"><h3>${e(d.name)}</h3><span class="price">${money(d.price)}</span><p>${e(d.short)}</p><span class="cat">${e(d.category === 'mains' ? 'Main course' : d.category[0].toUpperCase() + d.category.slice(1))}</span></a></li>`).join('');
  const prev = document.getElementById('chef-preview');
  const img = prev.querySelector('img');
  let token = 0;
  const showPreview = async a => {
    list.querySelectorAll('a').forEach(x => x.classList.toggle('is-active', x === a));
    const my = ++token;
    const three = await lazyThree().catch(() => null);
    if (!three || !three.webglAvailable()) { prev.classList.add('is-ready'); return; }
    const spec = renderSpec(a.dataset.id);
    prev.classList.remove('is-ready');
    const url = await three.renderDishImage(spec.type, spec.params, { w: 900, h: 720 });
    if (my !== token) return;
    img.src = url; img.alt = `${byId(a.dataset.id).name} — 3D render`;
    prev.classList.add('is-ready');
  };
  list.addEventListener('pointerover', ev => { const a = ev.target.closest('a'); if (a && !a.classList.contains('is-active')) showPreview(a); });
  list.addEventListener('focusin', ev => { const a = ev.target.closest('a'); if (a) showPreview(a); });
  nearViewport(list).then(() => showPreview(list.querySelector('a')));
}

/* ---------------- Horizontal preparation reel ---------------- */
function initPrepHorizontal() {
  const g = window.gsap;
  const pin = document.querySelector('.prep__pin');
  const track = document.querySelector('.prep__track');
  if (!g || prefersReduced()) return;
  const mm = g.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    g.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 },
    });
    // Horizontal image reveals as each card slides in
    track.querySelectorAll('.prep__card .frame').forEach((f, i) => {
      g.fromTo(f, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.4, ease: 'expo.inOut', delay: i * 0.12, scrollTrigger: { trigger: pin, start: 'top 70%', once: true } });
    });
  });
  mm.add('(max-width: 900px)', () => {
    track.querySelectorAll('.prep__card').forEach(c => g.from(c, { opacity: 0, y: 40, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 88%', once: true } }));
  });
}

/* ---------------- Testimonials ---------------- */
function initTestimonials() {
  const track = document.getElementById('t-track');
  const cards = () => [...track.children];
  const go = dir => {
    const w = cards()[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
    track.scrollBy({ left: dir * w, behavior: prefersReduced() ? 'auto' : 'smooth' });
  };
  document.getElementById('t-prev').addEventListener('click', () => go(-1));
  document.getElementById('t-next').addEventListener('click', () => go(1));
  track.addEventListener('keydown', ev => { if (ev.key === 'ArrowRight') { ev.preventDefault(); go(1); } if (ev.key === 'ArrowLeft') { ev.preventDefault(); go(-1); } });
  void splitLines; void icons;
}
