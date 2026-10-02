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
let asked = false, granted = false;   // module scope: "ask for motion at most once per session" survives stopTour and startTour

export async function createWalk({ root, motion, hooks }) {
  const cfg = await (await fetch('rooms.json')).json();
  const R = cfg.rooms, ORDER = cfg.order;
  const pristine = root.innerHTML;                                          // restored on dispose: every listener below is on static markup, so a second tour starts clean
  const $ = s => root.querySelector(s);
  const view = $('#wview'), hsLayer = $('#whs'), fade = $('#wfade'), sheet = $('#wsheet'), body = $('#ws-body'), tog = $('#ws-toggle'), rtag = $('#w-tag');
  const live = $('#wlive'), hint = $('#whint'), mapEl = $('#wmap'), intro = $('#wintro'), cardEl = $('#wcard'), lead = $('#wlead');
  const stops = ORDER.filter(x => x !== 'elevator'), back = $('#ws-back'), next = $('#ws-next'), num = $('#ws-num');   // the route: 11 stops, reception is 01
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
  let Y = 0, P = 0, dirty = true, raf = 0, busy = false, mesh = null, props = [], hs = [], baseFov = 60;
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
  function fovRange() { return [baseFov * 0.62, Math.min(85, baseFov * 1.15)]; }
  function setFov(f) { const [a, b] = fovRange(); cam.fov = clamp(f, a, b); cam.updateProjectionMatrix(); clampView(); request(); }

  // ---------- sprites and hotspots ----------
  const vTmp = new THREE.Vector3(), fwd = new THREE.Vector3();
  function clearRoom() {
    closeCard();
    props.forEach(m => { scene.remove(m); m.geometry.dispose(); m.material.dispose(); }); props = [];
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
    el.className = `hs hs-${h.type === 'fig' ? 'fig' : h.type}${h.hint ? ' hint near' : ''}`;
    let aria = h.label;
    if (h.go && R[h.go]) aria = `Walk to ${h.label}`; else if (h.href) aria = `Open ${h.label}`;
    if (h.bench) aria = `Position ${h.label}`;
    if (h.ref) aria = `Read the reference from ${h.label}`;
    el.setAttribute('aria-label', aria);
    if (h.type === 'pin') { if (h.bench) el.textContent = h.bench; else el.classList.add('dot'); }
    const lab = document.createElement('span'); lab.className = 'hs-lab'; lab.setAttribute('aria-hidden', 'true'); lab.textContent = h.label; el.append(lab);
    const o = { ...h, el };
    el.addEventListener('click', () => activate(o));
    el.addEventListener('focus', () => { if (el.classList.contains('off')) panTo(o.b, o.p); });       // off-view hotspots stay tabbable
    hsLayer.append(el); return o;
  }
  async function buildRoom(id) {
    const r = R[id];
    clearRoom();
    r.hotspots.forEach(h => {
      const o = mkHS(h); o.dir = dir(h.b, h.p, 300); hs.push(o);
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
    const r = R[id], s = r.sheet, i = stops.indexOf(id), n = stops[i + 1];
    if (!s) return setSheet('hide');                                       // the elevator's card is the arrival popup; no rail there
    num.textContent = String(i + 1).padStart(2, '0'); num.append(el('i', null, ` / ${stops.length}`)); $('#ws-t').textContent = r.name;
    back.setAttribute('aria-label', 'Back: ' + R[stops[i - 1] || 'elevator'].name);
    sheet.classList.toggle('last', !n); if (n) next.setAttribute('aria-label', 'Next: ' + R[n].name); else next.removeAttribute('aria-label');   // last stop: the button says One-page version
    const box = $('#ws-room'); box.textContent = '';
    const acts = el('div', 'ws-acts'); s.a.forEach((a, i) => acts.append(actionEl(a, i > 0)));
    box.append(el('h3', null, s.h), el('p', null, s.p), el('p', 'ws-proof', 'Proof: ' + s.proof), acts);
    setSheet('peek');
  }
  let card = null;                                                         // { h }: the open object card and its hotspot
  function cardNode(h) {
    const n = el('div', 'ws-card');
    if (h.bench) {
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
    if (isPhone()) { body.append(cardEl); sheet.classList.add('has-card'); setSheet('open'); panTo(h.b, h.p - 0.25 * cam.fov); }   // phone: the card sits in the drawer; lift the object above it
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
  back.addEventListener('click', () => { if (still()) walkTo(stops[stops.indexOf(cur) - 1] || 'elevator'); });
  next.addEventListener('click', () => { const n = stops[stops.indexOf(cur) + 1]; if (!still()) return; if (n) walkTo(n); else hooks.onPage && hooks.onPage(cur); });
  rtag.addEventListener('click', () => { if (R[cur].sheet) setSheet(sheet.dataset.s === 'hide' ? 'peek' : 'open'); else showIntro(); });

  // ---------- actions ----------
  function activate(h) {
    if (h.ref || h.bench || h.plinth) return openCard(h);
    go(h.go || h.href, h.home ? undefined : h.b);                          // home: that doorway opens the room on its arrival frame
  }
  function go(target, bearing) {
    if (!target) return;
    if (target === '#page') return hooks.onPage && hooks.onPage(cur);
    if (target === '#map') return openMap();
    if (R[target]) return walkTo(target, { face: bearing });
    if (/^https?:/.test(target)) window.open(target, '_blank', 'noopener'); else location.href = target;
  }
  function panTo(b, p) {
    if (reduce) { setView(b, p); return; }
    const y0 = Y, dy = wrap(b - Y), p0 = P, t0 = performance.now();
    const step = now => { const t = clamp((now - t0) / 380, 0, 1), e = t * t * (3 - 2 * t); setView(y0 + dy * e, p0 + (p - p0) * e); if (t < 1 && !disposed) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  // ---------- walking ----------
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function show(id, face, push) {
    const r = R[id];
    const tex = await pano(id);
    if (disposed) return;
    const prev = mesh; mesh = panoMesh(r.kind, tex); scene.add(mesh);
    if (prev) { scene.remove(prev); prev.geometry.dispose(); prev.material.dispose(); }
    cur = id;
    baseFov = r.fov || (phone ? 75 : 60); cam.fov = baseFov; cam.updateProjectionMatrix();
    await buildRoom(id);
    const arrival = phone && r.yawPhone != null ? r.yawPhone : r.yaw;      // per-room arrival frame from rooms.json
    setView(face == null ? arrival : face, r.pitch || 0);
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
      await show(id, o.face, o.push === undefined ? 'push' : o.push);
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
    go: walkTo,
    state: () => ({ room: cur, yaw: +Y.toFixed(2), pitch: +P.toFixed(2), fov: cam.fov, big, phone, kind: R[cur] && R[cur].kind, hotspots: hs.map(h => ({ id: h.id || h.ref, off: h.el.classList.contains('off'), rect: h.el.getBoundingClientRect().toJSON() })), props: props.length, sheet: sheet.dataset.s, card: !!card, intro: intro.classList.contains('on'), tilt: sens.on, doors: root.className }),
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
