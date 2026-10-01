push-state: main ahead 0 / behind 0 / dirty 0 after Russell Works slice 2 push; recheck before writing
visible-at: https://russellcolevop.github.io/ and https://russellcolevop.github.io/works/ (unlisted, noindex)
needs-russell: confirm the Harrison Lapides portrait is the right person (generation report: identity pending); review /works/ in Safari and on a phone; approve or edit the Walt Duflock quote; decide whether MaryAnn card discloses the McLennan family tie; confirm the Cronk/Content Studio copy

# Russell Cole personal site

Updated September 30, 2026. Public job-search portfolio and audience profiles.
Pushing main deploys GitHub Pages from the repository root. No custom domain.

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

## Russell Works (/works/), slices 1 and 2

Unlisted résumé experience in `works/`: one-page version (default for no-WebGL, Save-Data, screen readers)
plus a Three.js tour (elevator, reception, AI workshop, Fuwari, reference wall); phones default to the tour
when WebGL2 is available. Slice 2 (October 1) replaced every stand-in plate with the finished 2560 px artwork
(phones: the 1600 x 1200 plates), hand-split each tour room into background, middle and foreground layers with
scroll parallax, added Russell's greeting and bench poses, the seven reference likenesses on the eight floor
marks (eighth mark empty), the building-model prop, and the other seven rooms as one-page-only sections.
Images are rebuilt by `works/tools/build_images.py` (see its header; source art is read from RussellLabs).
Still stand-ins: Content Studio uses the Product plate; Fuwari screen is the public demo capture on a drawn
monitor prop; Rachael Rose, Samantha and MaryAnn are generic figures. Three.js 0.180.0 pinned in `works/vendor/`.
Plan: RussellLabs/job-search-2026/3d-resume-concept-2026-09-30/ (NARRATIVE-v2.md wins). Evidence:
_reports/2026-09-30-russell-works-slice-1.md and _reports/2026-10-01-russell-works-slice-2.md. Do not link
/works/ from root until Lighthouse, VoiceOver and device checks pass and Russell approves.

## Related work

RussellLabs/job-search-2026/HANDOFF.md owns applications.
FI answers: RussellLabs/job-search-2026/applications/founder-institute-portfolio-success.md.
No job application or employer message was submitted as part of this site refresh.
External LinkedIn or other account profiles were not edited: this scope updates the
multiple profiles hosted on Russell site.

## Next

Use the live site and hub in applications. Refresh claims from current venture handoffs
when status changes, then regenerate, review and verify the live release.
