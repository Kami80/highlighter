# Markflow GitHub Pages — Design notes

The marketing site is an original, responsive implementation informed by the **Apple Design** and **Design Engineering** design skills published by Emil Kowalski:

- https://github.com/emilkowalski/skills/tree/main/skills/apple-design
- https://github.com/emilkowalski/skills/tree/main/skills/emil-design-eng

This project is not affiliated with Apple or Emil Kowalski.

## Design principles applied

- **Immediate response:** Button press and annotation-demo controls respond on activation, with pressed-state scaling.
- **Restrained motion:** Spatially anchored comment and sticky-note entrances; no perpetual movement or distracting scroll parallax.
- **Direct manipulation:** Desktop sticky-note dragging follows pointer movement, respecting the original grab offset and using pointer capture.
- **Translucent hierarchy:** A floating navigation material uses localized blur to distinguish navigation from content.
- **Typography:** Tight headline tracking, native system font stack, line-height hierarchy, maximum readable line lengths.
- **Respect motion preferences:** `prefers-reduced-motion: reduce` disables transitions, reveals, and other unnecessary motion.
- **Accessibility:** Keyboard navigation, visible focus states, alt text, skip link, tab semantics, no automatic page scroll, ample target sizes.
- **Local-first:** No remote fonts, JavaScript libraries, metrics/analytics, or network calls from the landing page itself. Its demo is illustrative and does not access extension storage.

## Files

- `docs/index.html` — marketing site HTML and demo structure
- `docs/site.css` — all responsive styling and motion
- `docs/site.js` — theme, accessible gallery, demo interactions, note dragging, scroll progress, copy feedback
- `docs/privacy.html` — consistent privacy page
- `docs/assets/` — screenshot assets, icons and social preview

No CSS build, JS bundler, or backend is needed. GitHub Pages serves these files directly from the `/docs` folder.
