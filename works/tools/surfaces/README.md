> Provenance copy (October 1, 2026). `surfaces.json` and this README are the measurement record behind the `surfaces` arrays in `works/rooms.json`; the site does not read either file. The measurement scripts (`rerun.sh`, `measure.js`, `lib.js`, `rail.js`, `build.js` and the rest), the overlays and the crops stay in the original scratch folder and are not part of this repository. `rerun.sh` needs `sharp` (WebP decode and PNG encode), which was borrowed read-only from `plumcom-site/node_modules` (`SHARP_PATH` points it at another install); nothing was installed. Links below to `overlays/`, `crops/`, `rejected.json` and `optional.json` refer to that scratch folder.

# Russell Works: blank surface measurements

Read-only measurement of the seven sphere rooms (curriculum, workshop, product, customers, ventures, references, achievements).
Source images: `russellcole-site/works/pano/pano-<room>.webp` (8192 x 4096) and `pano-<room>-phone.webp` (4096 x 2048). Nothing in any repository was touched.

## Files

| file | what |
|---|---|
| `surfaces.json` | accepted surfaces, `{ room: [ { id, kind, corners, occluded, note, tier, size, fit } ] }`. `fit.withinTolerance` is true unless an exception is stated; `fit.cornersInferred` lists corners hidden behind an object |
| `rejected.json` | everything measured or considered and not accepted, with the reason; two borderline desk sheets and one seam sliver keep their corners |
| `optional.json` | NOT blank display surfaces: big stone-wall zones (references 3, curriculum 2) offered only as a fallback |
| `overlays/<room>-overlay.png` (+ `-2400`) | 4096 px sphere with accepted quads outlined, numbered and a legend (number = array order in `surfaces.json`) |
| `crops/<id>-fov60.png` | rectilinear view, fov 60, centred on the surface, quad outlined, corners numbered 1-4 (TL, TR, BR, BL) |
| `crops/<id>-tight.png` | same, framed at about 2x the surface, from the 8192 file |
| `crops/<id>-corners.png` | four close-ups (1.6 to 5 deg across), one per corner, quad edge drawn 1 px; this is the sheet used to judge the 0.3 deg fit |
| `rejected/`, `optional/` | the same overlays and crops for the borderline rejects and the optional wall zones |
| `rerun.sh` | reruns the whole pipeline (see Method) |

## Conventions

* Bearing b = (u - 0.5) x 360 (u = x / width), clockwise from north, range -180..180. Pitch p = (0.5 - v) x 180 (v = y / height), positive up.
* `corners` = `[[b,p] x 4]` ordered top-left, top-right, bottom-right, bottom-left as seen by a viewer at the centre looking at the surface (bearing increases to the right).
* A quad edge is a straight line in a rectilinear view, i.e. a great-circle arc on the sphere. Draw or project the plane through the four corner directions; do not interpolate linearly in (b,p) over more than a few degrees (rail segments are small enough that either works).
* `size.widthDeg/heightDeg` are mean angular edge lengths. `size.physAspectWoverH` is the true width/height of the planar rectangle recovered from the four corner directions (pinhole homography), so a texture canvas can use it directly. `size.phone30` assumes a 375 px phone showing 30 deg (12.5 px per degree): the on-screen size in px and what fits at 13 px type (6.8 px avg glyph width, 17 px line height, 12 percent padding). Rough guide, not a layout.
* `tier`: `primary` = in the room and visible from the room centre; `doorway-far` = a surface in the NEXT room seen through a doorway (only visible when looking through the door, softer pixels); `desk` = a sheet lying on a desk, foreshortened, you must pitch down about 35 deg.

## Result per room


#### curriculum (8)

| # | id | kind | tier | size deg (w x h) | aspect w/h | phone 30 deg view | text capacity at 13 px type | occluded / fit flags |
|---|---|---|---|---|---|---|---|---|
| 1 | curriculum-rail-1 | rail | primary | 3.9 x 1.9 | 2.18 | 49 x 24 px | 1 line, ~6 chars | none |
| 2 | curriculum-rail-2 | rail | primary | 13.1 x 2 | 6.93 | 164 x 25 px | 1 line, ~21 chars | none |
| 3 | curriculum-rail-3 | rail | primary | 11.4 x 2.1 | 5.72 | 143 x 26 px | 1 line, ~18 chars | none |
| 4 | curriculum-rail-4 | rail | primary | 11.3 x 2.1 | 5.36 | 141 x 26 px | 1 line, ~18 chars | none |
| 5 | curriculum-rail-5 | rail | primary | 9.2 x 2.1 | 4.5 | 115 x 26 px | 1 line, ~14 chars | none |
| 6 | curriculum-rail-6 | rail | primary | 10.4 x 2.1 | 5 | 130 x 26 px | 1 line, ~16 chars | none |
| 7 | curriculum-rail-7 | rail | primary | 9.7 x 2 | 4.98 | 121 x 24 px | 1 line, ~15 chars | none |
| 8 | curriculum-whiteboard-far | whiteboard | doorway-far | 19.5 x 13.1 | 1.54 | 243 x 163 px | ~248 chars (31 x 8 lines) | none |

#### workshop (9)

| # | id | kind | tier | size deg (w x h) | aspect w/h | phone 30 deg view | text capacity at 13 px type | occluded / fit flags |
|---|---|---|---|---|---|---|---|---|
| 1 | workshop-panel-1 | panel | primary | 8 x 11 | 0.72 | 99 x 138 px | ~84 chars (12 x 7 lines) | none |
| 2 | workshop-panel-2 | panel | primary | 7.1 x 11.1 | 0.64 | 89 x 139 px | ~77 chars (11 x 7 lines) | none |
| 3 | workshop-panel-3 | panel | primary | 7.7 x 6 | 1.29 | 96 x 74 px | ~36 chars (12 x 3 lines) | none |
| 4 | workshop-panel-4 | panel | primary | 16.9 x 20.3 | 0.83 | 212 x 254 px | ~351 chars (27 x 13 lines) | none |
| 5 | workshop-panel-5 | panel | primary | 11.9 x 17.6 | 0.67 | 148 x 220 px | ~209 chars (19 x 11 lines) | none |
| 6 | workshop-panel-6 | panel | primary | 7.3 x 11 | 0.67 | 92 x 137 px | ~77 chars (11 x 7 lines) | none |
| 7 | workshop-whiteboard-far | whiteboard | doorway-far | 14 x 12.5 | 1.16 | 174 x 157 px | ~176 chars (22 x 8 lines) | partial: plant foliage over the bottom-right corner (about 1.5 deg); corner inferred: BR |
| 8 | workshop-frame-far-1 | frame | doorway-far | 6 x 12 | 0.51 | 74 x 150 px | ~63 chars (9 x 7 lines) | none |
| 9 | workshop-frame-far-2 | frame | doorway-far | 5 x 11.5 | 0.47 | 62 x 144 px | ~56 chars (8 x 7 lines) | none |

#### product (5)

| # | id | kind | tier | size deg (w x h) | aspect w/h | phone 30 deg view | text capacity at 13 px type | occluded / fit flags |
|---|---|---|---|---|---|---|---|---|
| 1 | product-sheet-1 | panel | primary | 14.2 x 20.3 | 0.69 | 177 x 254 px | ~286 chars (22 x 13 lines) | partial: brass pin at top centre (about 0.9 deg across) |
| 2 | product-sheet-2 | panel | primary | 15.9 x 21 | 0.74 | 198 x 263 px | ~325 chars (25 x 13 lines) | partial: brass pin at top centre (about 0.9 deg across) |
| 3 | product-sheet-3 | panel | primary | 14.8 x 20.6 | 0.71 | 186 x 258 px | ~312 chars (24 x 13 lines) | partial: brass pin at top centre (about 0.9 deg across) |
| 4 | product-monitor | monitor | primary | 36 x 17.7 | 1.98 | 450 x 221 px | ~638 chars (58 x 11 lines) | EXCEPTION: curved screen: bottom corners about 0.9 deg inside the true corners by design (inscribed); everything else within 0.2 deg |
| 5 | product-desk-sheet-2 | panel | desk | 15.8 x 9.3 | 1.34 | 197 x 116 px | ~150 chars (25 x 6 lines) | none |

#### customers (2)

| # | id | kind | tier | size deg (w x h) | aspect w/h | phone 30 deg view | text capacity at 13 px type | occluded / fit flags |
|---|---|---|---|---|---|---|---|---|
| 1 | customers-frame-1 | frame | primary | 12.6 x 33.3 | 0.4 | 157 x 417 px | ~420 chars (20 x 21 lines) | partial: four brass corner pins (about 0.8 deg across each) |
| 2 | customers-whiteboard-far | whiteboard | doorway-far | 17.7 x 10.6 | 1.66 | 222 x 133 px | ~168 chars (28 x 6 lines) | partial: potted plant in front of the lower-left corner (leaves cover about 30 percent of the bottom edge and 15 percent of the height there); three small pins on the top edge; corner inferred: BL |

#### ventures (6)

| # | id | kind | tier | size deg (w x h) | aspect w/h | phone 30 deg view | text capacity at 13 px type | occluded / fit flags |
|---|---|---|---|---|---|---|---|---|
| 1 | ventures-frame-L1 | frame | primary | 11.1 x 21 | 0.54 | 138 x 262 px | ~221 chars (17 x 13 lines) | none |
| 2 | ventures-frame-L2 | frame | primary | 9.6 x 19.2 | 0.53 | 120 x 239 px | ~180 chars (15 x 12 lines) | none |
| 3 | ventures-frame-L3 | frame | primary | 8.1 x 17.1 | 0.54 | 101 x 214 px | ~143 chars (13 x 11 lines) | none |
| 4 | ventures-frame-R1 | frame | primary | 8 x 17.1 | 0.56 | 100 x 213 px | ~132 chars (12 x 11 lines) | none |
| 5 | ventures-frame-R2 | frame | primary | 9.6 x 19.1 | 0.55 | 121 x 239 px | ~180 chars (15 x 12 lines) | none |
| 6 | ventures-frame-R3 | frame | primary | 12 x 21.2 | 0.57 | 150 x 265 px | ~247 chars (19 x 13 lines) | none |

#### references (0)

none

#### achievements (3)

| # | id | kind | tier | size deg (w x h) | aspect w/h | phone 30 deg view | text capacity at 13 px type | occluded / fit flags |
|---|---|---|---|---|---|---|---|---|
| 1 | achievements-frame-far-R | frame | doorway-far | 21.8 x 22.1 | 1.03 | 273 x 276 px | ~490 chars (35 x 14 lines) | partial: small vase with foliage over the middle of the bottom edge (about 40 percent of that edge, 7 percent of the height) |
| 2 | achievements-frame-far-L2 | frame | doorway-far | 6 x 13 | 0.67 | 75 x 163 px | ~72 chars (9 x 8 lines) | none |
| 3 | achievements-frame-far-L3 | frame | doorway-far | 7.8 x 15.2 | 0.66 | 98 x 190 px | ~108 chars (12 x 9 lines) | none |

Per-surface one-liners (what it is, physical aspect, occlusion detail) are in each record's `note` and `occluded`.

### Rooms in one line each

* **curriculum**: seven navy rail segments (2 deg tall: one line of text each; 5 sit between the wooden brackets, 2 are free end stubs) plus one far whiteboard through the right doorway. No big blank panel in the room itself; the stone wall above the rail is only offered as optional zones.
* **workshop**: six pinned paper panels on the curved navy felt board (one large 17 x 20 deg, one tall, four small), plus a far whiteboard (left door) and a far two-panel diptych (right door).
* **product**: three pinned sheets (14 x 20 deg each), a curved ultrawide monitor screen (36 x 18 deg, wider than the 30 deg phone view), one desk sheet.
* **customers**: one tall plate on the red felt wall (12.6 x 33 deg) and one far whiteboard through the centre doorway.
* **ventures**: six unframed gallery canvases (three each side, 8 to 12 x 17 to 21 deg, all about 0.55 aspect). The open ledger on the desk is rejected (warped pages).
* **references**: NO usable blank display surface. Only a plain limestone wall; three optional wall zones are in `optional.json`. `rooms.json` already stands seven reference figures at floor marks along that wall (b -66 to +67), so the lower part of any wall zone is occupied by sprites.
* **achievements**: nothing in the room itself (shelves and binders). Three far panels seen through the two doorways (one large 22 x 22 deg lounge frame; two gallery panels). A fourth (L1) is borderline and sits in `rejected.json`.

## Rejected (details in rejected.json)

* workshop-board, product-board: the backing boards are curved (cylindrical), edges bow 2 to 3 deg, 60 deg wide; no flat quad within 0.3 deg. Use the pinned sheets.
* ventures-frame-S: 5.6 deg sliver bisected by the panorama wrap seam at b = 180 (exposure step down its middle).
* ventures-ledger-left / -right: warped, non-planar pages at pitch -45 to -75; region fit and snapped fit differ by 0.9 / 1.3 deg.
* achievements-frame-far-L1: borderline. An olive tree hides the bottom-left corner and the lower 45 percent of the left edge, so that corner was inferred, never checked against an edge; 4096 and 8192 fits differ by 0.31 deg. The other three corners are within about 0.15 deg. Corners kept in `rejected.json`.
* product-desk-sheet-1 / -3: borderline. Edges wash out against a sun patch on the desk; best fit is within about 0.3 to 0.4 deg on some corners only. Corners are kept in `rejected.json` if you accept a looser tolerance. Crops in `rejected/crops/`.
* customers: two pinned notes in the doorway room (4 x 6 deg), open notebook on the desk (small, foreshortened), red felt wall (textured, not plain).
* ventures: two small panels in the meeting room behind the central door (5 x 12 deg, behind plants and chairs).
* curriculum: whole-rail single quad (90 deg wide on a cylinder, invalid; per-segment quads accepted instead); stone wall (optional only).
* references: nothing; see above.
* Not measured on purpose: binder spines, book covers, small frames deeper than the first doorway room, red felt walls.

## Method (so it can be rerun)

No PIL, numpy, scipy or OpenCV exist for any Python on this Mac (python3.9 through 3.14 checked), and nothing was installed. The pipeline is plain JavaScript (`node` 26) using `sharp` for WebP decode/PNG encode, borrowed read-only from `/Users/russellcole/Developer/plumcom-site/node_modules/sharp` (set `SHARP_PATH` to use another install). `bash rerun.sh` rebuilds everything; it takes about 25 seconds and reproduces `surfaces.json`, `rejected.json` and `optional.json` byte for byte (tested).

1. `lib.js`: loads a pano into raw RGB; renders a rectilinear view centred on any (b,p) at any fov (bilinear, wraps at the seam); features: lightness, saturation, local standard deviation (texture), blueness; box-filter morphology; connected components; convex hull; greedy minimum-area 4-gon; total-least-squares line fits with outlier trimming; corner ordering.
2. `measure.js`, per surface, on the 4096 file first and then the 8192 file (the 4096 result seeds the 8192 pass; the two are compared, column `d48` in the build log and `fit.delta4096vs8192Deg`):
   * Pinned sheets, monitor, felt plates (`config.js` entries with `ov` seeds): a seed point in a view centred on the surface; region = pixels whose lightness/saturation are within tolerance of the seed patch and whose local texture is low; close small holes (pins); component containing the seed; hull, 4-gon, four per-side line fits, corner intersections. The region sits 0.1 to 0.2 deg inside soft edges (texture window), so every side is then snapped to the strongest luminance edge along its normal (polarity: face brighter than surround), with shrinking windows 0.5 to 0.25 deg at 4096 and 0.35 to 0.18 deg at 8192, and the quad rebuilt from the four robust lines. A snap that moves more than 0.8 deg from the region fit is refused.
   * Low-contrast panels (ventures gallery, far whiteboards and frames, achievements, product monitor and desk sheets): colour thresholding fails here (the downlight hot-spot is a stronger gradient than the panel/wall step), so the region step is replaced by a rough quad (`rough:` in `config.js`) and only the edge snap is used.
   * `sideT` skips an occluded or curved stretch of a side when fitting it (achievements L1 left edge, monitor bottom edge).
3. `rail.js`: the curriculum rail is measured straight in equirect pixels (the wall is a cylinder round the camera, so the rail is a constant-pitch band): navy mask (dark, not wood-coloured), longest vertical run per column, segments = column runs at least 85 percent of median thickness, lines fitted to run tops and bottoms, 2 px inset at brackets, none at the free ends.
4. `build.js`: converts to the output schema, computes size, true aspect, phone capacity; `notes.js` holds the written occlusion/description calls, `rejections.js` the rejections. `optional.js` finds the stone-wall zones (wood-coloured beam above, bench below, 3 deg top margin, 2 deg bottom margin) for the optional list.
5. `render.js`: overlays and crops. `montage.js`, `peek.js`, `dbg.js` are review helpers.

## What was automatic and what was a human call

Seed positions and rough quads were picked by eye from overview renders (accuracy about 0.5 deg). Corners in `surfaces.json` come from the code. Accept/reject, occlusion notes and descriptions are my judgements from the crops. The tolerance was judged visually on `-corners.png` at 120 to 190 px per degree; I make no claim finer than about 0.1 deg.

## Tolerance rule and review log

Rule: a surface is accepted when every corner lies within about 0.3 deg of the visible edge of the face, judged on the `-corners.png` close-ups (120 to 190 px per degree). A corner hidden behind an object is allowed only when it is a short extension of two verified edges; it is listed in `fit.cornersInferred`. One accepted exception (`fit.withinTolerance: false`): `product-monitor`.

Every accepted surface has had its overlay, fov60 crop, tight crop and all four corner close-ups looked at (rejected ones: the same where a quad exists). Findings:

* Pinned sheets, felt plate, rail, gallery canvases: corners hug the visible face within about 0.1 deg.
* product-monitor (EXCEPTION): the screen is curved. The bottom edge bows up about 0.9 deg mid-span, so the quad is inscribed on purpose: its bottom edge sits on the mid-span edge, the two bottom corners are about 0.9 deg inside the true screen corners, nothing lands on the bezel, the corner slivers are lost. Top edge about 0.2 deg high (inner bezel line), sides within 0.1 deg. To get true corners instead, move the two bottom corners down about 0.9 deg.
* workshop-whiteboard-far (bottom-right) and customers-whiteboard-far (bottom-left): the corner is behind plant foliage and inferred from the two visible edges (about 1.5 deg extension). Nothing else about those fits is in doubt.
* achievements-frame-far-R: the vase hides about 40 percent of the bottom edge; the fit uses the visible part and the corners are clear.
* Doorway-far surfaces sit 15 to 30 deg off the room axis in blurrier pixels (edges 0.2 to 0.3 deg soft); their fit is within about 0.15 deg of the visible edge but the edge itself is fuzzy.
* Whiteboards on curved walls have slightly bowed top edges in the render; a flat quad is the chord.
* The renders are AI generated, so planes are only approximately planar and rectangles not quite rectangles (the diptych halves are slightly slanted); the quads follow the pixels, not an ideal rectangle.
* Pins, brass buttons and plants listed under `occluded` are painted objects in the panorama: unless the builder masks them or insets the text, text painted there will be hidden or collide.

Bearing convention check (read-only against `works/rooms.json` door hotspots, same convention): workshop `to-operations` b -84 and `to-product` b +83 against the far surfaces measured at b -83 and b +80; curriculum `to-customers` b 123 against 129; customers `to-product` b 0 against -7; achievements `to-gallery` b -134 and `to-contact` b +134 against panels at b -118 to -149 and +139; product `to-workshop` b -91 and ventures gallery door b 180 (the wrap seam where the sliver is) also agree. Signs and offsets match, so nothing is mirrored. These are raw image bearings: the viewer adds `yaw`/`pitch` per room at view time and that was not examined.
