import { boot } from './main.js';
import { pageHeroIn, prefersReduced } from './animations.js';
import { renderArt } from './art.js';

boot(async () => {
  renderArt();
  initGallery();
  initOffers();
  return { intro: () => pageHeroIn() };
});

function initGallery() {
  const track = document.getElementById('g-track');
  const go = dir => {
    const item = track.querySelector('.gallery__item');
    track.scrollBy({ left: dir * (item.getBoundingClientRect().width + 24), behavior: prefersReduced() ? 'auto' : 'smooth' });
  };
  document.getElementById('g-prev').addEventListener('click', () => go(-1));
  document.getElementById('g-next').addEventListener('click', () => go(1));
  track.addEventListener('keydown', ev => { if (ev.key === 'ArrowRight') { ev.preventDefault(); go(1); } if (ev.key === 'ArrowLeft') { ev.preventDefault(); go(-1); } });
}

// Cinematic offer transitions: the image wipes in sideways while the text rises.
function initOffers() {
  const g = window.gsap;
  if (!g || prefersReduced()) return;
  document.querySelectorAll('.offer').forEach((o, i) => {
    const media = o.querySelector('.offer__media');
    const svg = media.querySelector('svg');
    const tl = g.timeline({ scrollTrigger: { trigger: o, start: 'top 75%', once: true } });
    tl.fromTo(media, { clipPath: i % 2 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0%)', duration: 1.6, ease: 'expo.inOut' })
      .from(svg, { scale: 1.25, duration: 2, ease: 'expo.out' }, 0)
      .from(o.querySelectorAll('.offer__text > *'), { opacity: 0, y: 30, duration: 1.1, ease: 'expo.out', stagger: 0.08 }, 0.5);
    g.to(svg, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: o, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}
