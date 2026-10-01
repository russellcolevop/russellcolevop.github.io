# Russell Works, slice 2 evidence (2026-10-01)

URL: https://russellcolevop.github.io/works/ (unlisted, `noindex`). Scope: `works/` only. Root, hub, profiles, `profiles.json`, `build-profiles.py`, achievements, dev, sales, founders, investors untouched. Artwork read from RussellLabs at a5cac3c9, not modified.

## Conversion tool
Python 3.14 venv in the session scratchpad with Pillow 12.3 (libwebp) and numpy. `cwebp` and `sips` exist on this Mac, `avifenc` does not; Pillow could also write AVIF but WebP was kept for decoder reach (Safari 14+). Plates q64, phone plates q60, layers q68 (alpha q85), figures q74. No PNG fallback needed. Everything reproducible with `works/tools/build_images.py <artwork assets dir>`; the header lists the venv line.

## Layer-split method (hand-drawn polygons in `build_images.py`)
Every plate ships as a full opaque background plus alpha cut-outs. The background keeps the cut-out objects, so a small shift never shows a hole. Masks are polygons on a 1280-wide grid, feathered about 1.6 px. Cut-outs are cropped to their bounding box.

| Room | Background | Middle (depth 0.5) | Foreground (depth 1) | Props between |
|---|---|---|---|---|
| Elevator (desktop) | opening view, cropped | none | three opaque frame pieces (left panel, right panel, sill) | steel door leaves, sampled from the right jamb, clipped to the opening |
| Reception | full plate, painted model inpainted away | centre pier, potted olive | desk with lamp and vase bumps, left pier, plinth block | Russell greeting (0.8) behind the desk layer; building-model cut-out (1) on the plinth |
| Workshop | full plate | none | table, stools, floor, left column, with bumps for laptop, instruments, cups, plants, cube | Russell bench (0.9), hands on the table's far edge |
| Gallery (Fuwari) | full plate | plinths 2 to 4 and the pier | nearest plinth, left pier, right planter | Fuwari demo on a monitor prop standing on the nearest plinth |
| References | full plate | two piers and the wall bench | none | seven figures (1.4) |

The reception split worked first time, so no two-layer fallback was needed. Phones: the 4:3 phone plates are separately composed, so they have their own coordinates; they are single backgrounds with a foreground cut-out only for the reception desk and the workshop table. No scroll parallax layers on phones beyond those two, and the elevator is one plate with clipped door leaves. This is a deliberate reduction.

Parallax: layer offsets are set directly from scroll progress through the current room's text (no easing), max 12 x 30 world units per unit depth, zero under reduced motion. Pointer parallax (whole scene, 1.2 %) kept from slice 1.

## Scale rule (1.75 m)
Reception: desk top 1.05 m at the far edge, about 125 grid units per metre there, so Russell is 219 grid units tall, feet hidden behind the desk. Reference wall: horizon near grid y 310 from bench height, floor marks at y 530, so figures are 245 grid units (1.75 m). Workshop: table 0.75 m, Russell 262 units with hands on the far edge. These are estimates from the plates; the generator does not give a measured horizon. Phone values scaled from the phone plates the same way.

## Verified (built-in browser, local no-store static server)
| Check | Result |
|---|---|
| Console errors, tour desktop, tour phone 375, page desktop, page phone | 0 |
| All image requests | 200 |
| Elevator doors | closed doors in the first frame; open fully 600 ms after the first open frame (sampled with a 60 Hz timer shim) |
| Scroll parallax settle | mid layer offset changes on each scroll event and is final the frame after the last event (sampled every 16 ms, last event at 131 ms, final value at 163 ms) |
| Reduced motion (stored toggle) | scene ready immediately, no layer offsets, sp 0 |
| Rooms render new plates | reception (Russell, model), workshop (pins, Russell at bench), Fuwari (screen prop, pill), reference wall (7 figures on marks, eighth empty), at desktop and 375 px |
| Figures | 7 buttons in wall order, 44 px minimum, aria-labels; click opens the card (Rachael: `ref-rose` focused and marked on) |
| Horizontal scroll at 375 px | none (scrollWidth 375), tour and page |
| One-page rooms | seven new sections present with 16:9 plates (4:3 phone plates under 760 px) |

Transfer, first room. Summed from the built files after the final encode (HTML, CSS, JS, three.js, fonts and the room images; gzip estimated with `gzip -9` on text files, images and fonts as-is). The network tool figures from the live Pages URL are in the last section.

| View | Raw | Gzip estimate | Notes |
|---|---|---|---|
| Desktop tour, first room | 1.47 MB (images 580 KB, code 800 KB incl. three.js 720 KB, fonts 90 KB) | 0.87 MB | Local server measurement before the last quality drop was 1.51 MB net of a duplicate |
| Phone tour at 375 px, first room | 1.26 MB (images 367 KB) | 0.66 MB | phone plates, single-layer except desk |
| Phone one-page, first view | 279 KB measured | same | reception phone plate 128 KB, no three.js |

## Stand-ins and judgement calls
- Content Studio uses `product.png` and says so on the page.
- Fuwari screen is the Sept 30 public demo capture on a drawn monitor, not a render.
- Building model: the painted model on the plinth is inpainted out and the supplied model is placed over it, squashed to 72 % height to sit at the plate's viewing angle. It is a different design and orientation from the painted one; a small smooth patch remains at the plinth's left top.
- Rachael Rose uses `ref-neutral-2.png`; Samantha and MaryAnn are generic women, as ordered. Harrison's portrait is a candidate with identity pending in the generation report; it is used as instructed and listed under needs-russell. Fine print on the page states which figures are likenesses.
- "10,000 hours" from the §4 Curriculum headline was dropped: it is unsupported and cannot be true from May 4 to now. The headline reads "Since May 4: one program, shipped work."
- Curriculum entries carry status only; no release dates were invented.
- Content Studio copy uses the 26 clips and 106-slot calendar from NARRATIVE-v2 §4; Jim's reference card text is unchanged.
- Walt's quote unchanged; MaryAnn's card does not mention a family tie.
- Test hooks: `?debug` exposes `window.__rw`; `?debug=raf` swaps requestAnimationFrame for a 60 Hz timer because the pane is hidden between screenshots. Both are inert otherwise.
- Stage geometry changed: the tour stage is now a 16:10 frame (4:3 under 960 px) with a caption underneath, so the 16:9 plates show whole rooms; the old full-height stage cropped them to about 56 %.

## Not verified / remaining
- Lighthouse, VoiceOver or any screen reader, Safari, real iPhone and Android, GPU memory and frame pacing: cannot run here.
- OS-level `prefers-reduced-motion` emulation (the toggle path was exercised).
- Phone tour at 375 px: workshop, Fuwari and wall rooms were viewed; the first-figure button sits off-screen until focus pans the camera.
- Plates are Lanczos-upscaled from 1672 px natives (per the generation report), so fine detail at Fuwari zoom is soft.
- Resume PDFs still do not exist. Content Studio, Eight entrance pages, rigged Russell, folio pose (ventures room) are later slices.
- Tour is still five rooms; the other rooms are one-page only.

## Live readback (after push of d80e7d1)
- https://russellcolevop.github.io/works/ and these files returned 200: img/reception.webp, reception-fg.webp, russell-greeting.webp, ref-cronk.webp, layers.json, elevator-bg.webp, contact.webp, tour3d.js.
- Desktop tour, first room, Resource Timing on the live URL: 879,675 bytes transferred (gzip on, 22 files). Largest: reception.webp 217 KB, elevator-bg.webp 151 KB, three.core 102 KB gzip.
- Phone tour: the live read was served partly from cache (151 KB), so it is not a clean number. The clean figure remains the 0.66 MB gzip estimate above; measure on a real phone with an empty cache.
