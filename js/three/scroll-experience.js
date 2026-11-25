// The Signature Burger film: a pinned, scroll-scrubbed Three.js sequence.
// Enter → centre → layers separate (with editorial captions) → reassemble →
// top / front / side / three-quarter / close-up views → final presentation.
import { DishViewer, cameraFor, VIEWS } from './food-scene.js';

const VIEW_LABELS = { top: 'Top-down view', front: 'Front view', side: 'Side view', threeQuarter: 'Three-quarter view', close: 'Close-up · the sear', hero: 'Final presentation' };

export async function initSignatureFilm(section, { onReady } = {}) {
  const { gsap, ScrollTrigger } = window;
  const stage = section.querySelector('.sig-stage');
  const canvasBox = section.querySelector('.sig-canvas');
  const captions = [...section.querySelectorAll('.sig-caption')];
  const viewLabel = section.querySelector('.sig-view-label');
  const progressBar = section.querySelector('.sig-progress i');

  const viewer = new DishViewer(canvasBox, { controls: false, floatMotion: false, dprCap: 1.6, loop: false });
  const dish = await viewer.load('burger', {}, 'threeQuarter');
  viewer.stop();
  section.querySelector('.viewer-loading')?.classList.add('is-done');
  onReady?.();

  const cam = { x: 0, y: 0, z: 0, ty: 0 };
  const groundY = dish.root.position.y;
  const camFor = (view, ex = 0, dist = 1) => cameraFor({ ...viewOf(view), dist: viewOf(view).dist * dist }, viewer.frame, viewer.aspect || 1, ex, dish);
  // On portrait screens the final frame lifts the burger so the title can sit beneath it.
  const set = (view, ex = 0, dist = 1, lift = 0) => {
    const shift = () => ((viewer.aspect || 1) < 0.8 ? -viewer.frame.height * lift : 0);
    const portraitDist = () => dist * ((viewer.aspect || 1) < 0.8 && lift ? 1.12 : 1);
    return { x: () => camFor(view, ex, portraitDist()).x, y: () => camFor(view, ex, portraitDist()).y + shift(), z: () => camFor(view, ex, portraitDist()).z, ty: () => camFor(view, ex, portraitDist()).ty + shift() };
  };
  Object.assign(cam, { ...camFor('threeQuarter', 0, 1.05) });

  const explode = { t: 0 };
  const layerOrder = ['topBun', 'lettuce', 'tomato', 'cheese', 'patty', 'bottomBun'];
  const byName = Object.fromEntries(dish.layers.map(l => [l.name, l]));

  const render = () => {
    dish.explode(explode.t);
    viewer.camera.position.set(cam.x, cam.y, cam.z);
    viewer.camera.lookAt(0, cam.ty, 0);
    viewer.renderer.render(viewer.scene, viewer.camera);
  };

  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: {
      trigger: section, start: 'top top', end: () => '+=' + Math.round(innerHeight * (innerWidth < 700 ? 6 : 7)),
      pin: stage, scrub: 1.1, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: self => { progressBar && (progressBar.style.transform = `scaleX(${self.progress})`); },
    },
    onUpdate: render,
  });

  // 1 — dramatic entrance from above, turning into place
  tl.fromTo(dish.root.position, { y: groundY + 4.5 }, { y: groundY, duration: 1.2, ease: 'power3.out' }, 0)
    .fromTo(dish.root.rotation, { y: -1.6 }, { y: 0, duration: 1.4, ease: 'power3.out' }, 0)
    .fromTo(cam, set('threeQuarter', 0, 1.25), { ...set('front', 0, 1.0), duration: 1.4 }, 0)
    .fromTo('.sig-intro', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.3)
    .to('.sig-intro', { autoAlpha: 0, y: -30, duration: 0.5 }, 1.6);

  // 2 — layers separate vertically, camera pulls back to keep everything framed
  tl.to(explode, { t: 1, duration: 1.4 }, 1.8)
    .to(cam, { ...set({ theta: 0.6, phi: 1.2, dist: 1 }, 1, 0.92), duration: 1.4 }, 1.8);

  // 3 — editorial caption for each ingredient; the featured layer slides forward
  const step = 0.75;
  layerOrder.forEach((name, i) => {
    const l = byName[name]; const at = 3.3 + i * step;
    if (l) tl.to(l.obj.position, { x: 0.35, z: 0.2, duration: step * 0.45, ease: 'power2.out' }, at).to(l.obj.position, { x: 0, z: 0, duration: step * 0.45, ease: 'power2.in' }, at + step * 0.55);
    const c = captions[i];
    if (c) tl.fromTo(c, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: step * 0.35 }, at).to(c, { autoAlpha: 0, y: -24, duration: step * 0.3 }, at + step * 0.7);
  });

  // 4 — reassemble
  const reassemble = 3.3 + layerOrder.length * step + 0.1;
  tl.to(explode, { t: 0, duration: 1.2, ease: 'power3.inOut' }, reassemble)
    .to(cam, { ...set('threeQuarter', 0, 0.95), duration: 1.2 }, reassemble);

  // 5 — rotate through the camera views
  const views = ['top', 'front', 'side', 'threeQuarter', 'close'];
  let t0 = reassemble + 1.3;
  views.forEach(v => {
    tl.to(cam, { ...set(v, 0, v === 'top' ? 0.85 : 1), duration: 0.9 }, t0)
      .call(() => { if (viewLabel) viewLabel.textContent = VIEW_LABELS[v]; }, null, t0 + 0.45);
    t0 += 1.05;
  });
  tl.fromTo(viewLabel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, reassemble + 1.3)
    .to(viewLabel, { autoAlpha: 0, duration: 0.3 }, t0);

  // 6 — final full-screen presentation with a slow full turn
  tl.to(cam, { ...set('hero', 0, 0.82, 0.55), duration: 1.4 }, t0)
    .to(dish.root.rotation, { y: Math.PI * 2, duration: 2.2, ease: 'none' }, t0)
    .to('.sig-stage', { '--vignette': 1, duration: 1 }, t0)
    .fromTo('.sig-final', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.8 }, t0 + 0.8)
    .to({}, { duration: 0.6 });

  viewer.onResize = render;

  render();
  ScrollTrigger.refresh();

  return {
    viewer, tl,
    dispose() { tl.scrollTrigger?.kill(); tl.kill(); viewer.dispose(); },
  };
}

function viewOf(v) { return typeof v === 'string' ? VIEWS[v] : v; }
