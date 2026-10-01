// Russell Works tour, slice 2: hand-split plate layers with scroll parallax, plus cut-out props.
// One persistent canvas, aria-hidden. No wheel handling, no render loop at rest.
// Images are built by tools/build_images.py; layer rectangles come from img/layers.json.
import * as THREE from './vendor/three.module.min.js';

// ---- per-variant geometry. Coordinates are written on a 1280-wide grid and multiplied by K to world units
// (world units = plate pixels: 2560x1440 for desktop plates, 1600x1200 for the phone plates).
const VARIANTS = {
  wide: {
    K: 2, PW: 2560, PH: 1440, sfx: '',
    // elevator plate placed in reception coordinates so the two building models line up (world units)
    ELEV: { s: 1.345, x: -389, y: -168 },
    DOOR: { l: 584, r: 1976, bottom: 1380, w: 696 },             // inner opening of the lift, elevator plate px
    rooms: {
      elevator: { plate: 'elevator', cx: 1333, cy: 800, h: 1937, free: true },
      reception: { plate: 'reception', cx: 1700, cy: 720, h: 1440 },
      workshop: { plate: 'workshop', cx: 1280, cy: 720, h: 1440 },
      fuwari: { plate: 'gallery', cx: 700, cy: 800, h: 780 },
      gallery: { plate: 'gallery', cx: 1280, cy: 720, h: 1440 },
      wall: { plate: 'references', cx: 1280, cy: 720, h: 1440 },
    },
    // scale rule: eye height 1.6 m. Reference wall: horizon near grid y 310, floor marks y 530 -> 1.75 m = 245 grid units.
    // Reception: desk top 1.05 m at far edge y 366 (about 125 grid units per metre there) -> floor y 497, 1.75 m = 219 units.
    russell: { x: 1085, y: 497, h: 219 },                         // greeting pose, feet y hidden behind the desk
    bench: { x: 1000, y: 536, h: 262 },                            // bench pose: feet y = far table edge 404 + half his height, so his hands land on the edge
    screen: { x: 335, y: 506, w: 200 },                           // Fuwari demo monitor on the nearest plinth
    model: { x: 662, y: 584, w: 455, squash: 0.72 },              // building model on the reception plinth
    marks: [138, 263, 393, 524, 654, 784, 914, 1043], markY: 530, figH: 245,
  },
  phone: {
    K: 1.25, PW: 1600, PH: 1200, sfx: '-phone',
    ELEV: { s: 1.21, x: -116, y: -50 },
    DOOR: { l: 310, r: 1281, bottom: 1140, w: 486 },
    rooms: {
      elevator: { plate: 'elevator', cx: 852, cy: 676, h: 1452, free: true },
      reception: { plate: 'reception', cx: 800, cy: 600, h: 1200 },
      workshop: { plate: 'workshop', cx: 800, cy: 600, h: 1200 },
      fuwari: { plate: 'gallery', cx: 560, cy: 760, h: 760 },
      gallery: { plate: 'gallery', cx: 800, cy: 600, h: 1200 },
      wall: { plate: 'references', cx: 800, cy: 700, h: 1000 },
    },
    russell: { x: 1110, y: 664, h: 324 },
    bench: { x: 1000, y: 684, h: 309 },
    screen: { x: 400, y: 648, w: 270 },
    model: { x: 684, y: 718, w: 520, squash: 0.72 },
    marks: [140, 271, 406, 542, 677, 814, 949, 1079], markY: 687, figH: 287,
  },
};
// left-to-right on the wall; the eighth mark stays empty
const WALL = ['lapides', 'haddad', 'duflock', 'mclennan-s', 'mclennan-m', 'rose', 'cronk'];
const PLATE_ORDER = { reception: 1, workshop: 2, gallery: 3, references: 4, elevator: 10 };
const BASE = { reception: 100, workshop: 200, gallery: 300, references: 400, elevator: 1000 };
const AMP = { x: 12, y: 30 };                                        // world units of parallax per unit depth at full scroll progress

const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export async function createTour({ canvas, stage, motion, hooks }) {
  let reduce = !motion;
  const phone = innerWidth < 760;                       // viewport, not stage: phone plates only on phones
  const V = phone ? VARIANTS.phone : VARIANTS.wide, K = V.K, { PW, PH } = V, ROOMS = V.rooms;
  const manifest = await (await fetch('img/layers.json')).json();
  const LAY = manifest[phone ? 'phone' : 'wide'].layers, FIGS = manifest.figs;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.localClippingEnabled = true;
  renderer.setClearColor(0xd9d2c2);
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
  cam.position.z = 10;
  let W = 1, H = 1, disposed = false;
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); hooks.onFail && hooks.onFail('context'); });

  // ---------- textures and meshes ----------
  const loader = new THREE.TextureLoader();
  const cache = {};
  const load = u => cache[u] || (cache[u] = new Promise((res, rej) => loader.load(u, t => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; res(t);
  }, undefined, () => rej(new Error('texture ' + u)))));
  const quad = (tex, x, y, w, h, order, extra) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, ...extra }));
    m.position.set(x + w / 2, -(y + h / 2), 0); m.renderOrder = order;
    m.userData = { bx: m.position.x, by: m.position.y, depth: 0, kf: null };
    return m;
  };
  // a cut-out person or prop: placed by its visible box (feet centre at fx, fy; height hw), in world units
  const place = async (name, fx, fy, hw, order, depth) => {
    const f = FIGS[name], t = await load(`img/${name}.webp`);
    const bw = f.x1 - f.x0, bh = f.y1 - f.y0, s = hw / bh;
    const m = quad(t, fx - (f.x0 + bw / 2) * s, fy - f.y1 * s, f.w * s, f.h * s, order);
    m.userData.depth = depth; m.userData.box = { w: bw * s, h: hw };
    return m;
  };

  const groups = {}, ready = {}, meshes = {};
  const op = { elevator: 1, reception: 1, workshop: 0, gallery: 0, references: 0 };
  const st = { russell: 0, figs: 0, russellY: 14, doors: 0, sp: 0, pan: 0 };

  async function addLayers(group, plate, doors) {
    const list = LAY[plate];
    await Promise.all(list.map(async L => {
      const t = await load('img/' + L.file);
      const m = quad(t, L.x, L.y, L.w, L.h, BASE[plate] + (L.depth === 0 ? 0 : L.depth < 1 ? 1 : 2));
      m.userData.depth = L.depth; group.add(m);
    }));
  }

  // elevator: opening view, door leaves, frame pieces (desktop) -- placed in reception coordinates
  async function buildElevator() {
    const g = groups.elevator = new THREE.Group();
    const { s, x, y } = V.ELEV; g.scale.set(s, s, 1); g.position.set(x, -y, 0);
    await addLayers(g, 'elevator');
    const tDoor = await load('img/door.webp'), D = V.DOOR;
    const clipL = x + s * D.l, clipR = x + s * D.r, clipB = -(y + s * D.bottom);
    const clips = [new THREE.Plane(new THREE.Vector3(1, 0, 0), -clipL), new THREE.Plane(new THREE.Vector3(-1, 0, 0), clipR), new THREE.Plane(new THREE.Vector3(0, 1, 0), -clipB)];
    meshes.doorL = quad(tDoor, D.l, 0, D.w + 4, PH, BASE.elevator + 1, { clippingPlanes: clips });
    meshes.doorR = quad(tDoor, D.r - D.w - 4, 0, D.w + 4, PH, BASE.elevator + 1, { clippingPlanes: clips });
    meshes.doorL.userData.depth = 0; meshes.doorR.userData.depth = 0;
    meshes.doorBase = { l: meshes.doorL.position.x, r: meshes.doorR.position.x };
    g.add(meshes.doorL, meshes.doorR); scene.add(g);
  }
  async function buildReception() {
    const g = groups.reception = new THREE.Group(), B = BASE.reception;
    await addLayers(g, 'reception');
    const R = V.russell, M = V.model;
    meshes.russell = await place('russell-greeting', R.x * K, R.y * K, R.h * K, B + 1.5, 0.8);
    meshes.russell.userData.kf = () => st.russell;
    // the building model: a cut-out prop covering the (inpainted) painted one on the plinth
    const fm = FIGS['building-model'], mw = M.w * K, mh = mw * fm.h / fm.w * M.squash;
    const mod = quad(await load('img/building-model.webp'), M.x * K - mw / 2, M.y * K - mh, mw, mh, B + 4);
    mod.userData.depth = 1; meshes.model = mod;
    g.add(meshes.russell, mod); scene.add(g);
  }
  async function buildWorkshop() {
    const g = groups.workshop = new THREE.Group();
    await addLayers(g, 'workshop');
    const b = V.bench;
    meshes.bench = await place('russell-bench', b.x * K, b.y * K, b.h * K, BASE.workshop + 1.5, 0.9);
    // slot him between the background and the table layer: the table (order +2) hides everything below its far edge
    g.add(meshes.bench); scene.add(g);
  }
  async function buildGallery() {
    const g = groups.gallery = new THREE.Group();
    await addLayers(g, 'gallery');
    const S = V.screen, f = FIGS['fuwari-screen'];
    // screen prop stands on the nearest plinth, drawn above the foreground layer; foot ellipse bottom sits at y
    const w = S.w * K, h = w * 590 / 800;
    meshes.screen = quad(await load('img/fuwari-screen.webp'), S.x * K - w / 2, S.y * K - h + h * 0.01, w, h, BASE.gallery + 3);
    meshes.screen.userData.depth = 1; g.add(meshes.screen); scene.add(g);
  }
  async function buildReferences() {
    const g = groups.references = new THREE.Group();
    await addLayers(g, 'references');
    meshes.figs = [];
    const figs = new THREE.Group(); groups.figs = figs;
    for (let i = 0; i < WALL.length; i++) {
      const m = await place('ref-' + WALL[i], V.marks[i] * K, V.markY * K, V.figH * K * (0.985 + 0.015 * ((i * 5) % 3)), BASE.references + 5, 1.4);
      m.userData.i = i; m.userData.kf = () => st.figs; meshes.figs.push(m); figs.add(m);
    }
    g.add(figs); scene.add(g);
  }
  const builders = { elevator: buildElevator, reception: buildReception, workshop: buildWorkshop, gallery: buildGallery, references: buildReferences };
  const ensure = plate => ready[plate] || (ready[plate] = builders[plate]().then(() => { applyState(); request(); }));

  // ---------- state, camera, render ----------
  let cur = 'elevator';
  let view = { ...ROOMS.elevator };
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  const anims = new Set();
  let raf = 0;
  const motion_on = () => !reduce;

  function setOp(group, o) {
    if (!group) return;
    group.visible = o > 0.002;
    group.traverse(m => {
      if (!m.material) return;
      const u = m.userData || {};
      m.material.opacity = o * (u.kf ? u.kf() : 1);
    });
  }
  function applyState() {
    for (const p of Object.keys(op)) setOp(groups[p], op[p]);
    const sp = reduce ? 0 : st.sp;
    scene.traverse(m => {
      const u = m.userData;
      if (!m.isMesh || !u || u.bx === undefined) return;
      m.position.x = u.bx + sp * (u.depth || 0) * AMP.x;
      m.position.y = u.by + sp * (u.depth || 0) * AMP.y + (u.lift || 0) + (m === meshes.russell ? -st.russellY : 0);
    });
    if (meshes.doorL) {
      const p = st.doors * V.DOOR.w;
      meshes.doorL.position.x = meshes.doorBase.l - p; meshes.doorR.position.x = meshes.doorBase.r + p;
    }
  }

  function camView() {
    const a = W / H; let { cx, cy, h } = view;
    cx += st.pan;
    if (view.free !== true) {
      h = Math.min(h, PH - 10, (PW - 10) / a);
      const hw = h * a / 2; cx = clamp(cx, hw + 12, PW - hw - 12); cy = clamp(cy, h / 2 + 12, PH - h / 2 - 12);
    }
    return { cx: cx + par.x * h * 0.012, cy: cy + par.y * h * 0.012, h };
  }
  function render() {
    if (disposed || !W) return;
    const v = camView(), a = W / H;
    cam.left = -v.h * a / 2; cam.right = v.h * a / 2; cam.top = v.h / 2; cam.bottom = -v.h / 2;
    cam.position.set(v.cx, -v.cy, 10); cam.updateProjectionMatrix();
    applyState();
    renderer.render(scene, cam);
    const pv = new THREE.Vector3(), sp = reduce ? 0 : st.sp;
    hooks.layout && hooks.layout((x, y, depth = 0) => {
      pv.set(x + sp * depth * AMP.x, -(y) + sp * depth * AMP.y, 0).project(cam);
      return { x: (pv.x + 1) / 2 * W, y: (1 - pv.y) / 2 * H, k: H / v.h };
    });
  }
  function request() { if (!raf && !disposed) raf = requestAnimationFrame(tick); }
  function tick(now) {
    raf = 0;
    for (const an of [...anims]) {
      const t = Math.min(1, (now - an.t0) / an.dur);
      an.fn(an.ease(t));
      if (t >= 1) { anims.delete(an); an.done && an.done(); }
    }
    if (motion_on()) { par.x += (par.tx - par.x) * .12; par.y += (par.ty - par.y) * .12; }
    render();
    if (anims.size || (motion_on() && (Math.abs(par.tx - par.x) > .002 || Math.abs(par.ty - par.y) > .002))) request();
  }
  function animate(dur, fn, done, e = ease) {
    if (reduce || dur === 0) { fn(1); done && done(); request(); return null; }
    const an = { t0: performance.now(), dur, fn, done, ease: e }; anims.add(an); request(); return an;
  }
  function finishAll() { for (const an of [...anims]) { anims.delete(an); an.fn(1); an.done && an.done(); } request(); }

  function resize() {
    const r = stage.getBoundingClientRect(); W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, W < 760 ? 1.25 : 1.5));
    renderer.setSize(W, H, false); request();
  }
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  const lerpView = (a, b, u) => ({ cx: a.cx + (b.cx - a.cx) * u, cy: a.cy + (b.cy - a.cy) * u, h: Math.exp(Math.log(a.h) + (Math.log(b.h) - Math.log(a.h)) * u) });
  function blend(A, B, u) {                       // crossfade without ever showing the clear colour
    if (A === B) return;
    if (PLATE_ORDER[B] > PLATE_ORDER[A]) { op[B] = u; op[A] = 1; if (u >= 1) op[A] = 0; }
    else { op[B] = 1; op[A] = 1 - u; }
  }
  // the reception view as the camera will actually frame it
  function settled(name) { const keep = [view, st.pan]; view = { ...ROOMS[name], free: false }; st.pan = 0; const v = camView(); view = keep[0]; st.pan = keep[1]; return { cx: v.cx - par.x * v.h * 0.012, cy: v.cy - par.y * v.h * 0.012, h: v.h, free: true }; }

  // ---------- intro: doors, walk, arrive ----------
  let introDone = false, introAnims = [];
  async function intro() {
    view = { ...ROOMS.elevator }; op.elevator = 1; op.reception = 1; st.russell = 0; st.doors = 0;
    render();
    hooks.onReady && hooks.onReady();
    if (reduce) { arrive(true); return; }
    await new Promise(r => requestAnimationFrame(r));                // let the closed-door frame paint, then open
    if (introDone) return;
    introAnims.push(animate(600, u => { st.doors = u; }, () => {
      setTimeout(() => {
        if (introDone) return;
        const a = ROOMS.elevator, b = settled('reception');
        introAnims.push(animate(3200, u => { view = { ...lerpView(a, b, u), free: true }; op.elevator = 1 - smooth(.55, .96, u); }, () => arrive(false), t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2));
      }, 250);
    }));
  }
  function arrive(instant) {
    introDone = true; introAnims = []; view = { ...ROOMS.reception }; op.elevator = 0; op.reception = 1; st.doors = 1; cur = 'reception';
    animate(instant ? 0 : 700, u => { st.russell = u; st.russellY = 14 * (1 - u); });
    hooks.onArrive && hooks.onArrive();
    // next room first, then the rest, one at a time, while the visitor reads
    (window.requestIdleCallback || (f => setTimeout(f, 300)))(() => prefetch(['workshop', 'gallery', 'references']));
    request();
  }
  async function prefetch(list) { for (const p of list) { if (disposed) return; try { await ensure(p); } catch (e) { hooks.onFail && hooks.onFail('assets'); return; } } }
  function skipIntro() {
    if (introDone) return;
    introDone = true; introAnims.forEach(a => a && anims.delete(a)); introAnims = [];
    anims.clear(); arrive(true);
  }

  // ---------- rooms ----------
  const ORDER = ['reception', 'workshop', 'fuwari', 'gallery', 'wall'];
  function goRoom(name) {
    if (!introDone || name === cur || !ROOMS[name]) return;
    finishAll();
    const from = cur, to = ROOMS[name], fromP = ROOMS[from].plate, toP = to.plate;
    const adjacent = Math.abs(ORDER.indexOf(from) - ORDER.indexOf(name)) === 1;
    const v0 = camView(); v0.free = false; cur = name; st.pan = 0;
    const figsOn = name === 'wall' ? 1 : 0;
    const run = () => {
      if (fromP === toP) {
        animate(adjacent ? 1100 : 450, u => { view = lerpView(v0, to, u); });
      } else if (adjacent) {
        animate(1100, u => {                       // dolly toward the threshold, then arrive in the next room
          view = u < .5 ? lerpView(v0, { cx: v0.cx, cy: v0.cy, h: v0.h * .86 }, ease(u * 2))
                        : lerpView({ cx: to.cx, cy: to.cy, h: to.h * 1.14 }, to, ease((u - .5) * 2));
          blend(fromP, toP, smooth(.3, .7, u));
        });
      } else {
        animate(250, u => { view = lerpView(v0, to, u); blend(fromP, toP, u); });
      }
      const f0 = st.figs; animate(adjacent ? 1100 : 300, u => { st.figs = f0 + (figsOn - f0) * u; });
    };
    if (!ready[toP]) ensure(toP).then(() => { if (cur === name) run(); }).catch(() => hooks.onFail && hooks.onFail('assets')); else run();
  }

  // ---------- pointer parallax (small, whole-scene) and scroll parallax (per layer) ----------
  function onMove(e) {
    if (reduce) return;
    const r = stage.getBoundingClientRect();
    par.tx = ((e.clientX - r.left) / r.width - .5) * -2; par.ty = ((e.clientY - r.top) / r.height - .5) * -2; request();
  }
  const onLeave = () => { par.tx = 0; par.ty = 0; request(); };
  stage.addEventListener('pointermove', onMove, { passive: true });
  stage.addEventListener('pointerleave', onLeave);

  await ensure('elevator'); await ensure('reception');
  render();
  return {
    start: intro, goRoom, skipIntro, phone,
    get room() { return cur; },
    isReady: () => introDone,
    refresh: () => request(),
    // scroll parallax: layer offsets follow scroll progress directly (-1..1), so they are settled the frame scrolling stops
    setScroll(p) { st.sp = clamp(p, -1, 1); request(); },
    panTo(x) { const to = clamp(x - ROOMS[cur].cx, -PW / 2, PW / 2); const f = st.pan; animate(450, u => { st.pan = f + (to - f) * u; }); },
    setMotion(on) { reduce = !on; if (reduce) { par.x = par.y = par.tx = par.ty = 0; st.sp = 0; st.pan = 0; finishAll(); } request(); },
    liftFigure(i, on) { const m = meshes.figs && meshes.figs[i]; if (m) { m.userData.lift = on ? 14 : 0; request(); } },
    figures: () => (meshes.figs || []).map(m => ({ x: m.userData.bx, y: V.markY * K, w: m.userData.box.w, h: m.userData.box.h, depth: m.userData.depth })),
    debug: () => ({ sp: st.sp, pan: st.pan, reduce, phone, room: cur, layers: Object.fromEntries(Object.entries(meshes).filter(([k, m]) => m && m.position).map(([k, m]) => [k, [+m.position.x.toFixed(2), +m.position.y.toFixed(2)]])), reception: groups.reception && groups.reception.children.map(m => [m.userData.depth, +m.position.x.toFixed(2), +m.position.y.toFixed(2)]) }),
    dispose() {
      disposed = true; cancelAnimationFrame(raf); ro.disconnect();
      stage.removeEventListener('pointermove', onMove); stage.removeEventListener('pointerleave', onLeave);
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      Object.values(cache).forEach(p => p.then(t => t.dispose()).catch(() => {}));
      renderer.dispose();
    },
  };
}
