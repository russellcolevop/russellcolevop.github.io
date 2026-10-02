# Russell Works: route rail, Russell on the floor, arrival frames (2026-10-01)

Scope: `works/` (index.html `#wsheet` block, walk.js, works.css, rooms.json), HANDOFF.md and this report. Root site, hub, profiles, build-profiles.py and the one-page version untouched. `/works/` is not linked from the root. Committed on main, not pushed.

Owner feedback that prompted it (iPhone, live build): "simple way to get to the spots", "my body is cut off", and a teal focus ring around the bottom bar that stopped short of its x.

## What changed
- Route rail (merged into the peek bar). `<-  02 / 11  The Curriculum  ->` over 11 stops (`rooms.json` order minus the elevator, reception = 01). Back is an outlined 44 px circle, Next is the solid petrol button (52 x 44), the title is still the expand button (chevron kept), x still hides, the room tag top-left still restores. Next and Back call `walkTo` with no bearing, so they open on the room's arrival frame with the usual fade; non-adjacent walking is the same code path. Back from reception goes to the elevator, which shows the three-choice popup; the rail is hidden there. On contact the Next button reads "One-page version" and calls the existing `onPage` hook. aria-labels: "Next: The Curriculum", "Back: Elevator". If a walk starts from a rail button, focus stays on that button so the keyboard can step the whole route; any other room change (doorway, map, deep link) focuses the heading as before. Live announcement unchanged.
- Look: Corbel journey control reduced to its parts (big step number, small total, name, hairline-edged arrows), in Russell Works colours (`--ox` number, `--petrol` buttons, plate background). No Corbel copy. No progress line (the "02 / 11" carries it).
- Expanded card now opens above the rail, so Next never moves under the thumb. The sheet headline (old bar text) is the card's first line; the bar shows the room name.
- Desktop: the rail is a floating pill, bottom-centre, 480 px wide, 36 px off the bottom, collapsed corners fully rounded. The title still expands the floating card above it. Drag hint raised to 108 px, caption lowered to 10 px and held to one line (it wrapped into the pill at 1024 wide, checked at 1024 and 1440 after) so neither sits behind the pill; the object-card clamp moved to 108 px for the same reason.
- Russell's body (reception): `crop` 0.66 to 0, bearing 99 to 68, dist 3.6 to 2.5. Feet land at pitch -32.6 on the floor in front of the desk's left end, open floor to his right foot (at b 74 his right shoe was behind the desk's base line, inside the desk's face; at 68 it is clear). Head at +3.4, so he reads as 1.75 m beside a counter whose top is chest height in the image (about 1.2 m by the panorama's own geometry).
- Hard cuts elsewhere: ventures (`russell-folio`) showed the stool legs sliced flat above the floor, `crop` 0.26 to 0 puts the stool and shoes on the floor between the chairs. Workshop (`russell-bench`) left alone: the bottom edge sits at the table's far edge with his hands on the table, no cut over open air.
- Arrival frames: every room now has yaw, pitch (and yawPhone where phone differs) chosen from the best object. See the table. Next, Back, the map, the popup and deep links open on it. A doorway walk still faces the bearing walked through, except four doorways flagged `home: true` in rooms.json, which open the room on its arrival frame: customers to curriculum (b 180, bare wall), product to customers (b 180, mostly bare wall and floor on phones), reception to elevator (b -121, the elevator's side wall) and elevator to reception (the existing special case, now data instead of a code branch).
- Door labels now sit above the door pin (same as pins), so "Take the tour: the Curriculum" cannot cover Russell's face and is not clipped at the screen edge.
- A swipe that starts on Back, Next or the title no longer also clicks (400 ms guard, same as the title's existing one). Hover styling on the rail buttons is wrapped in `@media(hover:hover)` so it does not stick after a tap on a phone.
- Focus ring: `[tabindex="-1"]:focus{outline:none}` replaces three one-off rules. The room-change focus target is now the `h2#ws-h` (tabindex -1) instead of the toggle button, so no ring on iOS programmatic focus. `:focus-visible` rings on real controls untouched.

## Final arrival numbers (rooms.json)
Before values are the committed ac4b4f5 ones.

| room | yaw | yawPhone | pitch | before (yaw/yawPhone/pitch) | what the 375 arrival frames |
|---|---|---|---|---|---|
| elevator | 0 | none | 0 | 0 / none / 0 | elevator door (the popup is the UI) |
| reception | 78 | 68 | -13 | 76 / 99 / -3 | Russell centred on the floor, curriculum doorway pin left, desk end right |
| curriculum | 30 | 45 | -8 | 0 / none / 0 (bare wall) | peg rail end, bench, potted plant, sconce, lit studio at the right edge |
| customers | 25 | none | -18 | 0 / none / 0 | desk with the open notebook, brass lamp, glass door, studio beyond |
| product | -10 | none | -6 | 0 / none / 0 | curved monitor, two pinned sheets, pencil jar, paper |
| workshop | 12 | none | -6 | 0 / none / -4 | bench with lamp pin 4, Russell leaning on it, wall boards |
| operations | -5 | none | -14 | 0 / none / 0 | long table, the three trays |
| ventures | 28 | none | -9 | 0 / none / -8 | Russell seated on the stool, dining chairs in the foreground |
| gallery | 37 | none | -7 | 0 / none / -4 (bare wall) | two plinths with AgXactly and Playing for Keeps pins, courtyard tree |
| references | -9 | none | -5 | 0 / none / -6 | row of figures on their floor marks, one whole and two cut at the edges |
| achievements | -60 | none | -2 | 0 / none / 0 | wall of dated binders |
| contact | 0 | none | -8 | 0 / none / -8 | elevator door behind, round table with brass lamp, Resume overview pin |

Russell placements: reception `b 68, dist 2.5, crop 0, h 1.75` (was 99, 3.6, 0.66, 1.75). Ventures `b 28, dist 2.0, crop 0, h 1.35` (was crop 0.26). Workshop unchanged (`b 22, dist 2.57, crop 0.5`). Desk pin (b 99, p 8) and downloads pin (b 118, p 14) did not overlap him at either size, left unchanged.

## Checks (built-in browser, local no-store server, `?debug=raf`)
Final code (everything in the commit): the full flow at both sizes (popup, Take the tour, 10 Next, 11 Back, 27 doorways with centre hit-test), `scrollWidth`, rail height, real tap on Next at 375, swipe guard, console. A tab only paints, and so only sizes its canvas, after a screenshot, so each final run started with one. Earlier code, not repeated after later edits that do not touch these rules (hover wrap, caption nowrap, doorway narrowing, swipe guard): Tab rings, peek tap/swipe behaviour, object cards, 360 px title widths, programmatic-focus outline, desktop expanded card. The console reader was confirmed live with a probe; its two probe lines are the only entries in that tab.

| Check | 375x812 | 1440x900 |
|---|---|---|
| Console errors or warnings, full flow, final code | 0 new | 0 new |
| Resource responses 400 or more | none in the last 300 of 424 logged requests (all 200) | not read |
| `scrollWidth` | 375 | 1440 |
| Collapsed rail height | 56 px | 56 px, 480 wide, centre x 720 = viewport centre, 36 px above the bottom |
| Elevator popup then "Take the tour" | reception 01 / 11 | same |
| Next from reception walks the route | reception > curriculum > customers > product > workshop > operations > ventures > gallery > references > achievements > contact | same |
| Last stop | Next reads "One-page version", no aria-label, clicking it ends the tour and lands on the contact section | same label and class |
| Back from contact | back through every stop to the elevator; popup shown, rail display none | same |
| Doorways walking to the right room (centre hit-test then click) | 27 of 27 arrived; 26 centre-hit, the elevator door pin is under the popup on phones (clicked directly) | 27 of 27 centre-hit and arrived |
| Doorway yaw on arrival | the four `home` doorways land on the arrival frame (68, 0, 45, 25); the rest land on the bearing walked (product to workshop -91, workshop to product 83, reception to curriculum 62), strip rooms clamp to their edge (120 on phones) | the four land on 78, 0, 30, 25; the rest on the bearing walked, strip rooms clamp at 92 |
| Swipe that starts on the rail | synthetic swipe up on the row then an immediate Next click: stayed in the room, sheet opened; a click 500 ms later walked | n/a |
| Titles not truncated | all 11 at 375, all 11 at 360 (contact 56 of 56) | n/a |
| Real tap on Next (final code) | reception to curriculum, focus stays on `ws-next`, `:focus-visible` false, outline none, no ring in screenshot, rail 56 px, `scrollWidth` 375 | n/a |
| Programmatic focus on room change | walk with programmatic changes lands focus on `h2#ws-h` (tabindex -1) | in keyboard modality (`:focus-visible` true) the focused `ws-h` and the object-card h3 have computed outline `none` |
| Tab order and rings | not repeated (same CSS) | 20 Tabs: rail Back, title, Next, x, header chips, all six reception hotspots, room tag each `:focus-visible` with a 3 px solid ring (petrol on the rail, white over the world) |
| Peek behaviour | tap title open, world tap folds, x hides, room tag restores, synthetic swipe down hides and up opens, swipe guard stops a double toggle | tap and card verified |
| Object card on phone (bench pin 4) | docks above the rail, Next does not move (x slot kept), closes back to 56 px | card beside the pin, clamped above the pill (card bottom 592, pill top 808) |
| Russell's feet on the floor | screenshot after "Take the tour": shoes on open floor, 100 px above the rail | screenshot: shoes on open floor, curriculum doorway pin in frame |

Screenshots inspected (final or near-final code): every room's arrival at 375x812 (reception, curriculum, customers, product, workshop, operations, ventures, gallery, references, achievements, contact) and at 1440x900; the 27 doorway arrival frames as a phone and a desktop contact sheet (panorama only, no sprites); expanded rail at both sizes; phone object card; elevator popup; reception at both sizes. Customers was re-shot after its last edit (pitch -18) at both sizes: the notebook clears the desktop pill and the phone rail.

## Judgement calls
- Numbering: reception is 01 by the stated rule, so the Curriculum reads "02 / 11". The brief's `03 / 11 The Curriculum` was an example.
- The bar shows the room name; the old sheet headline moved into the card as its first line.
- Doorway frames follow the brief's rule per doorway: keep the walked bearing unless that frame is bare wall. I judged all 27 on a phone and a desktop contact sheet (panorama only, no sprites) and flagged only the four named above. Frames with content stay as they were, including ones I would have liked to change: every doorway into reception (it shows the desk, floor or building model, not Russell, except from the elevator), reception to curriculum (plant and doorway), reception to gallery (plinth), curriculum to customers (lamp, plant), reception or achievements to contact (a red shelf, not the pins), and the three doorways that land on the gallery strip's edge (ventures, references, achievements: wooden counter, floor, or the next room through glass). If Russell wants those to open on the arrival frame, add `"home": true` to the hotspot, one line each. The six rooms that keep the walked bearing all showed content at both sizes.
- Reception pitch -13 on both sizes: at fov 60 he is 35 degrees tall, so a shallower pitch puts his shoes behind the desktop pill or on the phone rail. The cyl strips clamp pitch at +/-15 at fov 60, which allows it.
- The chevron is hidden on the last stop to make room for "One-page version" (title would otherwise truncate to "Cont...").
- The expanded card still lists its own "Next: ..." and "Back to ..." buttons from `rooms.json` (existing copy); they now duplicate the rail. Left in place; deleting them is a copy decision for Russell.
- The sheet's x slot is kept (invisible) while a phone object card is open, so Next does not slide right.
- Reception door pin left at b 62; Russell's extended hand reaches about b 63 at hip height, well below the pin.
- Door labels above the pin is a global change to door pins (all rooms), not reception only.

## Not verified
Real iPhone or Android and Safari or WebKit (the ring fix is verified in Chrome with keyboard modality and a real mouse click; the iOS programmatic-focus behaviour that triggered it is not reproduced here), touch swipes (pointer events synthesised), VoiceOver and a screen reader reading the changed labels, widths below 360 px (320 not tried), a real gyro, Lighthouse, notch safe areas, the real-device feel of the 44 px targets, doorway frames with sprites (the contact sheet had none; gallery to references relies on figures being present, as seen in the app at yaw 0), print.
