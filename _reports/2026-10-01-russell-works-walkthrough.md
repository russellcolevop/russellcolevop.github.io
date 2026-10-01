# Russell Works walkthrough (2026-10-01)

URL: https://russellcolevop.github.io/works/ (unlisted, noindex). Scope: `works/` and this report and HANDOFF.md. Root, hub, achievements, dev, sales, founders, investors, profiles.json, build-profiles.py untouched. Panoramas read from RussellLabs (design package, read-only).

## What was built
- `works/walk.js`: Three.js camera inside an inverted sphere (8 full panoramas) or a partial band (4 cylindrical strips: reception, operations, gallery, contact; spanDeg 270, spanPitch 90, view yaw and pitch clamped to the strip with the live FOV, 3 degree vertex-colour fade at the edges). Drag, pinch, wheel, arrow keys, "Use motion" (DeviceOrientation, iOS permission on tap). Hotspots are HTML buttons projected from bearing and pitch, 44 px minimum, label on hover, focus or when near the view centre. Walking fades to black over 250 ms (none under reduced motion), swaps the texture, faces the walked bearing (reception always faces north). Hash is the room; Back and Forward walk.
- `works/rooms.json`: all bearings, pitches, sprites, sheet copy, plinth cards, map dots. Bearings were measured from each image, not the compass text. Biggest differences from the text: reception curriculum door at +62 (text east), gallery door at -89; curriculum to customers at +123 and to reception at -81; operations to ventures at -84 (text said south); ventures to operations at 0 (text north) and to gallery at 180; achievements reception 0 / gallery -134 / contact +134; reference wall reception +139, ventures -146.
- Sprites: Russell greeting behind the reception desk (cut at the desk top), bench pose behind the workshop bench (cut at his hands), folio pose seated in the ventures room; seven reference figures on the first seven of eight detected floor marks (found by colour in pano-references), scaled to 1.75 m from each mark's pitch (distance = 1.6 m / tan(pitch)), always facing the camera, each a button opening the existing card (cloned from the one-page DOM). Rachael = ref-neutral-2.
- Sheet: phone bottom drawer starting at a peek (grabber, heading visible); desktop 380 px right column. Heading focus and one polite announcement on room change. Every hotspot has a button in the sheet (doorways, bench, plinths, figures, contact actions).
- Mini-map: `img/building-model.webp` with numbered dots (approximate), room list, "You are here", walks on tap.
- Removed: `tour3d.js`, `tools/build_images.py`, layer and plate assets used only by the retired tour (elevator pieces, door, *-fg, *-mid, references plates, fuwari-screen, layers.json). One-page images kept. The one-page hero image is now `loading="lazy"` so the walkthrough does not fetch it (saved 128 KB phone / 217 KB desktop); otherwise the one-page markup is unchanged.
- New tool: `works/tools/build_panos.py` (jpg to WebP q70/72, plus the folio sprite).

## Verified (built-in browser, local no-store server, `?debug=raf`)
| Check | Result |
|---|---|
| Console errors, phone 375 and desktop 1440, tour and page | 0 |
| Every doorway hotspot (25 of them) at 375 px: centred then clicked | all 25 walk to the right room, button on screen, facing = walked bearing (clamped in the 4 strips; reception faces 0) |
| Strips clamp | yaw clamped to the strip edge at the live FOV (e.g. gallery -170 request gives -107 at 375 px), pitch clamped |
| Figures | 7 buttons, 44 px min, Rachael click opens her card in the sheet |
| Russell | present in reception, workshop, ventures |
| Bench pins and plinths | pin opens card in sheet, camera pans to it |
| Horizontal scroll | none (scrollWidth 375 phone, 1440 desktop) |
| Back, Forward, One-page version, Take the tour door | ok; leaving lands on the matching one-page section |
| Mini-map | opens, 12 rooms, You are here, walks |

## Transfer, first room (elevator)
Raw bytes from Resource Timing on the local server (no gzip); gzip estimated with `gzip -9` on text (three.js 179 KB gz, other code and json 31 KB gz); images and fonts as-is.
| View | Raw | Gzip estimate | Includes |
|---|---|---|---|
| Phone 375, elevator only | 1.21 MB | 0.60 MB | pano-elevator-phone 297 KB, three 720 KB raw, fonts 90 KB, html/css/js/json |
| Phone, plus reception preloaded | 1.52 MB | 0.91 MB | reception strip 311 KB preloaded because its doorway is in view |
| Desktop 1440 (8192 file), elevator only | 1.60 MB | 1.28 MB | pano-elevator 683 KB |
| Desktop, plus reception preloaded | 2.30 MB | 1.98 MB | cyl-reception 699 KB |
Budgets (phone 1.2 MB, desktop 2.5 MB) hold on the gzip figures and the raw phone figure; raw phone is at the limit only because three.js is 720 KB uncompressed. Live gzip figure below.

## Judgement calls and stand-ins
- Desktop canvas is the area left of the 380 px panel, not behind it.
- The four strips use FOV 60 on phones too (spec says 75) so the vertical clamp (45 minus half the FOV) leaves room to reach floor-level objects such as the model.
- Strip projection is assumed to be equidistant over 270 by 90 degrees; the generation report says the angular field is not metrically certified. Rendering looks right, but bearings in strips are approximate.
- Strip bearings are not the compass bearings (reception elevator is at -121, not 180); the arrival heading uses the departure bearing clamped to the strip.
- Sprite scale and the cuts at the desk and bench are estimates from the images. Rachael, Samantha and MaryAnn are generic figures; Harrison's portrait identity is still pending. Russell's folio pose is seated and sits in the doorway gap, not truly beside the folio.
- Reception hotspots: the model opens the mini-map, the desk figure is "One-page version", the oxblood cabinet is "Downloads and contact", the curriculum door is "Take the tour". Content Studio has no panorama and appears on the one-page version only. Achievements has no door in the gallery or reception strips; it is reached from the next-room action on the reference wall, the map, or the contact room's door, and its own doors lead to reception, gallery and contact.
- Reference cards and bench text come from the one-page DOM; the plinth cards copy the one-page case text.
- Timings: `?debug=raf` swaps rAF for a timer because the pane is hidden; first-room transfer was measured at the page, not the live network (see below).

## Not verified
Lighthouse, VoiceOver, Safari, a real iPhone and Pixel, DeviceOrientation (no sensors here), pinch on touch hardware, GPU memory with 8192 textures on low-end phones (phones load 4096), OS reduced-motion emulation (code path only), keyboard-only walk through every room.

## Live readback (after push of 639876d)
- https://russellcolevop.github.io/works/, walk.js, rooms.json, pano-elevator(-phone), cyl-reception, cyl-contact-phone, pano-references and russell-folio.webp all returned 200 (gzip sizes: page 9.8 KB, walk.js 9.4 KB, rooms.json 5.1 KB).
- Desktop 1440 live, first room: 990 KB transferred (11 requests, 8192 file chosen), no console errors, scrollWidth 1440. Phone live figure not measured on a real device; the 0.60 MB gzip estimate stands.
