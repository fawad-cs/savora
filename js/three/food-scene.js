// Studio scene, interactive DishViewer and a single shared snapshot renderer
// that produces WebP "studio renders" for cards (one WebGL context for many images).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildDish } from './food-model.js';

export { THREE };

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}
export const isLowPower = () => (navigator.hardwareConcurrency || 8) <= 4 || matchMedia('(max-width: 600px)').matches;

export function makeRenderer(canvas, { alpha = true, preserve = false } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, preserveDrawingBuffer: preserve, powerPreference: 'high-performance' });
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.05;
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.setClearColor(0x000000, 0);
  return r;
}

/** Warm studio: soft environment, warm key spot, cool rim, shadow-catching floor. */
export function makeStudio(renderer, { floor = true, mood = 'warm' } = {}) {
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();

  const key = new THREE.SpotLight(mood === 'warm' ? 0xffd2a1 : 0xfff1e0, 60, 30, Math.PI / 6, 0.6, 1.6);
  key.position.set(-3.5, 6.5, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  key.shadow.radius = 6;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xbfd3ff, 1.6); rim.position.set(4, 3, -5); scene.add(rim);
  const fill = new THREE.HemisphereLight(0xffe7cc, 0x1a120c, 0.45); scene.add(fill);
  const bounce = new THREE.PointLight(0xff8a4a, 3, 8, 2); bounce.position.set(2.5, 0.6, 2.5); scene.add(bounce);

  let ground = null;
  if (floor) {
    ground = new THREE.Mesh(new THREE.CircleGeometry(12, 64), new THREE.ShadowMaterial({ opacity: 0.55 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  }
  return {
    scene, key, rim, fill, bounce, ground,
    dispose() { envTex.dispose(); ground?.geometry.dispose(); ground?.material.dispose(); },
  };
}

/** Spherical camera presets around the dish (azimuth θ, polar φ, distance multiplier). */
export const VIEWS = {
  top: { theta: 0.0, phi: 0.06, dist: 1.25 },
  front: { theta: 0.0, phi: 1.36, dist: 1.0 },
  side: { theta: Math.PI / 2, phi: 1.36, dist: 1.0 },
  threeQuarter: { theta: Math.PI / 4, phi: 1.02, dist: 1.0 },
  close: { theta: 0.35, phi: 1.22, dist: 0.55 },
  hero: { theta: -0.35, phi: 1.12, dist: 0.95 },
};

/** Measure a dish and drop it on the floor. Returns { radius, height, center }. */
export function placeDish(dish) {
  dish.explode(0);
  const box = new THREE.Box3().setFromObject(dish.root);
  dish.root.position.y -= box.min.y;
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.z) / 2;
  return { radius, height: size.y, centerY: size.y / 2 };
}

export function cameraFor(view, frame, aspect = 1, explode = 0, dish) {
  const v = typeof view === 'string' ? VIEWS[view] : view;
  const extent = Math.max(frame.radius * 1.05, frame.height * 1.0 + (explode && dish ? explode * (dish.layers.length - 1) * dish.spacing * 0.6 : 0));
  const fitDist = extent / Math.tan((32 * Math.PI / 180) / 2) * (aspect < 1 ? 1.05 / Math.max(aspect, 0.55) : 1);
  const d = fitDist * v.dist * 1.08;
  const ty = frame.centerY + (dish ? explode * (dish.layers.length - 1) * dish.spacing / 2 : 0);
  return {
    x: d * Math.sin(v.phi) * Math.sin(v.theta), y: ty + d * Math.cos(v.phi), z: d * Math.sin(v.phi) * Math.cos(v.theta),
    tx: 0, ty: v.dist < 0.7 ? ty * 0.8 : ty, tz: 0,
  };
}

/* ======================= Interactive viewer ======================= */
export class DishViewer {
  constructor(container, { controls = true, autoRotate = false, interactive = true, floatMotion = true, dprCap = 1.75, loop = true } = {}) {
    this.loop = loop;
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('aria-hidden', 'true');
    container.prepend(this.canvas);
    this.renderer = makeRenderer(this.canvas);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isLowPower() ? 1.25 : dprCap));
    this.studio = makeStudio(this.renderer);
    this.scene = this.studio.scene;
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
    this.floatMotion = floatMotion;
    this.explodeT = 0;
    this.running = false;
    this.clock = new THREE.Clock();
    if (controls) {
      this.controls = new OrbitControls(this.camera, this.canvas);
      Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.07, enablePan: false, autoRotate, autoRotateSpeed: 0.8, rotateSpeed: 0.7, zoomSpeed: 0.6 });
      this.controls.maxPolarAngle = Math.PI * 0.49;
      this.controls.enableZoom = interactive;
      this.controls.enableRotate = interactive;
      this.controls.addEventListener('start', () => { this.userActive = true; });
      // Allow page scroll on touch while not rotating: only capture with one-finger drag horizontally.
      this.canvas.style.touchAction = 'pan-y';
    }
    this.resize = this.resize.bind(this);
    this.ro = new ResizeObserver(this.resize); this.ro.observe(container);
    this.io = new IntersectionObserver(([e]) => { if (!this.loop) return; e.isIntersecting ? this.start() : this.stop(); }, { rootMargin: '100px' });
    this.io.observe(container);
    this.onVis = () => (document.hidden ? this.stop() : this.visibleCheck());
    document.addEventListener('visibilitychange', this.onVis);
    this.resize();
  }
  visibleCheck() { if (!this.loop) return; const r = this.container.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) this.start(); }

  async load(type, params, view = 'threeQuarter') {
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0))); // let the loading indicator paint
    if (this.dish) { this.scene.remove(this.dish.root); this.dish.dispose(); }
    this.dish = buildDish(type, params);
    this.frame = placeDish(this.dish);
    this.scene.add(this.dish.root);
    this.explodeT = 0;
    this.setView(view, 0);
    this.renderOnce();
    return this.dish;
  }

  camTarget(view) { return cameraFor(view, this.frame, this.aspect, this.explodeT, this.dish); }

  setView(view, duration = 1.6) {
    if (!this.dish) return;
    this.currentView = view;
    const c = this.camTarget(view);
    const t = this.controls ? this.controls.target : (this.target ||= new THREE.Vector3());
    if (!duration || !window.gsap) { this.camera.position.set(c.x, c.y, c.z); t.set(c.tx, c.ty, c.tz); this.camera.lookAt(t); this.controls?.update(); return; }
    window.gsap.to(this.camera.position, { x: c.x, y: c.y, z: c.z, duration, ease: 'expo.inOut', overwrite: true });
    window.gsap.to(t, { x: c.tx, y: c.ty, z: c.tz, duration, ease: 'expo.inOut', overwrite: true, onUpdate: () => !this.controls && this.camera.lookAt(t) });
  }

  setExplode(value, duration = 1.6) {
    if (!this.dish) return;
    const obj = { t: this.explodeT };
    const apply = () => { this.explodeT = obj.t; this.dish.explode(obj.t); };
    if (!duration || !window.gsap) { obj.t = value; apply(); this.setView(this.currentView || 'threeQuarter', 0); return; }
    window.gsap.to(obj, { t: value, duration, ease: 'expo.inOut', onUpdate: apply });
    this.explodeT = value; // compute camera for the end state
    const c = this.camTarget(this.currentView === 'top' ? 'top' : this.currentView || 'threeQuarter');
    this.explodeT = obj.t;
    const tgt = this.controls ? this.controls.target : this.target;
    window.gsap.to(this.camera.position, { x: c.x, y: c.y, z: c.z, duration, ease: 'expo.inOut' });
    window.gsap.to(tgt, { y: c.ty, duration, ease: 'expo.inOut' });
  }

  zoom(factor) {
    if (!this.controls) return;
    const t = this.controls.target, p = this.camera.position;
    const dir = p.clone().sub(t); const len = THREE.MathUtils.clamp(dir.length() * factor, this.frame.radius * 1.6, this.frame.radius * 14);
    dir.setLength(len);
    window.gsap ? window.gsap.to(p, { x: t.x + dir.x, y: t.y + dir.y, z: t.z + dir.z, duration: 0.9, ease: 'expo.out' }) : p.copy(t).add(dir);
  }

  setAutoRotate(on) { if (this.controls) this.controls.autoRotate = on; }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.aspect = w / h;
    this.camera.aspect = this.aspect; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    if (this.frame && this.controls) { this.controls.minDistance = this.frame.radius * 1.4; this.controls.maxDistance = this.frame.radius * 14; }
    this.renderOnce();
    this.onResize?.();
  }

  tick = () => {
    if (!this.running) return;
    const t = this.clock.getElapsedTime();
    if (this.dish && this.floatMotion) { this.dish.root.position.x = 0; this.dish.inner.position.y = Math.sin(t * 0.9) * 0.025; this.dish.inner.rotation.y = Math.sin(t * 0.25) * 0.05; }
    this.controls?.update();
    this.onFrame?.(t);
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.tick);
  };
  renderOnce() { if (this.dish) { this.controls?.update(); this.renderer.render(this.scene, this.camera); } }
  start() { if (this.running || this.disposed) return; this.running = true; this.clock.start(); this.raf = requestAnimationFrame(this.tick); }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }

  dispose() {
    this.disposed = true; this.stop();
    this.ro.disconnect(); this.io.disconnect();
    document.removeEventListener('visibilitychange', this.onVis);
    this.controls?.dispose();
    if (this.dish) { this.scene.remove(this.dish.root); this.dish.dispose(); }
    this.studio.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
    this.canvas.remove();
  }
}

/* ======================= Snapshot renders ======================= */
let snap = null;
const memo = new Map();
let queue = Promise.resolve();

function snapRig() {
  if (snap) return snap;
  const canvas = document.createElement('canvas');
  const renderer = makeRenderer(canvas, { preserve: true });
  renderer.setPixelRatio(1);
  const studio = makeStudio(renderer);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
  snap = { canvas, renderer, studio, camera };
  return snap;
}

/**
 * Render a dish to a WebP image URL. Cached in memory and sessionStorage, so a dish is
 * generated once per visit. Calls are queued so only one model exists at a time.
 */
export function renderDishImage(type, params = {}, { w = 900, h = 720, view = 'threeQuarter', key } = {}) {
  const id = key || `savora-r3-${type}-${JSON.stringify(params)}-${view}-${w}x${h}`;
  if (memo.has(id)) return memo.get(id);
  try { const cached = sessionStorage.getItem(id); if (cached) { const p = Promise.resolve(cached); memo.set(id, p); return p; } } catch { /* ignore */ }
  const job = queue.then(() => new Promise(resolve => {
    requestAnimationFrame(() => {
      const { renderer, studio, camera } = snapRig();
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      const dish = buildDish(type, params);
      const frame = placeDish(dish);
      if (params.explode) dish.explode(params.explode);
      studio.scene.add(dish.root);
      const v = typeof view === 'string' ? VIEWS[view] : view;
      const c = cameraFor({ ...v, dist: v.dist * 0.92 }, frame, w / h, params.explode || 0, dish);
      camera.position.set(c.x, c.y, c.z); camera.lookAt(c.tx, c.ty * 0.9, c.tz);
      renderer.render(studio.scene, camera);
      let url = renderer.domElement.toDataURL('image/webp', 0.86);
      if (!url.startsWith('data:image/webp')) url = renderer.domElement.toDataURL('image/png');
      studio.scene.remove(dish.root); dish.dispose();
      try { sessionStorage.setItem(id, url); } catch { /* quota: keep in memory only */ }
      resolve(url);
    });
  }));
  queue = job.catch(() => {});
  memo.set(id, job);
  return job;
}

/** Fill every [data-render] slot lazily as it nears the viewport. */
export function hydrateRenders(root = document, lookup) {
  const slots = [...root.querySelectorAll('[data-render]:not([data-rendered])')];
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const el = e.target; el.dataset.rendered = '1';
      const spec = lookup(el.dataset.render);
      if (!spec) return;
      const img = el.querySelector('img');
      renderDishImage(spec.type, spec.params, { view: el.dataset.view || spec.view || 'threeQuarter', w: +el.dataset.w || 900, h: +el.dataset.h || 720 })
        .then(url => { img.src = url; img.decode?.().catch(() => {}).finally(() => el.classList.add('is-ready')); if (!img.decode) el.classList.add('is-ready'); })
        .catch(err => { console.warn('Render failed', err); el.classList.add('is-ready'); });
    });
  }, { rootMargin: '400px 0px' });
  slots.forEach(s => io.observe(s));
  return io;
}
