# Profile Page Workflow

`profiles.json` is the source of truth for achievements, the shared AI-practice
section, and the generated audience pages. Updated 2026-10-02.

1. Edit `profiles.json`.
   Achievement `id` values are stable. Each profile selects them with `work_ids`;
   title, status, and body come from that one achievement definition.
2. Run `python3 build-profiles.py`.
3. Review the regenerated `dev/`, `founders/`, `investors/`, `sales/`, and `achievements/` pages.
4. Commit `profiles.json`, `build-profiles.py`, `PROFILES.md`, and the regenerated pages.

The root `index.html` is hand-maintained and should only be updated directly when the general-audience wording changes.
`hub/index.html` is also hand-maintained. The generator does not write the hub.
Keep root/hub summaries, metadata, and contact-card title aligned during refreshes.
Current resume career facts live in the private canonical record at
`/Users/russellcole/Developer/RussellLabs/job-search-2026/resumes/content.json`.
Its `build_resumes.py --site-dir /Users/russellcole/Developer/russellcole-site`
exports only public-safe HTML and Markdown into `resume/`. Eight views share the
same career/education record; summaries and selected evidence change by role.
The general view is `/resume/`; the seven tailored views are below it. Root,
hub and the four profile pages link to the relevant view. No PDF link is enabled
until a PDF exists and its layout has been checked. Current print pagination and
PDF export are pending the machine resource guard; text/HTML generation is light.

When resume facts change, rebuild the exports and reconcile matching facts in
`profiles.json` before rendering the profile pages. Preserve already submitted
application documents in the private job-search home. PH/KoyaOS remain historical
deep-board evidence only; five overview/profile surfaces select the strongest work.
Do not carry forward stale test counts, unlabeled currencies, or retired-backend
claims as current achievements. Evidence for the September refresh is in
`_reports/2026-09-30-profile-refresh.md`.
