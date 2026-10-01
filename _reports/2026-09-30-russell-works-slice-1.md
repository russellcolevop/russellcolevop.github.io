# Russell Works, slice 1 evidence (2026-09-30)

URL: https://russellcolevop.github.io/works/ (unlisted, `noindex`, not linked from anywhere).
Scope: everything under `works/`. Root, hub, profiles, `profiles.json`, `build-profiles.py` untouched.

## What exists
- `works/index.html`: the one-page version. Complete without JS. Hero + three doors, career strip (7 stops, each opens its evidence), How I work (six-position bench), four cases (Fuwari, Corbel, AgXactly, Playing for Keeps) + "Also built", reference wall (7 cards), contact.
- `works/tour3d.js` + `works/vendor/`: Three.js 0.180.0 (pin and hashes in `vendor/THREE-PIN.txt`). One canvas, `aria-hidden`, native scroll, no wheel handler, no render loop at rest (rAF only while animating).
- Tour: elevator (doors open 600 ms after first render, bronze panels clipped to the opening) -> 3.2 s walk -> reception (Russell standee behind a desk-foreground layer, three doors) -> AI Workshop (six numbered pins mapped to the list) -> Fuwari (public demo capture mapped onto the gallery monitor by homography) -> Reference Wall (seven stylized figures, each a button that opens its card) -> back to reception for contact.
- Modes: desktop >= 760 px with WebGL2 defaults to tour; narrower, no WebGL2, or Save-Data defaults to one-page. `?view=page` and `?view=tour` force either. Header "Enable 3D" / "One-page version" toggles live. Motion toggle remembered in localStorage; OS reduced-motion read before first paint (inline head script).
- Fonts self-hosted (Source Serif 4, Inter, Latin subset). No third-party requests.

## Verified (built-in browser, local no-store static server)
| Check | Result |
|---|---|
| Console errors, desktop tour + page + phone | 0 |
| Cross-origin requests (tour and page) | 0 |
| First room, desktop tour, uncompressed bytes | 1,612,148 (HTML 25.6 KB, three 720 KB, plates 480 KB, fonts 90 KB). Gzip on Pages will cut JS/CSS/HTML; image bytes are already WebP |
| First view, 375 px page mode, uncompressed bytes | 236,938 (target <= 800 KB) |
| Phone scrollWidth at 375 px | 375 (no horizontal scroll), page and tour |
| Tour at 375 px | stage 375x281 (4:3) sticky under the header; bench pins render at 44 px |
| Reduced motion (user toggle, persisted, reload) | html.reduce set, scroll-behavior auto, scene ready at 93 ms, no dolly, room switches instant |
| Keyboard | Tab order: skip links, brand, five nav links, view toggle, motion, three doors, strip buttons. Figure button Click focuses its card (`#ref-mclennan-m`) and marks it active |
| Tab/room switching | IntersectionObserver band; tour room follows scroll on desktop and at 375 px |
| Contrast (computed) | ink/paper 12.75, petrol/paper 7.17, muted/paper 6.32, oxblood/paper 7.24, white/petrol 8.16, gold/ink 9.14. All >= AA |
| Referee emails in `works/` | none. Only russellcolevop@gmail.com appears |
| Quotes verbatim | Haddad and Lapides sentences confirmed against the signed PDFs with `pdftotext`; Sam, MaryAnn, Rachael, Jim copied from the "Approved sentences, September 30" block |

## Not verified (remaining checks)
- Lighthouse (mobile >= 90 target): cannot run here.
- VoiceOver / any screen reader pass: cannot run here. Document order and labels were reviewed by reading the DOM only.
- OS-level `prefers-reduced-motion` emulation: not available in this browser pane. The same code path was exercised through the Motion toggle. Inline head script reads the media query; not exercised with the OS flag on.
- Safari, real iPhone, Pixel: none. Frame pacing and GPU memory unmeasured; no continuous loop exists at rest.
- Screenshots are downscaled in this tool, so fine visual detail (figure stylization, plate softness at zoom) was judged at reduced size.
- Live Pages readback: see HANDOFF.md for the result after push.

## Stand-ins and honest limits
| Item | Stand-in |
|---|---|
| Elevator plate | `elevator.png` concept (1672 px, not 2560) |
| Reception plate | `reception.png` concept; Russell and desk are separate layers cut from it |
| Workshop plate | `workshop.png` concept |
| Company gallery and Reference Wall plate | `company-gallery.png`, reused for Fuwari, gallery and wall |
| Depth layers | not generated; one plate per room, with Russell as a standee layer and a desk layer in front. Pointer parallax is a whole-scene pan plus Russell offset only |
| Russell | `russell-character.png` cut out as a still (flood-fill matte, feet removed because the desk hides them). No gesture animation; he fades and rises in once on arrival |
| Reference figures | 7 neutral flat illustrations drawn for this slice, not likenesses. Two share hair style; no skin-tone variation by design |
| Door panels | brushed-bronze strip sampled from the elevator plate and stretched |
| Phone crops | 4:3 crops of the same 1672 px plates at 1024 px |
| Fuwari screen | the Sept 30 public sample-shop demo capture (`works/img/fuwari-public-demo.jpg`), labelled as a website demo with made-up clients |

At the Fuwari zoom the plate is upscaled about 3.5x on a 2x display, so it is soft. The 2560 px plates fix this.

## Content decisions to review
- Walt Duflock quote: the section in NARRATIVE has no sentence for him. I took "He possesses a remarkable ability to identify emerging trends and translate them into practical, value-driven solutions." from his letter. It avoids the US$500,000 line.
- MaryAnn and Samantha McLennan share a surname. NARRATIVE says disclose the family relationship if asked; I did not add it to the cards.
- Jim's card uses the approved sentence ("brilliant at making a plain message land"), not the earlier draft.
- Money lines: Fuwari "Paid, live customer software, in daily use"; Corbel "Paid engagements" (no CAD figure); AgXactly "Raised just under US$1M"; PFK none. No revenue, appointment or client counts.
- Career strip: OrganicGrow has no detail on record, so it is paired with Vesta.AI and carries only the Vesta lesson.
- Résumé PDFs do not exist yet, so no PDF buttons. Downloads and contact offers vCard, email, LinkedIn and the existing standard résumé overview.

## Remaining (out of this slice)
Curriculum, Customer Studio, Content Studio (Cronk exhibit), Product, Operations, Venture, Achievements rooms; eight entrance pages; résumé PDFs; 2560 px plates and depth layers; rigged or gesturing Russell; referee likenesses; Lighthouse, VoiceOver, device tests listed above.
