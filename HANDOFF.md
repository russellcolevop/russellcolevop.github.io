push-state: main ahead 0 / behind 0 / dirty 0 (scoped product-priority release; default-branch state checked at task exit)
visible-at: https://russellcolevop.github.io/resume/ and https://russellcolevop.github.io/; /works/ is unlisted and noindex
needs-russell: none for published resume content

# Russell Cole public site

Updated October 4, 2026. GitHub Pages serves the repository root from main.

## Published content

- Overview: `/`; audience profiles: `/dev/`, `/sales/`, `/founders/`, `/investors/`.
- `/hub/` links the audience profiles; `/achievements/` holds the deeper work record.
- `/resume/` is the general resume, with seven tailored views: AI builder,
  Commercial, Founder, Portfolio support, Leadership, Operations and Product.
- Resume views share career facts and vary summary, focus and selected evidence.
  Each has a Markdown download and browser print control. PDF downloads are not
  published; HTML/text are the available formats.
- Main profiles select relevant work and use the current Corbel affiliation.
- Professional product evidence leads: Fuwari, Stonewise, ChildCareOS, Signal
  Engine and AgAR where relevant, then Playing for Keeps. Resume selections
  stay compact and tailored to each role.
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
The curriculum now puts Stonewise ahead of Playing for Keeps, and the fourth
gallery plinth features Stonewise. Playing for Keeps remains in the curriculum
and one-page supporting cases. Room geometry, stops and artwork are unchanged.
The existing October 1 reports describe implementation. Broader tour improvements
remain a separate bounded task.

## Release

October 4 product-priority update is a content-only release on main.
The 22 changed public files matched their reviewed source after publication.
Chrome confirmed the product order, general resume and Stonewise gallery card.
Keep reader-facing checks focused on changed pages and the gallery selection.
Keep further public release notes limited to the published feature state.
