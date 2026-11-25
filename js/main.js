// Entry point shared by every page: layout, smooth scroll, navigation, loader, animations.
import { mountLayout, initNavigation } from './navigation.js';
import { initAnimations, initMagnetic, prefersReduced } from './animations.js';

export let lenis = null;

export function icons(root) {
  try { window.lucide?.createIcons({ attrs: { 'stroke-width': 1.5, 'aria-hidden': 'true' }, nameAttr: 'data-lucide', root }); }
  catch (err) { console.warn('Icons unavailable', err); }
}

function initSmoothScroll() {
  const { gsap, ScrollTrigger, Lenis } = window;
  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (!Lenis || prefersReduced() || !gsap) return null;
  const l = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  l.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => l.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  // In-page anchors scroll smoothly through Lenis.
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); l.scrollTo(target, { offset: -70 }); }
  });
  return l;
}

/** Loader: shown once per session on the home page, waits for `ready` (or 4s max). */
async function runLoader(ready) {
  const el = document.querySelector('.loader');
  if (!el) return;
  const { gsap } = window;
  let seen = false;
  try { seen = sessionStorage.getItem('savora-loaded') === '1'; sessionStorage.setItem('savora-loaded', '1'); } catch { /* ignore */ }
  if (seen || !gsap || prefersReduced()) { await Promise.race([ready, wait(2500)]); el.remove(); return; }
  const bar = el.querySelector('.loader__line i');
  const letters = el.querySelectorAll('.loader__word span');
  gsap.to(letters, { yPercent: -105, duration: 1.1, ease: 'expo.out', stagger: 0.06 });
  const prog = gsap.to(bar, { scaleX: 0.85, duration: 2.4, ease: 'power2.out' });
  await Promise.all([Promise.race([ready, wait(4000)]), wait(1300)]);
  prog.kill();
  await gsap.to(bar, { scaleX: 1, duration: 0.4, ease: 'power2.out' });
  await gsap.to(el, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' });
  el.remove();
}
const wait = ms => new Promise(r => setTimeout(r, ms));

/**
 * boot(pageInit) — pageInit may return { ready: Promise, intro: () => void }.
 * `ready` holds the loader; `intro` plays the page's hero entrance once the loader leaves.
 */
export async function boot(pageInit) {
  const root = document.documentElement;
  if (prefersReduced()) root.classList.add('reduce');
  mountLayout();
  icons();
  lenis = initSmoothScroll();
  window.lenis = lenis;
  initNavigation(lenis);

  let result = {};
  try { result = (await pageInit?.({ lenis })) || {}; }
  catch (err) { console.error('Page init failed', err); }

  icons();
  await runLoader(result.ready || Promise.resolve());
  result.intro?.();
  initAnimations();
  initMagnetic();

  const refresh = () => window.ScrollTrigger?.refresh();
  document.fonts?.ready.then(refresh);
  window.addEventListener('load', refresh);

  // Reduced-motion preference changes mid-visit: reload into the right mode.
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', () => location.reload());
}
