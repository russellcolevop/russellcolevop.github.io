// Russell Works walkthrough: one 360 panorama per room, drag or tilt to look, tap a doorway to walk.
// Camera sits at the centre of an inverted sphere (full panoramas) or a partial band (the cyl-* strips, which do not wrap).
// Hotspot bearings, sprites and copy come from rooms.json. No render loop at rest. The canvas is aria-hidden;
// every hotspot has an equivalent button in the reading sheet.
import * as THREE from './vendor/three.module.min.js';

const D2R = Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const wrap = a => { a = ((a + 180) % 360 + 360) % 360 - 180; return a; };
const dir = (b, p, r = 1) => new THREE.Vector3(Math.sin(b * D2R) * Math.cos(p * D2R), Math.sin(p * D2R), -Math.cos(b * D2R) * Math.cos(p * D2R)).multiplyScalar(r);
const COMPASS = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
const compass = y => COMPASS[Math.round(((y % 360) + 360) % 360 / 45) % 8];

export async function createWalk({ root, motion, hooks }) {
  const cfg = await (await fetch('rooms.json')).json();
  const R = cfg.rooms, ORDER = cfg.order;
  const $ = s => root.querySelector(s);
  const view = $('#wview'), hsLayer = $('#whs'), fade = $('#wfade'), sheet = $('#wsheet'), body = $('#ws-body'), head = $('#ws-h'), eyebrow = $('#ws-eyebrow');
  const live = $('#wlive'), hint = $('#whint'), grab = $('#ws-grab'), mapEl = $('#wmap');
  const phone = innerWidth < 760;
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
    el.addEventListener('click', () => activate(h, el));
    hsLayer.append(el); return { ...h, el };
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
        const o = mkHS({ type: 'fig', label: refName(key), ref: key }); o.sprite = m; hs.push(o);
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

  // ---------- reading sheet ----------
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  function actionEl(a, quiet) {
    if (a.href) { const x = el('a', 'btn' + (quiet ? ' btn-quiet' : ''), a.label); x.href = a.href; if (/^https?:/.test(a.href)) { x.target = '_blank'; x.rel = 'noopener'; x.append(Object.assign(el('span', 'sr', ' (opens in a new tab)'))); } return x; }
    const x = el('button', 'btn' + (quiet ? ' btn-quiet' : ''), a.label); x.type = 'button'; x.addEventListener('click', () => go(a.go)); return x;
  }
  function listBtn(label, fn, cls) { const li = el('li'), b = el('button', cls, label); b.type = 'button'; b.addEventListener('click', fn); li.append(b); return li; }
  let cardBox = null;
  function showCard(node, mark) { cardBox.textContent = ''; cardBox.append(node); body.querySelectorAll('.ws-list .on').forEach(x => x.classList.remove('on')); if (mark) mark.classList.add('on'); openSheet(true); cardBox.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); }
  function renderSheet(id) {
    const r = R[id], s = r.sheet; body.textContent = ''; cardBox = el('div', 'ws-cardbox'); cardBox.setAttribute('aria-live', 'polite');
    eyebrow.textContent = r.name; head.textContent = s.h;
    if (s.ask) body.append(el('p', 'ws-ask', s.ask));
    body.append(el('p', null, s.p), el('p', 'ws-proof', 'Proof: ' + s.proof));
    const acts = el('div', 'ws-acts'); s.a.forEach((a, i) => acts.append(actionEl(a, i > 0))); body.append(acts);
    if (s.doors) {
      body.append(el('h3', 'ws-sub', 'Three ways in'));
      const ul = el('ul', 'ws-list');
      ul.append(listBtn('Take the tour: walk to the Curriculum', () => go('curriculum')), listBtn('The one-page version', () => go('#page')), listBtn('Downloads and contact', () => go('contact')));
      body.append(ul);
    }
    if (s.bench) {
      body.append(el('h3', 'ws-sub', 'The bench, in six positions'));
      const ul = el('ul', 'ws-list');
      document.querySelectorAll('#bench li').forEach(li => {
        const i = li.dataset.i, b = listBtn(`${i}. ${li.querySelector('b').textContent}`, () => benchStep(i), null); b.firstChild.dataset.i = i; ul.append(b);
      });
      body.append(ul);
    }
    if (s.plinths) {
      body.append(el('h3', 'ws-sub', 'The four plinths'));
      const ul = el('ul', 'ws-list');
      Object.entries(cfg.plinths).forEach(([k, c]) => { const b = listBtn(c.title, () => plinthCard(k), null); b.firstChild.dataset.k = k; ul.append(b); });
      body.append(ul);
    }
    if (s.refs) {
      body.append(el('h3', 'ws-sub', 'The seven references'));
      const ul = el('ul', 'ws-list');
      R.references.wall.forEach(k => { const b = listBtn(refName(k), () => refCardShow(k), null); b.firstChild.dataset.k = k; ul.append(b); });
      body.append(ul);
    }
    if (s.contact) {
      const ul = el('ul', 'ws-list');
      [['Email Russell', 'mailto:russellcolevop@gmail.com?subject=Re%3A%20Russell%20Works'], ['LinkedIn', 'https://www.linkedin.com/in/russellcole/'], ['Contact card (.vcf)', '../russell.vcf']].forEach(([l, h]) => {
        const li = el('li'), a = el('a', null, l); a.href = h; if (/^https?:/.test(h)) { a.target = '_blank'; a.rel = 'noopener'; } if (h.endsWith('.vcf')) a.setAttribute('download', ''); li.append(a); ul.append(li);
      });
      body.append(ul);
    }
    body.append(cardBox);
    // equivalents for every other doorway and object in the room
    const others = r.hotspots.filter(h => (h.go && R[h.go]) || h.href || h.go === '#map' || h.go === '#page');
    const seen = new Set((s.a || []).map(a => a.go || a.href));
    const extra = others.filter(h => !seen.has(h.go || h.href));
    if (extra.length) {
      body.append(el('h3', 'ws-sub', 'Doorways and objects in this room'));
      const ul = el('ul', 'ws-list');
      extra.forEach(h => {
        if (h.href) { const li = el('li'), a = el('a', null, h.label); a.href = h.href; if (/^https?:/.test(h.href)) { a.target = '_blank'; a.rel = 'noopener'; } li.append(a); ul.append(li); }
        else ul.append(listBtn(h.go === '#map' ? 'Building model: all rooms' : h.go === '#page' ? h.label : `Walk to ${h.label}`, () => go(h.go, h.b)));
      });
      body.append(ul);
    }
  }
  function benchStep(i) {
    const li = document.querySelector(`#bench li[data-i="${i}"]`), n = el('div', 'ws-card');
    n.append(el('h3', null, li.querySelector('b').textContent), el('p', null, li.childNodes[li.childNodes.length - 1].textContent.trim()));
    showCard(n, body.querySelector(`.ws-list button[data-i="${i}"]`)); markPin(h => h.bench == i);
    const h = hs.find(x => x.bench == i); if (h) panTo(h.b, h.p);
  }
  function plinthCard(k) {
    const c = cfg.plinths[k], n = el('div', 'ws-card');
    n.append(el('p', 'badge', c.badge), el('h3', null, c.title));
    if (c.money) n.append(el('p', 'money', c.money));
    n.append(el('p', 'pull', c.pull), el('p', null, 'Where it stands: ' + c.stands));
    if (c.link) n.append(actionEl({ label: c.link.label, href: c.link.href }, true));
    showCard(n, body.querySelector(`.ws-list button[data-k="${k}"]`)); markPin(h => h.plinth === k);
    const h = hs.find(x => x.plinth === k); if (h) panTo(h.b, h.p);
  }
  function refCardShow(k) {
    const src = refCard(k), n = el('div', 'ws-card'), c = src.cloneNode(true);
    c.removeAttribute('id'); c.removeAttribute('tabindex'); c.classList.remove('on'); c.querySelector('img.fig').loading = 'eager';
    n.append(c);
    showCard(n, body.querySelector(`.ws-list button[data-k="${k}"]`)); markPin(h => h.ref === k);
  }
  const markPin = fn => hs.forEach(h => h.el.classList.toggle('on', !!fn(h)));
  function openSheet(on) { sheet.classList.toggle('open', on); grab.setAttribute('aria-expanded', String(on)); }
  grab.addEventListener('click', () => openSheet(!sheet.classList.contains('open')));
  let gy = null;
  grab.addEventListener('pointerdown', e => { gy = e.clientY; });
  grab.addEventListener('pointerup', e => { if (gy != null && Math.abs(e.clientY - gy) > 24) { openSheet(e.clientY < gy); e.preventDefault(); grab.dataset.skip = '1'; } gy = null; });
  grab.addEventListener('click', e => { if (grab.dataset.skip) { delete grab.dataset.skip; e.stopImmediatePropagation(); } }, true);
  sheet.addEventListener('focusin', () => { if (phone) openSheet(true); });

  // ---------- actions ----------
  function activate(h, elx) {
    if (h.ref) return refCardShow(h.ref);
    if (h.bench) return benchStep(h.bench);
    if (h.plinth) return plinthCard(h.plinth);
    go(h.go || h.href, h.b);
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
    const y = id === 'reception' ? 0 : face != null ? face : r.yaw;
    setView(y, r.pitch || 0);
    renderSheet(id); openSheet(false); sheet.scrollTop = 0;
    $('#w-motion').hidden = !(canMotion());
    if (push === 'push') history.pushState({ room: id }, '', `#${id}`); else if (push === 'replace') history.replaceState({ room: id }, '', location.search + `#${id}`);
    hint.classList.toggle('gone', id !== cfg.start || hintGone);
    live.textContent = `${r.name}. Facing ${compass(Y)}.`;
    head.focus({ preventScroll: true });
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
    const list = $('#wm-list'), model = $('#wm-model');
    list.textContent = ''; model.querySelectorAll('.wmap-dot,.wmap-here').forEach(x => x.remove());
    ORDER.forEach((id, i) => {
      const li = el('li', id === cur ? 'here' : ''), b = el('button', null, R[id].name); b.type = 'button'; if (id === cur) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', () => walkTo(id, { face: 0, force: true })); li.append(b); list.append(li);
      const d = el('button', 'wmap-dot' + (id === cur ? ' here' : ''), String(i + 1)); d.type = 'button'; d.setAttribute('aria-label', R[id].name + (id === cur ? ', you are here' : ''));
      d.style.left = cfg.map[id][0] + '%'; d.style.top = cfg.map[id][1] + '%'; d.addEventListener('click', () => walkTo(id, { face: 0, force: true })); model.append(d);
      if (id === cur) { const h = el('span', 'wmap-here', 'You are here'); h.style.left = cfg.map[id][0] + '%'; h.style.top = cfg.map[id][1] + '%'; model.append(h); }
    });
  }
  let lastFocus = null;
  function openMap() { lastFocus = document.activeElement; mapEl.hidden = false; $('#wm-close').focus(); }
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
    if (e.target.closest('.wmap')) return;
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
  view.addEventListener('wheel', e => { if (e.target.closest('.wmap')) return; e.preventDefault(); setFov(cam.fov * (1 + clamp(e.deltaY, -80, 80) * 0.0012)); }, { passive: false });
  const onKey = e => {
    if (e.target.closest && e.target.closest('.wsheet,.wmap,.wbar')) { if (e.key === 'Escape') closeMap(); return; }
    const s = e.shiftKey ? 12 : 5;
    if (e.key === 'ArrowLeft') Y -= s; else if (e.key === 'ArrowRight') Y += s; else if (e.key === 'ArrowUp') P += s; else if (e.key === 'ArrowDown') P -= s;
    else if (e.key === '+' || e.key === '=') setFov(cam.fov - 5); else if (e.key === '-') setFov(cam.fov + 5);
    else if (e.key === 'Escape') { closeMap(); return; } else return;
    if (sens.on) { sens.offY = Y - sens.y; sens.offP = P - sens.p; }
    gone(); e.preventDefault(); request();
  };
  document.addEventListener('keydown', onKey);

  // ---------- device motion ----------
  const canMotion = () => 'DeviceOrientationEvent' in window && matchMedia('(pointer: coarse)').matches;
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
  mbtn.addEventListener('click', async () => {
    if (sens.on) { sens.on = false; removeEventListener('deviceorientation', onOrient); mbtn.textContent = 'Use motion'; mbtn.setAttribute('aria-pressed', 'false'); return; }
    try {
      if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) { const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') { mbtn.textContent = 'Motion blocked'; return; } }
      sens.on = true; sens.first = false; addEventListener('deviceorientation', onOrient); mbtn.textContent = 'Motion on'; mbtn.setAttribute('aria-pressed', 'true'); gone();
    } catch (e) { mbtn.textContent = 'Motion unavailable'; }
  });

  // ---------- history ----------
  const roomFromHash = () => { const h = location.hash.slice(1); return R[h] ? h : null; };
  const onPop = () => { walkTo(roomFromHash() || cfg.start, { push: false, force: true, face: undefined }); };
  addEventListener('popstate', onPop);

  return {
    async start() {
      const id = roomFromHash() || cfg.start;
      try { await show(id, undefined, 'replace'); } catch (e) { hooks.onFail && hooks.onFail(e); return; }
      hooks.onReady && hooks.onReady();
    },
    get room() { return cur; },
    setMotion(on) { reduce = !on; },
    go: walkTo,
    state: () => ({ room: cur, yaw: +Y.toFixed(2), pitch: +P.toFixed(2), fov: cam.fov, big, phone, kind: R[cur] && R[cur].kind, hotspots: hs.map(h => ({ id: h.id || h.ref, off: h.el.classList.contains('off'), rect: h.el.getBoundingClientRect().toJSON() })), props: props.length }),
    setView, setFov,
    dispose() {
      disposed = true; cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('popstate', onPop); removeEventListener('deviceorientation', onOrient);
      document.removeEventListener('keydown', onKey);
      clearRoom(); if (mesh) { mesh.geometry.dispose(); mesh.material.dispose(); }
      texP.forEach(p => p.then(t => t.dispose()).catch(() => {})); spriteTex.forEach(p => p.then(t => t.dispose()).catch(() => {}));
      renderer.dispose(); fade.classList.remove('on'); closeMap();
    },
  };
}
