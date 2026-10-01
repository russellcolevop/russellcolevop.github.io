push-state: main ahead 2 / behind 0 / dirty 0: walk-notes rebuild (3613241) plus review fixes (784d69d) committed and reviewed at 375 and 1440; push was blocked by the agent permission classifier, Russell pushes
visible-at: https://russellcolevop.github.io/ and https://russellcolevop.github.io/works/ (unlisted, noindex); live /works/ still serves the previous build, the walk-notes rebuild is local only until pushed
needs-russell: push main (git -C ~/Developer/russellcole-site push origin main); then on a real iPhone check the elevator doors, the tilt prompt on the first tap, the peek bar and object cards; run Lighthouse and VoiceOver; confirm the Harrison Lapides portrait; approve or edit the Walt Duflock quote; decide whether MaryAnn card discloses the McLennan family tie; confirm the Cronk/Content Studio copy

# Russell Cole personal site

Updated September 30, 2026. Public job-search portfolio and audience profiles.
Pushing main deploys GitHub Pages from the repository root. No custom domain.

- October 1 (walk notes): /works/ walkthrough UI rebuilt to Russell's phone-walk notes: elevator doors then a three-choice popup, motion asked on the first tap, thin peek bar, object cards beside the object, no side panel. Committed, not pushed. Evidence: _reports/2026-10-01-russell-works-walk-notes.md.
- October 1 (later): /works/ tour is now a 360 walkthrough (see below); the one-page version is unchanged.
- October 1: phones now default to the 3D tour when WebGL2 is available and Save-Data is off; the one-page version remains the fallback and the toggle. Russell saw only the landing page on his phone and asked for the tour.

## Current positioning

“I work at the edge of what is possible with AI, and turn it into working products.”
Concrete tools and build evidence support the statement; no population percentile claimed.
Ontario-based and available full-time.

Root, engineering, sales, founder, investor/portfolio, achievements and hub pages refreshed.
Stonewise added as a live installable care-companion web app, September 30.
Native iPhone release remains planned; no clinical validation or personal health claims.
AI-building positioning now spans research, design, development and operations,
with ownership through maintenance and no traditional software-engineering training.
PFK copy explains custom contracts, rosters, salary caps, fees, authentication and chat.
AI practice names Claude Code, Cowork, Codex, MCP, local transcription, browser workflows,
Agent Reach and the bounded Jev pilot, with testing and release accountability.
Current production, private releases, external beta, local tooling, prototypes and retired
backends are distinguished. AgXactly raised just under US$1M, Russell-confirmed.
FI score means highest cumulative judge-rated pitch at program end, not DNA assessment.
Cohort year/location omitted pending conflicting historical records.

## Editing

- profiles.json owns achievements, stable IDs, audience work_ids and shared ai_practice.
- python3 build-profiles.py generates dev, sales, founders, investors and achievements.
- Root and hub/index.html are hand-maintained. PROFILES.md describes the workflow.
- assets/profile-social-card.html is the reproducible 1200x630 share-card source.
- russell.vcf is the public contact card. Keep its positioning consistent.
- private/ is ignored and must never be published.

## Evidence and release

Claim sources, acceptance checks, review and release evidence:
_reports/2026-09-30-profile-refresh.md and
_reports/2026-09-30-application-site-sync.md.
Browser runner: _reports/verify-profile-pages.cjs, optional --live.
Seven routes verified at desktop/mobile sizes, links, card interactions and social metadata.
Independent Deep review and final live readback are recorded in the dated report.
Rollback uses a scoped revert, never rewritten history.

## Russell Works (/works/): one-page version plus 360 walkthrough

Unlisted résumé experience in `works/`. One-page version (default for no-WebGL, Save-Data, screen readers) is
unchanged. The tour is a walkthrough: `walk.js` (Three.js 0.180.0 pinned in `works/vendor/`) puts the camera inside
one panorama per room (12 rooms: elevator, reception, curriculum, customers, product, workshop, operations,
ventures, gallery, references, achievements, contact). Eight rooms are full 360 spheres; reception, operations,
gallery and contact are 270 degree strips (`cyl-*`) with the view clamped to the strip and a 3 degree edge fade.
`works/rooms.json` holds every hotspot bearing and pitch (read from where the doorway actually is in each image,
not the compass text), sprite placement (Russell, seven reference figures on the floor marks), sheet copy and mini-map
dots; tune it without touching code. Panoramas are WebP in `works/pano/` (phone 4096 wide, desktop 8192 only when
devicePixelRatio x width > 2048), rebuilt by `works/tools/build_panos.py <design package>/assets/panoramas`.
UI (walk notes build): the canvas is full-bleed on every screen and all text floats over it. First load plays bronze elevator doors (the loader) then a three-choice popup (tour, one-page, downloads and contact); deep links skip both. One peek bar (phone: bottom strip at most 56 px; desktop: pill bottom-left) shows room and heading, tap or swipe up to read, swipe down or x to hide, the room tag top-left brings it back. Bench pins, plinths and reference figures open a card (desktop: beside the object with a leader line; phone: inside the peek). No lists, no side panel. Tilt-to-look is on by default on touch devices (iOS permission is asked on the first tap, synchronously); arrival frame per room in rooms.json (yaw, yawPhone, pitch). Off-view hotspots stay tabbable and pan into view on focus. Hash is the room, Back and Forward work.
Plan: RussellLabs/job-search-2026/3d-resume-concept-2026-09-30/ (NARRATIVE-v2.md wins). Evidence:
_reports/2026-10-01-russell-works-walkthrough.md (current), earlier slices in the same folder.
The old plates-and-parallax tour, its layer images and `build_images.py` were removed; the one-page images are
the last build and have no rebuild tool now. Content Studio exists only on the one-page version (no panorama).
Still stand-ins: Rachael Rose, Samantha and MaryAnn figures are generic; Harrison's portrait identity pending.
Do not link /works/ from root until Lighthouse, VoiceOver and device checks pass and Russell approves.

## Related work

RussellLabs/job-search-2026/HANDOFF.md owns applications.
FI answers: RussellLabs/job-search-2026/applications/founder-institute-portfolio-success.md.
No job application or employer message was submitted as part of this site refresh.
External LinkedIn or other account profiles were not edited: this scope updates the
multiple profiles hosted on Russell site.

## Next

Use the live site and hub in applications. Refresh claims from current venture handoffs
when status changes, then regenerate, review and verify the live release.
