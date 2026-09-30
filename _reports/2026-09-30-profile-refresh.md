# Profile refresh, September 30, 2026

Owner: Russell Cole. Scope: public personal site and audience profiles, plus factual
corrections to the private FI application in RussellLabs. Review: Deep for public release.

## Goal and acceptance

Make the site useful for current job applications: explain Russell's AI tools, build
method, founder and ecosystem experience, and current versus historical product work.
Refresh root, engineering, sales, founders, investors, achievements, and hub. Preserve
their layouts and audience palettes. Verify generator reproducibility, local links,
metadata, mobile/desktop rendering and card interactions; obtain independent review;
publish on main and verify all live paths. Do not submit applications or contact employers.

## Positioning and boundaries

Lead: “I work at the edge of what is possible with AI, and turn it into working products.”
The requested top-0.01% idea is expressed as positioning, not an unsupported percentile.
No benchmark establishes a population rank. Full-time availability is Russell-confirmed. Public copy uses professional information only.

Just under US$1M raised and the highest cumulative judge-rated pitch score at program
end are direct Russell confirmations on September 30. Cohort location/year stay omitted
because FI's public 2021 label differs from Russell's 2020 recollection. Unlabeled $45K
MRR and mixed-currency aggregate funding claims are removed, not converted or estimated.

## Claim evidence

- Fuwari: `RussellLabs/tidy-tails/HANDOFF.md`, September 30. Customer web app live;
  iPhone build 43 available in external TestFlight. No App Store release claimed.
  The no-data-loss GroomBook cutover is historical build evidence, not current counts.
- ChildCareOS: `RussellLabs/childcareos/HANDOFF.md`, September 23. Private web release;
  mobile and physical acceptance pending. No customer name, child data, internal
  source materials, or production table counts enter this site.
- Signal Engine: `RussellLabs/signal-engine/HANDOFF.md`, September 13. Local MCP
  integration and retained transcript/provenance artifacts, not public SaaS.
- Playing for Keeps: `fantasy-hockey-platform/HANDOFF.md`, current September checkpoint.
  League authentication, records, rules, fees and chat. No member or financial details.
- AgAR: `RussellLabs/agtech-ar-scouting/HANDOFF.md`, September 30 section. Public
  prototype copy; hosted data backend retired. No unverified traction, customer
  names, LOIs, funding or partnerships copied into the site.
- Koya: `RussellLabs/mission-control/HANDOFF.md`, September 16. Historical hosted
  dashboard retired. Current repositories, evidence and agent workflows remain.
- Auction/F1: respective `RussellLabs/*/HANDOFF.md` September 20 retirement sections.
  Historical/personal build evidence, no current-production claim.
- AIVA, enterprise and earlier founder background: existing public profile content
  and job-search resume. Keep to public role-level facts; no internal work product.
- FI Select Portfolio: Jonathan Greechan's October 5, 2022 email, documented in
  `RussellLabs/job-search-2026/applications/founder-institute-portfolio-success.md`.
  FI Canadian growth list: https://fi.co/50-CANADA.
- FI mentor arrangements: November/December 2021 emails documented in the same FI
  draft. Do not claim mentoring outcomes or treat the adviser as an endorsement.
- AI build tools and stack: local product sources and current handoffs; Claude/Codex
  used throughout this task. MCP integration verified in Signal Engine.
- Agent Reach: `RussellLabs/_reports/2026-09-24-agent-reach-global-install.md`.
- DeepSeek Harness: `RussellLabs/_reports/2026-09-13-deepseek-harness-playwright-verification.md`.
- Jev: `RussellLabs/_reports/2026-09-23-jev-evaluation.md`, September 24 activation.
  Only synthetic pilot access/contract tests; no accuracy or production adoption claim.

## Implementation

Shared `ai_practice` and stable achievement `id` / audience `work_ids` replace
duplicated profile card copy. Generator renders four audience pages and achievements;
root and hub remain hand-maintained. Existing palettes and interaction code retained.
Added canonical URLs and corrected contact-card title. Missing agent-rule pointers added.

## Risks and verification plan

Unsupported superiority: use concrete work instead of population rank. Stale product
status: distinguish private, beta, local, prototype and historical work. Privacy: only
public role/product facts; exclude confidential information.
Renderer regression: structural, reproducibility, browser and interaction checks.
Publication: normal main push authorized by this task and global standing rules;
rollback by reverting this scoped release, never rewriting history.

Machine guard initially held an abandoned RENs browser-acceptance lease. `ps` found
the recorded supervisor absent. The guard's exact-token `recover` path independently
validated the dead owner and recovered the lease; preflight then passed (26 GiB free,
about 6.7 GiB swap, 43% memory free). No active process or other-owner job was stopped.

## Verification results

Local browser acceptance passed all seven routes at 1440px and 390px: no horizontal overflow, expandable cards open/close, relative links HTTP 200, zero page errors. Root mobile, engineering desktop and social image were visually inspected. Five generated pages were byte-identical after rerunning the generator. Independent review passed after remediation; final live readback follows deployment. Structural checks passed for
all seven pages: unique IDs, valid ARIA references, canonical and social metadata,
valid JSON-LD, and no em dashes. Generator ran successfully. No stale test/live-backend
counts, funding aggregates, or percentile claims remain on those surfaces.

Independent specialist review approved after targeted remediation: 0 Critical / 0 Important.
Fixed the hub favicon path and checked it in the browser resource test. FI copy now
states invitation/scheduled office hours rather than inferring session attendance.
Removed obsolete default metrics from the renderer and corrected schema documentation.
Voice/claim checks: direct wording, no em dashes or unsupported superiority percentile;
source/status boundaries preserved. No private customer or family information included.

Git recovery: empty index.lock dated September 28 had no lsof owner or active Git process. Preserved its bytes at _reports/2026-09-30-recovered-index-lock.empty before resuming normal Git. Fresh independent rereview: 0 Critical / 0 Important / 0 Minor.

## Live release verified

Content commit cccbdedf34f1082903ed07b49f3d5707049f4ed1 reached origin/main.
GitHub Pages run 36741061885 completed successfully. Live byte readback matches
all seven HTML pages and the new PNG exactly; SHA-256 evidence is in
2026-09-30-browser/live-byte-readback.json. Live browser acceptance passed
desktop/mobile rendering, card interactions, local links including favicon resources,
metadata and zero page errors; live-checks.json and live screenshots retained.

OpenGraph.xyz scanned the live URL and its LinkedIn preview was visually inspected:
https://www.opengraph.xyz/url/https%3A%2F%2Frussellcolevop.github.io%2F
The updated title, portrait graphic and destination display correctly. Inspector
reported zero errors, a clean image fetch and 1200x630 PNG dimensions. Three
non-blocking marketing suggestions remain: no image CTA, 134-character description
may truncate, and optional og:site_name omitted. No account/profile modification
or public social post was made by this preview check.

Final specialist review: 0 Critical / 0 Important / 0 Minor after all fixes.
This release updates only the profiles hosted on Russell site, not LinkedIn accounts.
Application corrections separately reached RussellLabs main at 2dcc3e1d.
