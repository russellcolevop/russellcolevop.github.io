# Russell Works: walk-notes rebuild (2026-10-01)

Scope: `works/` (index.html `#walk` block, walk.js, works.js, works.css, rooms.json, img/door.webp), HANDOFF.md and this report. Root, hub, profiles, build-profiles.py untouched. `/works/` is not linked from the root. One-page version unchanged. Committed on main, not pushed.

## What changed
- Arrival: first tour load shows two bronze door leaves over the world. They stay closed until the first panorama texture resolves, then slide apart (1.1 s, `cubic-bezier(.65,0,.35,1)`, canvas eases 1.04 to 1), and the popup fades in at about 60%: "Welcome. Three ways in." with Take the tour, The one-page version, Downloads and contact (copy reused from the one-page `.doors`). No "Russell Cole / Founder" card. Walking back into the elevator shows the same popup, no doors. Deep links skip both. Reduced motion: no slide, doors fade in 200 ms.
- Motion on by default (touch devices only). `askMotion()` is called first, synchronously, in every popup choice, the popup close and the tilt toggle, plus a one-time capture listener for `click` and `touchend` on the view. Non-iOS touch devices listen from load. Off for `rw-motion=off` or prefers-reduced-motion. "Use motion" chip replaced by an icon toggle (`aria-pressed`, "Tilt to look"). The first event still calibrates; a finger on the screen wins.
- Reception arrival frame comes from rooms.json (`yaw`, `yawPhone`, `pitch`); the hard-coded "reception faces north" is gone. Elevator to reception uses the arrival frame; other doors still face the walked bearing.
- Reading surface: the side panel, docked sheet and every list are deleted from markup, CSS and code. One peek component: collapsed bar (room eyebrow, heading, chevron, x), tap or swipe up to read, swipe down or x hides it, a tap on the world folds it back, the room tag top-left brings it back.
- Object cards (bench pins, plinths, reference figures) open as a floating card beside the hotspot with a leader line on desktop (follows drag and tilt, clamped, closes when the hotspot leaves the view) and inside the peek on phones. Focus moves to the card heading; x or Escape closes and returns focus to the hotspot.
- Accessibility without the lists: `.hs.off` is now `opacity:0`, so off-view hotspots stay in the tab order and pan into view on focus. `overflow:clip` stops focus from scrolling the hotspot layer.
- Chrome: transparent masthead (brand, Map, Contact, One-page), room tag, drag hint, caption. Map dialog keeps the building model, no list, every dot is labelled with its room, current room highlighted.
- Corbel borrowed: floating plate with a hairline edge and soft shadow, tiny tracked room tag with a dot, thin leader line to the object. Palette is Russell Works (`--paper`, `--ink`, `--petrol`, `--ox`, `--ash`); no Corbel copy or branding.
- Door treatment: CSS only. Layered `linear-gradient` bronze body (tinted to the dark cab frame in `cyl-reception-phone.webp`), `repeating-linear-gradient` vertical brushed grain, two soft sheen bands, inner vignette; `img/door.webp` (the 1.6 KB slice-1 edge strip, restored from `639876d^`) is the 20 px meeting-edge trim on each leaf.

## Reception arrival (final)
| | yaw | yawPhone | pitch |
|---|---|---|---|
| spec start | 70 | 96 | -6 |
| shipped | 76 | 99 | -3 |
Phone 375x812: yaw 99 puts Russell centred (96 left him right of centre), pitch -3 shows his face and shoulders above the desk with the 56 px bar clear below. Desktop 1440x900: yaw 76 keeps the curriculum doorway (left third) and Russell (right third) both in frame. The desk pin moved from p 2 to p 8 so it floats above his head, and pin labels now sit above the pin so they never cover his face.

## Checks (built-in browser, local no-store server, `?debug=raf`, fresh tab for the console count)
| Check | 375x812 | 1440x900 |
|---|---|---|
| Console errors, full flow incl. 27-doorway walk | 0 | 0 |
| Resource responses with status 400 or more | 0 | 0 |
| `scrollWidth` | 375 | 1440 |
| Canvas size | full-bleed | 1440x900 = window |
| Element docked at a side (scan of `#walk`) | none | none |
| Collapsed peek (`#wsheet` rect height) | 56 px | 56 px |
| Expanded peek | 406 px = 50.0% of height | pill 360 px wide, floating |
| Masthead on one line | yes, right edge 367 of 375 | yes |
| Doorways that walk to the right room (centre, click) | 27 of 27 | 27 of 27 |
| Tab order, reception | all 6 hotspots reached, 5 of them off-view; after focus each pans into view (curriculum yaw 62, gallery -89, elevator -120, model pitch -15 clamped, downloads 118 pitch 14) | not repeated |
| Escape on a card returns focus to the hotspot | yes (docked card moves back, peek restored) | yes |
| Card follows the view; closes when the hotspot leaves | n/a (docks) | moved 915 to 806 px on an 8 degree pan; closed at yaw -120 |
| Card flips left near the right edge | n/a | yes (pin at 1079, card ends at 1053) |
| Peek: tap, tap on world, x, room tag, swipe up and down | open, peek, hide, peek, open, hide | tap and x verified |
| `requestPermission` stub flagged inside `el.click()` | called once, flag true right after click returned | n/a |
| Second click does not re-ask | called count stayed 1 | n/a |
| Rejected request (no gesture) keeps the backup armed | a later tap re-asked and turned tilt on; after a grant, no further calls | n/a |
| Synthetic `deviceorientation` | event 1 calibrates (yaw 0 to 0); events 2 and 3 move yaw 0, -30, -60 and pitch 0, -10, 10; toggle off freezes the view | n/a |
| Doors held until texture resolves | server delayed the elevator panorama 4 s: doors opened at 4.02 s | same code |
| Popup timing | +681 ms after open start (60% of 1.1 s) | |
| Doors removed | +1181 ms | |
| Reduced motion (`rw-motion=off`) | leaf `transform: none`, popup +175 ms, doors gone +274 ms, computed `transition: opacity .2s` on the doors | |
| Slow-load notice over the doors | shown at 5 s (8 s delay) | |
| Texture 404 on first room | onFail: page fallback with message, doors cleared | |
| Deep link `#workshop` | no doors, no popup, peek bar | |
| Tour, one-page, tour again | no doors second time, popup shown, handlers not duplicated | |
| Map: 12 labelled dots, no overlap, tap walks | yes (Product Studio dot walked to product) | yes, no overlap |

Screenshots inspected at both sizes, final code: doors closed, doors mid-open (desktop with a stretched 10 s transition, phone with 8 s), arrival popup, reception arrival (desktop yaw 76 / pitch -3, phone yaw 99 / pitch -3 with the desk pin at p 8), peek collapsed, expanded and hidden, bench card, reference-figure card (desktop Walt Duflock, phone MaryAnn McLennan), plinth card in the Company gallery, contact card, map. Doors-closed on phone was seen during a real delayed load; on desktop it was the `.arrive` class forced on.

## Judgement calls
- Reception numbers differ from the starting values (table above) after looking at the frames.
- Phone popup is centred vertically as well as horizontally, as written. It covers the glowing doorway until x is tapped.
- Phone object card is the same `#wcard` element moved into the peek body, with the room text hidden and the bar x hidden while it is there (one x). Back on close.
- Swipe down hides from collapsed or expanded (not stepwise). A tap on the world folds an expanded peek only; it does not close an object card.
- Contact card lists three buttons (Email, LinkedIn, Contact card). The old "Resume overview" sheet action is gone; its world pin remains. `sheet.ask`, `doors`, `bench`, `plinths`, `refs`, `contact` fields deleted from rooms.json as dead data.
- Plinths are in the Company gallery, not the product room; the plinth card was checked there. The doorway count is 27 (26 doors plus the Downloads pin), not the 25 in the earlier report.
- Map: twelve full labels do not fit the 283 px model on a phone without overlap (checked with a small solver), so the phone model is 340 px wide in a sideways-pannable strip that scrolls to the current room on open; label sides are set per dot in rooms.json (`map` third value).
- Caption: full sentence at bottom-right on desktop; on phones the short form sits under the room tag.
- `dispose()` now restores the `#walk` markup. Every listener is attached to static markup, so a second tour was stacking handlers (the old peek toggle would have double-fired). `#w-notice-page` is delegated from `#walk` for the same reason.
- Escape also folds an open peek (not asked for). The iOS "asked" flag is module scope: one request per session across stopTour and startTour. The click/touchend backup is removed only once a request settles as granted or denied; a rejection (no gesture) resets the flag so the next tap retries. The toggle can also retry on an explicit tap.
- The old "Résumé" header link is dropped to meet "at most three controls"; it stays in the contact card and the one-page version.

## Not verified
Real iPhone or Android, a real gyro (synthetic events only), Safari or WebKit, the real iOS permission prompt (stub only: the property tested is that the call happens synchronously inside the click), touch swipes (pointer events synthesised), pinch, Lighthouse, VoiceOver, an OS-level prefers-reduced-motion setting (the `rw-motion` path was used), the reduced-motion fade visually (computed style only, the pane does not step frames), `overflow: clip` fallback on Safari older than 16, notch safe areas (no `viewport-fit=cover`, so insets are 0), touch panning of the phone map, first-room transfer size after this change (the doors add img/door.webp, 1.6 KB).
