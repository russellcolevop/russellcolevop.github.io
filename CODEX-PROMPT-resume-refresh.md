# Codex prompt — restore the build pipeline + refresh russellcole-site with current ventures

Paste everything in the code block into Codex. It contains the exact, vetted, public-safe copy
so Codex does not invent anything. Russell approved this roster and framing.

Why this prompt does two things: the site is data-driven from `profiles.json` (the source of
truth), which was meant to be rendered into the per-audience pages by a `build-profiles.py`
script. That script is missing from the repo, so right now edits do not propagate. Russell wants
future edits to be automatic (edit the JSON, rebuild), NOT hand-edited page by page. So Step 1
restores the pipeline, then Step 2 updates the content, then Step 3 regenerates.

---

```
You are (1) restoring the page-build pipeline for Russell Cole's resume site so it is
maintainable, then (2) refreshing its content with his current ventures.

=====================================================================
REPO + DEPLOY (read first)
=====================================================================
- Work ONLY in this repo: /Users/russellcole/Developer/russellcole-site
  It is the git root. It deploys via GitHub Pages from the repo root of branch main, so
  committing and pushing to main publishes the site. Treat every push as a live deploy.
- profiles.json is the documented source of truth. Its "achievements" array is the master board;
  each entry in "profiles" has "work_cards" and metadata for that audience page. The pages that
  are generated from it are: founders/index.html, investors/index.html, dev/index.html,
  sales/index.html, achievements/index.html. The root index.html is hand-maintained (general
  audience); update it by hand only where venture wording actually changes.
- Do NOT touch: private/, russell.vcf, screenshots/, assets/ (unless an image is explicitly
  needed), .git, .gstack, favicon.ico, the CSS/design, fonts, or the visual layout. You are
  changing WORDS, which venture cards appear, and restoring the renderer, not redesigning.
- Do NOT commit this prompt file or any scratch/output file. Commit only the site files.

=====================================================================
STEP 1 — RESTORE THE BUILD PIPELINE (do this before any content change)
=====================================================================
Goal: recreate build-profiles.py so that running it reads profiles.json and regenerates the
per-audience pages, and so future edits are just "edit profiles.json, run the script."

1. Reverse-engineer the page template from the CURRENT generated pages. Treat the existing
   dev/founders/investors/sales/achievements pages as the reference output. Derive the exact
   HTML skeleton each page type uses (head, header, card markup, footer) and where profiles.json
   fields (title, accent, work_cards, filtered achievements, metric, link, etc.) are injected.
2. Write build-profiles.py so that, run against the CURRENT unmodified profiles.json, it
   reproduces the current pages with no meaningful diff (whitespace-only differences are fine).
3. VERIFY parity: run the script on the unmodified profiles.json and diff its output against the
   committed pages. If the diff is empty or whitespace-only, the pipeline is faithful, proceed.
   If the diff is substantive (the script would change real content or structure), STOP and
   report the diff to Russell instead of overwriting the pages. Do not ship a lossy renderer.
4. Add a short PROFILES.md (or a header comment in build-profiles.py) documenting the workflow:
   "edit profiles.json, run `python3 build-profiles.py`, commit the regenerated pages."

Only once Step 1 parity is confirmed do you move to Step 2.

=====================================================================
STEP 2 — UPDATE CONTENT IN profiles.json
=====================================================================
KEEP these existing "achievements" entries unchanged: Ramara Hub, GroomBook, Auction Advisor,
AgXactly, OrganicGrow Solutions, Vesta.AI, Enterprise sales career, AIVA Network, KoyaOS.

EDIT the existing "Parallel Human Labs — products shipped end to end" entry, replacing it with
this studio umbrella entry (individual products get their own cards below, and it now links out):
{
  "title": "Parallel Human — my AI-native venture studio",
  "blurb": "My studio: one founder and a stack of AI agents building and running a portfolio of companies. The ventures here came out of it, each carried from blank page toward production with the same discipline: workflow research, information architecture, implementation, QA, and iteration.",
  "audiences": ["general", "dev", "investors", "founders"],
  "link": "https://www.parallelhuman.ai"
}

ADD these new entries, placed in the "achievements" array immediately AFTER "Auction Advisor"
and BEFORE "AgXactly", so current AI-native builds cluster at the top and career history stays
below:

{
  "title": "ChildCareOS — AI-native operations SaaS for childcare",
  "blurb": "Building an operations platform for licensed childcare centres: a funding console, attendance reconciliation, enrollment forecasting, and provincial compliance workflows. Scaffolded on Next.js and Supabase with a design partner engaged, directed end to end through an AI agent dev team under human-gated releases.",
  "audiences": ["dev", "founders", "investors"],
  "metric": "design partner engaged · multi-module platform in active build"
},
{
  "title": "Agtech AR scouting — heads-up pest management for greenhouses",
  "blurb": "Designing and building an augmented-reality platform for greenhouse integrated pest management: a perception layer that turns what an agronomist sees into pest and task alerts, plus an action dispatcher that routes the work. In active build with a design partner and a live backend.",
  "audiences": ["dev", "founders", "investors", "sales"],
  "metric": "design partner engaged · live backend · 53 passing tests"
},
{
  "title": "Signal Engine — video intelligence in one paste",
  "blurb": "A tool that turns any video link into a clean transcript, a summary, and purpose-specific insight. Phase 0 MVP in active build with a passing test suite; freemium model planned.",
  "audiences": ["dev", "founders", "investors", "general"],
  "metric": "MVP in build · 51 passing tests"
},
{
  "title": "F1 Fantasy Optimizer — live seasonal product",
  "blurb": "A Formula 1 fantasy-league optimizer that started as a tool for friends and shipped to production, pulling the season's data to recommend the highest-value lineup each race weekend.",
  "audiences": ["dev", "founders", "general"],
  "metric": "live in production"
},
{
  "title": "Corbel — AI-native RevOps consulting",
  "blurb": "A services-first consulting practice that reviews and rebuilds revenue-operations systems in Airtable and Notion, in Fix, Review, and Operate tiers. Full go-to-market built and readied for market: positioning, offer, pricing model, and pipeline.",
  "audiences": ["sales", "founders", "investors", "general"],
  "metric": "go-to-market ready"
},
{
  "title": "Life Archive — reclaim your digital life",
  "blurb": "A privacy-first platform that recovers and organizes a lifetime of scattered digital history into something searchable and meaningful. Started as tooling for my own archive and now being built toward a product, including a Conversation Mirror that indexes personal message history for recall.",
  "audiences": ["dev", "founders", "general"],
  "metric": "in active development · privacy-first architecture"
}

Resulting top-of-board order (current builds, then studio/infra, then career history):
Ramara Hub, GroomBook, Auction Advisor, ChildCareOS, Agtech AR scouting, Signal Engine,
F1 Fantasy Optimizer, Corbel, Life Archive, KoyaOS, Parallel Human (studio), then AgXactly,
OrganicGrow, Vesta.AI, Enterprise sales career, AIVA Network.

If any "profiles" entry has its own "work_cards", make sure the ventures shown on that audience
page (via work_cards or filtered achievements) use these same titles/blurbs/metrics.

=====================================================================
STEP 3 — REGENERATE + FIX THE ROOT PAGE
=====================================================================
- Run build-profiles.py to regenerate all per-audience pages from the updated profiles.json.
- Update the hand-maintained root index.html by hand only where venture wording changed, so it
  agrees with the new roster.

=====================================================================
PUBLIC-SAFETY RULES (do not violate)
=====================================================================
- No capital-raise language for the current ventures. Agtech AR scouting has NOT raised money;
  never imply a raise, valuation, equity, or ownership split for it. (Historical entries like
  AgXactly and Vesta.AI already state real past raises; leave those as written.)
- No client names, client financials, or engagement details anywhere (Corbel and ChildCareOS
  especially). No childcare operator names, centre names, or licence numbers.
- No IP, patent, or legal-status details for any venture.
- Ramara Hub stays framed strictly as a neutral civic-information product, never as campaign or
  political infrastructure.
- Do NOT add FounderOps Center / founderopscenter.com / agtech-ops-center, HOPE, IPM Scoutek /
  Redstick, or any client engagement anywhere.

=====================================================================
VERIFY, THEN COMMIT
=====================================================================
1. Confirm Step 1 parity was achieved (the renderer reproduces the pre-change pages), so the
   only content differences now are the intended Step 2 updates.
2. Grep the repo to confirm: the six new venture titles appear on the right pages; the old
   "Parallel Human Labs — products shipped end to end" wording is gone; "founderops",
   "founderopscenter", "agtech-ops", "scoutek", "redstick", and "HOPE" appear nowhere; no client
   names were introduced.
3. Open each changed page and confirm it renders with consistent styling and correct cards.
4. Stage only the intended files (explicit paths, never `git add -A`); do NOT stage this prompt
   file. Confirm `git status` shows only intended files.
5. Commit (e.g. "Restore build pipeline + refresh resume with current ventures") and push to main
   (this deploys via GitHub Pages).
6. Report back: the commit hash, the list of files changed, whether Step 1 parity was clean or
   needed a reported diff, and the grep results from step 2.
```

---

## Notes for you, Russell

- **AIVA Network stays**, framed neutrally (role + what you built), since your severance includes
  a positive reference. Nothing adversarial appears.
- **Life Archive** is now framed as an early venture, personal-first but being built toward a
  product, in line with your others. Say the word if you'd rather dial it back or cut it.
- **Scoutek (IPM Scoutek / Redstick)** is deliberately kept OFF the public site (it is a client
  engagement, and the prompt blocks it from appearing). Its value is the reference, not a public
  card. If you want it as a private consulting credential somewhere, that is a separate task.
- **Tidy Tails cleanup** is available whenever: the extra tidy-tails-* and tt-* folders are git
  worktrees, almost all marked prunable. I can give you a safe cleanup command to remove the
  stale ones and reclaim space (the main repo alone is 1.5G).
