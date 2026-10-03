push-state: main ahead 0 / behind 0 / dirty 0 (published content c909de0; public closeout checked at task exit)
visible-at: https://russellcolevop.github.io/resume/ and https://russellcolevop.github.io/; /works/ is unlisted and noindex
needs-russell: none for published resume content

# Russell Cole public site

Updated October 3, 2026. GitHub Pages serves the repository root from main.

## Published content

- Overview: `/`; audience profiles: `/dev/`, `/sales/`, `/founders/`, `/investors/`.
- `/hub/` links the audience profiles; `/achievements/` holds the deeper work record.
- `/resume/` is the general resume, with seven tailored views: AI builder,
  Commercial, Founder, Portfolio support, Leadership, Operations and Product.
- Resume views share career facts and vary summary, focus and selected evidence.
  Each has a Markdown download and browser print control. PDF downloads are not
  published; HTML/text are the available formats.
- Main profiles select relevant work and use the current Corbel affiliation.
  Historical/paused projects remain labelled on the achievements board.
- Product status distinguishes live web, external beta, internal testing,
  private releases, local tools, prototypes and historical work.

## Editing

- `profiles.json` owns achievements, audience selection and shared AI practice.
- `python3 build-profiles.py` generates the four profiles and achievements.
- Root and `hub/index.html` are hand-maintained. `PROFILES.md` explains the flow.
- Public resume exports live in `resume/`; keep their common career facts aligned.
- `russell.vcf` and the embedded contact card use the same current affiliation.
- Never publish `private/`, credentials or confidential customer records.
- Preserve canonical URLs, title/description, favicon and the existing social card.

## Russell Works

`/works/` remains the separate unlisted 360 resume experience. Desktop uses the
scroll-driven tour; touch devices use the guided room rail, with a one-page
fallback. Room content is in `works/rooms.json`; movement is in `works/walk.js`.
The resume refinement did not change this tour. Its implementation details are
in the existing October 1 reports. Continue tour work as a separate bounded task.

## Release

Current public content release: `c909de0`, built and served by GitHub Pages.
The resume/profile routes and text downloads were read back after publication.
Keep further public release notes limited to the published feature state.
