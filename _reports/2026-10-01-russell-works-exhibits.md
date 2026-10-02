# Russell Works: exhibits on the display surfaces (2026-10-01)

Scope: `works/` (walk.js, works.css, rooms.json, tools/surfaces/), HANDOFF.md and this report. Root site, hub, profiles, build-profiles.py and the one-page version untouched. `/works/` is not linked from the root. Committed on main, not pushed (origin/main was 58fed39 at the start: `git rev-list --left-right --count origin/main...HEAD` was `0 0`).

Owner feedback that prompted it (iPhone): "I don't see anything in the rooms." The panoramas are renders with blank whiteboards, pinned sheets, a monitor and gallery canvases; the copy lived only in the collapsed card and the one-page DOM.

## What changed
- **Surfaces.** Per room `surfaces` in rooms.json (id, corners, aspect, ink, `paint`, `card`). Corners are the measured ones from `tools/surfaces/surfaces.json` (rounded to 0.01 degree); the site no longer needs the scratch folder. Each surface is an 8 x 8 grid quad: every vertex is the normalised bilinear blend of the four corner directions at radius 490, UVs 0..1, `depthTest` off, `renderOrder` 1 (above the panorama, below the figures).
- **Print.** One canvas per surface (about 1024 px on the long side, up to 2048 where the phone-size surface needs it; 2048 for the monitor), fonts awaited with `document.fonts.load` (Source Serif 4 600, Inter 400 and 600), mipmaps on, anisotropy min(4, device max). Blending is `CustomBlending` with no alpha: dark ink on an opaque white canvas multiplies the board's own light (src 0, dst src-colour); pale ink on an opaque black canvas screens onto the navy rail (src 1, dst 1-src-colour); the monitor is a normal opaque texture. Nothing paints on a pin: sheets carry a top margin of 1.7 degrees under the brass pin, the customer plate 1.4 degrees all round for its four corner pins.
- **Type size.** Sized for a 375 x 812 phone at the surface's own stop frame (CSS px per degree = 812 / (2 tan(fov/2)) in radians): body never below 15 px (Inter cap height 0.727 em = 10.9 px), headings 20 px and up, rail and venture names 16 px serif. If the full copy does not fit it carries its title (`paint.alt` gives a shorter title). Measured on the Fuwari sheet in a 375 px capture: the "O" of "One screen" is 11 rows tall.
- **Stops.** Per room `stops`: ordered shots (surface or hotspot ids, `at: "arrival"` keeps the old frame, `fill` the share of a phone's width the group may fill, `pad` degrees of air). Each is fitted at the moment it is used: centred on the group (unit vectors, so ventures straddling the seam at 180 is fine), zoomed until the group fills the width or the height clear of the masthead and the 56 px rail (phone 88 percent unless `fill`, desktop 62 percent), pitch lifted by half the inset difference. Phone zoom floor 26 degrees, desktop 36. Next pans (and zooms, same 380 ms ease) through them, then walks on. Back retraces and lands on the previous room's last stop. A doorway walk keeps the bearing it walked, then the first Next goes to stop 0; `home` doorways, the map, the popup and deep links open on stop 0. The counter stays at room level. No card opens by itself. **One list, one function:** `tour` is the ordered list of every stop in every room (20 stops, reception first, `{ room, i }`); `stopFrame(n)` gives `{ room, y, p, fov }` for global stop n at the current screen size; `goTo(n)` is the only function Next and Back call (below 0 the elevator, past the end the one-page version, another room a walk landing on that stop, same room a pan and zoom); `between(a, b, t)` is a pure helper returning the view at progress 0 to 1 from stop a to stop b (a pan and zoom with the yaw taken the short way round inside a room; across rooms there is nothing to pan through, so it stays on stop a until t reaches 1). `tour`, `goTo` and `between` are on the object `createWalk` returns, and `state().at` is the current global index. This is so a scroll-driven build can reuse them; no scroll handling was written. A newer pan cancels an older one (token), so two quick Next taps no longer fight. Next and Back aria-labels say "view 2 of 3 in ..." while a room has more.
- **Buttons.** Every painted surface has a transparent button in the hotspot layer (aria-label `Read: <title>`, canvas stays aria-hidden) covering its projected box (at least 44 px), off-view unless all four corners are in front, focusable and panning on focus like the other hotspots. It opens the existing object card (phone: the drawer, with the surface re-centred above it and zoomed out if taller; desktop: beside it with the leader line).
- **Strip rooms** (reception, operations, gallery, contact) are not surface-mapped. Their pins show always-on labels with a leader (kept on screen by a clamp). Operations has three name tags on the trays.
- **Debug.** `?debug=quads` outlines every surface; `__rw.state()` now lists each surface's canvas size, fitted type and px per degree, the stop frames, texture MB and `renderer.info.memory`.
- **Dispose.** Textures, canvases and geometry are released in `clearRoom`; a room token stops a late build from touching the next room.
- Provenance: `works/tools/surfaces/surfaces.json` and `README.md` (with a note that `rerun.sh` needs `sharp`, borrowed read-only from `plumcom-site/node_modules`).

## Content as built
| room | surface | on the surface | card |
|---|---|---|---|
| curriculum (pale ink on the navy rail, 4 stops) | rail 1 (3.9 degree stub) | May 4 | May 4, 2026 + the program sentence |
| | rail 2 | Fuwari · Playing for Keeps | status line of each |
| | rail 3 | Corbel · Stonewise | status line of each |
| | rail 4, 5, 6, 7 | ChildCareOS, Signal Engine, Ramara Hub, KoyaOS | its status line |
| workshop (3 stops, left to right = steps) | panel 1 (upper left) | 1 Source + line | same text |
| | panel 3 (lower left, small) | 2 Spec (title only) | same text |
| | panel 2 | 3 Bounded task + line | same text |
| | panel 4 (largest) | "AI helps me build. I own the result." then 4 Change + line | same text |
| | panels 5, 6 | 5 Check + line, 6 Release + line | same text |
| product (3 stops) | monitor | public demo at full brightness, HTML caption under it, exact figcaption | caption, Try the public demo |
| | sheet 1 | Make the next action clear. | the room paragraph |
| | sheet 2 | Fuwari + its line | the line |
| | sheet 3 | Stonewise + its line + "No clinical validation or health claims are made." | both |
| customers (1 stop) | tall plate | heading + Fuwari, AgXactly, Corbel lines, full | full |
| ventures (3 stops: Russell, left trio, right trio) | R1, R2, R3, L1, L2, L3 (left to right from the door) | Vesta.AI, Formation, Customers, Capital, Acquired, Wind-down (16 px titles) | the beat's sentence (Formation: the arc) |
| operations (1 stop) | three trays, far to near | name tags AIVA Network, Fuwari, KoyaOS (line under the name when zoomed in) | the #operations line |
| reception, gallery, contact | pins | always-on labels | unchanged |
| references, achievements | none | unchanged | unchanged |

Words: 99 strings in the new data checked against the one-page DOM and the previous rooms.json (`verify_words.py` in the scratch folder): 86 exact, 13 differ only in case (capitalised first word of a fragment: the three tray lines and the five venture titles with their cards), 0 missing. No figure beyond "just under US$1M". Content Studio does not appear.

## Stop frames (yaw, pitch, fov)
| room | phone 375 x 812 | desktop 1440 x 900 | before (phone yaw/pitch/fov) |
|---|---|---|---|
| curriculum | -34.5 7.3 44.9; -7.6 7.6 55.9; 20.6 7.4 49.8; 40.5 7.3 47 | all fov 36, pitch 5.4 | 45 -8 75 (bare wall and plant) |
| customers | 82.7 11.2 43.8 | 82.7 9.2 42.4 | 25 -18 75 (the plate was not in it) |
| product | 1.4 -12.5 78.8; -10.5 10.9 74; 21.4 9.6 36.2 | 37.2, 36.8, 36 | -10 -6 75 |
| workshop | -24.1 6.9 42.2; -3.6 7.7 40.9; 21.6 6.8 51.4 | all fov 36 | 12 -6 75 |
| operations | 0.5 -14.9 53.5 | 0.5 -17.3 45.6 | -5 -14 60 |
| ventures | 28 -9 75 (Russell, kept); 155.1 14.1 73.9; -154.4 13.9 74.2 | 28 -9 60; 38.2; 37 | same |
Reception, gallery, references, achievements, contact: one stop, arrival frame unchanged.

## Checks (built-in browser, local no-store server, `?debug=raf`, fresh tab per size; the console reader was confirmed live with a probe in each)
| Check | 375x812 | 1440x900 |
|---|---|---|
| Console errors or warnings, popup, Take the tour, 19 Next, 20 Back, 27 doorways, card clicks | 0 (the probe only) | 0 (the probe only) |
| `scrollWidth` | 375 | 1440 |
| Next from reception to contact | reception > curriculum x4 > customers > product x3 > workshop x3 > operations > ventures x3 > gallery > references > achievements > contact: 19 taps, last button reads One-page version | same 19 |
| Back from contact | exact reverse (lands on each room's last stop), 20 taps, elevator popup shown, rail hidden | same |
| Global index | `state().at` runs 0 to 19 in route order, `tour` length 20; after a doorway walk (stop -1) Next goes to the room's stop 0 and Back to the previous room's last stop; `between(6, 7, t)` returned product stop 0 at t 0, the midpoint at 0.5, stop 1 at 1; `between(5, 6, 0.5)` (across rooms) stayed on customers | same flow, run after the refactor in both sizes |
| Doorways walking to the right room | 27 of 27 (10 + 9 + 8 in three runs) | 27 of 27 |
| Doorway landing | walked bearing, stop -1 so the next Next goes to stop 0; the four `home` doorways open on stop 0 | same code |
| Surface, placard and caption buttons open the right card | all 28 buttons (7 rail, 6 workshop, 3 sheets, monitor and its caption, plate, 6 canvases, 3 tags): card heading equals the aria-label; workshop panels 5 and 6 only after focus (they start off view) | panels 5 and 6 and 1 and 4 again via focus |
| Tab order | from the header: Read 1 Source, 2, 3, then 4 to 6 (off view), then the bench pins | not repeated |
| Focus pans | panel 5 off view: focus moved yaw -24 to 16.5 and it came on view; panel 1 back to -27.8 | not repeated |
| Escape on a surface card | not repeated | card closes and focus returns to the surface button (4 panels) |
| No swim | customers plate, ?debug=quads: at yaw -10 and at yaw +10 / pitch +8 the text keeps its place against the plate edges and corner pins | not repeated |
| Printed, not floating | the board's lighting shows through (multiply), pins stay visible, rail text sits in the enamel | seen |
| Cap height on screen | "O" of "One screen" on the Fuwari sheet: 11 rows in a 375 px capture | n/a |
| Phone card re-frame | Stonewise sheet: stays at fov 36 above the drawer; customers plate: zooms out 43.8 to 76.9 to clear the taller drawer | card beside it, clamped |
| Texture count and GPU estimate (RGBA8 + mips) | curriculum 7 textures 8.9 MB; customers 1, 2.9 MB; product 4, 23.3 MB (the monitor is 11.3 of it); workshop 6, 24.1 MB; ventures 6, 18.4 MB; operations, gallery, references, achievements, contact, reception none | same canvases |
| WebGL textures in the context after arriving (route order) | 11, 10, 13, 13, 9, 9, 8, 9, 9, 9, 8: it falls when the surface rooms are left | n/a |
| First-room transfer (elevator + reception strip, phone) | 13 requests. Nothing new is requested: fonts, canvases and the demo image load only when a room that has surfaces is entered. Bigger files, gzip: walk.js +5.0 KB, rooms.json +2.2 KB, works.css +0.3 KB (about +7.5 KB) | n/a |

## Screenshots inspected (final code unless noted)
Phone 375 x 812: every stop of curriculum (4), workshop (3), product (3), customers, ventures (3: Russell, left trio, right trio), operations, the gallery arrival, the product and customers cards on the phone drawer, the Stonewise sheet, ventures with `?debug=quads`. Desktop 1440 x 900: every stop of curriculum (4), workshop (3), product (3), customers, ventures (3), operations, the reception and contact labels, the monitor card. Not shot at 375: reception and contact labels.

## Judgement calls
- **The rail is navy.** Multiply cannot show on it, so it takes pale ink screened on. Dark ink multiplies everywhere else.
- **Counting.** One date plus eight names is nine labels for seven segments: two pairs, not one. The widest segment (13 degrees) carries the longest pair (Fuwari · Playing for Keeps), Corbel · Stonewise the next. The 3.9 degree stub cannot hold "May 4, 2026" at 16 px (83 px against about 62), so it says "May 4"; the card says May 4, 2026.
- **Legibility cost.** The four rail stops, three product stops, three workshop stops and three ventures stops are what a 15 to 16 px minimum needs. Zoom is 36 to 79 degrees; the 4096 phone panoramas are visibly soft behind the print at the tightest stops, the print stays sharp.
- **Ventures.** From the door the left-to-right order is R1, R2, R3, L1, L2, L3 (the ids are image left and right). The canvases are 8 to 12 degrees wide, so even a three-canvas stop only fits one word each. All six carry a title at the same 16 px for a uniform wall. "Acquisition" (89 px) does not fit the 9.6 degree canvas, so it says "Acquired"; its card says Acquisition. Russell on the stool stays stop 0.
- **Workshop order.** Panels 1 and 3 share a column (left edges -31.9 and -33.1): top then bottom, so 1 Source is the upper panel and 2 Spec the small lower one.
- **Monitor label.** An HTML caption anchored under the screen (13 px, exact figcaption words) rather than painted on the lit pixels: it stays legible and the demo keeps full brightness. The image is cover-fit but kept to the top so its own heading shows.
- **Stonewise qualifier** is painted on the sheet as well as in the card, since it fits.
- **Operations name tags** sit on the trays (tray centres b 0.5 to 0.6, pitch -9.7, -14.4, -22.9, read from the strip's own mapping); the line under the name joins only when zoomed in (22 px per degree), so stacked tags never collide.
- **Back lands on the previous room's last stop** so it is the exact inverse of Next. Map, popup and deep links land on stop 0.
- Customers, curriculum, product, workshop and operations now open on their first exhibit, not the old frame (the customers plate was not in the old one). Ventures keeps Russell.
- Stops are fitted per screen: desktop never zooms past 36 degrees, so the text there is larger in the world than on the phone but the room still shows.
- The painted text is decorative and aria-hidden; the buttons and cards carry the accessible text.
- Pinch range now spans the room's own range widened to include every stop.

## Not verified
Real iPhone and Android, Safari and WebKit (the blend factors and sRGB canvas textures were only run in Chromium; the hyphen-break regex avoids a lookbehind so a Safari older than 16.4 does not lose the whole module), the phone reception and contact labels as pictures, VoiceOver reading the new labels, Lighthouse, a low-end GPU (surface textures peak at about 24 MB plus three panoramas), device pixel ratio 3 (checks ran at 2), the reduced-motion path through the stops (code only), a resize or rotation while at a stop, a gyro at a stop, touch pinch limits after the widened range, the unlisted-page deploy (nothing pushed).
