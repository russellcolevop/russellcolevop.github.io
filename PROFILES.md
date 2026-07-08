# Profile Page Workflow

`profiles.json` is the source of truth for the generated audience pages.

1. Edit `profiles.json`.
2. Run `python3 build-profiles.py`.
3. Review the regenerated `dev/`, `founders/`, `investors/`, `sales/`, and `achievements/` pages.
4. Commit `profiles.json`, `build-profiles.py`, `PROFILES.md`, and the regenerated pages.

The root `index.html` is hand-maintained and should only be updated directly when the general-audience wording changes.
