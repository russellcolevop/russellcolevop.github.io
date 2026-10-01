// Russell Works: page behaviour. The one-page document is complete without this file.
// The 360 walkthrough lives in walk.js and is loaded only when WebGL2 is available (see the inline script in index.html).
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = document.documentElement;
/* test hook: ?debug=raf swaps rAF for a 60 Hz timer so timing can be measured while the pane is hidden */
if (/[?&]debug=raf\b/.test(location.search)) { window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16); window.cancelAnimationFrame = id => clearTimeout(id); }
const motionOn = () => !html.classList.contains('reduce');

let walk = null, starting = false, statusTimer = 0, doorsDone = false;
// one-page section to land on when leaving the walkthrough from a given room
const SECTION = { elevator: 'reception', reception: 'reception', curriculum: 'curriculum', customers: 'customers', product: 'product', workshop: 'ai', operations: 'operations', ventures: 'ventures', gallery: 'cases', references: 'references', achievements: 'achievements', contact: 'contact' };

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
  if (walk) walk.setMotion(on);
}
mbtn.textContent = 'Motion: ' + (motionOn() ? 'on' : 'off');
mbtn.addEventListener('click', () => setMotion(!motionOn(), true));

/* ---------- mode switch ---------- */
function setMode(tourOn) {
  const t = $('#door-tour'), p = $('#door-page'), v = $('#view-toggle');
  if (tourOn) { t.setAttribute('aria-current', 'page'); p.removeAttribute('aria-current'); } else { p.setAttribute('aria-current', 'page'); t.removeAttribute('aria-current'); }
  v.textContent = tourOn ? 'One-page version' : 'Enable 3D';
  const u = new URL(location.href); u.searchParams.set('view', tourOn ? 'tour' : 'page'); if (!tourOn) u.hash = '';
  history.replaceState(history.state, '', u);
}
const status = $('#tour-status');
function say(msg) { status.textContent = msg; status.hidden = !msg; }
async function startTour() {
  if (walk || starting) return;
  starting = true; html.classList.add('tour'); setMode(true);
  const h = location.hash.slice(1);
  if (!doorsDone && !(h in SECTION && h !== 'elevator')) $('#walk').classList.add('arrive');     // the elevator doors play on the first load only; deep links skip them
  doorsDone = true;
  const notice = $('#wnotice');
  statusTimer = setTimeout(() => { notice.hidden = false; }, 5000);
  try {
    const m = await import('./walk.js');
    const w = await m.createWalk({
      root: $('#walk'), motion: motionOn(),
      hooks: { onReady() { clearTimeout(statusTimer); notice.hidden = true; }, onFail: why => fail(why), onPage: room => stopTour(room) },
    });
    walk = w; starting = false;
    if (/[?&]debug/.test(location.search)) window.__rw = w;           // test hook, only with ?debug
    w.start();
  } catch (e) { starting = false; fail(e); }
}
function fail(why) {
  console.warn('walkthrough unavailable:', why);
  stopTour(); say('The walkthrough could not start here. Everything is on this page.');
}
function stopTour(room) {
  clearTimeout(statusTimer); $('#wnotice').hidden = true;
  const r = room || (walk && walk.room) || 'reception';
  if (walk) { try { walk.dispose(); } catch (e) {} walk = null; }
  starting = false; $('#walk').classList.remove('arrive', 'open');
  html.classList.remove('tour'); setMode(false);
  const sec = document.getElementById(SECTION[r] || 'reception');
  if (sec && sec.id !== 'reception') sec.scrollIntoView({ block: 'start', behavior: 'instant' }); else scrollTo({ top: 0, behavior: 'auto' });
}

$('#door-tour').addEventListener('click', e => { e.preventDefault(); if (!html.classList.contains('tour')) { startTour(); scrollTo({ top: 0, behavior: 'auto' }); } });
$('#door-page').addEventListener('click', e => { e.preventDefault(); if (html.classList.contains('tour')) stopTour(); });
$('#view-toggle').addEventListener('click', () => { html.classList.contains('tour') ? stopTour() : startTour(); });
$('#walk').addEventListener('click', e => { if (e.target.closest('#w-notice-page')) { e.preventDefault(); stopTour(); } });   // delegated: the walkthrough markup is rebuilt on each tour

if (html.classList.contains('tour')) { html.classList.remove('tour'); startTour(); }
else setMode(false);
