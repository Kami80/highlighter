# Markflow 2.0 — Test report

Date: November 19, 2026

## Passed

- `node --check`: `background.js`, `content.js`, `library.js`.
- `tests/test_background.cjs`: v1.4 migration + IndexedDB message contract (mock).
- `tests/test_background_v16.cjs`: v1.5-compatible data, layer settings, collections, JSON backup and restore (mock).
- `tests/test_background_v20.cjs`: independent multi-tab edits are merged; conflicting edits to the same ID are rejected; privacy domain exclusions; favorite toggle; storage health; backup of site rules (mock).
- `tests/test_v15.py`: text selection toolbar, highlight shapes, comment threads, rich notes, drag/resize, manager, undo/redo, visibility, and old annotation import (headless Chromium with simulated extension APIs).
- `tests/test_v16.py`: layers, image regions, command palette, reading mode, self-healing text, and previous library functionality (same test environment).
- `tests/test_v20.py`: star/unstar, Privacy Center, add/remove exclusions, diagnostics, delete confirmation, and visible multi-tab conflict warning (same test environment).
- Manifest V3 validation, version number, static file packaging, no HTML export bundle.

## Not verified

- A fully installed unpacked extension on a human user's Chrome desktop profile.
- Actual Chrome background service worker + real extension-origin IndexedDB persistence over browser restarts.
- End-to-end v1.6 → v2.0 data migration with a populated real Chrome profile.
- Behavior on every external website, including dynamic SPA layouts, embedded frames, and permissions edge cases.

Attempting `launch_persistent_context` with Chromium and `--load-extension` produced no running service worker within the test window. This means the storage tests are explicitly **contract tests** rather than a claim of full live-extension verification.

**Before public release:** back up real data; test upgrade in-place, add annotations, close/reopen Chrome, test excluded hosts, test two tabs simultaneously, export JSON backups and restore them to a disposable test profile.

## Final GitHub release audit — November 19, 2026

- **PASS**: JavaScript syntax checks for all three bundled JavaScript files.
- **PASS**: All three deterministic IndexedDB and message-contract test suites.
- **PASS**: All three headless Chromium UI regression suites using simulated extension messaging, including existing annotation workflows and v2 privacy/library features.
- **PASS**: Manifest V3, version `2.0.0`, built-in assets only, no `export.js`/`viewer.js`, and installable ZIP with `manifest.json` at ZIP root.
- **PASS**: GitHub Pages source/asset links, static privacy page, MIT license, contribution/security guidance, GitHub issue templates, and release publishing instructions.
- **PASS**: Metadata-only edits (star/folder) now use atomic IndexedDB transactions rather than writing stale page snapshots.
- **PASS**: Reproducible release ZIP generated with `python scripts/package_release.py` and verified by `python scripts/verify_release.py`.
- **CI**: GitHub Actions workflow runs syntax/contract/package checks and installs Playwright Chromium for browser UI checks. It has been locally exercised; the first GitHub-hosted run still needs verification after upload.

### Important release boundary

The repository package is ready for **publication on GitHub**, but this does not certify compatibility with all live sites or Chrome Web Store approval. A true installed-extension test with real Chrome extension-origin IndexedDB across browser restarts and in-place upgrades is still outstanding and is prominently called out in `README.md` and `GITHUB-PUBLISHING.md`.

## GitHub Pages redesign verification — November 20, 2026

- **Static HTML, CSS, JS:** Tested in headless Chromium using an inline-asset test harness because this runner blocks `file://` navigation. The GitHub Pages deployment remains plain static files using relative URLs.
- **Interactive preview:** Highlight/comment/note/visibility toggles, color selection, and editable note tested. The sample explicitly discloses that nothing is saved.
- **Screenshot gallery:** Switching features, image source/alt, and tab states tested.
- **Themes:** Light/dark toggle and local preference tested.
- **Responsive:** Checked widths of 360, 390, 768, 1024, and 1440 pixels without horizontal scrolling.
- **Privacy page:** Accessible, with original privacy text retained.
- **Browser errors:** No uncaught JavaScript exceptions during the smoke test.
- **Release packaging:** Manifest is at the root of the Chrome extension ZIP; existing runtime files unchanged.
- **Limitation:** These website tests do not prove that the GitHub Pages deployment itself is live or that Chrome can install the extension in a real persistent browser profile.
