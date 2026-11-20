# Markflow v2.0.0 — Release notes

Markflow is a **free, private, local-first Chrome extension** for annotating webpages. No account, server, or subscription is required.

### Highlights

- Privacy Center with pause/exclusion controls for specific hostnames.
- Safer multi-tab editing with revision-aware saves and conflict warnings.
- Starred pages and a more polished, searchable annotation library.
- Storage health diagnostics and safer per-page deletion.
- Rounded highlights, contextual comments and replies, sticky notes, image comments and drawings.
- Annotation layers, reading mode, command palette, and self-healing text anchors.
- Local JSON backup and restore.

### Installation

Download `markflow-v2.0-extension-only.zip`, extract it, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the extracted folder containing `manifest.json`. A Chrome Web Store installation is not provided.

### Existing users

**Back up before upgrading.** Replace the files in your existing unpacked extension directory and click **Reload**. Do not uninstall or change the extension ID if you need your IndexedDB data. Note that installation through GitHub does not automatically update Chrome.

### Scope and limitations

Completely local/offline for annotation storage; no HTML export. May not work on Chrome internal pages, browser-managed PDFs, some dynamic sites or cross-origin frames. Tests include simulated extension messaging, IndexedDB contract mocks, and Chromium browser UI; real installed-extension lifetime and multi-tab persistence still need manual verification on desktop Chrome.
