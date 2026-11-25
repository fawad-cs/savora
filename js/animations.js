// Shared GSAP animation system. Every effect is opt-in through data attributes,
// and nothing runs when the visitor prefers reduced motion.

export const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce');

const gsap = () => window.gsap;

/** Split an element's text into masked lines (no paid SplitText plugin needed). */
export function splitLines(el) {
  if (!el || el.dataset.splitDone) return [];
  const text = el.textContent.trim().replace(/\s+/g, ' ');
  const words = text.split(' ');
  el.setAttribute('aria-label', text);
  el.innerHTML = words.map(w => `<span class="w" aria-hidden="true" style="display:inline-block">${w}</span>`).join(' ');
  const lines = [];
  let top = null;
  el.querySelectorAll('.w').forEach(w => {
    const t = w.offsetTop;
    if (top === null || Math.abs(t - top) > 4) { lines.push([]); top = t; }
    lines[lines.length - 1].push(w.textContent);
  });
  el.innerHTML = lines.map(l => `<span class="split-line" aria-hidden="true"><span>${l.join(' ')}</span></span>`).join('');
  el.dataset.splitDone = '1';
  return [...el.querySelectorAll('.split-line > span')];
}

export function initAnimations(scope = document) {
  const g = gsap();
  if (!g || prefersReduced()) {
    scope.querySelectorAll('[data-reveal],[data-clip]').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; el.style.clipPath = 'none'; });
    return;
  }
  const ST = window.ScrollTrigger;

  // Text mask reveals: headings slide up from behind a line mask.
  scope.querySelectorAll('[data-split]').forEach(el => {
    const lines = splitLines(el);
    g.from(lines, {
      yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.09,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  // Generic fade-up, staggered for siblings that enter together.
  ST.batch(scope.querySelectorAll('[data-reveal]'), {
    start: 'top 90%', once: true,
    onEnter: els => g.to(els, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, overwrite: true }),
  });

  // Image clip-path reveals (vertical by default, horizontal with data-clip="x").
  scope.querySelectorAll('[data-clip]').forEach(el => {
    const horizontal = el.dataset.clip === 'x';
    const inner = el.querySelector('img, svg, canvas');
    const tl = g.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    tl.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' });
    if (inner) tl.from(inner, { scale: 1.25, duration: 2, ease: 'expo.out' }, 0);
    void horizontal;
  });

  // Parallax: data-parallax="0.15" moves the element against the scroll.
  scope.querySelectorAll('[data-parallax]').forEach(el => {
    const amt = parseFloat(el.dataset.parallax) || 0.15;
    g.fromTo(el, { yPercent: -amt * 50 }, {
      yPercent: amt * 50, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // Horizontal marquee tied to scroll velocity-free scrub.
  scope.querySelectorAll('.marquee__track').forEach(track => {
    g.to(track, { xPercent: -30, ease: 'none', scrollTrigger: { trigger: track, start: 'top bottom', end: 'bottom top', scrub: 1 } });
  });

  // Numbers count up.
  scope.querySelectorAll('[data-count]').forEach(el => {
    const end = parseFloat(el.dataset.count);
    const obj = { v: 0 };
    g.to(obj, {
      v: end, duration: 2, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString(); },
    });
  });
}

/** Hero entrance for inner pages: kicker, split title, then supporting copy. */
export function pageHeroIn(root = document.querySelector('[data-page-hero]')) {
  const g = gsap();
  if (!root || !g || prefersReduced()) return;
  const title = root.querySelector('[data-hero-title]');
  const lines = title ? splitLines(title) : [];
  const tl = g.timeline({ delay: 0.35 });
  const pre = root.querySelectorAll('[data-hero-pre]'), post = root.querySelectorAll('[data-hero-post]'), media = root.querySelectorAll('[data-hero-media]');
  if (pre.length) tl.from(pre, { opacity: 0, y: 20, duration: 1, ease: 'expo.out' });
  if (lines.length) tl.from(lines, { yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: 0.1 }, pre.length ? '-=0.7' : 0);
  if (post.length) tl.from(post, { opacity: 0, y: 24, duration: 1.1, ease: 'expo.out', stagger: 0.1 }, '-=1');
  if (media.length) tl.from(media, { clipPath: 'inset(100% 0 0 0)', duration: 1.6, ease: 'expo.inOut' }, 0.2);
  return tl;
}

/** Magnetic hover for primary buttons (pointer devices only). */
export function initMagnetic() {
  const g = gsap();
  if (!g || prefersReduced() || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll('.btn--solid, [data-magnetic]').forEach(btn => {
    const xTo = g.quickTo(btn, 'x', { duration: 0.6, ease: 'expo.out' });
    const yTo = g.quickTo(btn, 'y', { duration: 0.6, ease: 'expo.out' });
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.18);
      yTo((e.clientY - r.top - r.height / 2) * 0.28);
    });
    btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}
