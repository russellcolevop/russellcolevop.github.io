// Russell Works: page behaviour. The document is complete without this file.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = document.documentElement;
/* test hook: ?debug=raf swaps rAF for a 60 Hz timer so timing can be measured while the page is hidden */
if (/[?&]debug=raf\b/.test(location.search)) { window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16); window.cancelAnimationFrame = id => clearTimeout(id); }
const motionOn = () => !html.classList.contains('reduce');
const behavior = () => (motionOn() ? 'smooth' : 'auto');

let tour = null, starting = false, active = 'reception', statusTimer = 0, io = null;

/* ---------- career strip ---------- */
$$('.strip button').forEach(b => b.addEventListener('click', () => {
  const open = b.getAttribute('aria-expanded') === 'true';
  $$('.strip button').forEach(x => { x.setAttribute('aria-expanded', 'false'); $('#' + x.getAttribute('aria-controls')).hidden = true; });
  if (!open) { b.setAttribute('aria-expanded', 'true'); $('#' + b.getAttribute('aria-controls')).hidden = false; }
}));

/* ---------- motion control ---------- */
const mbtn = $('#motion');
function setMotion(on, persist) {
  html.classList.toggle('reduce', !on);
  mbtn.textContent = 'Motion: ' + (on ? 'on' : 'off');
  if (persist) { try { localStorage.setItem('rw-motion', on ? 'on' : 'off'); } catch (e) {} }
  if (tour) tour.setMotion(on);
}
mbtn.textContent = 'Motion: ' + (motionOn() ? 'on' : 'off');
mbtn.addEventListener('click', () => setMotion(!motionOn(), true));

/* ---------- workshop bench: pins <-> list ---------- */
function setBench(i, scroll) {
  $$('#bench li').forEach(li => li.classList.toggle('on', li.dataset.i === String(i)));
  $$('.pin').forEach(p => p.classList.toggle('on', p.dataset.i === String(i)));
  if (scroll) $(`#bench li[data-i="${i}"]`).scrollIntoView({ block: 'center', behavior: behavior() });
}
const pinX = p => +(tour && tour.phone ? p.dataset.px : p.dataset.x);
const panToPin = i => { const p = $(`.pin[data-i="${i}"]`); if (tour && p) tour.panTo(pinX(p)); };
$$('.pin').forEach(p => {
  p.addEventListener('click', () => { setBench(p.dataset.i, true); panToPin(p.dataset.i); });
  p.addEventListener('mouseenter', () => setBench(p.dataset.i, false));
  p.addEventListener('focus', () => { setBench(p.dataset.i, false); panToPin(p.dataset.i); });
});
$$('#bench li').forEach(li => {
  li.addEventListener('mouseenter', () => { setBench(li.dataset.i, false); panToPin(li.dataset.i); });
});

/* ---------- reference wall: figures <-> cards, left to right as on the wall ---------- */
const WALL = ['lapides', 'haddad', 'duflock', 'mclennan-s', 'mclennan-m', 'rose', 'cronk'];   // the eighth mark stays empty
const card = key => $(`.ref[data-ref="${key}"]`);
function showRef(key) {
  $$('.ref').forEach(c => c.classList.toggle('on', c.dataset.ref === key));
  $$('.fig-btn').forEach(b => b.classList.toggle('on', b.dataset.ref === key));
  const c = card(key);
  c.scrollIntoView({ block: 'center', behavior: behavior() });
  c.focus({ preventScroll: true });
}
function buildWall() {
  const ul = $('#hs-wall'); ul.textContent = '';
  WALL.forEach((key, i) => {
    const name = $('h3', card(key)).textContent;
    const li = document.createElement('li'), b = document.createElement('button'), n = document.createElement('span');
    b.type = 'button'; b.className = 'fig-btn'; b.dataset.ref = key; b.setAttribute('aria-label', `Read the reference from ${name}`);
    n.className = 'fig-name'; n.textContent = name; b.append(n); li.append(b); ul.append(li);
    b.addEventListener('click', () => showRef(key));
    const lift = on => tour && tour.liftFigure(i, on);
    b.addEventListener('mouseenter', () => lift(true)); b.addEventListener('mouseleave', () => lift(false));
    b.addEventListener('focus', () => { lift(true); const f = tour && tour.figures()[i]; if (f) tour.panTo(f.x); }); b.addEventListener('blur', () => lift(false));
  });
}
buildWall();

/* ---------- hotspot layout, driven by the renderer ---------- */
function layout(project) {
  const ph = tour && tour.phone;
  $$('.hs:not([hidden]) [data-x]').forEach(el => {
    const p = project(+(ph ? el.dataset.px : el.dataset.x), +(ph ? el.dataset.py : el.dataset.y), +el.dataset.depth || 0), li = el.closest('li');
    li.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)`;
  });
  if (!$('#hs-wall').hidden && tour) {
    const f = tour.figures();
    $$('#hs-wall li').forEach((li, i) => {
      const g = f[i]; if (!g) return;
      const p = project(g.x, g.y, g.depth), k = p.k, b = li.firstChild;
      li.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)`;
      b.style.width = Math.max(44, g.w * k) + 'px'; b.style.height = Math.max(44, g.h * k) + 'px';
    });
  }
}
let hsTimer = 0;
function showHotspots(room) {
  clearTimeout(hsTimer);
  $$('.hs').forEach(h => { h.hidden = true; });
  // hotspots appear once the camera has settled
  hsTimer = setTimeout(() => { $$('.hs').forEach(h => { h.hidden = h.dataset.room !== room; }); if (tour) tour.refresh(); }, motionOn() ? 1150 : 0);
}

/* ---------- which room is in the reading band ---------- */
const alias = r => (r === 'reception2' ? 'reception' : r);
function observeRooms() {
  if (io) io.disconnect();
  const vh = innerHeight, narrow = innerWidth < 960;
  const top = narrow ? Math.round($('.bar').offsetHeight + Math.min(innerWidth * .75, vh * .46) + 40) : Math.round(vh * .5);
  const bottom = Math.max(0, vh - top - 30);
  const seen = new Map();
  io = new IntersectionObserver(es => {
    es.forEach(e => seen.set(e.target, e.isIntersecting));
    const hit = $$('main [data-room]').filter(el => seen.get(el)).pop();
    if (hit) setRoom(alias(hit.dataset.room));
  }, { rootMargin: `-${top}px 0px -${bottom}px 0px`, threshold: 0 });
  $$('main [data-room]').forEach(el => io.observe(el));
}
function setRoom(room) {
  if (room === active && tour && tour.isReady()) return;
  active = room;
  if (!tour || !tour.isReady()) return;
  showHotspots(room);
  if (tour.room !== room) tour.goRoom(room);
}

/* ---------- tour lifecycle ---------- */
const status = $('#tour-status');
function say(msg) { status.textContent = msg; status.hidden = !msg; }
function setMode(tourOn) {
  const t = $('#door-tour'), p = $('#door-page'), v = $('#view-toggle');
  if (tourOn) { t.setAttribute('aria-current', 'page'); p.removeAttribute('aria-current'); } else { p.setAttribute('aria-current', 'page'); t.removeAttribute('aria-current'); }
  v.textContent = tourOn ? 'One-page version' : 'Enable 3D';
  const u = new URL(location.href); u.searchParams.set('view', tourOn ? 'tour' : 'page');
  history.replaceState(null, '', u);
}
async function startTour() {
  if (tour || starting) return;
  starting = true; html.classList.add('tour'); setMode(true);
  statusTimer = setTimeout(() => say('The visual tour is still loading. Your résumé and work samples are ready below.'), 5000);
  try {
    const old = $('#gl'), c = old.cloneNode(false); old.replaceWith(c);          // fresh canvas, fresh context
    const m = await import('./tour3d.js');
    const t = await m.createTour({
      canvas: c, stage: $('#frame'), motion: motionOn(), hooks: {
        layout,
        onReady() {
          clearTimeout(statusTimer); say('');
          if (scrollY > 24 || (location.hash && location.hash !== '#reception')) tour && tour.skipIntro();
        },
        onArrive() { showHotspots(active); if (active !== 'reception') tour.goRoom(active); },
        onFail(why) { fail(why); },
      },
    });
    tour = t; starting = false;
    if (/[?&]debug/.test(location.search)) window.__rw = t;           // test hook, only with ?debug
    t.start();
  } catch (e) { starting = false; fail(e); }
}
function fail(why) {
  console.warn('tour unavailable:', why);
  stopTour(); say('The visual tour could not start here. Everything is on this page.');
}
function stopTour() {
  clearTimeout(statusTimer); clearTimeout(hsTimer);
  const sec = $$('main [data-room]').find(el => alias(el.dataset.room) === active) || $('#reception');
  if (tour) { try { tour.dispose(); } catch (e) {} tour = null; }
  html.classList.remove('tour'); setMode(false);
  $$('.hs').forEach(h => { h.hidden = true; });
  if (sec && sec.id !== 'reception') sec.scrollIntoView({ block: 'start', behavior: 'auto' });
}

$('#door-tour').addEventListener('click', e => {
  e.preventDefault();
  if (html.classList.contains('tour')) $('#ai').scrollIntoView({ block: 'start', behavior: behavior() });
  else { startTour(); scrollTo({ top: 0, behavior: 'auto' }); }
});
$('#door-page').addEventListener('click', e => { e.preventDefault(); if (html.classList.contains('tour')) stopTour(); });
$('#view-toggle').addEventListener('click', () => { html.classList.contains('tour') ? stopTour() : (startTour(), scrollTo({ top: 0, behavior: 'auto' })); });

/* ---------- scroll parallax: progress through the current room's text drives the layer offsets ---------- */
let pRaf = 0;
function roomProgress() {
  const all = $$('main [data-room]'), mid = innerHeight * (innerWidth < 960 ? .62 : .5);
  const hit = all.findIndex(el => { const r = el.getBoundingClientRect(); return r.top <= mid && r.bottom >= mid; });
  if (hit < 0) return 0;
  let a = hit, b = hit;                                   // the run of neighbouring sections that share this room
  while (a > 0 && alias(all[a - 1].dataset.room) === alias(all[hit].dataset.room)) a--;
  while (b < all.length - 1 && alias(all[b + 1].dataset.room) === alias(all[hit].dataset.room)) b++;
  const top = all[a].getBoundingClientRect().top, bot = all[b].getBoundingClientRect().bottom;
  return Math.max(-1, Math.min(1, ((mid - top) / Math.max(1, bot - top)) * 2 - 1));
}
function onScroll() {
  if (tour && !tour.isReady() && scrollY > 24) tour.skipIntro();
  if (!tour || !tour.isReady() || pRaf) return;
  pRaf = requestAnimationFrame(() => { pRaf = 0; if (tour) tour.setScroll(motionOn() ? roomProgress() : 0); });
}
addEventListener('scroll', onScroll, { passive: true });
let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(observeRooms, 150); });

observeRooms();
if (html.classList.contains('tour')) { html.classList.remove('tour'); starting = false; startTour(); }
else setMode(false);
