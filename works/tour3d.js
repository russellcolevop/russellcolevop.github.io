// Russell Works tour: rendered room plates with a few real textured props in front.
// One persistent canvas, aria-hidden. No wheel handling, no render loop at rest.
import * as THREE from './vendor/three.module.min.js';

const PW = 1672, PH = 941;                 // plate size in px; world units = plate px
const ORDER = ['reception', 'workshop', 'fuwari', 'gallery', 'wall'];
// Camera views in plate px (cx, cy = centre, h = visible height).
const ROOMS = {
  elevator:  { plate: 'elevator',  cx: 875,  cy: 532, h: 1411 },
  reception: { plate: 'reception', cx: 1020, cy: 470, h: 941 },
  workshop:  { plate: 'workshop',  cx: 840,  cy: 470, h: 941 },
  fuwari:    { plate: 'gallery',   cx: 812,  cy: 455, h: 520 },
  gallery:   { plate: 'gallery',   cx: 840,  cy: 500, h: 941 },
  wall:      { plate: 'gallery',   cx: 870,  cy: 560, h: 941 },
};
const PLATE_ORDER = { reception: 1, workshop: 4, gallery: 5, elevator: 10 };
// Monitor face in the gallery plate, plate px: TL, TR, BR, BL.
const MONITOR = [[739.4, 395.6], [885, 396.4], [900, 482.4], [752.4, 489.6]];
// Elevator plate is placed in reception coordinates so the building models line up.
const ELEV = { s: 1.5, x: -379, y: -172.5 };
const DOOR = { l: 452, r: 1298, bottom: 888, w: 424 };            // opening, elevator px
const FIG = { n: 7, x0: 470, dx: 125, base: 800, h: 270, w: 135 };

const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function solveH(src, dst) {               // 4-point homography, Gaussian elimination
  const A = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u], [0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }
  for (let c = 0; c < 8; c++) {
    let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < 8; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k]; }
  }
  const h = A.map((row, i) => row[8] / row[i]);
  return new THREE.Matrix3().set(h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1);
}

function figureSVG(color, hair) {
  const g = `url(#g)`;
  const hairPath = hair === 1
    ? '<path d="M37.5 24C36 10 43 7 50 7s14 3 12.5 17c-1-8-5-12-12.5-12s-11.5 4-12.5 12z" fill="#2b2420"/><path d="M37.5 24c-1 8 1 15 3 18-2-6-2-12-1-18zM62.5 24c1 8-1 15-3 18 2-6 2-12 1-18z" fill="#2b2420"/>'
    : '<path d="M38 22C38 11 44 8 50 8s12 3 12 14c-3-6-7-8-12-8s-9 2-12 8z" fill="#2b2420"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200" width="300" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity=".82"/></linearGradient></defs>`
    + BODY.replace(/url\(#figg\)/g, g).replace('%HAIR%', hairPath) + '</svg>';
}
const BODY = '<ellipse cx="50" cy="193" rx="30" ry="4.5" fill="#182C34" opacity=".2"/><path d="M38 112L36.5 186H48L50 132L52 186H63.5L62 112Z" fill="#2c3a40"/><ellipse cx="42" cy="187.5" rx="8.5" ry="3.4" fill="#182327"/><ellipse cx="58" cy="187.5" rx="8.5" ry="3.4" fill="#182327"/><path d="M33 45Q50 38 67 45L72 80 71 120H29L28 80Z" fill="url(#figg)"/><path d="M33 46L23 84 24.5 112H31L33 84 38 60Z" fill="url(#figg)"/><path d="M67 46L77 84 75.5 112H69L67 84 62 60Z" fill="url(#figg)"/><path d="M43 41L50 62 57 41Z" fill="#f4f0e7"/><rect x="45.5" y="33" width="9" height="10" rx="3" fill="#cdbf9f"/><ellipse cx="50" cy="23" rx="11.5" ry="13.5" fill="#d7caa9"/><circle cx="27.5" cy="114" r="4.2" fill="#cdbf9f"/><circle cx="72.5" cy="114" r="4.2" fill="#cdbf9f"/>%HAIR%';

export async function createTour({ canvas, stage, motion, figures, hooks }) {
  let reduce = !motion;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.localClippingEnabled = true;
  renderer.setClearColor(0xd9d2c2);
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
  cam.position.z = 10;
  let W = 1, H = 1, disposed = false;

  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); hooks.onFail && hooks.onFail('context'); });

  // ---------- textures ----------
  const loader = new THREE.TextureLoader();
  const cache = {};
  const load = u => cache[u] || (cache[u] = new Promise((res, rej) => loader.load(u, t => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; res(t);
  }, undefined, () => rej(new Error('texture ' + u)))));

  const mat = (tex, order, extra) => {
    const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, ...extra });
    return m;
  };
  const quad = (tex, x, y, w, h, order, extra) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(tex, order, extra));
    m.position.set(x + w / 2, -(y + h / 2), 0); m.renderOrder = order; return m;
  };

  const op = { elevator: 1, reception: 1, workshop: 0, gallery: 0 };
  const st = { russell: 0, figs: 0, russellY: 14, doors: 0 };
  const meshes = {};
  const groups = {};

  const [tElev, tRec, tRus, tDesk, tDoor] = await Promise.all([
    load('img/elevator.webp'), load('img/reception.webp'), load('img/russell.webp'),
    load('img/reception-desk.webp'), load('img/door.webp')]);

  // reception group: plate, Russell standee, desk foreground (occludes his lower body)
  groups.reception = new THREE.Group();
  meshes.recPlate = quad(tRec, 0, 0, PW, PH, 1);
  meshes.russell = quad(tRus, 1325, 228, 171, 475, 2);
  meshes.desk = quad(tDesk, 1150, 470, 522, 471, 3);
  groups.reception.add(meshes.recPlate, meshes.russell, meshes.desk);

  // elevator group, placed so its building model lines up with the reception plate
  groups.elevator = new THREE.Group();
  groups.elevator.scale.set(ELEV.s, ELEV.s, 1);
  groups.elevator.position.set(ELEV.x, -ELEV.y, 0);
  meshes.elevPlate = quad(tElev, 0, 0, PW, PH, 10);
  const clipL = ELEV.x + ELEV.s * DOOR.l, clipR = ELEV.x + ELEV.s * DOOR.r, clipB = -(ELEV.y + ELEV.s * DOOR.bottom);
  const clips = [new THREE.Plane(new THREE.Vector3(1, 0, 0), -clipL), new THREE.Plane(new THREE.Vector3(-1, 0, 0), clipR), new THREE.Plane(new THREE.Vector3(0, 1, 0), -clipB)];
  meshes.doorL = quad(tDoor, DOOR.l, 0, DOOR.w, PH, 11, { clippingPlanes: clips });
  meshes.doorR = quad(tDoor, DOOR.r - DOOR.w, 0, DOOR.w, PH, 11, { clippingPlanes: clips });
  meshes.doorR.scale.x = -1;
  const doorBase = { l: meshes.doorL.position.x, r: meshes.doorR.position.x };
  groups.elevator.add(meshes.elevPlate, meshes.doorL, meshes.doorR);
  // the doors live inside the group, so clip planes must be in world space: group scale/offset are baked above.
  scene.add(groups.reception, groups.elevator);

  // lazily created rooms
  let extrasReady = null;
  function loadExtras() {
    return extrasReady || (extrasReady = (async () => {
      const [tWork, tGal, tFu] = await Promise.all([load('img/workshop.webp'), load('img/gallery.webp'), load('img/fuwari-public-demo.jpg')]);
      groups.workshop = new THREE.Group(); meshes.workPlate = quad(tWork, 0, 0, PW, PH, 4); groups.workshop.add(meshes.workPlate);
      groups.gallery = new THREE.Group(); meshes.galPlate = quad(tGal, 0, 0, PW, PH, 5); groups.gallery.add(meshes.galPlate);
      // Fuwari public demo capture, mapped onto the monitor face with a homography
      const Hm = solveH(MONITOR.map(([x, y]) => [x, y]), [[0, 0], [1, 0], [1, 1], [0, 1]]);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(MONITOR.flatMap(([x, y]) => [x, -y, 0]), 3));
      g.setIndex([0, 2, 1, 0, 3, 2]);
      const sm = new THREE.ShaderMaterial({
        transparent: true, depthTest: false, depthWrite: false,
        uniforms: { map: { value: tFu }, H: { value: Hm }, op: { value: 1 } },
        vertexShader: 'varying vec2 vP; void main(){ vP=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: `uniform sampler2D map; uniform mat3 H; uniform float op; varying vec2 vP;
          void main(){ vec3 q=H*vec3(vP.x,-vP.y,1.); vec2 uv=q.xy/q.z;
            vec4 c=texture2D(map,vec2(uv.x,1.-uv.y));
            float glass=.05*smoothstep(.0,.9,uv.y*.6+(1.-uv.x)*.5);   // faint daylight on the glass
            c.rgb=mix(c.rgb,vec3(1.),glass); c.rgb*=.97+.03*(1.-length(uv-.5));
            gl_FragColor=vec4(c.rgb,c.a*op);
            #include <colorspace_fragment>
          }`,
      });
      meshes.screen = new THREE.Mesh(g, sm); meshes.screen.renderOrder = 6;
      groups.gallery.add(meshes.screen);
      // reference figures: stylised standees, same plane-with-texture method as Russell
      const tint = ['#275565', '#763F3D', '#6E7C61', '#B98B57', '#182C34', '#275565', '#763F3D'];
      meshes.figs = [];
      groups.figs = new THREE.Group();
      for (let i = 0; i < FIG.n; i++) {
        const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(figureSVG(tint[i % tint.length], i % 3 === 1 ? 1 : 0));
        const img = new Image(); img.src = url; await img.decode();
        const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true;
        const k = 0.97 + 0.03 * ((i * 5) % 3);
        const w = FIG.w * k, h = FIG.h * k, cxp = FIG.x0 + i * FIG.dx;
        const m = quad(t, cxp - w / 2, FIG.base - h, w, h, 7); m.userData = { i, y: m.position.y, cx: cxp, h, w };
        meshes.figs.push(m); groups.figs.add(m);
      }
      scene.add(groups.workshop, groups.gallery, groups.figs);
      applyOpacity(); request();
    })());
  }

  // ---------- state, camera, render ----------
  let cur = 'elevator';
  let view = { ...ROOMS.elevator };
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  const anims = new Set();
  let raf = 0;

  function setOp(group, o, perMesh) {
    if (!group) return;
    group.visible = o > 0.002;
    group.traverse(m => { if (m.material) { if (m.material.uniforms) m.material.uniforms.op.value = o; else m.material.opacity = o * (perMesh && perMesh(m) !== undefined ? perMesh(m) : 1); } });
  }
  function applyOpacity() {
    setOp(groups.reception, op.reception, m => m === meshes.russell ? st.russell : undefined);
    setOp(groups.elevator, op.elevator);
    setOp(groups.workshop, op.workshop);
    setOp(groups.gallery, op.gallery);
    if (groups.figs) setOp(groups.figs, op.gallery * st.figs);
    meshes.russell.position.y = -(228 + 475 / 2) - st.russellY;
    meshes.russell.position.x = 1325 + 171 / 2 + par.x * 6;
    const p = st.doors * DOOR.w;
    meshes.doorL.position.x = doorBase.l - p; meshes.doorR.position.x = doorBase.r + p;
    if (meshes.figs) meshes.figs.forEach(m => { m.position.y = m.userData.y - (m.userData.lift || 0); });
  }

  function camView() {
    const a = W / H; let { cx, cy, h } = view;
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
    applyOpacity();
    renderer.render(scene, cam);
    const pv = new THREE.Vector3();
    hooks.layout && hooks.layout((x, y) => { pv.set(x, -y, 0).project(cam); return { x: (pv.x + 1) / 2 * W, y: (1 - pv.y) / 2 * H, k: H / v.h }; });
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
  const motion_on = () => !reduce;
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

  // ---------- intro: doors, walk, arrive ----------
  let introDone = false, introAnims = [];
  async function intro() {
    view = { ...ROOMS.elevator }; op.elevator = 1; op.reception = 1; st.russell = 0; st.doors = 0;
    render();
    hooks.onReady && hooks.onReady();
    if (reduce) { arrive(true); return; }
    await new Promise(r => setTimeout(r, 120));
    if (introDone) return;
    introAnims.push(animate(600, u => { st.doors = u; }, () => {
      setTimeout(() => {
        if (introDone) return;
        const a = ROOMS.elevator, b = ROOMS.reception;
        introAnims.push(animate(3200, u => { view = { ...lerpView(a, b, u), free: true }; op.elevator = 1 - smooth(.55, .96, u); }, () => arrive(false), t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2));
      }, 250);
    }));
  }
  function arrive(instant) {
    introDone = true; introAnims = []; view = { ...ROOMS.reception }; op.elevator = 0; op.reception = 1; st.doors = 1; cur = 'reception';
    animate(instant ? 0 : 700, u => { st.russell = u; st.russellY = 14 * (1 - u); });
    hooks.onArrive && hooks.onArrive();
    (window.requestIdleCallback || setTimeout)(() => loadExtras().catch(() => hooks.onFail && hooks.onFail('assets')));
    request();
  }
  function skipIntro() {
    if (introDone) return;
    introDone = true; introAnims.forEach(a => a && anims.delete(a)); introAnims = [];
    anims.clear(); arrive(true);
  }

  // ---------- rooms ----------
  function goRoom(name) {
    if (!introDone || name === cur || !ROOMS[name]) return;
    finishAll();
    const from = cur, to = ROOMS[name], fromP = ROOMS[from].plate, toP = to.plate;
    const adjacent = Math.abs(ORDER.indexOf(from) - ORDER.indexOf(name)) === 1;
    const v0 = camView(); v0.free = false; cur = name;
    const figsOn = name === 'wall' ? 1 : 0;
    const run = () => {
      if (fromP === toP) {
        const f0 = st.figs;
        animate(adjacent ? 1100 : 450, u => { view = lerpView(v0, to, u); st.figs = f0 + (figsOn - f0) * u; });
      } else if (adjacent) {
        animate(1100, u => {                       // dolly toward the threshold, then arrive in the next room
          view = u < .5 ? lerpView(v0, { cx: v0.cx, cy: v0.cy, h: v0.h * .86 }, ease(u * 2))
                        : lerpView({ cx: to.cx, cy: to.cy, h: to.h * 1.14 }, to, ease((u - .5) * 2));
          blend(fromP, toP, smooth(.3, .7, u)); st.figs = figsOn ? smooth(.7, 1, u) : st.figs * (1 - smooth(.3, .7, u));
        });
      } else {
        animate(250, u => { view = lerpView(v0, to, u); blend(fromP, toP, u); st.figs = figsOn ? u : st.figs * (1 - u); });
      }
    };
    if (!groups[toP]) { loadExtras().then(() => { if (cur === name) run(); }); } else run();
  }

  // ---------- pointer parallax (no wheel) ----------
  function onMove(e) {
    if (reduce) return;
    const r = stage.getBoundingClientRect();
    par.tx = ((e.clientX - r.left) / r.width - .5) * -2; par.ty = ((e.clientY - r.top) / r.height - .5) * -2; request();
  }
  const onLeave = () => { par.tx = 0; par.ty = 0; request(); };
  stage.addEventListener('pointermove', onMove, { passive: true });
  stage.addEventListener('pointerleave', onLeave);

  render();
  return {
    start: intro, goRoom, skipIntro,
    get room() { return cur; },
    isReady: () => introDone,
    refresh: () => request(),
    setMotion(on) { reduce = !on; if (reduce) { par.x = par.y = par.tx = par.ty = 0; finishAll(); } },
    liftFigure(i, on) { const m = meshes.figs && meshes.figs[i]; if (m) { m.userData.lift = on ? 8 : 0; request(); } },
    figures: () => Array.from({ length: FIG.n }, (_, i) => ({ x: FIG.x0 + i * FIG.dx, y: FIG.base, w: FIG.w, h: FIG.h })),
    dispose() {
      disposed = true; cancelAnimationFrame(raf); ro.disconnect();
      stage.removeEventListener('pointermove', onMove); stage.removeEventListener('pointerleave', onLeave);
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      Object.values(cache).forEach(p => p.then(t => t.dispose()).catch(() => {}));
      renderer.dispose();
    },
  };
}
