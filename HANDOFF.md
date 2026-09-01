---
last-updated: 2026-09-01
current-owner: Russell
lane: PRODUCT
---

# HANDOFF: russellcole-site (product repo)

push-state: `main` ahead 0 / behind 0 / dirty 0
visible-at: https://russellcolevop.github.io, per the repo name and `README.md`. There is no `CNAME` file, so no custom domain is configured. The URL was not loaded in this pass.
needs-russell: none

## What this is

Russell's personal landing site: who he is, what he has built, and how to reach
him. One hand-written `index.html` for the general audience, plus five pages
generated for specific readers (`dev`, `founders`, `investors`, `sales`,
`achievements`) and a `hub` page. No framework and no build step for the site
itself; Tailwind and the fonts load from a CDN. It deploys by pushing to `main`,
which GitHub Pages serves from the repo root, so every push to `main` is a live
publish.

The generated pages come from `profiles.json`, which is the source of truth for
the venture cards and achievements. A Python script renders it into the pages.

## Current state

Largely dormant. Last substantive work 2026-07-08.

- 5 commits total. First 2026-07-04, last 2026-09-01. The short history is because the repo's git history restarts at that first commit, not because the site is new; a build report from 2026-05-06 exists in the vault.
- 2026-07-08, `34161e4`, is the last real change: "Restore build pipeline + refresh resume with current ventures". That commit brought back `build-profiles.py` and refreshed the content.
- Everything after is housekeeping. 2026-08-26 added the `CODEX-PROMPT-resume-refresh.md` working note. The two 2026-09-01 commits add a `.gitignore` rule and remove a stray git maintenance lock file that had been committed by accident. Neither touched the site.
- The dirty count is 0 for the repo as it stood before this file. `HANDOFF.md` itself is untracked until Russell commits it.
- 32 files are tracked. `private/` and `.gstack/` are gitignored and stay local; `private/` holds professional reference material and must not be published.

## How to run or build it

To view it, open `index.html` in a browser. There is nothing to compile.

To change the audience pages, do not hand-edit them:

    1. edit profiles.json
    2. python3 build-profiles.py
    3. review the regenerated dev/, founders/, investors/, sales/, achievements/ pages

Verified 2026-09-01: the pipeline is genuinely reproducible. `build-profiles.py`
was run against the current unmodified `profiles.json` in a scratch copy outside
the repo, and all five generated pages came out byte-identical to the committed
ones, with `hub/index.html` untouched. So the generator and the committed output
are in sync, and a regeneration will not produce surprise diffs. The scratch copy
was used precisely so the run could not dirty this repo.

The root `index.html` is hand-maintained and is edited directly, only when the
general-audience wording changes. `PROFILES.md` documents this workflow.

## Known issues

- No custom domain. `README.md` documents how to add one (`CNAME` file plus DNS records) but it has not been done, so the site is on a github.io address.
- `CODEX-PROMPT-resume-refresh.md` is a working note that lives in the repo and is committed. Its own instructions say not to commit it. It is harmless but it is not site content.
- Content freshness was not audited. `profiles.json` lists 16 achievements including Ramara Hub, GroomBook, Auction Advisor, ChildCareOS, Signal Engine and Corbel, last refreshed 2026-07-08. Whether that still reflects what Russell wants a reader to see is his call, not a verifiable fact.
- Not verified: whether GitHub Pages is enabled, whether the URL serves, and whether the LinkedIn and image to-dos listed in `README.md` were ever completed.

## Where related context lives

There is no dedicated venture folder for this site in the vault. The closest
related records are:

- `~/Developer/RussellLabs/_reports/2026-05-06-russellcole-site-build.md`, the original build report.
- `~/Developer/RussellLabs/job-search-2026/HANDOFF.md`, which owns the current job-search positioning and outreach. It does not reference this site, so if the site is meant to back that positioning, the two are not yet connected.
- `CODEX-PROMPT-resume-refresh.md` in this repo, which records the approved roster and framing used for the July refresh.

## Next move

Leave it alone unless the content is wrong. If the ventures or framing on the
site no longer match how Russell is presenting himself, the fix is one pass:
edit `profiles.json`, run `python3 build-profiles.py`, review the diff, push.
The pipeline is proven working as of today, so that is a short job rather than
a rebuild.
