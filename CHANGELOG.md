# Changelog

## 2.0.0 — November 19, 2026

- Added local Privacy Center with exact-hostname exclusions.
- Added privacy pause behavior to content script after refresh.
- Added revision-aware, transactional writes with three-way merge and conflict detection for the same annotation ID.
- Added a visible save conflict warning with a downloadable unsaved JSON safety copy.
- Added Starred websites in the annotation library.
- Added local storage diagnostics and annotation type breakdown.
- Added safe per-page deletion with confirmation.
- Reduced local storage footprint by avoiding blank records for merely visited pages.
- Improved Library card layout, keyboard focus, and reduced-motion handling.
- Retained v1.4/1.5/1.6 annotation structures, local IndexedDB, and JSON backups.
- Did not reintroduce HTML export.

## 1.6.0

Local JSON backups, searchable Library, self-healing highlights, advanced sticky notes, annotation layers, command palette, reading mode, and image comments.

### 2.0.0 GitHub release hardening

- Fixed the GitHub Pages download button to resolve to the published release ZIP.
- Added reproducible release verification/packaging, security policy, contribution guide, issue templates, MIT license, and release notes.
- Protected page metadata updates (favorite/folder) from overwriting concurrent annotation writes by updating fields transactionally.
- Expanded GitHub Actions to include browser UI regression tests.
