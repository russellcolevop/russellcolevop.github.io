# Profile Page Workflow

`profiles.json` is the source of truth for achievements, the shared AI-practice
section, and the generated audience pages. Updated 2026-10-04.

1. Edit `profiles.json`.
   Achievement `id` values are stable. Each profile selects them with `work_ids`;
   title, status, and body come from that one achievement definition.
2. Run `python3 build-profiles.py`.
3. Review the regenerated `dev/`, `founders/`, `investors/`, `sales/`, and `achievements/` pages.
4. Commit `profiles.json`, `build-profiles.py`, `PROFILES.md`, and the regenerated pages.

The root `index.html` is hand-maintained and should only be updated directly when the general-audience wording changes.
`hub/index.html` is also hand-maintained. The generator does not write the hub.
Keep root/hub summaries, metadata, and contact-card title aligned during refreshes.
Current resume exports are in `resume/`: the general view at `/resume/` and
seven tailored views below it. The separate resume source produces public-safe
HTML and Markdown only. Keep shared career facts aligned with `profiles.json`.
Root, hub and the four profiles link to the relevant resume. No PDF download
link is enabled until a PDF exists and its layout has been checked.

Preserve already submitted application records separately. PH/KoyaOS remain
labelled historical evidence on the deeper achievements board; main profiles
select the strongest role-relevant work.

Do not carry forward stale test counts, unlabeled currencies, or retired-backend
claims as current achievements. Evidence for the September refresh is in
`_reports/2026-09-30-profile-refresh.md`.

Product selections lead with Fuwari, Stonewise, ChildCareOS, Signal Engine and
AgAR where relevant, then Playing for Keeps. Business achievements remain
tailored to each audience. The tour features Stonewise in its fourth gallery
plinth and retains Playing for Keeps as supporting technical evidence.
