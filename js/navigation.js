// Global header, mobile menu, footer and page transitions — shared by every page.
import { prefersReduced } from './animations.js';

export const NAV = [
  { href: 'index.html', label: 'Home', page: 'home', note: 'Welcome' },
  { href: 'menu.html', label: 'Menu', page: 'menu', note: 'The carte' },
  { href: 'story.html', label: 'Our Story', page: 'story', note: 'Since 2009' },
  { href: 'experience.html', label: 'Experience', page: 'experience', note: 'Dining rooms' },
  { href: 'contact.html', label: 'Contact', page: 'contact', note: 'Find us' },
];

export const HOURS = [
  ['Tuesday – Thursday', '18:00 – 23:00'],
  ['Friday – Saturday', '17:30 – 00:00'],
  ['Sunday', '12:00 – 16:00'],
  ['Monday', 'Closed'],
];

const SOCIAL = [
  { label: 'Instagram', icon: 'instagram', href: 'https://www.instagram.com/' },
  { label: 'Facebook', icon: 'facebook', href: 'https://www.facebook.com/' },
  { label: 'YouTube', icon: 'youtube', href: 'https://www.youtube.com/' },
];

const current = () => document.body.dataset.page;

function headerHTML() {
  const links = NAV.map(n => `<li><a href="${n.href}"${n.page === current() ? ' aria-current="page"' : ''}>${n.label}</a></li>`).join('');
  return `
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header" id="site-header">
    <nav class="nav" aria-label="Primary">
      <a class="logo" href="index.html" aria-label="Savora — home">SAVORA</a>
      <ul class="nav-links">${links}</ul>
      <div class="nav-cta">
        <a class="btn btn--sm btn--gold nav-reserve" href="reservations.html"${current() === 'reservations' ? ' aria-current="page"' : ''}>Reserve a Table</a>
        <button class="burger-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span></button>
      </div>
    </nav>
  </header>
  <div class="mobile-menu" id="mobile-menu" aria-hidden="true">
    <ul>
      ${NAV.map(n => `<li><a href="${n.href}"${n.page === current() ? ' aria-current="page"' : ''}>${n.label}<small>${n.note}</small></a></li>`).join('')}
      <li><a href="reservations.html"${current() === 'reservations' ? ' aria-current="page"' : ''}>Reservations<small>Book</small></a></li>
    </ul>
    <div class="mobile-menu__foot">
      <a class="btn btn--solid" href="reservations.html">Reserve a Table <i data-lucide="arrow-right"></i></a>
      <p style="margin:0">Sample address: 18 Ember Lane, Old Town · <span style="white-space:nowrap">+1 (555) 014-2200</span></p>
    </div>
  </div>`;
}

function footerHTML() {
  return `
  <footer class="site-footer">
    <div class="wrap">
      <div class="footer-top">
        <div class="footer-brand">
          <a class="logo" href="index.html">SAVORA</a>
          <p>More than food. It's an experience. A fire-led kitchen and an intimate dining room, open five evenings a week.</p>
          <div class="socials">${SOCIAL.map(s => `<a href="${s.href}" target="_blank" rel="noopener" aria-label="${s.label} (opens a new tab)"><i data-lucide="${s.icon}"></i></a>`).join('')}</div>
        </div>
        <div>
          <h3>Explore</h3>
          <ul>${NAV.map(n => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}<li><a href="reservations.html">Reservations</a></li></ul>
        </div>
        <div>
          <h3>Visit</h3>
          <address>18 Ember Lane, Old Town<br>Sample City 10001<br><span class="tiny muted">Sample address for demonstration</span></address>
          <ul style="margin-top:1rem">
            <li><span style="white-space:nowrap">+1 (555) 014-2200</span></li>
            <li><span>table@savora.example</span></li>
          </ul>
        </div>
        <div>
          <h3>Hours</h3>
          ${HOURS.map(([d, h]) => `<div class="hours-row"><span>${d}</span><span>${h}</span></div>`).join('')}
        </div>
      </div>
      <div class="footer-word" aria-hidden="true">SAVORA</div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} Savora. A demonstration website — dishes, prices and contact details are sample content.</span>
        <span>Visuals: real-time 3D renders &amp; illustrations</span>
      </div>
    </div>
  </footer>`;
}

export function mountLayout() {
  const top = document.getElementById('layout-top');
  const bottom = document.getElementById('layout-bottom');
  if (top) top.outerHTML = headerHTML();
  if (bottom) bottom.outerHTML = footerHTML();
  if (!document.querySelector('.curtain')) {
    const c = document.createElement('div');
    c.className = 'curtain';
    c.innerHTML = '<div class="curtain__logo">SAVORA</div>';
    document.body.appendChild(c);
  }
}

export function initNavigation(lenis) {
  const header = document.getElementById('site-header');
  const btn = document.querySelector('.burger-btn');
  const menu = document.getElementById('mobile-menu');
  const root = document.documentElement;
  if (!header) return;

  // Transparent → solid, hide on fast scroll-down, show on scroll-up.
  let lastY = window.scrollY;
  const hasHero = !!document.querySelector('[data-hero]');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-solid', !hasHero || y > 40);
    const hide = y > 400 && y > lastY + 4 && !root.classList.contains('menu-open');
    if (hide) header.classList.add('is-hidden');
    else if (y < lastY - 4 || y < 400) header.classList.remove('is-hidden');
    lastY = y;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  const setOpen = (open) => {
    root.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
    menu.inert = !open;
    header.classList.add('is-solid');
    if (open) { lenis?.stop(); menu.querySelector('a')?.focus({ preventScroll: true }); }
    else { lenis?.start(); onScroll(); }
  };
  menu.inert = true;
  btn?.addEventListener('click', () => setOpen(!root.classList.contains('menu-open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('menu-open')) { setOpen(false); btn.focus(); } });
  window.addEventListener('resize', () => { if (window.innerWidth > 1024 && root.classList.contains('menu-open')) setOpen(false); });

  initPageTransitions(() => setOpen(false));
}

// Curtain transition between pages. Same-document hash links and new-tab links are left alone.
function initPageTransitions(closeMenu) {
  const curtain = document.querySelector('.curtain');
  const reduce = prefersReduced();
  const gsap = window.gsap;

  if (curtain && gsap && !reduce && sessionStorage_get('savora-transition') === '1') {
    gsap.set(curtain, { scaleY: 1, transformOrigin: 'top' });
    gsap.to(curtain, { scaleY: 0, duration: 0.9, ease: 'expo.inOut', delay: 0.05 });
  }
  sessionStorage_set('savora-transition', '0');

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || /^(mailto:|tel:|https?:)/i.test(href)) return;
    const url = new URL(href, location.href);
    if (url.pathname === location.pathname && url.hash) { closeMenu(); return; } // same page, different view
    e.preventDefault();
    closeMenu();
    sessionStorage_set('savora-transition', '1');
    if (!curtain || !gsap || reduce) { location.href = url.href; return; }
    gsap.set(curtain, { transformOrigin: 'bottom' });
    gsap.to(curtain, { scaleY: 1, duration: 0.7, ease: 'expo.inOut', onComplete: () => { location.href = url.href; } });
  });

  // Back/forward cache: make sure the curtain is not left closed.
  window.addEventListener('pageshow', ev => { if (ev.persisted && curtain && gsap) gsap.set(curtain, { scaleY: 0 }); });
}

function sessionStorage_get(k) { try { return sessionStorage.getItem(k); } catch { return null; } }
function sessionStorage_set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* storage unavailable */ } }
