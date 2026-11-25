// Procedural 3D food models built from real geometry (lathe profiles, displaced meshes,
// instanced garnishes) with canvas-painted textures. No .glb files are required.
// Every builder returns a Dish: { root, layers[], explode(t), dispose(), size }.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/* ---------------- helpers ---------------- */
function rng(seed = 7) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function tex(size, draw, { srgb = true, repeat = 1 } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  return t;
}
/** Speckled noise texture: base colour plus n blotches of the given palette. */
function speckle(base, palette, n = 900, size = 256, rMin = 1, rMax = 5, seed = 3) {
  const r = rng(seed);
  return tex(size, (g, s) => {
    g.fillStyle = base; g.fillRect(0, 0, s, s);
    for (let i = 0; i < n; i++) {
      g.globalAlpha = 0.15 + r() * 0.55;
      g.fillStyle = palette[(r() * palette.length) | 0];
      g.beginPath(); g.arc(r() * s, r() * s, rMin + r() * (rMax - rMin), 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
  });
}
function gradientTex(stops, size = 256) {
  return tex(size, (g, s) => {
    const gr = g.createLinearGradient(0, 0, 0, s);
    stops.forEach(([o, c]) => gr.addColorStop(o, c));
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  });
}
const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...o });
const P = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.4, metalness: 0, ...o });
const shadowy = o => { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
function lathe(pts, seg = 72) { return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y)), seg); }
function mesh(geo, mat) { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; return m; }
function instanced(geo, mat, count, place) {
  const im = new THREE.InstancedMesh(geo, mat, count);
  const d = new THREE.Object3D();
  for (let i = 0; i < count; i++) { d.position.set(0, 0, 0); d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1); place(d, i); d.updateMatrix(); im.setMatrixAt(i, d.matrix); }
  im.castShadow = im.receiveShadow = true;
  return im;
}
function leafGeo(len = 0.3, wid = 0.13) {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.quadraticCurveTo(wid, len * 0.45, 0, len); s.quadraticCurveTo(-wid, len * 0.45, 0, 0);
  const g = new THREE.ShapeGeometry(s, 8);
  const p = g.attributes.position; // gentle curl
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, x * x * 2.2 + Math.sin(y / len * Math.PI) * 0.02); }
  g.computeVertexNormals();
  g.rotateX(-Math.PI / 2);
  return g;
}

/** Wrap layers in a centred root so explode() can separate them vertically. */
function makeDish(name, layers, { spacing = 0.5, footprint = 1.3 } = {}) {
  const root = new THREE.Group(); root.name = name;
  const inner = new THREE.Group(); root.add(inner);
  let top = 0;
  layers.forEach(l => { l.base = l.obj.position.y; inner.add(l.obj); top = Math.max(top, l.base + (l.h || 0)); });
  const n = layers.length;
  const dish = {
    name, root, inner, layers, height: top, footprint, spacing, progress: 0,
    explode(t) {
      this.progress = t;
      layers.forEach((l, i) => { l.obj.position.y = l.base + t * i * spacing; });
    },
    /** Height of the visual centre for a given explode amount (used for camera targets). */
    centerY(t = this.progress) { return top / 2 + t * (n - 1) * spacing / 2; },
    dispose() {
      root.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
        mats.forEach(m => { Object.values(m).forEach(v => v && v.isTexture && v.dispose()); m.dispose(); });
      });
    },
  };
  return dish;
}
const layer = (name, obj, h, label) => ({ name, obj, h, label: label || name });

/* ---------------- shared pieces ---------------- */
function plate({ r = 1.75, color = '#efe9df', rim = 0.55, depth = 0.1, dark = false } = {}) {
  const pts = [[0, 0], [r * 0.55, 0], [r * 0.6, 0.02], [r - rim, 0.05], [r - rim * 0.8, 0.07], [r * 0.97, depth + 0.04], [r, depth + 0.05], [r * 0.985, depth + 0.07], [r - rim * 0.85, 0.11], [r - rim, 0.09], [0, 0.085]];
  const mat = dark ? P('#262320', { roughness: 0.55, clearcoat: 0.2 }) : P(color, { roughness: 0.18, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  return mesh(lathe(pts, 96), mat);
}
function board(r = 1.6, h = 0.12) {
  const t = tex(512, (g, s) => {
    g.fillStyle = '#6b4526'; g.fillRect(0, 0, s, s);
    const rr = rng(11);
    for (let i = 0; i < 140; i++) { g.strokeStyle = `rgba(${40 + rr() * 40},${22 + rr() * 20},${10},${0.25 + rr() * 0.4})`; g.lineWidth = 0.5 + rr() * 2.5; g.beginPath(); const y = rr() * s; g.moveTo(0, y); g.bezierCurveTo(s * 0.3, y + rr() * 12 - 6, s * 0.6, y + rr() * 12 - 6, s, y + rr() * 8 - 4); g.stroke(); }
  });
  const g = new THREE.CylinderGeometry(r, r * 0.98, h, 96);
  return mesh(g, M('#ffffff', { map: t, roughness: 0.75 }));
}
function sauceDots(count, color, radius, y, seed = 5, size = 0.06) {
  const r = rng(seed);
  return instanced(new THREE.SphereGeometry(size, 16, 10), P(color, { roughness: 0.15, clearcoat: 1 }), count, (d, i) => {
    const a = (i / count) * Math.PI * 1.3 + 0.4 + r() * 0.2, rad = radius * (0.85 + r() * 0.15);
    d.position.set(Math.cos(a) * rad, y, Math.sin(a) * rad); const s = 0.6 + r() * 0.6; d.scale.set(s, s * 0.4, s);
  });
}
function microgreens(count, center, spread, y, seed = 9, color = '#5f8f3a') {
  const r = rng(seed); const g = new THREE.Group();
  g.add(instanced(leafGeo(0.16, 0.07), M(color, { side: THREE.DoubleSide, roughness: 0.5 }), count, (d) => {
    d.position.set(center.x + (r() - 0.5) * spread, y + r() * 0.12, center.z + (r() - 0.5) * spread);
    d.rotation.set(-0.6 + r() * 1.2, r() * Math.PI * 2, -0.4 + r() * 0.8);
  }));
  return g;
}

/* ---------------- BURGER ---------------- */
export function burger(o = {}) {
  const opt = { patties: 1, cheese: true, topping: 'tomato', bun: '#b8682a', ...o };
  const layers = [];
  let y = 0;
  const push = (name, obj, h, label) => { obj.position.y = y; layers.push(layer(name, obj, h, label)); y += h; };

  // bottom bun
  const crumb = speckle('#e9c58c', ['#d9ae6c', '#f3dcae', '#c99a5a'], 1400, 256, 0.5, 2.5, 21);
  const bunSide = P('#ffffff', { roughness: 0.5, clearcoat: 0.25, map: gradientTex([[0, '#c98a45'], [0.5, opt.bun], [1, '#8a4a1c']]) });
  const bottom = new THREE.Group();
  bottom.add(mesh(lathe([[0, 0], [0.92, 0], [1.0, 0.05], [1.04, 0.14], [1.02, 0.26], [0.97, 0.32], [0, 0.32]], 80), bunSide));
  const cut = mesh(new THREE.CircleGeometry(0.97, 80), M('#ffffff', { map: crumb, roughness: 0.9 })); cut.rotation.x = -Math.PI / 2; cut.position.y = 0.321; bottom.add(cut);
  push('bottomBun', bottom, 0.33, 'Toasted brioche base');

  for (let p = 0; p < opt.patties; p++) {
    // patty — irregular seared disc
    const pg = new THREE.CylinderGeometry(1.1, 1.12, 0.36, 96, 6);
    const pos = pg.attributes.position, r = rng(31 + p);
    const seeds = Array.from({ length: 12 }, () => r());
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), yy = pos.getY(i); const a = Math.atan2(z, x); const rad = Math.hypot(x, z);
      if (rad > 0.05) {
        let n = 0; seeds.forEach((s, k) => { n += Math.sin(a * (k + 3) + s * 6.28) * 0.012; });
        const edge = 1 - Math.pow(Math.abs(yy) / 0.18, 4) * 0.12;
        const k = (1 + n) * edge; pos.setX(i, x * k); pos.setZ(i, z * k);
      }
      if (Math.abs(yy) > 0.17) pos.setY(i, yy + (Math.sin(x * 9) * Math.cos(z * 7)) * 0.012);
    }
    pg.computeVertexNormals();
    const char = speckle('#5a2f1a', ['#2a140a', '#7a4325', '#3b1d0e', '#8f5532'], 2600, 256, 0.6, 3.4, 41 + p); char.repeat.set(4, 1);
    const patty = mesh(pg, M('#ffffff', { map: char, bumpMap: char, bumpScale: 2.5, roughness: 0.72 }));
    patty.position.y = 0.18;
    const pw = new THREE.Group(); pw.add(patty);
    push(p ? 'patty2' : 'patty', pw, 0.36, p ? 'Second smoked patty' : 'Dry-aged beef patty');

    if (opt.cheese) {
      // melted cheese square draping over the patty edge
      const cg = new THREE.PlaneGeometry(1.95, 1.95, 48, 48); cg.rotateX(-Math.PI / 2); cg.rotateY(Math.PI / 4 + p * 0.3);
      const cp = cg.attributes.position;
      for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), z = cp.getZ(i); const d = Math.hypot(x, z); if (d > 0.98) cp.setY(i, -Math.pow(d - 0.98, 1.4) * 1.3); }
      cg.computeVertexNormals();
      const cheese = mesh(cg, P('#f5a623', { roughness: 0.3, side: THREE.DoubleSide, sheen: 0.4, sheenColor: new THREE.Color('#ffd27a'), emissive: '#5a2a00', emissiveIntensity: 0.12 }));
      cheese.position.y = 0.02;
      const cw = new THREE.Group(); cw.add(cheese);
      push(p ? 'cheese2' : 'cheese', cw, 0.05, 'Aged cheddar');
    }
  }

  if (opt.topping === 'mushroom') {
    const r = rng(77); const g = new THREE.Group();
    const mg = new THREE.SphereGeometry(0.34, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.2); mg.scale(1, 0.32, 1);
    g.add(instanced(mg, M('#7b5434', { roughness: 0.55 }), 7, (d, i) => { const a = i / 7 * Math.PI * 2; d.position.set(Math.cos(a) * 0.55, 0.02, Math.sin(a) * 0.55); d.rotation.set(r() * 0.3, r() * 6, r() * 0.3); }));
    push('mushroom', g, 0.1, 'Roasted king oyster');
  } else {
    // tomato slices with painted cross-section
    const face = tex(256, (g, s) => {
      g.fillStyle = '#b8231c'; g.fillRect(0, 0, s, s);
      g.fillStyle = '#e04a33'; g.beginPath(); g.arc(s / 2, s / 2, s * 0.44, 0, 7); g.fill();
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; g.fillStyle = '#f08a56'; g.beginPath(); g.ellipse(s / 2 + Math.cos(a) * s * 0.22, s / 2 + Math.sin(a) * s * 0.22, s * 0.11, s * 0.07, a, 0, 7); g.fill(); g.fillStyle = '#f6d26a'; for (let q = 0; q < 5; q++) { g.beginPath(); g.arc(s / 2 + Math.cos(a) * s * (0.18 + q * 0.02), s / 2 + Math.sin(a) * s * (0.18 + q * 0.02) + (q % 2 ? 4 : -4), 3, 0, 7); g.fill(); } }
      g.fillStyle = '#c93224'; g.beginPath(); g.arc(s / 2, s / 2, s * 0.07, 0, 7); g.fill();
    });
    const tg = new THREE.CylinderGeometry(0.5, 0.5, 0.09, 48);
    const side = P('#b11e17', { roughness: 0.25, clearcoat: 0.6 }), cap = P('#ffffff', { map: face, roughness: 0.3, clearcoat: 0.5 });
    const g = new THREE.Group();
    [0, 1, 2].forEach(i => { const a = i / 3 * Math.PI * 2 + 0.4; const m = mesh(tg, [side, cap, cap]); m.position.set(Math.cos(a) * 0.46, 0.045 + i * 0.012, Math.sin(a) * 0.46); m.rotation.y = a; g.add(m); });
    push('tomato', g, 0.1, 'Heirloom tomato');
  }

  // lettuce — ruffled ring
  const lg = new THREE.RingGeometry(0.0001, 1.3, 180, 10); lg.rotateX(-Math.PI / 2);
  const lp = lg.attributes.position;
  for (let i = 0; i < lp.count; i++) {
    const x = lp.getX(i), z = lp.getZ(i); const rad = Math.hypot(x, z), a = Math.atan2(z, x); const e = Math.pow(rad / 1.3, 2.2);
    lp.setY(i, Math.sin(a * 14) * 0.07 * e + Math.sin(a * 31 + 1.3) * 0.035 * e - e * 0.04);
    const k = 1 + Math.sin(a * 7) * 0.05 * e; lp.setX(i, x * k); lp.setZ(i, z * k);
  }
  lg.computeVertexNormals();
  const veins = tex(256, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2); gr.addColorStop(0, '#d6e8a6'); gr.addColorStop(0.6, '#7fb446'); gr.addColorStop(1, '#3f7a26'); g.fillStyle = gr; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(230,245,190,.5)'; for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; g.beginPath(); g.moveTo(s / 2, s / 2); g.lineTo(s / 2 + Math.cos(a) * s / 2, s / 2 + Math.sin(a) * s / 2); g.stroke(); } });
  const lettuce = mesh(lg, P('#ffffff', { map: veins, roughness: 0.45, side: THREE.DoubleSide, sheen: 0.5, sheenColor: new THREE.Color('#cfe8a0') }));
  lettuce.position.y = 0.06;
  const lw = new THREE.Group(); lw.add(lettuce);
  push('lettuce', lw, 0.12, 'Butter lettuce');

  // top bun — glazed dome with sesame
  const R = 1.06, H = 0.78, ptsTop = [[0, 0], [R * 0.95, 0], [R, 0.04]];
  for (let i = 1; i <= 20; i++) { const t = i / 20 * Math.PI / 2; ptsTop.push([R * Math.cos(t) * (1 + 0.03 * Math.sin(t * 2)), 0.04 + H * Math.pow(Math.sin(t), 0.85)]); }
  const topG = lathe(ptsTop, 96);
  const glaze = gradientTex([[0, '#e8b46c'], [0.18, '#c97c36'], [0.55, '#9a4f1d'], [1, '#7a3a14']]);
  const top = new THREE.Group();
  top.add(mesh(topG, P('#ffffff', { map: glaze, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.35 })));
  const r = rng(99), seedGeo = new THREE.SphereGeometry(0.038, 10, 6); seedGeo.scale(1, 0.42, 0.62);
  const up = new THREE.Vector3(0, 1, 0), nrm = new THREE.Vector3(), q = new THREE.Quaternion(), qs = new THREE.Quaternion();
  top.add(instanced(seedGeo, M('#f2e3c0', { roughness: 0.5 }), 110, d => {
    const t = 0.25 + r() * 1.2, ph = r() * Math.PI * 2;
    const x = R * Math.cos(t) * Math.cos(ph), z = R * Math.cos(t) * Math.sin(ph), yy = 0.04 + H * Math.pow(Math.sin(t), 0.85);
    d.position.set(x * 0.995, yy + 0.005, z * 0.995);
    nrm.set(x / (R * R), yy / (H * H), z / (R * R)).normalize();
    q.setFromUnitVectors(up, nrm); qs.setFromAxisAngle(up, r() * 6.28); d.quaternion.copy(q.multiply(qs));
  }));
  push('topBun', top, H + 0.04, 'Sesame brioche crown');

  return makeDishReturn(layers, 'burger', 0.8);
}
// small indirection so builders read cleanly
function makeDishReturn(layers, name, spacing, footprint) { const d = makeDish(name, layers, { spacing, footprint }); shadowy(d.root); return d; }

/* ---------------- PIZZA ---------------- */
export function pizza(o = {}) {
  const opt = { style: 'diavola', ...o };
  const layers = [];
  const b = board(1.62, 0.12); b.position.y = 0.06; const bw = new THREE.Group(); bw.add(b); bw.position.y = 0;
  layers.push(layer('board', bw, 0.12, 'Olive-wood board'));

  const crustT = speckle('#d9a45e', ['#8a4a1c', '#3a1d0c', '#f0cc8a', '#b9773a'], 900, 256, 0.6, 6, 13);
  const dough = mesh(lathe([[0, 0], [1.26, 0], [1.33, 0.04], [1.36, 0.12], [1.32, 0.2], [1.24, 0.21], [1.16, 0.15], [1.12, 0.09], [0, 0.08]], 96), M('#ffffff', { map: crustT, bumpMap: crustT, bumpScale: 3, roughness: 0.8 }));
  const dw = new THREE.Group(); dw.add(dough); dw.position.y = 0.12;
  layers.push(layer('dough', dw, 0.1, '72-hour fermented dough'));

  const sauceCol = opt.style === 'bianca' ? '#efe2c6' : '#a8261a';
  const sauce = mesh(new THREE.CircleGeometry(1.13, 80), P(sauceCol, { roughness: 0.3, clearcoat: 0.5 })); sauce.rotation.x = -Math.PI / 2; sauce.position.y = 0.002;
  const sw = new THREE.Group(); sw.add(sauce); sw.position.y = 0.2;
  layers.push(layer('sauce', sw, 0.01, opt.style === 'bianca' ? 'Fior di latte cream' : 'San Marzano tomato'));

  const melt = tex(512, (g, s) => {
    g.clearRect(0, 0, s, s); const r = rng(17);
    for (let i = 0; i < 46; i++) { const x = s / 2 + (r() - 0.5) * s * 0.8, y = s / 2 + (r() - 0.5) * s * 0.8; if (Math.hypot(x - s / 2, y - s / 2) > s * 0.45) continue; const rad = 18 + r() * 40; const gr = g.createRadialGradient(x, y, 2, x, y, rad); gr.addColorStop(0, 'rgba(255,248,226,1)'); gr.addColorStop(0.6, 'rgba(246,224,170,.95)'); gr.addColorStop(0.85, 'rgba(214,150,70,.8)'); gr.addColorStop(1, 'rgba(200,130,60,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); }
  }, { repeat: 1 });
  const cheese = mesh(new THREE.CircleGeometry(1.12, 80), P('#ffffff', { map: melt, transparent: true, roughness: 0.35, clearcoat: 0.4, depthWrite: false })); cheese.rotation.x = -Math.PI / 2;
  const chw = new THREE.Group(); chw.add(cheese); chw.position.y = 0.215;
  layers.push(layer('cheese', chw, 0.01, 'Buffalo mozzarella'));

  const tp = new THREE.Group(); const r = rng(23);
  if (opt.style === 'diavola') {
    const pep = tex(128, (g, s) => { g.fillStyle = '#8f1d14'; g.fillRect(0, 0, s, s); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,${180 + r() * 50},${150},.55)`; g.beginPath(); g.arc(r() * s, r() * s, 1 + r() * 4, 0, 7); g.fill(); } g.strokeStyle = '#4a0d08'; g.lineWidth = 10; g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 5, 0, 7); g.stroke(); });
    const pg = new THREE.CylinderGeometry(0.17, 0.17, 0.025, 32);
    const pp = pg.attributes.position; for (let i = 0; i < pp.count; i++) { const d = Math.hypot(pp.getX(i), pp.getZ(i)); pp.setY(i, pp.getY(i) + d * d * 0.6); } pg.computeVertexNormals();
    tp.add(instanced(pg, P('#ffffff', { map: pep, roughness: 0.3, clearcoat: 0.8 }), 13, (d, i) => { const ring = i < 1 ? 0 : i < 6 ? 0.45 : 0.85; const n = i < 1 ? 1 : i < 6 ? 5 : 7; const k = i < 1 ? 0 : i < 6 ? i - 1 : i - 6; const a = k / n * Math.PI * 2 + ring; d.position.set(Math.cos(a) * ring, 0.015, Math.sin(a) * ring); d.rotation.y = r() * 6; }));
    tp.add(sauceDots(10, '#d9542a', 0.7, 0.01, 4, 0.035));
  } else if (opt.style === 'bianca') {
    const mg = new THREE.SphereGeometry(0.16, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2.4); mg.scale(1, 0.3, 0.7);
    tp.add(instanced(mg, M('#6d5440', { roughness: 0.5 }), 16, d => { const a = r() * 6.28, rad = 0.15 + r() * 0.85; d.position.set(Math.cos(a) * rad, 0.01, Math.sin(a) * rad); d.rotation.y = r() * 6; }));
    const tr = new THREE.CircleGeometry(0.07, 14);
    tp.add(instanced(tr, M('#2a2018', { roughness: 0.8, side: THREE.DoubleSide }), 30, d => { const a = r() * 6.28, rad = r() * 0.95; d.position.set(Math.cos(a) * rad, 0.03, Math.sin(a) * rad); d.rotation.set(-Math.PI / 2 + r() * 0.3, 0, r()); }));
  } else {
    const bur = new THREE.SphereGeometry(0.28, 24, 16); bur.scale(1, 0.45, 1);
    tp.add(instanced(bur, P('#f7f2e6', { roughness: 0.35, sheen: 0.6 }), 4, (d, i) => { const a = i / 4 * 6.28 + 0.5; d.position.set(Math.cos(a) * 0.55, 0.03, Math.sin(a) * 0.55); }));
  }
  if (opt.style !== 'bianca') tp.add(instanced(leafGeo(0.26, 0.12), M('#3f7d2a', { roughness: 0.4, side: THREE.DoubleSide }), 7, d => { const a = r() * 6.28, rad = 0.2 + r() * 0.7; d.position.set(Math.cos(a) * rad, 0.05, Math.sin(a) * rad); d.rotation.set(0.1, r() * 6.28, 0); }));
  tp.position.y = 0.22;
  layers.push(layer('toppings', tp, 0.08, opt.style === 'diavola' ? 'Spicy salami & basil' : opt.style === 'bianca' ? 'Wild mushrooms & black truffle' : 'Burrata & basil'));
  return makeDishReturn(layers, 'pizza', 0.42, 1.6);
}

/* ---------------- DESSERT (layered entremet) ---------------- */
export function entremet(o = {}) {
  const opt = { glaze: '#2a140b', mousse: '#4a2a1a', sponge: '#5b3622', cream: '#efe2cc', style: 'chocolate', ...o };
  const layers = [];
  const pl = plate({ r: 1.5, rim: 0.45 }); const pw = new THREE.Group(); pw.add(pl);
  layers.push(layer('plate', pw, 0.12, 'Hand-thrown plate'));
  const R = 0.82;
  const stack = (name, h, col, label, extra = {}) => { const m = mesh(new THREE.CylinderGeometry(R, R, h, 96), M(extra.map ? '#ffffff' : col, { roughness: 0.7, ...extra })); m.position.y = h / 2; const g = new THREE.Group(); g.add(m); g.position.y = layers.reduce((a, l) => a + l.h, 0); layers.push(layer(name, g, h, label)); };
  stack('base', 0.12, opt.sponge, opt.style === 'cheesecake' ? 'Spiced biscuit base' : 'Hazelnut sablé', { map: speckle(opt.sponge, ['#2e1a0e', '#7a4c2c'], 600, 128, 0.5, 2, 4) });
  stack('cream', 0.14, opt.cream, opt.style === 'cheesecake' ? 'Vanilla cream cheese' : 'Salted caramel crémeux');
  stack('mousse', 0.34, opt.mousse, opt.style === 'cheesecake' ? 'Basque custard' : '70% chocolate mousse');

  // glaze cap with drips
  const gz = new THREE.Group();
  const capG = lathe([[0, 0.06], [R * 0.9, 0.055], [R + 0.012, 0.03], [R + 0.014, 0]], 96);
  const glazeMat = P(opt.glaze, { roughness: opt.style === 'cheesecake' ? 0.6 : 0.08, clearcoat: opt.style === 'cheesecake' ? 0.1 : 1, clearcoatRoughness: 0.05 });
  gz.add(mesh(capG, glazeMat));
  const r = rng(61);
  gz.add(instanced(new THREE.CapsuleGeometry(0.055, 0.1, 6, 12), glazeMat, 22, (d, i) => { const a = i / 22 * Math.PI * 2 + r() * 0.12; const len = 0.5 + r() * 1.4; d.position.set(Math.cos(a) * (R + 0.006), -0.05 * len, Math.sin(a) * (R + 0.006)); d.scale.set(1, len, 0.45); d.rotation.y = -a; }));
  gz.position.y = layers.reduce((a, l) => a + l.h, 0);
  layers.push(layer('glaze', gz, 0.07, opt.style === 'cheesecake' ? 'Caramelised top' : 'Mirror glaze'));

  const gar = new THREE.Group();
  if (opt.style === 'cheesecake') {
    gar.add(instanced(new THREE.SphereGeometry(0.09, 16, 12), P('#3b1238', { roughness: 0.15, clearcoat: 1 }), 9, (d, i) => { d.position.set(-0.2 + (i % 3) * 0.14 + r() * 0.03, 0.08 + (i > 5 ? 0.1 : 0), -0.1 + ((i / 3) | 0) * 0.12); }));
  } else {
    const berry = new THREE.IcosahedronGeometry(0.11, 3); const bp = berry.attributes.position; for (let i = 0; i < bp.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(bp, i); const k = 1 + 0.07 * Math.sin(v.x * 80) * Math.sin(v.y * 80) * Math.sin(v.z * 80); bp.setXYZ(i, v.x * k, v.y * k * 1.15, v.z * k); } berry.computeVertexNormals();
    gar.add(instanced(berry, P('#b5122c', { roughness: 0.35, sheen: 0.8, sheenColor: new THREE.Color('#ff6b7d') }), 4, (d, i) => { const a = i / 4 * 2 + 0.5; d.position.set(Math.cos(a) * 0.32, 0.1, Math.sin(a) * 0.32); }));
    const leaf = new THREE.PlaneGeometry(0.22, 0.16, 6, 6); const lp = leaf.attributes.position; for (let i = 0; i < lp.count; i++) lp.setZ(i, Math.sin(lp.getX(i) * 20) * 0.015); leaf.computeVertexNormals();
    const gold = mesh(leaf, M('#d4a84a', { metalness: 1, roughness: 0.25, side: THREE.DoubleSide })); gold.position.set(-0.1, 0.14, 0.05); gold.rotation.set(-1.1, 0.4, 0.3); gar.add(gold);
    const tuile = new THREE.CylinderGeometry(0.5, 0.5, 0.25, 32, 1, true, 0, 1.4); const tu = mesh(tuile, M('#3a1c0e', { side: THREE.DoubleSide, roughness: 0.4 })); tu.position.set(0.25, 0.22, -0.32); tu.rotation.set(0.3, 0.6, 1.2); tu.scale.set(0.6, 1, 0.6); gar.add(tu);
  }
  gar.position.y = layers.reduce((a, l) => a + l.h, 0);
  layers.push(layer('garnish', gar, 0.2, opt.style === 'cheesecake' ? 'Port-poached cherries' : 'Raspberries & gold leaf'));
  return makeDishReturn(layers, 'dessert', 0.42, 1.5);
}

/* ---------------- TART ---------------- */
export function tart() {
  const layers = [];
  const pl = plate({ r: 1.5, rim: 0.45, dark: true }); const pw = new THREE.Group(); pw.add(pl); layers.push(layer('plate', pw, 0.12, 'Slate plate'));
  const pts = []; const R = 0.95; pts.push([0, 0], [R - 0.03, 0]);
  for (let i = 0; i <= 6; i++) pts.push([R + Math.sin(i / 6 * Math.PI) * 0.03, i / 6 * 0.26]);
  pts.push([R - 0.08, 0.27], [R - 0.08, 0.1], [0, 0.1]);
  const shell = mesh(lathe(pts, 120), M('#ffffff', { roughness: 0.7, map: speckle('#e2b071', ['#b9813f', '#f3d39a'], 600, 128, 0.5, 2, 8) }));
  const sp = shell.geometry.attributes.position; for (let i = 0; i < sp.count; i++) { const x = sp.getX(i), z = sp.getZ(i); const a = Math.atan2(z, x); const k = 1 + Math.abs(Math.sin(a * 16)) * 0.025; sp.setX(i, x * k); sp.setZ(i, z * k); } shell.geometry.computeVertexNormals();
  const sw = new THREE.Group(); sw.add(shell); sw.position.y = 0.12; layers.push(layer('shell', sw, 0.27, 'Almond pâte sucrée'));
  const curd = mesh(new THREE.CylinderGeometry(R - 0.09, R - 0.09, 0.16, 96), P('#f2c230', { roughness: 0.12, clearcoat: 1 })); curd.position.y = 0.08;
  const cw = new THREE.Group(); cw.add(curd); cw.position.y = 0.3; layers.push(layer('curd', cw, 0.16, 'Yuzu & lemon curd'));
  const mer = []; for (let i = 0; i <= 12; i++) { const t = i / 12; mer.push([0.12 * Math.pow(1 - t, 0.9), t * 0.24]); }
  const merG = lathe(mer, 24); const r = rng(5);
  const tw = new THREE.Group();
  tw.add(instanced(merG, M('#f7ecd9', { roughness: 0.55, map: gradientTex([[0, '#f7ecd9'], [0.6, '#f2d9b0'], [1, '#c58a4a']]) }), 14, (d, i) => { const a = i / 14 * Math.PI * 2; const rad = i % 2 ? 0.62 : 0.42; d.position.set(Math.cos(a) * rad, 0, Math.sin(a) * rad); d.rotation.y = r() * 3; const s = 0.8 + r() * 0.4; d.scale.set(s, s, s); }));
  tw.add(instanced(leafGeo(0.14, 0.06), M('#6a9a3a', { side: THREE.DoubleSide }), 5, d => { d.position.set((r() - 0.5) * 0.3, 0.05, (r() - 0.5) * 0.3); d.rotation.y = r() * 6; }));
  tw.position.y = 0.46; layers.push(layer('meringue', tw, 0.24, 'Torched meringue'));
  return makeDishReturn(layers, 'tart', 0.4, 1.5);
}

/* ---------------- PLATED MAIN (steak / fish / octopus) ---------------- */
export function plated(o = {}) {
  const opt = { protein: 'steak', puree: '#e8cf9a', sauce: '#4a1a10', dark: false, ...o };
  const layers = [];
  const pw = new THREE.Group(); pw.add(plate({ r: 1.85, rim: 0.6, dark: opt.dark || opt.protein === 'octopus' })); layers.push(layer('plate', pw, 0.1, 'Porcelain plate'));

  const sw = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.95, 0, 0.35), new THREE.Vector3(-0.3, 0, 0.55), new THREE.Vector3(0.4, 0, 0.45), new THREE.Vector3(0.95, 0, 0.1)]);
  const swoosh = new THREE.TubeGeometry(curve, 64, 0.13, 16, false);
  const sp = swoosh.attributes.position; for (let i = 0; i < sp.count; i++) { const tt = Math.floor(i / 17) / 64; sp.setY(i, sp.getY(i) * 0.3); const taper = Math.sin(tt * Math.PI) * 0.8 + 0.2; const c = curve.getPointAt(Math.min(tt, 1)); sp.setX(i, c.x + (sp.getX(i) - c.x) * taper); sp.setZ(i, c.z + (sp.getZ(i) - c.z) * taper); } swoosh.computeVertexNormals();
  sw.add(mesh(swoosh, P(opt.puree, { roughness: 0.3, clearcoat: 0.6 })));
  sw.add(sauceDots(7, opt.sauce, 0.95, 0.0, 12, 0.07));
  sw.position.y = 0.12; layers.push(layer('puree', sw, 0.04, opt.protein === 'fish' ? 'Celeriac purée & dashi butter' : opt.protein === 'octopus' ? 'Smoked paprika aioli' : 'Smoked potato purée & jus'));

  const pr = new THREE.Group();
  if (opt.protein === 'steak') {
    const face = tex(256, (g, s) => { const gr = g.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, '#3a1a0d'); gr.addColorStop(0.08, '#7a3a22'); gr.addColorStop(0.16, '#a8483e'); gr.addColorStop(0.3, '#c2525a'); gr.addColorStop(0.5, '#cf5f68'); gr.addColorStop(0.7, '#c2525a'); gr.addColorStop(0.84, '#a8483e'); gr.addColorStop(0.92, '#7a3a22'); gr.addColorStop(1, '#3a1a0d'); g.fillStyle = gr; g.fillRect(0, 0, s, s); const r = rng(2); for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(245,215,200,.35)'; g.lineWidth = 1; g.beginPath(); const y = s * 0.2 + r() * s * 0.6; g.moveTo(r() * s, y); g.lineTo(r() * s, y + r() * 10 - 5); g.stroke(); } });
    const crust = M('#ffffff', { map: speckle('#3b1c0e', ['#1a0b05', '#6a3418', '#c08a52'], 1500, 256, 0.5, 3, 7), roughness: 0.6 });
    const cutM = P('#ffffff', { map: face, roughness: 0.4, clearcoat: 0.4 });
    const bg = new RoundedBoxGeometry(0.2, 0.42, 0.95, 3, 0.035);
    for (let i = 0; i < 6; i++) { const m = mesh(bg, [cutM, cutM, crust, crust, crust, crust]); m.position.set(-0.62 + i * 0.25, 0.16, -0.12 + i * 0.015); m.rotation.set(0, 0.3, -0.95); pr.add(m); }
  } else if (opt.protein === 'fish') {
    const fg = new THREE.BoxGeometry(1.25, 0.34, 0.62, 24, 6, 12); const fp = fg.attributes.position;
    for (let i = 0; i < fp.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(fp, i); const nx = v.x / 0.625, nz = v.z / 0.31, ny = v.y / 0.17; const round = 1 - 0.18 * (nx * nx + nz * nz) * Math.max(ny, 0); fp.setY(i, v.y * round + (ny > 0 ? Math.sin(v.x * 9) * 0.008 : 0)); const pinch = 1 - 0.25 * Math.pow(Math.abs(nx), 3); fp.setZ(i, v.z * pinch); }
    fg.computeVertexNormals();
    const flake = tex(256, (g, s) => { const gr = g.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, '#5a2a0e'); gr.addColorStop(0.35, '#b06a2a'); gr.addColorStop(0.55, '#f1e3cf'); gr.addColorStop(1, '#f6ede0'); g.fillStyle = gr; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(255,255,255,.35)'; for (let x = 0; x < s; x += 14) { g.beginPath(); g.moveTo(x, s * 0.45); g.quadraticCurveTo(x + 8, s * 0.7, x - 4, s); g.stroke(); } });
    const fish = mesh(fg, P('#ffffff', { map: flake, roughness: 0.25, clearcoat: 1 })); fish.position.y = 0.17; fish.rotation.y = 0.3; pr.add(fish);
  } else {
    const r = rng(15);
    for (let k = 0; k < 2; k++) {
      const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; const a = t * Math.PI * 2.4 + k * 2; const rad = 0.9 * (1 - t * 0.85); pts.push(new THREE.Vector3(Math.cos(a) * rad + (k ? 0.2 : -0.2), 0.12 + Math.sin(t * Math.PI) * 0.12, Math.sin(a) * rad)); }
      const c = new THREE.CatmullRomCurve3(pts); const tg = new THREE.TubeGeometry(c, 120, 0.13, 18, false); const tp = tg.attributes.position;
      for (let i = 0; i < tp.count; i++) { const ti = Math.floor(i / 19) / 120; const cp = c.getPointAt(Math.min(ti, 1)); const s = 1 - ti * 0.82; tp.setXYZ(i, cp.x + (tp.getX(i) - cp.x) * s, cp.y + (tp.getY(i) - cp.y) * s, cp.z + (tp.getZ(i) - cp.z) * s); }
      tg.computeVertexNormals();
      pr.add(mesh(tg, P('#ffffff', { map: speckle('#8a2f2a', ['#3a0f0b', '#c25a3c', '#e8a07a'], 1200, 256, 0.6, 3, 31 + k), roughness: 0.4, clearcoat: 0.6 })));
    }
    void r;
  }
  pr.position.y = 0.12; layers.push(layer('protein', pr, 0.42, opt.protein === 'fish' ? 'Miso-glazed black cod' : opt.protein === 'octopus' ? 'Charred Galician octopus' : 'Dry-aged ribeye, sliced'));
  const gw = new THREE.Group(); gw.add(microgreens(22, new THREE.Vector3(0.05, 0, -0.1), 0.6, 0.0, 3)); gw.add(sauceDots(5, '#e9e2c9', 0.6, -0.36, 40, 0.04));
  gw.position.y = 0.52; layers.push(layer('garnish', gw, 0.12, 'Herb shoots & pickled shallot'));
  return makeDishReturn(layers, 'plated', 0.42, 1.85);
}

/* ---------------- BOWL (risotto / pasta / soup) ---------------- */
export function bowl(o = {}) {
  const opt = { fill: 'risotto', ...o };
  const layers = [];
  const outer = P('#ffffff', { roughness: 0.6, map: speckle('#2b2825', ['#1a1816', '#3e3a35', '#8a7f70'], 800, 256, 0.3, 1.4, 6) });
  const inner = P('#efe8dc', { roughness: 0.25, clearcoat: 0.6, side: THREE.BackSide });
  const pts = [[0, 0], [0.55, 0], [0.6, 0.04], [1.15, 0.38], [1.42, 0.6], [1.45, 0.64]];
  const g = new THREE.Group(); g.add(mesh(lathe(pts, 96), outer));
  const innerPts = [[1.43, 0.64], [1.38, 0.6], [1.1, 0.4], [0.55, 0.1], [0, 0.1]];
  g.add(mesh(lathe(innerPts.map(([r, y]) => [r, y]).reverse(), 96), inner));
  layers.push(layer('bowl', g, 0.3, 'Stoneware bowl'));
  const f = new THREE.Group(); const r = rng(19);
  if (opt.fill === 'risotto') {
    const base = mesh(new THREE.CircleGeometry(1.08, 64), P('#e3c98e', { roughness: 0.4, clearcoat: 0.3 })); base.rotation.x = -Math.PI / 2; f.add(base);
    const grain = new THREE.SphereGeometry(0.035, 8, 6); grain.scale(1, 0.6, 2.2);
    f.add(instanced(grain, P('#efdcae', { roughness: 0.3, clearcoat: 0.5 }), 520, d => { const a = r() * 6.28, rad = Math.sqrt(r()) * 1.02; d.position.set(Math.cos(a) * rad, 0.01 + (1 - rad) * 0.06 + r() * 0.02, Math.sin(a) * rad); d.rotation.set(r(), r() * 6, r()); }));
    const mg = new THREE.SphereGeometry(0.16, 16, 8, 0, 6.28, 0, 1.3); mg.scale(1, 0.35, 0.7);
    f.add(instanced(mg, M('#5a3d24', { roughness: 0.5 }), 8, d => { const a = r() * 6.28, rad = 0.2 + r() * 0.6; d.position.set(Math.cos(a) * rad, 0.07, Math.sin(a) * rad); d.rotation.y = r() * 6; }));
    f.add(instanced(new THREE.BoxGeometry(0.22, 0.005, 0.1), M('#f2dfa6', { roughness: 0.6 }), 6, d => { d.position.set((r() - 0.5) * 0.5, 0.12, (r() - 0.5) * 0.5); d.rotation.set(r() * 0.6, r() * 6, r() * 0.6); }));
  } else if (opt.fill === 'pasta') {
    const base = mesh(new THREE.CircleGeometry(1.0, 64), P('#d98a3a', { roughness: 0.3, clearcoat: 0.6 })); base.rotation.x = -Math.PI / 2; f.add(base);
    const pmat = P('#f0c97a', { roughness: 0.35, clearcoat: 0.5 });
    for (let k = 0; k < 14; k++) { const pts = []; const ph = r() * 6.28, rad0 = 0.3 + r() * 0.35; for (let i = 0; i <= 30; i++) { const t = i / 30; const a = ph + t * Math.PI * 3; pts.push(new THREE.Vector3(Math.cos(a) * rad0 * (1 - t * 0.6), 0.04 + t * 0.22 + Math.sin(t * 9 + k) * 0.02, Math.sin(a) * rad0 * (1 - t * 0.6))); } f.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.026, 6, false), pmat)); }
    const lob = new THREE.CapsuleGeometry(0.1, 0.22, 6, 14);
    f.add(instanced(lob, P('#e24b2a', { roughness: 0.3, clearcoat: 0.6, map: gradientTex([[0, '#f6e4d2'], [0.5, '#f08a62'], [1, '#c8331a']]) }), 4, (d, i) => { const a = i / 4 * 6.28 + 0.3; d.position.set(Math.cos(a) * 0.6, 0.12, Math.sin(a) * 0.6); d.rotation.set(1.3, a, 0.4); }));
    f.add(microgreens(10, new THREE.Vector3(0, 0, 0), 0.4, 0.28, 7));
  } else {
    const base = mesh(new THREE.CircleGeometry(1.12, 64), P('#c8752e', { roughness: 0.15, clearcoat: 1 })); base.rotation.x = -Math.PI / 2; f.add(base);
    const c = new THREE.CatmullRomCurve3(Array.from({ length: 24 }, (_, i) => { const t = i / 23; const a = t * Math.PI * 4; return new THREE.Vector3(Math.cos(a) * 0.65 * t, 0.01, Math.sin(a) * 0.65 * t); }));
    const sg = new THREE.TubeGeometry(c, 120, 0.03, 6, false); sg.scale(1, 0.3, 1); f.add(mesh(sg, P('#f7efe2', { roughness: 0.2 })));
  }
  f.position.y = 0.38; layers.push(layer('fill', f, 0.3, opt.fill === 'pasta' ? 'Hand-cut tagliolini & lobster' : opt.fill === 'risotto' ? 'Carnaroli rice & porcini' : 'Roasted squash velouté'));
  return makeDishReturn(layers, 'bowl', 0.4, 1.45);
}

/* ---------------- STARTERS ---------------- */
export function starter(o = {}) {
  const opt = { kind: 'burrata', ...o };
  const layers = []; const r = rng(29);
  const pw = new THREE.Group(); pw.add(plate({ r: 1.6, rim: 0.5, dark: opt.kind === 'arancini' })); layers.push(layer('plate', pw, 0.1, 'Plate'));
  const main = new THREE.Group();
  if (opt.kind === 'burrata') {
    const bg = new THREE.SphereGeometry(0.5, 48, 32); const bp = bg.attributes.position; for (let i = 0; i < bp.count; i++) { const y = bp.getY(i); bp.setY(i, y > 0 ? y * 0.8 : y * 0.4); if (y > 0.42) { bp.setX(i, bp.getX(i) * 1.2); bp.setZ(i, bp.getZ(i) * 1.2); } } bg.computeVertexNormals();
    const b = mesh(bg, P('#fbf6ea', { roughness: 0.35, sheen: 0.8, sheenColor: new THREE.Color('#ffffff'), clearcoat: 0.3 })); b.position.y = 0.2; main.add(b);
    const cols = ['#c52a1c', '#e9a228', '#7d2a1f', '#6a8a2a'];
    const wedge = new THREE.SphereGeometry(0.17, 20, 14, 0, Math.PI);
    cols.forEach((c, k) => main.add(instanced(wedge, P(c, { roughness: 0.2, clearcoat: 0.8, side: THREE.DoubleSide }), 3, (d, i) => { const a = (k * 3 + i) / 12 * 6.28; d.position.set(Math.cos(a) * 0.9, 0.12, Math.sin(a) * 0.9); d.rotation.set(Math.PI / 2 + r() * 0.4, r() * 6, 0); })));
    main.add(instanced(leafGeo(0.24, 0.11), M('#3f7d2a', { side: THREE.DoubleSide, roughness: 0.4 }), 6, d => { const a = r() * 6.28; d.position.set(Math.cos(a) * 0.55, 0.3 + r() * 0.1, Math.sin(a) * 0.55); d.rotation.set(0.2, r() * 6, 0); }));
    main.add(sauceDots(12, '#9a8a1a', 1.15, 0.02, 3, 0.05));
  } else if (opt.kind === 'tartare') {
    const tt = speckle('#8a1d1f', ['#5a0d10', '#c43a3a', '#f0c0b0'], 1800, 256, 0.8, 3.5, 12);
    const t = mesh(new THREE.CylinderGeometry(0.55, 0.58, 0.4, 64), M('#ffffff', { map: tt, bumpMap: tt, bumpScale: 3, roughness: 0.45 })); t.position.y = 0.2; main.add(t);
    const yolk = mesh(new THREE.SphereGeometry(0.17, 32, 16, 0, 6.28, 0, Math.PI / 2), P('#f29a12', { roughness: 0.05, clearcoat: 1 })); yolk.position.y = 0.4; main.add(yolk);
    main.add(instanced(new THREE.SphereGeometry(0.035, 10, 8), P('#5b6a24', { roughness: 0.3, clearcoat: 0.6 }), 14, d => { const a = r() * 6.28, rad = 0.7 + r() * 0.25; d.position.set(Math.cos(a) * rad, 0.04, Math.sin(a) * rad); }));
    main.add(instanced(new THREE.BoxGeometry(0.7, 0.05, 0.22), M('#ffffff', { map: speckle('#d6a865', ['#8a5a28', '#f0d09a'], 400, 64, 0.5, 2, 2), roughness: 0.8 }), 3, (d, i) => { d.position.set(0.85, 0.06 + i * 0.05, -0.3 + i * 0.25); d.rotation.set(0, 0.6 + i * 0.2, 0.08); }));
  } else {
    const crumb = speckle('#c8872e', ['#7a4612', '#f0c060', '#a86a22'], 2400, 256, 0.5, 2.5, 9);
    main.add(instanced(new THREE.SphereGeometry(0.33, 40, 28), M('#ffffff', { map: crumb, bumpMap: crumb, bumpScale: 4, roughness: 0.85 }), 3, (d, i) => { const a = i / 3 * 6.28 + 0.4; d.position.set(Math.cos(a) * 0.5, 0.31, Math.sin(a) * 0.5); }));
    main.add(instanced(new THREE.SphereGeometry(0.15, 24, 16), P('#f3e6c4', { roughness: 0.2, clearcoat: 0.6 }), 3, (d, i) => { const a = i / 3 * 6.28 + 1.45; d.position.set(Math.cos(a) * 0.62, 0.05, Math.sin(a) * 0.62); d.scale.set(1, 0.6, 1); }));
    main.add(instanced(new THREE.BoxGeometry(0.16, 0.004, 0.08), M('#e6d6a0'), 10, d => { d.position.set((r() - 0.5) * 0.9, 0.66 + r() * 0.04, (r() - 0.5) * 0.9); d.rotation.set(r(), r() * 6, r()); }));
  }
  main.position.y = 0.1; layers.push(layer('main', main, 0.5, opt.kind));
  return makeDishReturn(layers, 'starter', 0.45, 1.6);
}

/* ---------------- DRINKS ---------------- */
const glassMat = () => P('#f4f1ea', { roughness: 0.03, metalness: 0, transparent: true, opacity: 0.2, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.4, depthWrite: false, side: THREE.DoubleSide, specularIntensity: 1 });
export function drink(o = {}) {
  const opt = { kind: 'rocks', liquid: '#b5651d', ...o };
  const layers = []; const g = new THREE.Group(); const liq = new THREE.Group(); const gar = new THREE.Group();
  const liquidMat = P(opt.liquid, { roughness: 0.08, clearcoat: 1, emissive: opt.liquid, emissiveIntensity: 0.22 });
  if (opt.kind === 'rocks') {
    g.add(mesh(lathe([[0, 0], [0.62, 0], [0.64, 0.02], [0.66, 1.15], [0.6, 1.15], [0.58, 0.24], [0, 0.24]], 72), glassMat()));
    const l = mesh(new THREE.CylinderGeometry(0.575, 0.57, 0.6, 64), liquidMat); l.position.y = 0.55; liq.add(l);
    const ice = mesh(new THREE.BoxGeometry(0.62, 0.62, 0.62, 2, 2, 2), P('#eef6f8', { roughness: 0.12, transparent: true, opacity: 0.45, clearcoat: 1, envMapIntensity: 2, depthWrite: false })); ice.position.y = 0.62; ice.rotation.set(0.2, 0.6, 0.1); ice.scale.setScalar(0.8); liq.add(ice);
    const peel = new THREE.CatmullRomCurve3(Array.from({ length: 12 }, (_, i) => { const t = i / 11; return new THREE.Vector3(0.42 + Math.cos(t * 9) * 0.08, 0.95 + t * 0.45, Math.sin(t * 9) * 0.08); }));
    const pg = new THREE.TubeGeometry(peel, 60, 0.035, 8, false); pg.scale(1, 1, 1);
    gar.add(mesh(pg, P('#e87a1a', { roughness: 0.4 })));
  } else if (opt.kind === 'wine') {
    const pts = [[0, 0], [0.5, 0], [0.52, 0.02], [0.08, 0.06], [0.04, 0.12], [0.035, 0.75], [0.06, 0.8], [0.4, 0.95], [0.55, 1.25], [0.52, 1.65], [0.47, 1.85], [0.455, 1.85], [0.5, 1.65], [0.53, 1.25], [0.38, 0.96], [0, 0.86]];
    g.add(mesh(lathe(pts, 72), glassMat()));
    const lp = [[0, 0.87], [0.37, 0.97], [0.51, 1.25], [0.52, 1.42], [0, 1.42]]; liq.add(mesh(lathe(lp, 64), liquidMat));
    const slice = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 32), P('#ffffff', { map: tex(128, (c, s) => { c.fillStyle = '#e8781a'; c.beginPath(); c.arc(s / 2, s / 2, s / 2, 0, 7); c.fill(); c.fillStyle = '#ffb14a'; c.beginPath(); c.arc(s / 2, s / 2, s * 0.43, 0, 7); c.fill(); c.strokeStyle = '#fff1d0'; c.lineWidth = 3; for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28; c.beginPath(); c.moveTo(s / 2, s / 2); c.lineTo(s / 2 + Math.cos(a) * s * 0.42, s / 2 + Math.sin(a) * s * 0.42); c.stroke(); } }), roughness: 0.3, transparent: true }));
    slice.position.set(0.08, 1.4, 0.1); slice.rotation.set(1.3, 0, 0.2); gar.add(slice);
  } else {
    // espresso cup on saucer
    const cup = P('#f3efe7', { roughness: 0.15, clearcoat: 1 });
    g.add(mesh(lathe([[0, 0], [1.0, 0], [1.05, 0.04], [1.08, 0.08], [0.5, 0.06], [0, 0.06]], 72), cup));
    g.add(mesh(lathe([[0, 0.06], [0.3, 0.06], [0.42, 0.12], [0.55, 0.5], [0.58, 0.72], [0.54, 0.72], [0.5, 0.52], [0.38, 0.16], [0, 0.16]], 72), cup));
    const h = mesh(new THREE.TorusGeometry(0.17, 0.04, 12, 32, Math.PI * 1.3), cup); h.position.set(0.62, 0.45, 0); h.rotation.z = -Math.PI * 0.65; g.add(h);
    const crema = mesh(new THREE.CircleGeometry(0.52, 48), P('#ffffff', { roughness: 0.4, map: tex(256, (c, s) => { const gr = c.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2); gr.addColorStop(0, '#c58a4a'); gr.addColorStop(0.7, '#a7672e'); gr.addColorStop(1, '#5a2f12'); c.fillStyle = gr; c.fillRect(0, 0, s, s); c.strokeStyle = 'rgba(240,210,170,.7)'; c.lineWidth = 6; c.beginPath(); for (let k = 0; k < 4; k++) c.arc(s / 2, s / 2 + k * 8, s * (0.32 - k * 0.07), Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }) }));
    crema.rotation.x = -Math.PI / 2; crema.position.y = 0.66; liq.add(crema);
    const r = rng(3); gar.add(instanced(new THREE.SphereGeometry(0.05, 10, 8), M('#3a1c0c', { roughness: 0.3 }), 3, (d, i) => { d.position.set(-0.75 + r() * 0.1, 0.1, 0.2 + i * 0.12); d.scale.set(1, 0.6, 0.75); }));
  }
  layers.push(layer('glass', g, 0, 'Glass'));
  layers.push(layer('liquid', liq, 0, 'Pour'));
  layers.push(layer('garnish', gar, 0, 'Garnish'));
  return makeDishReturn(layers, 'drink', 0.25, 1.1);
}

/* ---------------- registry ---------------- */
export const BUILDERS = { burger, pizza, entremet, tart, plated, bowl, starter, drink };
export function buildDish(type, params) {
  const fn = BUILDERS[type];
  if (!fn) throw new Error(`Unknown dish type: ${type}`);
  return fn(params || {});
}
