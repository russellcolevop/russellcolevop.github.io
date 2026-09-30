# Profile Page Workflow

`profiles.json` is the source of truth for achievements, the shared AI-practice
section, and the generated audience pages. Updated 2026-09-30.

1. Edit `profiles.json`.
   Achievement `id` values are stable. Each profile selects them with `work_ids`;
   title, status, and body come from that one achievement definition.
2. Run `python3 build-profiles.py`.
3. Review the regenerated `dev/`, `founders/`, `investors/`, `sales/`, and `achievements/` pages.
4. Commit `profiles.json`, `build-profiles.py`, `PROFILES.md`, and the regenerated pages.

The root `index.html` is hand-maintained and should only be updated directly when the general-audience wording changes.
`hub/index.html` is also hand-maintained. The generator does not write the hub.
Keep root/hub summaries, metadata, and contact-card title aligned during refreshes.
Do not carry forward stale test counts, unlabeled currencies, or retired-backend
claims as current achievements. Evidence for the September refresh is in
`_reports/2026-09-30-profile-refresh.md`.
