// Russell Works walkthrough: one 360 panorama per room, drag or tilt to look, tap a doorway to walk.
// Camera sits at the centre of an inverted sphere (full panoramas) or a partial band (the cyl-* strips, which do not wrap).
// Hotspot bearings, sprites and copy come from rooms.json. No render loop at rest. The canvas is aria-hidden;
// every hotspot is a real button (off-view ones stay in the tab order and pan into view on focus).
import * as THREE from './vendor/three.module.min.js';

const D2R = Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const wrap = a => { a = ((a + 180) % 360 + 360) % 360 - 180; return a; };
const dir = (b, p, r = 1) => new THREE.Vector3(Math.sin(b * D2R) * Math.cos(p * D2R), Math.sin(p * D2R), -Math.cos(b * D2R) * Math.cos(p * D2R)).multiplyScalar(r);
const COMPASS = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
const compass = y => COMPASS[Math.round(((y % 360) + 360) % 360 / 45) % 8];
const ang = (a, b) => Math.acos(clamp(a.dot(b), -1, 1)) / D2R;
const INK = '#182C34', OX = '#763F3D', PAPER = '#F4F0E7', GILT = '#E7C99E';
const SERIF = '"Source Serif 4", Georgia, serif', SANS = 'Inter, system-ui, sans-serif';
const PHONE = { w: 375, h: 812, top: 112, bot: 72, fill: 0.88, min: 26 }, DESK = { top: 72, bot: 108, fill: 0.62, min: 36 };   // framing margins: masthead and room tag above, route rail below, share of the width an exhibit may fill
const ppdAt = (H, fov) => H / (2 * Math.tan(fov * D2R / 2)) * D2R;                                          // CSS px per degree at the centre of a view
const KIND = { h: ['600', SERIF, 1.2], b: ['400', SANS, 1.32], l: ['600', SANS, 1.32] };
const wrapText = (g, text, w) => {                                                                          // greedy wrap; a long hyphenated word may break after its hyphen
  const out = []; let line = '';
  for (const word of text.split(' ')) word.split('-').map((x, i, a) => i < a.length - 1 ? x + '-' : x).forEach((part, i) => {
    const t = line ? line + (i ? '' : ' ') + part : part;
    if (line && g.measureText(t).width > w) { out.push(line); line = part; } else line = t;
  });
  if (line) out.push(line); return out;
};
// Print one surface's copy. s = canvas px per CSS px and ppd = CSS px per degree, both at the surface's phone stop frame, so type is sized as it will look on a 375 px phone:
// body never below 15 px (cap height about 11), headings larger. If the full copy cannot fit at that size the surface carries its title alone.
function paintCanvas(sp, W, H, s, ppd) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), light = sp.ink === 'light', P = sp.paint, cw = W / s, ch = H / s;
  g.fillStyle = light ? '#000' : '#fff'; g.fillRect(0, 0, W, H);                                               // multiply leaves white alone, screen leaves black alone
  const m = Math.max((P.mf || 0.07) * Math.min(cw, ch), (sp.m || 0) * ppd), mt = Math.max(m, (sp.mt || 0) * ppd), iw = cw - 2 * m, ih = ch - mt - m, ink = light ? PAPER : INK, acc = light ? GILT : OX;
  const layout = (k, str, body) => {
    const rows = []; let y = 0, ok = true, tail = 0;
    const put = (kind, px, text, color, gap) => {
      const [wt, fam, lh] = KIND[kind]; g.font = `${wt} ${px * s}px ${fam}`;
      for (const t of wrapText(g, text, iw * s)) { const w = g.measureText(t).width; if (w > iw * s + 1) ok = false; rows.push({ t, f: g.font, c: color, y: y + px, w: w / s }); y += px * lh; }
      y += gap; tail = gap;
    }, hp = 20 * k, bp = 15 * k;
    if (P.top) { put('h', hp, P.top, ink, 5 * k); rows.push({ rule: 1, y, c: acc }); y += 9 * k; }
    if (P.n != null) put('h', hp * 1.35, String(P.n), acc, 0);
    put('h', hp, str, ink, 6 * k);
    if (body) for (const b of P.b) { if (b.l) put('l', bp, b.l, ink, 1 * k); put('b', bp, b.t || b, ink, 7 * k); }
    return { rows, h: y - tail, ok, k, hp, bp };
  };
  let L = null, str = null;
  find: for (const t of [P.t || P.h, ...(P.alt || [])]) {                                                      // full copy first, then the title alone, then shorter titles
    for (const body of !!P.b && t === (P.t || P.h) ? [true, false] : [false]) for (const k of (body ? [1.6, 1.4, 1.25, 1.1, 1] : [1.6, 1.4, 1.25, 1.1, 1, .9, .8]).filter(k => k <= (P.kmax || 9))) {     // kmax: cap the type scale so a set of surfaces reads uniformly
      const l = layout(k, t, body); if (l.ok && l.h <= ih) { L = { ...l, body }; str = t; break find; }
    }
  }
  if (!L) { L = { ...layout(.8, P.t || P.h, false), body: false }; str = P.t || P.h; L.fail = true; }
  const center = P.al === 'c' || !L.body, y0 = mt + (center ? (ih - L.h) / 2 : 0);
  g.textBaseline = 'alphabetic'; g.fillStyle = ink;
  for (const r of L.rows) {
    if (r.rule) { g.fillStyle = r.c; g.fillRect(m * s, (y0 + r.y) * s, iw * s * .3, Math.max(1, s)); continue; }
    g.font = r.f; g.fillStyle = r.c; g.fillText(r.t, (m + (center ? (iw - r.w) / 2 : 0)) * s, (y0 + r.y) * s);
  }
  return { cv, fit: { text: str, body: L.body, head: +L.hp.toFixed(1), bodyPx: L.body ? +L.bp.toFixed(1) : 0, fail: !!L.fail } };
}
const DEBUG = /[?&]debug=quads\b/.test(location.search);
let asked = false, granted = false;   // module scope: "ask for motion at most once per session" survives stopTour and startTour

export async function createWalk({ root, motion, hooks }) {
  const cfg = await (await fetch('rooms.json')).json();
  const R = cfg.rooms, ORDER = cfg.order;
  const pristine = root.innerHTML;                                          // restored on dispose: every listener below is on static markup, so a second tour starts clean
  const $ = s => root.querySelector(s);
  const view = $('#wview'), hsLayer = $('#whs'), fade = $('#wfade'), sheet = $('#wsheet'), body = $('#ws-body'), tog = $('#ws-toggle'), rtag = $('#w-tag');
  const live = $('#wlive'), hint = $('#whint'), mapEl = $('#wmap'), intro = $('#wintro'), cardEl = $('#wcard'), lead = $('#wlead');
  const route = ORDER.filter(x => x !== 'elevator'), back = $('#ws-back'), next = $('#ws-next'), num = $('#ws-num');   // the route: 11 rooms, reception is 01
  const UI = '.wsheet,.wcard,.wintro,.wtag,.wmotion';                      // overlays: they must not start a drag, zoom or arrow-key look
  const phone = innerWidth < 760, isPhone = () => matchMedia('(max-width:759px)').matches;
  let reduce = !motion, disposed = false;

  // ---------- renderer ----------
  const old = $('#gl'), canvas = old.cloneNode(false); old.replaceWith(canvas);             // fresh canvas, fresh context
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x182c34);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); hooks.onFail && hooks.onFail('context'); });
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  cam.rotation.order = 'YXZ';
  // desktop loads 8192 only when the screen needs it; phones always the 4096 file
  const big = !phone && renderer.capabilities.maxTextureSize >= 8192 && devicePixelRatio * innerWidth > 2048;
  const panoUrl = id => `pano/${R[id].file}${big ? '' : '-phone'}.webp`;

  // ---------- textures (pano cache keeps three) ----------
  const loader = new THREE.TextureLoader();
  const texP = new Map(), texOrder = [];
  const loadTex = (url, mip) => new Promise((res, rej) => loader.load(url, t => {
    t.colorSpace = THREE.SRGBColorSpace;
    if (!mip) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
    t.anisotropy = 4; res(t);
  }, undefined, () => rej(new Error('texture ' + url))));
  let cur = null;
  function pano(id) {
    if (!texP.has(id)) {
      texP.set(id, loadTex(panoUrl(id), false).catch(e => { texP.delete(id); throw e; }));
      texOrder.push(id);
      while (texOrder.length > 3) {
        const k = texOrder.find(x => x !== cur && x !== id);
        if (!k) break;
        texOrder.splice(texOrder.indexOf(k), 1);
        const p = texP.get(k); texP.delete(k); p && p.then(t => t.dispose()).catch(() => {});
      }
    }
    return texP.get(id);
  }
  const spriteTex = new Map();
  const sprite = n => spriteTex.get(n) || (spriteTex.set(n, loadTex(`img/${n}.webp`, true)), spriteTex.get(n));

  // ---------- panorama geometry ----------
  function panoMesh(kind, tex) {
    const cyl = kind === 'cyl', yM = cyl ? cfg.spanDeg / 2 : 180, pM = cyl ? cfg.spanPitch / 2 : 90, F = 3;
    const ys = [], ps = [], nY = cyl ? 108 : 144, nP = cyl ? 28 : 72;
    for (let i = 0; i <= nY; i++) ys.push(-yM + 2 * yM * i / nY);
    for (let j = 0; j <= nP; j++) ps.push(pM - 2 * pM * j / nP);
    if (cyl) { // fade rings 3 degrees in from each edge
      [-yM + F, yM - F].forEach(v => ys.push(v)); ys.sort((a, b) => a - b);
      [pM - F, -pM + F].forEach(v => ps.push(v)); ps.sort((a, b) => b - a);
    }
    const pos = [], uv = [], col = [], idx = [];
    for (const p of ps) for (const y of ys) {
      const d = dir(y, p, 500); pos.push(d.x, d.y, d.z);
      uv.push((y + yM) / (2 * yM), (p + pM) / (2 * pM));
      const f = cyl ? clamp(Math.min(yM - Math.abs(y), pM - Math.abs(p)) / F, 0, 1) : 1; col.push(f, f, f);
    }
    const w = ys.length;
    for (let j = 0; j < ps.length - 1; j++) for (let i = 0; i < w - 1; i++) { const a = j * w + i; idx.push(a, a + w, a + 1, a + 1, a + w, a + w + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, vertexColors: true, side: THREE.DoubleSide, toneMapped: false }));
  }

  // ---------- state ----------
  let Y = 0, P = 0, dirty = true, raf = 0, busy = false, mesh = null, props = [], surfs = [], hs = [], baseFov = 60, loFov = 37, hiFov = 69, stopIx = -1, panTok = 0;
  const sens = { on: false, y: 0, p: 0, offY: 0, offP: 0 };
  function setView(y, p) { Y = y; P = p; if (sens.on) { sens.offY = Y - sens.y; sens.offP = P - sens.p; } clampView(); request(); }
  function clampView() {
    const room = R[cur];
    P = clamp(P, -85, 85);
    if (room && room.kind === 'cyl') {
      const hf = 2 * Math.atan(Math.tan(cam.fov * D2R / 2) * cam.aspect) / D2R;
      const ym = Math.max(0, cfg.spanDeg / 2 - hf / 2), pm = Math.max(0, cfg.spanPitch / 2 - cam.fov / 2);
      Y = clamp(wrap(Y), -ym, ym); P = clamp(P, -pm, pm);
    } else Y = wrap(Y);
  }
  function fovRange() { return [loFov, hiFov]; }                                  // pinch range: the room's own, widened to include every exhibit stop
  function setFov(f) { const [a, b] = fovRange(); cam.fov = clamp(f, a, b); cam.updateProjectionMatrix(); clampView(); request(); }

  // ---------- sprites and hotspots ----------
  const vTmp = new THREE.Vector3(), fwd = new THREE.Vector3();
  function clearRoom() {
    closeCard();
    props.forEach(m => { scene.remove(m); m.geometry.dispose(); m.material.dispose(); }); props = [];
    surfs.forEach(u => { u.objs.forEach(m => { scene.remove(m); m.geometry.dispose(); m.material.dispose(); }); u.tex && u.tex.dispose(); }); surfs = [];
    hs.forEach(h => h.el.remove()); hs = []; hsLayer.textContent = '';
  }
  async function addSprite(s, D = 400) {
    const f = cfg.figs[s.img], tex = await sprite(s.img);
    const sc = D / s.dist, hw = s.h * sc, k = hw / (f.y1 - f.y0), feetY = -1.6 * sc;
    const bottomPx = s.crop ? f.y0 + (f.y1 - f.y0) * (1 - s.crop) : f.h;
    const pw = (f.x1 - f.x0) * k, ph = (bottomPx - f.y0) * k, bottomY = feetY + (f.y1 - bottomPx) * k;
    const g = new THREE.PlaneGeometry(pw, ph);
    const u0 = f.x0 / f.w, u1 = f.x1 / f.w, vt = 1 - f.y0 / f.h, vb = 1 - bottomPx / f.h;
    g.setAttribute('uv', new THREE.Float32BufferAttribute([u0, vt, u1, vt, u0, vb, u1, vb], 2));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
    m.position.set(Math.sin(s.b * D2R) * D, bottomY + ph / 2, -Math.cos(s.b * D2R) * D);
    m.rotation.y = -s.b * D2R;
    m.renderOrder = 2; m.userData = { top: new THREE.Vector3(m.position.x, bottomY + ph, m.position.z), bot: new THREE.Vector3(m.position.x, bottomY, m.position.z), aspect: pw / ph };
    scene.add(m); props.push(m); return m;
  }
  const refCard = key => document.querySelector(`.ref[data-ref="${key}"]`);
  const refName = key => refCard(key).querySelector('h3').textContent;
  function mkHS(h) {
    const el = document.createElement('button'); el.type = 'button';
    el.className = `hs hs-${h.type === 'fig' ? 'fig' : h.type}${h.hint ? ' hint near' : ''}${h.type === 'pin' && R[cur].kind === 'cyl' ? ' cap' : ''}`;   // strip rooms: object labels stay on
    let aria = h.label;
    if (h.go && R[h.go]) aria = `Walk to ${h.label}`; else if (h.href) aria = `Open ${h.label}`;
    if (h.bench) aria = `Position ${h.label}`;
    if (h.ref) aria = `Read the reference from ${h.label}`;
    if (h.card) aria = `Read: ${h.label}`;
    el.setAttribute('aria-label', aria);
    if (h.type === 'pin') { if (h.bench) el.textContent = h.bench; else el.classList.add('dot'); }
    if (h.type === 'placard') { const b = document.createElement('b'), l = document.createElement('span'); b.textContent = h.label; l.textContent = h.line; el.append(b, l); }
    else if (h.type === 'caption') el.textContent = h.text;
    else if (h.type !== 'surf') { const lab = document.createElement('span'); lab.className = 'hs-lab'; lab.setAttribute('aria-hidden', 'true'); lab.textContent = h.label; el.append(lab); }
    const o = { ...h, el };
    el.addEventListener('click', () => activate(o));
    el.addEventListener('focus', () => { if (el.classList.contains('off')) panTo(o.b, o.p); });       // off-view hotspots stay tabbable
    hsLayer.append(el); return o;
  }
  async function buildRoom(id) {
    const r = R[id];
    clearRoom();
    if (r.surfaces) { await buildSurfaces(id, r); if (disposed || cur !== id) return; }
    r.hotspots.forEach(h => {
      const u = h.of && r.surfaces.find(x => x.id === h.of), o = mkHS(u ? { ...h, label: cardOf(u).h, card: cardOf(u) } : h); o.dir = dir(h.b, h.p, 300); hs.push(o);
    });
    for (const s of r.sprites || []) { const m = await addSprite(s); if (s.img === 'russell-greeting' || s.img === 'russell-bench' || s.img === 'russell-folio') m.userData.russell = true; }
    if (r.wall) {
      for (let i = 0; i < r.wall.length; i++) {
        const [b, p] = r.marks[i], dist = 1.6 / Math.tan(-p * D2R), key = r.wall[i];
        const m = await addSprite({ img: 'ref-' + key, b, dist, crop: 0, h: 1.75 });
        const o = mkHS({ type: 'fig', label: refName(key), ref: key, b, p: p + 13 }); o.sprite = m; hs.push(o);
      }
    }
    if (id === cur) request();
  }

  // ---------- projection of hotspots, preload ----------
  let lastPre = [999, 999];
  function layoutHS() {
    const W = view.clientWidth, H = view.clientHeight;
    cam.getWorldDirection(fwd);
    const pxPerDeg = H / cam.fov;
    for (const h of hs) {
      const el = h.el;
      let ok;
      if (h.quad) {                                                           // painted surface: a transparent button over its projected box, off-view unless every corner is in front
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; ok = h.quad.every(d => d.dot(fwd) > 0);
        if (ok) for (const d of h.quad) { const v = vTmp.copy(d).project(cam), x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        ok = ok && x1 > 0 && x0 < W && y1 > 0 && y0 < H;
        if (ok) { const w = Math.max(44, x1 - x0), hh = Math.max(44, y1 - y0); el.style.width = w + 'px'; el.style.height = hh + 'px'; el.style.transform = `translate(${((x0 + x1) / 2 - w / 2).toFixed(1)}px,${((y0 + y1) / 2 - hh / 2).toFixed(1)}px)`; }
        el.classList.toggle('off', !ok); continue;
      }
      if (h.sprite) {
        const u = h.sprite.userData, a = vTmp.copy(u.top).project(cam), ax = (a.x + 1) / 2 * W, ay = (1 - a.y) / 2 * H;
        const b = vTmp.copy(u.bot).project(cam), by = (1 - b.y) / 2 * H;
        const front = u.top.dot(fwd) > 0, hh = Math.max(44, by - ay), ww = Math.max(44, hh * u.aspect);
        ok = front && ax > -ww && ax < W + ww;
        el.style.width = ww + 'px'; el.style.height = hh + 'px'; el.style.margin = `0 0 0 ${-ww / 2}px`;
        el.style.transform = `translate(${ax.toFixed(1)}px,${ay.toFixed(1)}px)`;
        el.classList.toggle('near', false);
      } else {
        const front = h.dir.dot(fwd) > 0, v = vTmp.copy(h.dir).project(cam), x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
        ok = front && x > -40 && x < W + 40 && y > -40 && y < H + 40;
        el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
        if (!h.hint) el.classList.toggle('near', ok && Math.hypot(x - W / 2, y - H / 2) < 16 * pxPerDeg);
        if (h.lab === undefined) h.lab = el.classList.contains('cap') ? el.querySelector('.hs-lab') : null;
        if (h.lab && ok) { const lw = h.lab.offsetWidth, sh = clamp(x - lw / 2, 6, W - lw - 6) - (x - lw / 2); h.lab.style.marginLeft = sh.toFixed(1) + 'px'; h.lab.style.setProperty('--sh', sh.toFixed(1) + 'px'); }   // always-on labels stay on screen; the leader stays on the pin
        if (h.type === 'placard') el.classList.toggle('sm', ppdAt(H, cam.fov) < 22);          // name tag until the view is close; then the line under it joins
      }
      el.classList.toggle('off', !ok);
    }
    if (card && !isPhone()) { if (card.h.el.classList.contains('off')) closeCard(); else placeCard(); }
    // preload the room behind a doorway as soon as it is in view
    if (Math.abs(Y - lastPre[0]) + Math.abs(P - lastPre[1]) > 2 || lastPre[0] === 999) {
      lastPre = [Y, P];
      for (const h of hs) if (h.go && R[h.go] && h.dir && h.dir.angleTo(fwd) < 38 * D2R) pano(h.go).catch(() => {});
    }
  }

  // ---------- render ----------
  function request() { dirty = true; if (!raf && !disposed) raf = requestAnimationFrame(frame); }
  function frame() {
    raf = 0; if (disposed || !dirty) return; dirty = false;
    clampView();
    cam.rotation.set(P * D2R, -Y * D2R, 0);
    cam.updateMatrixWorld();
    renderer.render(scene, cam);
    layoutHS();
  }
  const ro = new ResizeObserver(() => {
    const W = view.clientWidth, H = view.clientHeight; if (!W || !H) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, phone ? 2 : 2)); renderer.setSize(W, H, false);
    cam.aspect = W / H; cam.updateProjectionMatrix(); request();
  });
  ro.observe(view);

  // ---------- reading peek, arrival popup, object card ----------
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  function actionEl(a, quiet) {
    if (a.href) { const x = el('a', 'btn' + (quiet ? ' btn-quiet' : ''), a.label); x.href = a.href; if (a.download) x.setAttribute('download', ''); if (/^https?:/.test(a.href)) { x.target = '_blank'; x.rel = 'noopener'; x.append(Object.assign(el('span', 'sr', ' (opens in a new tab)'))); } return x; }
    const x = el('button', 'btn' + (quiet ? ' btn-quiet' : ''), a.label); x.type = 'button'; x.addEventListener('click', () => go(a.go)); return x;
  }
  const setSheet = st => { sheet.dataset.s = st; tog.setAttribute('aria-expanded', String(st === 'open')); };   // peek | open | hide
  function renderSheet(id) {
    const r = R[id], s = r.sheet, i = route.indexOf(id);
    if (!s) return setSheet('hide');                                       // the elevator's card is the arrival popup; no rail there
    num.textContent = String(i + 1).padStart(2, '0'); num.append(el('i', null, ` / ${route.length}`)); $('#ws-t').textContent = r.name; railState();
    const box = $('#ws-room'); box.textContent = '';
    const acts = el('div', 'ws-acts'); s.a.forEach((a, i) => acts.append(actionEl(a, i > 0)));
    box.append(el('h3', null, s.h), el('p', null, s.p), el('p', 'ws-proof', 'Proof: ' + s.proof), acts);
    setSheet('peek');
  }
  let card = null;                                                         // { h }: the open object card and its hotspot
  function cardNode(h) {
    const n = el('div', 'ws-card');
    if (h.card) { n.append(el('h3', null, h.card.h)); (h.card.p || []).forEach(t => n.append(el('p', null, t))); if (h.card.link) n.append(actionEl(h.card.link, true)); }
    else if (h.bench) {
      const li = document.querySelector(`#bench li[data-i="${h.bench}"]`);
      n.append(el('h3', null, li.querySelector('b').textContent), el('p', null, li.childNodes[li.childNodes.length - 1].textContent.trim()));
    } else if (h.plinth) {
      const c = cfg.plinths[h.plinth];
      n.append(el('p', 'badge', c.badge), el('h3', null, c.title));
      if (c.money) n.append(el('p', 'money', c.money));
      n.append(el('p', 'pull', c.pull), el('p', null, 'Where it stands: ' + c.stands));
      if (c.link) n.append(actionEl({ label: c.link.label, href: c.link.href }, true));
    } else {
      const c = refCard(h.ref).cloneNode(true);
      c.removeAttribute('id'); c.removeAttribute('tabindex'); c.classList.remove('on'); c.querySelector('img.fig').loading = 'eager'; n.append(c);
    }
    return n;
  }
  function openCard(h) {
    closeCard();
    const box = $('#wc-body'); box.textContent = ''; box.append(cardNode(h));
    card = { h }; h.el.classList.add('on'); cardEl.hidden = false;
    if (isPhone()) {                                                       // phone: the card sits in the drawer; lift the object above it
      body.append(cardEl); sheet.classList.add('has-card'); setSheet('open');
      if (h.quad) { const vh = view.clientHeight, f = framing(R[cur], { at: [h.id] }, view.clientWidth, vh, { top: PHONE.top, bot: vh - sheet.getBoundingClientRect().top + 8, fill: 1e9, min: cam.fov }); panTo(f.y, f.p, f.fov); }   // a painted surface: centred in the clear space above the drawer, zoomed out if it is taller
      else panTo(h.b, h.p - 0.25 * cam.fov);
    }
    else { const r = h.el.getBoundingClientRect(), vr = view.getBoundingClientRect(); if (r.left < vr.left || r.right > vr.right) panTo(h.b, P); placeCard(); }   // half off-screen: bring it in, the card follows
    const t = box.querySelector('h3'); t.tabIndex = -1; t.focus({ preventScroll: true });
  }
  function closeCard(ret) {                                                // ret: give focus back to the hotspot (x, Escape)
    if (!card) return;
    const h = card.h, inside = cardEl.contains(document.activeElement); card = null;
    h.el.classList.remove('on'); cardEl.hidden = true; lead.classList.remove('on');
    if (cardEl.parentNode !== view) { view.append(cardEl); sheet.classList.remove('has-card'); setSheet('peek'); }
    if (ret) h.el.focus({ preventScroll: true }); else if (inside) rtag.focus({ preventScroll: true });
  }
  function placeCard() {                                                   // desktop: right of the hotspot (left near the edge), thin leader line, clamped to the view above the peek pill
    const W = view.clientWidth, H = view.clientHeight, vr = view.getBoundingClientRect(), r = card.h.el.getBoundingClientRect();
    const l = r.left - vr.left, rt = r.right - vr.left, cy = (r.top + r.bottom) / 2 - vr.top, cw = cardEl.offsetWidth, ch = cardEl.offsetHeight, gap = 36;
    const right = rt + gap + cw + 8 <= W, x = clamp(right ? rt + gap : l - gap - cw, 8, Math.max(8, W - cw - 8)), y = clamp(cy - 28, 70, Math.max(70, H - ch - 108));
    cardEl.style.transform = `translate(${x}px,${y}px)`;
    const x0 = right ? rt : l, dx = (right ? x : x + cw) - x0, dy = clamp(cy, y + 12, y + ch - 12) - cy;
    lead.style.width = Math.hypot(dx, dy) + 'px'; lead.style.transform = `translate(${x0}px,${cy}px) rotate(${Math.atan2(dy, dx)}rad)`; lead.classList.add('on');
  }
  $('#wc-x').addEventListener('click', () => closeCard(true));
  const showIntro = () => { intro.classList.add('on'); $('#wi-h').focus({ preventScroll: true }); };
  const hideIntro = () => intro.classList.remove('on');
  intro.querySelectorAll('.wi-go').forEach(b => b.addEventListener('click', () => { askMotion(); hideIntro(); go(b.dataset.go); }));
  $('#wi-x').addEventListener('click', () => { askMotion(); hideIntro(); rtag.focus({ preventScroll: true }); });
  let sy = null, swipeT = 0;
  const row = $('#ws-row');
  row.addEventListener('pointerdown', e => { sy = e.clientY; });
  row.addEventListener('pointercancel', () => { sy = null; });
  row.addEventListener('pointerup', e => {                                 // swipe up reads, swipe down hides
    const d = sy == null ? 0 : e.clientY - sy; sy = null;
    if (Math.abs(d) > 24) { swipeT = performance.now(); setSheet(d < 0 ? 'open' : 'hide'); if (d > 0) rtag.focus({ preventScroll: true }); }
  });
  const still = () => performance.now() - swipeT > 400;                   // a swipe that starts on a rail button must not also click it
  tog.addEventListener('click', () => { if (still()) setSheet(sheet.dataset.s === 'open' ? 'peek' : 'open'); });
  $('#ws-x').addEventListener('click', () => { setSheet('hide'); rtag.focus({ preventScroll: true }); });
  back.addEventListener('click', () => { if (still()) goTo(pos() - 1); });                                 // back through this room's exhibits, then into the last exhibit of the room before
  next.addEventListener('click', () => { if (still()) goTo(stopIx < 0 ? pos() : pos() + 1); });             // stopIx -1: arrived by a doorway, so the first Next is this room's stop 0
  rtag.addEventListener('click', () => { if (R[cur].sheet) setSheet(sheet.dataset.s === 'hide' ? 'peek' : 'open'); else showIntro(); });

  // ---------- actions ----------
  function activate(h) {
    if (h.ref || h.bench || h.plinth || h.card) return openCard(h);
    go(h.go || h.href, h.home ? undefined : h.b);                          // home: that doorway opens the room on its arrival frame
  }
  function go(target, bearing) {
    if (!target) return;
    if (target === '#page') return hooks.onPage && hooks.onPage(cur);
    if (target === '#map') return openMap();
    if (R[target]) return walkTo(target, { face: bearing });
    if (/^https?:/.test(target)) window.open(target, '_blank', 'noopener'); else location.href = target;
  }
  function panTo(b, p, f) {                                                // f: also ease the zoom (exhibit stops)
    const tok = ++panTok;                                                  // a newer pan or a room change cancels this one
    if (reduce) { if (f != null) { cam.fov = f; cam.updateProjectionMatrix(); } setView(b, p); return; }
    const y0 = Y, dy = wrap(b - Y), p0 = P, f0 = cam.fov, t0 = performance.now();
    const step = now => {
      if (tok !== panTok || disposed) return;
      const t = clamp((now - t0) / 380, 0, 1), e = t * t * (3 - 2 * t);
      if (f != null) { cam.fov = f0 + (f - f0) * e; cam.updateProjectionMatrix(); }
      setView(y0 + dy * e, p0 + (p - p0) * e); if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ---------- exhibit stops: Next pans through them before it walks on ----------
  const shots = r => r.stops || [{ at: 'arrival' }];
  const ptsOf = (r, id) => { const u = (r.surfaces || []).find(x => x.id === id); if (u) return u.corners; const h = r.hotspots.find(x => x.id === id); return [[h.b, h.p]]; };
  function framing(r, st, W, H, M) {                                         // the view that composes a stop: centred on its group, zoomed until the group fills M.fill of the width, or the height clear of the rail
    if (st.at === 'arrival') return { y: M === PHONE && r.yawPhone != null ? r.yawPhone : r.yaw, p: r.pitch || 0, fov: r.fov || (M === PHONE ? 75 : 60) };
    const q = st.at.flatMap(id => ptsOf(r, id)), b0 = q[0][0], bs = q.map(([b]) => b0 + wrap(b - b0)), ps = q.map(x => x[1]), pad = st.pad || 0;
    const B0 = Math.min(...bs) - pad, B1 = Math.max(...bs) + pad, P0 = Math.min(...ps), P1 = Math.max(...ps), pc = (P0 + P1) / 2;
    const wD = (B1 - B0) * Math.cos(pc * D2R), hD = P1 - P0 + 2 * pad;
    const fill = M === PHONE && st.fill || M.fill, fov = clamp(2 * Math.atan(Math.max(Math.tan(hD * D2R / 2) * H / (H - M.top - M.bot), Math.tan(wD * D2R / 2) * H / (W * fill))) / D2R, M.min, 85);
    return { y: wrap((B0 + B1) / 2), p: clamp(pc + (M.top - M.bot) / 2 / ppdAt(H, fov), -85, 85), fov };
  }
  const frameOf = (r, i) => framing(r, shots(r)[i], view.clientWidth || PHONE.w, view.clientHeight || PHONE.h, isPhone() ? PHONE : DESK);
  // The tour: one ordered list of every stop in every room (reception first), so a single index says where you are. Next and Back are goTo(index).
  const tour = route.flatMap(id => shots(R[id]).map((st, i) => ({ room: id, i })));
  const pos = () => tour.findIndex(t => t.room === cur) + Math.max(stopIx, 0);
  const stopFrame = n => ({ room: tour[n].room, ...frameOf(R[tour[n].room], tour[n].i) });                    // { room, y: bearing, p: pitch, fov } of global stop n at this screen size
  function between(a, b, t) {                                              // pure: the view at progress t (0 to 1) from global stop a to stop b. Inside one room it is a pan and zoom (yaw the short way round); across rooms there is nothing to pan through, so stop a until t reaches 1
    const A = stopFrame(a), B = stopFrame(b); if (A.room !== B.room) return t < 1 ? A : B;
    return { room: A.room, y: wrap(A.y + wrap(B.y - A.y) * t), p: A.p + (B.p - A.p) * t, fov: A.fov + (B.fov - A.fov) * t };
  }
  function goTo(n) {                                                       // go to global stop n: past the first, the elevator; past the last, the one-page version
    if (n < 0) return walkTo('elevator');
    if (n >= tour.length) return hooks.onPage && hooks.onPage(cur);
    const t = tour[n]; if (t.room !== cur) return walkTo(t.room, { stop: t.i });
    closeCard(); setSheet('peek'); stopIx = t.i;
    const f = between(n, n, 0); panTo(f.y, f.p, f.fov); railState();
    live.textContent = `${R[cur].name}, view ${t.i + 1} of ${shots(R[cur]).length}.`;
  }
  function railState() {
    const r = R[cur], i = route.indexOf(cur), n = route[i + 1], more = stopIx + 1 < shots(r).length;
    back.setAttribute('aria-label', stopIx > 0 ? `Back: earlier view in ${r.name}` : 'Back: ' + R[route[i - 1] || 'elevator'].name);
    sheet.classList.toggle('last', !n && !more);                           // last stop: the button says One-page version
    if (more) next.setAttribute('aria-label', `Next: view ${stopIx + 2} of ${shots(r).length} in ${r.name}`); else if (n) next.setAttribute('aria-label', 'Next: ' + R[n].name); else next.removeAttribute('aria-label');
  }

  // ---------- painted surfaces: the blank display surfaces of the renders, printed with the room's own copy ----------
  const cardOf = u => u.card || { h: u.paint.h || u.paint.t, p: (u.paint.b || []).map(b => b.l ? `${b.l}: ${b.t}` : b) };
  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('image ' + src)); i.src = src; });
  const bpOf = ds => { const v = new THREE.Vector3(); ds.forEach(d => v.add(d)); v.normalize(); return [Math.atan2(v.x, -v.z) / D2R, Math.asin(v.y) / D2R]; };
  function quadGeom(c) {                                                   // 8 x 8 grid: each vertex is the normalised bilinear blend of the four corner directions, just inside the panorama sphere
    const N = 8, pos = [], uv = [], idx = [], v = new THREE.Vector3();
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
      const a = i / N, b = j / N;
      v.set(0, 0, 0).addScaledVector(c[0], (1 - a) * (1 - b)).addScaledVector(c[1], a * (1 - b)).addScaledVector(c[2], a * b).addScaledVector(c[3], (1 - a) * b).normalize().multiplyScalar(490);
      pos.push(v.x, v.y, v.z); uv.push(a, 1 - b);
    }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i; idx.push(a, a + N + 1, a + 1, a + 1, a + N + 1, a + N + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
  }
  async function buildSurfaces(id, r) {
    await Promise.all(['600 40px "Source Serif 4"', '400 40px Inter', '600 40px Inter'].map(f => document.fonts.load(f)));
    const imgs = await Promise.all(r.surfaces.map(u => u.img ? loadImg(u.img) : null));
    if (disposed || cur !== id) return;
    const sh = shots(r);
    r.surfaces.forEach((u, n) => {
      const c = u.corners.map(([b, p]) => dir(b, p)), wD = (ang(c[0], c[1]) + ang(c[3], c[2])) / 2, hD = (ang(c[0], c[3]) + ang(c[1], c[2])) / 2;
      const st = sh.find(x => x.at !== 'arrival' && x.at.includes(u.id)), ppd = ppdAt(PHONE.h, framing(r, st || sh[0], PHONE.w, PHONE.h, PHONE).fov);   // CSS px per degree on a 375 x 812 phone at this surface's stop
      const long = u.img ? 2048 : clamp(Math.round(Math.max(wD, hD) * ppd * 2), 1024, 2048), W = u.aspect >= 1 ? long : Math.round(long * u.aspect), H = u.aspect >= 1 ? Math.round(long / u.aspect) : long;
      let cv, fit;
      if (u.img) { cv = document.createElement('canvas'); cv.width = W; cv.height = H; const im = imgs[n], k = Math.max(W / im.width, H / im.height); cv.getContext('2d').drawImage(im, (W - im.width * k) / 2, 0, im.width * k, im.height * k); fit = { img: true }; }   // monitor: cover-fit, kept to the top so the demo's own heading shows
      else ({ cv, fit } = paintCanvas(u, W, H, W / (wD * ppd), ppd));
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());   // mipmaps stay on
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
      if (!u.img) {                                                        // printed: dark ink multiplies the board's own light, pale ink on the dark rail screens it. No alpha involved
        mat.blending = THREE.CustomBlending; mat.blendEquation = THREE.AddEquation;
        if (u.ink === 'light') { mat.blendSrc = THREE.OneFactor; mat.blendDst = THREE.OneMinusSrcColorFactor; } else { mat.blendSrc = THREE.ZeroFactor; mat.blendDst = THREE.SrcColorFactor; }
      }
      const mesh = new THREE.Mesh(quadGeom(c), mat); mesh.renderOrder = 1; scene.add(mesh);                   // above the panorama, below the figures
      const objs = [mesh];
      if (DEBUG) { const q = []; for (let e = 0; e < 4; e++) for (let t = 0; t < 8; t++) q.push(new THREE.Vector3().lerpVectors(c[e], c[(e + 1) % 4], t / 8).normalize().multiplyScalar(489)); const ln = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(q), new THREE.LineBasicMaterial({ color: 0xff00ff, depthTest: false })); ln.renderOrder = 3; scene.add(ln); objs.push(ln); }
      const card = cardOf(u), [b, p] = bpOf(c), o = mkHS({ type: 'surf', id: u.id, label: card.h, card, b, p }); o.quad = c; hs.push(o);
      surfs.push({ id: u.id, objs, tex, W, H, fit, ppd: +ppd.toFixed(1) });
    });
  }

  // ---------- walking ----------
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function show(id, face, push, stop) {
    const r = R[id];
    const tex = await pano(id);
    if (disposed) return;
    const prev = mesh; mesh = panoMesh(r.kind, tex); scene.add(mesh);
    if (prev) { scene.remove(prev); prev.geometry.dispose(); prev.material.dispose(); }
    cur = id; panTok++;
    baseFov = r.fov || (phone ? 75 : 60);
    const fr = shots(r).map((x, i) => frameOf(r, i));                      // arrival is stop 0; a doorway walk keeps the bearing it walked and the next Next goes to stop 0
    loFov = Math.min(baseFov * 0.62, ...fr.map(f => f.fov)); hiFov = Math.min(85, Math.max(baseFov * 1.15, ...fr.map(f => f.fov)));
    stopIx = stop != null ? stop : face == null ? 0 : -1;
    const at = stopIx >= 0 ? fr[stopIx] : { y: face, p: r.pitch || 0, fov: baseFov };
    cam.fov = at.fov; cam.updateProjectionMatrix();
    await buildRoom(id);
    setView(at.y, at.p);
    renderSheet(id); body.scrollTop = 0; $('#w-tag-t').textContent = r.name;
    if (push === 'push') history.pushState({ room: id }, '', `#${id}`); else if (push === 'replace') history.replaceState({ room: id }, '', location.search + `#${id}`);
    hint.classList.toggle('gone', id !== cfg.start || hintGone);
    live.textContent = `${r.name}. Facing ${compass(Y)}.`;
    if (r.sheet) { hideIntro(); if (!sheet.contains(document.activeElement)) $('#ws-h').focus({ preventScroll: true }); } else if (!root.classList.contains('arrive')) showIntro();
    renderMap();
    request();
  }
  async function walkTo(id, o = {}) {
    if (busy || !R[id] || id === cur && !o.force) return;
    busy = true; closeMap();
    try {
      if (!reduce) { fade.classList.add('on'); await wait(250); }
      await show(id, o.face, o.push === undefined ? 'push' : o.push, o.stop);
    } catch (e) { live.textContent = 'That room could not load. Staying here.'; console.warn(e); }
    fade.classList.remove('on'); busy = false;
  }

  // ---------- map dialog ----------
  function renderMap() {
    const model = $('#wm-model'); model.querySelectorAll('.wmap-dot').forEach(x => x.remove());
    ORDER.forEach(id => {
      const [x, y, side] = cfg.map[id], here = id === cur, d = el('button', `wmap-dot${side ? ' s-' + side : ''}${here ? ' here' : ''}`);
      d.type = 'button'; d.setAttribute('aria-label', R[id].name + (here ? ', you are here' : '')); d.append(el('i'), el('span', null, R[id].name));
      d.style.left = x + '%'; d.style.top = y + '%'; d.addEventListener('click', () => walkTo(id, { force: true })); model.append(d);
    });
  }
  let lastFocus = null;
  function openMap() { lastFocus = document.activeElement; mapEl.hidden = false; $('#wm-close').focus(); $('.wmap-dot.here').scrollIntoView({ inline: 'center', block: 'nearest' }); }   // phone: the model is wider than the screen, pan to this room
  function closeMap() { if (mapEl.hidden) return; mapEl.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }
  $('#wm-close').addEventListener('click', closeMap);
  mapEl.addEventListener('click', e => { if (e.target === mapEl) closeMap(); });

  // ---------- header ----------
  $('#w-rooms').addEventListener('click', openMap);
  $('#w-contact').addEventListener('click', () => walkTo('contact', { force: false }));
  $('#w-page').addEventListener('click', () => hooks.onPage && hooks.onPage(cur));
  $('#w-brand').addEventListener('click', e => { e.preventDefault(); walkTo('reception'); });

  // ---------- looking: drag, pinch, wheel, keys ----------
  let hintGone = false;
  const pts = new Map();
  let drag = null, pinch = null, moved = false;
  const gone = () => { if (!hintGone) { hintGone = true; hint.classList.add('gone'); } };
  view.addEventListener('pointerdown', e => {
    if (e.target.closest(UI)) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) { drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; moved = false; }
    else if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), fov: cam.fov }; moved = true; drag = null; }
  });
  view.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && pts.size === 2) { const [a, b] = [...pts.values()]; setFov(pinch.fov * pinch.d / Math.max(20, Math.hypot(a[0] - b[0], a[1] - b[1]))); return; }
    if (!drag || e.pointerId !== drag.id) return;
    if (!moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) { moved = true; try { view.setPointerCapture(e.pointerId); } catch (x) {} view.classList.add('drag'); gone(); }
    if (moved) {
      const k = cam.fov / view.clientHeight, dy = (e.clientX - prev[0]) * -k, dp = (e.clientY - prev[1]) * k;
      Y += dy; P += dp; if (sens.on) { sens.offY += dy; sens.offP += dp; } request();
    }
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) { drag = null; view.classList.remove('drag'); } };
  view.addEventListener('pointerup', up); view.addEventListener('pointercancel', up);
  view.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  view.addEventListener('click', e => { if (sheet.dataset.s === 'open' && !e.target.closest('button,a,' + UI)) setSheet('peek'); });   // a tap on the world folds the card back to the peek
  view.addEventListener('wheel', e => { if (e.target.closest(UI)) return; e.preventDefault(); setFov(cam.fov * (1 + clamp(e.deltaY, -80, 80) * 0.0012)); }, { passive: false });
  const onKey = e => {
    if (e.key === 'Escape') {
      if (!mapEl.hidden) closeMap(); else if (card) closeCard(true); else if (intro.classList.contains('on')) { hideIntro(); rtag.focus({ preventScroll: true }); } else if (sheet.dataset.s === 'open') setSheet('peek');
      return;
    }
    if (e.target.closest && e.target.closest(UI + ',.wmap,.wbar')) return;
    const s = e.shiftKey ? 12 : 5;
    if (e.key === 'ArrowLeft') Y -= s; else if (e.key === 'ArrowRight') Y += s; else if (e.key === 'ArrowUp') P += s; else if (e.key === 'ArrowDown') P -= s;
    else if (e.key === '+' || e.key === '=') setFov(cam.fov - 5); else if (e.key === '-') setFov(cam.fov + 5);
    else return;
    if (sens.on) { sens.offY = Y - sens.y; sens.offP = P - sens.p; }
    gone(); e.preventDefault(); request();
  };
  document.addEventListener('keydown', onKey);

  // ---------- device motion ----------
  const D = window.DeviceOrientationEvent, canTilt = () => !!D && matchMedia('(pointer: coarse)').matches;   // touch devices only; desktop is unaffected
  const zee = new THREE.Vector3(0, 0, 1), eu = new THREE.Euler(), q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion(-Math.sqrt(.5), 0, 0, Math.sqrt(.5)), qq = new THREE.Quaternion(), fv = new THREE.Vector3();
  function onOrient(e) {
    if (e.beta == null || e.alpha == null) return;
    const orient = (screen.orientation ? screen.orientation.angle : window.orientation || 0) * D2R;
    eu.set(e.beta * D2R, e.alpha * D2R, -e.gamma * D2R, 'YXZ'); qq.setFromEuler(eu); qq.multiply(q1); qq.multiply(q0.setFromAxisAngle(zee, -orient));
    fv.set(0, 0, -1).applyQuaternion(qq);
    sens.y = Math.atan2(fv.x, -fv.z) / D2R; sens.p = Math.asin(clamp(fv.y, -1, 1)) / D2R;
    if (!sens.first) { sens.first = true; sens.offY = Y - sens.y; sens.offP = P - sens.p; }
    if (pts.size) return;                                                    // a finger on the screen wins
    Y = sens.y + sens.offY; P = sens.p + sens.offP; request();
  }
  const mbtn = $('#w-motion');
  function tilt(on) {
    if (on === sens.on) return;
    sens.on = on; sens.first = false; (on ? addEventListener : removeEventListener)('deviceorientation', onOrient);
    mbtn.setAttribute('aria-pressed', String(on)); if (on) gone();
  }
  // iOS silently drops the permission prompt unless requestPermission() runs synchronously inside the tap:
  // call this FIRST in a click handler, never after an await (dynamic import, walkTo, fetch).
  const backup = () => askMotion();                                                   // click/touchend, not pointerdown: iOS ignores it as a gesture
  const stopBackup = () => ['click', 'touchend'].forEach(t => view.removeEventListener(t, backup, true));
  function askMotion(force) {
    if (!canTilt() || !force && (reduce || asked)) return;
    asked = true;
    if (D.requestPermission) D.requestPermission().then(r => { granted = r === 'granted'; if (granted) tilt(true); stopBackup(); }, () => { asked = false; });   // denied: stay on drag, silently; rejected (no gesture): the backup stays armed
    else { tilt(true); stopBackup(); }
  }
  mbtn.hidden = !canTilt();
  mbtn.addEventListener('click', () => { if (sens.on) tilt(false); else askMotion(true); });
  ['click', 'touchend'].forEach(t => view.addEventListener(t, backup, true));
  if (canTilt() && !reduce && (granted || !D.requestPermission)) tilt(true);       // Android and the like: listen from the start

  // ---------- history ----------
  const roomFromHash = () => { const h = location.hash.slice(1); return R[h] ? h : null; };
  const onPop = () => { walkTo(roomFromHash() || cfg.start, { push: false, force: true, face: undefined }); };
  addEventListener('popstate', onPop);

  return {
    async start() {
      const id = roomFromHash() || cfg.start;
      if (id !== cfg.start) root.classList.remove('arrive');                  // deep links skip the doors
      try { await show(id, undefined, 'replace'); } catch (e) { hooks.onFail && hooks.onFail(e); return; }
      hooks.onReady && hooks.onReady();
      if (root.classList.contains('arrive')) {                                // the doors were the loader: open them, then the popup at about 60%
        const t = reduce ? 200 : 1100;
        root.classList.add('open');
        setTimeout(() => { if (!disposed) showIntro(); }, t * 0.6);
        setTimeout(() => root.classList.remove('arrive', 'open'), t + 60);
      }
    },
    get room() { return cur; },
    setMotion(on) { reduce = !on; if (reduce) tilt(false); },
    go: walkTo, goTo, between, tour,                                       // the one global list of stops, the pure progress helper and the one function Next and Back call
    state: () => ({ room: cur, yaw: +Y.toFixed(2), pitch: +P.toFixed(2), fov: cam.fov, big, phone, kind: R[cur] && R[cur].kind, hotspots: hs.map(h => ({ id: h.id || h.ref, off: h.el.classList.contains('off'), rect: h.el.getBoundingClientRect().toJSON() })), props: props.length, sheet: sheet.dataset.s, card: !!card, stop: stopIx, stops: shots(R[cur]).length, tour: tour.length, at: pos(), frames: shots(R[cur]).map((x, i) => { const f = frameOf(R[cur], i); return [+f.y.toFixed(1), +f.p.toFixed(1), +f.fov.toFixed(1)]; }), surfs: surfs.map(({ id, W, H, fit, ppd }) => ({ id, W, H, fit, ppd })), texMB: +(surfs.reduce((a, u) => a + u.W * u.H * 16 / 3, 0) / 1e6).toFixed(1), mem: { ...renderer.info.memory }, intro: intro.classList.contains('on'), tilt: sens.on, doors: root.className }),
    setView, setFov,
    dispose() {
      disposed = true; cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('popstate', onPop); removeEventListener('deviceorientation', onOrient);
      document.removeEventListener('keydown', onKey);
      clearRoom(); if (mesh) { mesh.geometry.dispose(); mesh.material.dispose(); }
      texP.forEach(p => p.then(t => t.dispose()).catch(() => {})); spriteTex.forEach(p => p.then(t => t.dispose()).catch(() => {}));
      renderer.dispose(); root.classList.remove('arrive', 'open'); root.innerHTML = pristine; $('#wnotice').hidden = true;
    },
  };
}
