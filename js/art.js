// Illustrated atmosphere panels (inline SVG). Used where a photograph would go;
// every panel is labelled "Illustration" so it can be swapped for real photography.
// Usage: <figure class="frame" data-art="dining"></figure>

function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
const W = 1200, H = 900;

const defs = id => `
<defs>
  <radialGradient id="${id}-lamp" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd59a" stop-opacity=".95"/><stop offset=".35" stop-color="#e08a3c" stop-opacity=".35"/><stop offset="1" stop-color="#c8582a" stop-opacity="0"/></radialGradient>
  <linearGradient id="${id}-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".35"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></linearGradient>
  <linearGradient id="${id}-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1511"/><stop offset=".7" stop-color="#2a1f17"/><stop offset="1" stop-color="#120e0b"/></linearGradient>
  <linearGradient id="${id}-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a1e"/><stop offset="1" stop-color="#0d0b09"/></linearGradient>
  <radialGradient id="${id}-vig" cx="50%" cy="45%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></radialGradient>
  <radialGradient id="${id}-fire" cx="50%" cy="80%" r="60%"><stop offset="0" stop-color="#ffe2a8"/><stop offset=".3" stop-color="#ff8a2a"/><stop offset=".7" stop-color="#a8320f" stop-opacity=".6"/><stop offset="1" stop-color="#3a0f05" stop-opacity="0"/></radialGradient>
  <linearGradient id="${id}-copper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8a06a"/><stop offset=".5" stop-color="#a8532a"/><stop offset="1" stop-color="#4a1f0e"/></linearGradient>
  <linearGradient id="${id}-wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a2f1c"/><stop offset=".5" stop-color="#6b4528"/><stop offset="1" stop-color="#3a2416"/></linearGradient>
  <filter id="${id}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
  <filter id="${id}-soft"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="${id}-grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .4  0 0 0 0 .3  0 0 0 .08 0"/></filter>
</defs>`;

const finish = id => `<rect width="${W}" height="${H}" fill="url(#${id}-vig)"/><rect width="${W}" height="${H}" filter="url(#${id}-grain)"/>`;

function glass(x, y, s = 1, id) {
  return `<g transform="translate(${x} ${y}) scale(${s})" opacity=".85"><path d="M-14 -70 Q-16 -40 0 -32 Q16 -40 14 -70 Z" fill="#f3ece0" fill-opacity=".08" stroke="#f3ece0" stroke-opacity=".45" stroke-width="1.2"/><path d="M-12 -52 Q-12 -38 0 -34 Q12 -38 12 -52 Z" fill="#7a1222" fill-opacity=".8"/><line x1="0" y1="-32" x2="0" y2="0" stroke="#f3ece0" stroke-opacity=".45" stroke-width="1.2"/><ellipse cx="0" cy="0" rx="11" ry="2.5" fill="none" stroke="#f3ece0" stroke-opacity=".4"/><path d="M-10 -66 Q-9 -50 -4 -44" stroke="#fff" stroke-opacity=".5" fill="none" stroke-width="1"/></g>`;
}
function candle(x, y, id, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="-48" r="70" fill="url(#${id}-lamp)" opacity=".55"/><rect x="-6" y="-36" width="12" height="36" fill="#efe5d2"/><path d="M0 -58 Q5 -46 0 -38 Q-5 -46 0 -58Z" fill="#ffd88a"/><ellipse cx="0" cy="0" rx="16" ry="3" fill="#2a1f17"/></g>`;
}
function pendant(x, y, len, id, s = 1) {
  return `<g><line x1="${x}" y1="0" x2="${x}" y2="${y}" stroke="#8a7a64" stroke-opacity=".5"/><path d="M${x - 300 * s} ${H} L${x - 34 * s} ${y + 22 * s} L${x + 34 * s} ${y + 22 * s} L${x + 300 * s} ${H}Z" fill="url(#${id}-cone)" opacity=".35"/><circle cx="${x}" cy="${y + 26 * s}" r="${120 * s}" fill="url(#${id}-lamp)" opacity=".8"/><path d="M${x - 38 * s} ${y + 24 * s} Q${x} ${y - 30 * s} ${x + 38 * s} ${y + 24 * s}Z" fill="#b8945a"/><path d="M${x - 38 * s} ${y + 24 * s} L${x + 38 * s} ${y + 24 * s}" stroke="#ffe2b0" stroke-width="3"/>${void len || ''}</g>`;
}

const SCENES = {
  dining(id) {
    const r = rng(11); let s = `<rect width="${W}" height="${H}" fill="url(#${id}-wall)"/>`;
    // arched windows with night sky
    [220, 600, 980].forEach(x => { s += `<path d="M${x - 110} 560 V250 A110 110 0 0 1 ${x + 110} 250 V560Z" fill="#141a24"/><path d="M${x - 110} 560 V250 A110 110 0 0 1 ${x + 110} 250 V560Z" fill="none" stroke="#b8945a" stroke-opacity=".35" stroke-width="3"/><line x1="${x}" y1="140" x2="${x}" y2="560" stroke="#b8945a" stroke-opacity=".25"/><line x1="${x - 110}" y1="360" x2="${x + 110}" y2="360" stroke="#b8945a" stroke-opacity=".25"/>`; for (let i = 0; i < 8; i++) s += `<circle cx="${x - 90 + r() * 180}" cy="${180 + r() * 360}" r="${0.8 + r() * 1.4}" fill="#f3ece0" opacity="${0.3 + r() * 0.5}"/>`; });
    s += `<rect y="560" width="${W}" height="${H - 560}" fill="url(#${id}-floor)"/>`;
    [300, 900].forEach(x => { s += pendant(x, 210, 0, id, 1); });
    // chairs sit behind the tables
    [[90, 700], [510, 700], [690, 700], [1110, 700]].forEach(([x, y]) => { s += `<path d="M${x - 30} ${y - 120} Q${x} ${y - 140} ${x + 30} ${y - 120} V${y + 40} H${x - 30}Z" fill="#0f0c0a" opacity=".75"/>`; });
    // tables
    [[300, 690, 1], [900, 690, 1]].forEach(([x, y]) => { s += `<ellipse cx="${x}" cy="${y + 30}" rx="240" ry="40" fill="#000" opacity=".35" filter="url(#${id}-soft)"/><path d="M${x - 230} ${y} H${x + 230} L${x + 250} ${y + 120} H${x - 250}Z" fill="#e9dfcd" opacity=".92"/><path d="M${x - 230} ${y} H${x + 230}" stroke="#fff" stroke-opacity=".6"/>${candle(x, y - 2, id)}${glass(x - 120, y - 2, 1, id)}${glass(x + 110, y - 2, 1.05, id)}<ellipse cx="${x - 40}" cy="${y - 4}" rx="44" ry="8" fill="#f3ece0" opacity=".7"/>`; });
    return s + finish(id);
  },
  kitchen(id) {
    const r = rng(5); let s = `<rect width="${W}" height="${H}" fill="#120d0a"/>`;
    // brick hearth
    for (let row = 0; row < 18; row++) for (let c = 0; c < 14; c++) { const x = c * 92 + (row % 2) * 46 - 46, y = row * 50; s += `<rect x="${x}" y="${y}" width="88" height="46" fill="#2a1a12" opacity="${0.35 + r() * 0.4}"/>`; }
    s += `<path d="M300 900 V420 A300 300 0 0 1 900 420 V900Z" fill="#070504"/><ellipse cx="600" cy="760" rx="330" ry="260" fill="url(#${id}-fire)"/>`;
    for (let i = 0; i < 14; i++) { const x = 420 + i * 26 + r() * 10, h = 90 + r() * 160; s += `<path d="M${x - 18} 860 Q${x - 26} ${860 - h * 0.6} ${x + r() * 10} ${860 - h} Q${x + 24} ${860 - h * 0.5} ${x + 18} 860Z" fill="${r() > 0.5 ? '#ffb35a' : '#ff7a2a'}" opacity="${0.5 + r() * 0.4}" filter="url(#${id}-soft)"/>`; }
    s += `<path d="M300 900 V420 A300 300 0 0 1 900 420 V900" fill="none" stroke="#b8945a" stroke-opacity=".35" stroke-width="6"/>`;
    // logs
    s += `<rect x="440" y="840" width="320" height="34" rx="17" fill="#2a160c"/><rect x="480" y="815" width="240" height="30" rx="15" fill="#3a1f10" transform="rotate(-6 600 830)"/>`;
    // copper pans
    [[140, 220, 70], [140, 430, 55], [1060, 240, 78], [1060, 450, 52]].forEach(([x, y, rad]) => { s += `<line x1="${x}" y1="0" x2="${x}" y2="${y - rad}" stroke="#8a7a64" stroke-opacity=".5"/><circle cx="${x}" cy="${y}" r="${rad}" fill="url(#${id}-copper)"/><circle cx="${x - rad * 0.3}" cy="${y - rad * 0.3}" r="${rad * 0.25}" fill="#ffd8b0" opacity=".35" filter="url(#${id}-soft)"/><rect x="${x - 7}" y="${y - rad - 70}" width="14" height="72" fill="#6a3a1e"/>`; });
    // steam
    for (let i = 0; i < 4; i++) s += `<path d="M${520 + i * 50} 380 q-30 -60 0 -120 t0 -120" stroke="#f3ece0" stroke-opacity=".08" stroke-width="22" fill="none" filter="url(#${id}-blur)"/>`;
    return s + finish(id);
  },
  ingredients(id) {
    const r = rng(23); let s = `<rect width="${W}" height="${H}" fill="#14100d"/>`;
    s += `<rect x="140" y="120" width="920" height="660" rx="26" fill="url(#${id}-wood)"/><rect x="140" y="120" width="920" height="660" rx="26" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="8"/>`;
    for (let i = 0; i < 30; i++) { const y = 140 + i * 22; s += `<path d="M150 ${y} Q600 ${y + r() * 14 - 7} 1050 ${y}" stroke="#2a180d" stroke-opacity=".25" fill="none"/>`; }
    // tomatoes
    [[330, 300, 70, '#b8231c'], [430, 380, 56, '#d4421f'], [300, 440, 48, '#e9a228']].forEach(([x, y, rad, c]) => { s += `<circle cx="${x + 8}" cy="${y + 12}" r="${rad}" fill="#000" opacity=".35" filter="url(#${id}-soft)"/><circle cx="${x}" cy="${y}" r="${rad}" fill="${c}"/><circle cx="${x - rad * 0.35}" cy="${y - rad * 0.35}" r="${rad * 0.22}" fill="#fff" opacity=".35"/><path d="M${x - 14} ${y - rad + 6} l14 10 l14 -10 l-6 14 l8 8 l-16 -4 l-16 4 l8 -8z" fill="#3f6a22"/>`; });
    // garlic
    [[780, 300], [860, 340]].forEach(([x, y]) => { s += `<ellipse cx="${x + 6}" cy="${y + 10}" rx="46" ry="40" fill="#000" opacity=".3" filter="url(#${id}-soft)"/><path d="M${x} ${y - 52} Q${x + 52} ${y - 30} ${x + 44} ${y + 18} Q${x} ${y + 44} ${x - 44} ${y + 18} Q${x - 52} ${y - 30} ${x} ${y - 52}Z" fill="#efe6d6"/><path d="M${x} ${y - 52} Q${x + 10} ${y} ${x} ${y + 40} M${x} ${y - 52} Q${x - 22} ${y} ${x - 24} ${y + 30} M${x} ${y - 52} Q${x + 26} ${y} ${x + 26} ${y + 30}" stroke="#cbbfa8" fill="none"/>`; });
    // rosemary sprigs
    [[560, 560, -20], [640, 600, 15]].forEach(([x, y, rot]) => { s += `<g transform="translate(${x} ${y}) rotate(${rot})"><line x1="-150" y1="0" x2="150" y2="0" stroke="#5a4a2a" stroke-width="3"/>`; for (let i = -14; i <= 14; i++) s += `<ellipse cx="${i * 10}" cy="${i % 2 ? -10 : 10}" rx="12" ry="3" fill="#4f7a3a" transform="rotate(${i % 2 ? -35 : 35} ${i * 10} ${i % 2 ? -10 : 10})"/>`; s += `</g>`; });
    // salt and pepper
    for (let i = 0; i < 70; i++) s += `<rect x="${820 + r() * 160}" y="${560 + r() * 140}" width="${3 + r() * 5}" height="${3 + r() * 5}" fill="#f6f1e8" opacity=".85" transform="rotate(${r() * 90} ${900} ${620})"/>`;
    for (let i = 0; i < 50; i++) s += `<circle cx="${230 + r() * 180}" cy="${600 + r() * 120}" r="${3 + r() * 2}" fill="#1a120c"/>`;
    // knife
    s += `<g transform="rotate(-8 640 220)"><path d="M520 200 H860 Q880 210 860 222 H520Z" fill="#c8c6c0"/><path d="M520 200 H860" stroke="#fff" stroke-opacity=".7"/><rect x="420" y="196" width="104" height="30" rx="8" fill="#1a120c"/></g>`;
    return s + finish(id);
  },
  private(id) {
    const r = rng(41); let s = `<rect width="${W}" height="${H}" fill="url(#${id}-wall)"/>`;
    // wood paneling
    for (let i = 0; i < 10; i++) s += `<rect x="${i * 120 + 6}" y="80" width="108" height="420" fill="#21180f" stroke="#b8945a" stroke-opacity=".12"/>`;
    s += `<rect y="500" width="${W}" height="400" fill="url(#${id}-floor)"/>`;
    s += pendant(600, 140, 0, id, 1.4);
    s += `<ellipse cx="600" cy="690" rx="430" ry="110" fill="#000" opacity=".4" filter="url(#${id}-soft)"/><ellipse cx="600" cy="660" rx="420" ry="100" fill="#e9dfcd"/><ellipse cx="600" cy="660" rx="420" ry="100" fill="none" stroke="#fff" stroke-opacity=".4"/>`;
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const x = 600 + Math.cos(a) * 320, y = 660 + Math.sin(a) * 70; s += `<ellipse cx="${x}" cy="${y}" rx="38" ry="10" fill="#f6f0e4" stroke="#c8b89a" stroke-opacity=".6"/>`; if (Math.sin(a) < 0.2) s += glass(x + 30, y - 4, 0.8, id); }
    [500, 600, 700].forEach(x => { s += candle(x, 650 + r() * 6, id, 0.9); });
    s += `<path d="M560 640 Q600 610 640 640" stroke="#6a8a3a" stroke-width="6" fill="none"/>`;
    return s + finish(id);
  },
  occasion(id) {
    const r = rng(77); let s = `<rect width="${W}" height="${H}" fill="#110d0a"/>`;
    s += `<circle cx="600" cy="420" r="420" fill="url(#${id}-lamp)" opacity=".25"/>`;
    const coupe = (x, y) => `<g transform="translate(${x} ${y})"><path d="M-62 0 Q-60 34 0 38 Q60 34 62 0Z" fill="#e8c97a" fill-opacity=".55" stroke="#f3e3b8" stroke-opacity=".7"/><ellipse cx="0" cy="0" rx="62" ry="9" fill="#f6e2a8" fill-opacity=".6" stroke="#fff4d6" stroke-opacity=".7"/><line x1="0" y1="38" x2="0" y2="96" stroke="#f3ece0" stroke-opacity=".55" stroke-width="2"/><ellipse cx="0" cy="98" rx="30" ry="5" fill="none" stroke="#f3ece0" stroke-opacity=".5"/></g>`;
    const rows = [[600], [530, 670], [460, 600, 740], [390, 530, 670, 810]];
    rows.forEach((row, i) => row.forEach(x => { s += coupe(x, 240 + i * 120); }));
    for (let i = 0; i < 90; i++) s += `<circle cx="${r() * W}" cy="${r() * H}" r="${0.8 + r() * 2.2}" fill="#ffe2a8" opacity="${0.2 + r() * 0.6}"/>`;
    s += `<rect y="760" width="${W}" height="140" fill="#1a130e"/><path d="M0 760 H${W}" stroke="#b8945a" stroke-opacity=".4"/>`;
    return s + finish(id);
  },
  counter(id) {
    let s = `<rect width="${W}" height="${H}" fill="#100c09"/>`;
    // pass shelf with heat lamps
    s += `<rect x="0" y="120" width="${W}" height="18" fill="#3a2e24"/>`;
    [200, 450, 700, 950].forEach(x => { s += `<path d="M${x - 70} 138 H${x + 70} L${x + 40} 180 H${x - 40}Z" fill="#2a221b"/><path d="M${x - 260} 620 L${x - 40} 180 H${x + 40} L${x + 260} 620Z" fill="url(#${id}-cone)" opacity=".5"/><ellipse cx="${x}" cy="182" rx="40" ry="6" fill="#ffb36a"/>`; });
    // chefs hands silhouette suggestion: plates on the pass
    [260, 600, 940].forEach(x => { s += `<ellipse cx="${x}" cy="470" rx="120" ry="26" fill="#efe9df"/><ellipse cx="${x}" cy="466" rx="72" ry="14" fill="#e3dccf"/><ellipse cx="${x - 10}" cy="458" rx="34" ry="12" fill="#7a3a22"/><circle cx="${x + 30}" cy="452" r="7" fill="#5f8f3a"/><circle cx="${x - 40}" cy="462" r="5" fill="#c8582a"/>`; });
    s += `<rect y="520" width="${W}" height="60" fill="#2a2018"/><rect y="520" width="${W}" height="3" fill="#b8945a" opacity=".5"/><rect y="580" width="${W}" height="320" fill="#17110d"/>`;
    // stools
    [180, 420, 660, 900].forEach(x => { s += `<rect x="${x - 50}" y="640" width="100" height="16" rx="8" fill="#b8945a" opacity=".55"/><line x1="${x}" y1="656" x2="${x}" y2="880" stroke="#3a2e24" stroke-width="8"/><ellipse cx="${x}" cy="882" rx="50" ry="8" fill="#2a2018"/>`; });
    return s + finish(id);
  },
  cellar(id) {
    const r = rng(3); let s = `<rect width="${W}" height="${H}" fill="#0f0b08"/>`;
    s += `<path d="M0 0 H${W} V120 Q600 -40 0 120Z" fill="#1a130e"/>`;
    for (let row = 0; row < 9; row++) for (let c = 0; c < 15; c++) { const x = 60 + c * 75, y = 180 + row * 75; s += `<rect x="${x - 34}" y="${y - 34}" width="68" height="68" fill="#1d1510" stroke="#3a2a1e"/><circle cx="${x}" cy="${y}" r="20" fill="${r() > 0.2 ? '#2a0d10' : '#1a2a12'}"/><circle cx="${x}" cy="${y}" r="9" fill="${r() > 0.5 ? '#b8945a' : '#6a1a22'}" opacity="${0.5 + r() * 0.5}"/><circle cx="${x - 6}" cy="${y - 6}" r="3" fill="#fff" opacity=".25"/>`; }
    s += `<circle cx="600" cy="80" r="260" fill="url(#${id}-lamp)" opacity=".35"/>`;
    return s + finish(id);
  },
  chef(id) {
    let s = `<rect width="${W}" height="${H}" fill="#110d0a"/>`;
    s += `<circle cx="760" cy="260" r="380" fill="url(#${id}-lamp)" opacity=".3"/>`;
    // tweezers placing a herb on a plate, seen close
    s += `<ellipse cx="560" cy="700" rx="460" ry="120" fill="#000" opacity=".4" filter="url(#${id}-soft)"/><ellipse cx="560" cy="660" rx="450" ry="115" fill="#f1ebe1"/><ellipse cx="560" cy="650" rx="300" ry="72" fill="#e6dfd2"/>`;
    s += `<path d="M380 640 Q520 590 700 650 Q560 690 380 640Z" fill="#e8cf9a"/><ellipse cx="560" cy="630" rx="120" ry="40" fill="#5a2a18"/><ellipse cx="560" cy="618" rx="112" ry="30" fill="#7a3a22"/>`;
    for (let i = 0; i < 6; i++) s += `<circle cx="${430 + i * 44}" cy="${680 - (i % 2) * 8}" r="6" fill="#4a1a10"/>`;
    s += `<g transform="rotate(-28 760 300)"><rect x="600" y="296" width="420" height="10" rx="4" fill="#cfcdc6"/><rect x="600" y="312" width="420" height="10" rx="4" fill="#b9b6ae"/><path d="M600 296 L560 330 L600 322Z" fill="#cfcdc6"/></g>`;
    s += `<g transform="translate(590 560) rotate(-20)"><path d="M0 0 Q20 -26 44 -6 Q20 8 0 0Z" fill="#5f8f3a"/><path d="M0 0 L50 -4" stroke="#3f6a22"/></g>`;
    return s + finish(id);
  },
};

export function renderArt(root = document) {
  let n = 0;
  root.querySelectorAll('[data-art]:not([data-art-done])').forEach(el => {
    const kind = el.dataset.art; const fn = SCENES[kind]; if (!fn) return;
    const id = `art${Date.now().toString(36)}${n++}`;
    const label = el.dataset.artLabel || 'Illustration';
    el.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${el.dataset.alt || 'Illustration of the restaurant'}">${defs(id)}${fn(id)}</svg><span class="frame-tag">${label}</span>`);
    el.dataset.artDone = '1';
  });
}
export const ART_KINDS = Object.keys(SCENES);
