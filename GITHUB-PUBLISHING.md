# Publish the redesigned Markflow / Highlighter project

**Repository:** https://github.com/Kami80/Highlighter  
**Project website:** https://kami80.github.io/highlighter/  
**Latest Releases:** https://github.com/Kami80/Highlighter/releases/latest  
**Extension version in this package:** `2.0.0` (no extension feature changes; website + publishing workflow update)

## A. Update the existing repository (recommended)

1. Download **`highlighter-v2-redesigned-github-ready.zip`** and extract it. Confirm the extracted folder contains `README.md`, `manifest.json`, `docs/`, `.github/`, and `dist/` at the same level.
2. Open PowerShell or CMD and clone your **existing** GitHub repository if you do not already have a local checkout:

   ```bash
   git clone https://github.com/Kami80/Highlighter.git
   cd Highlighter
   ```

   If you already have a clone, use that folder instead and run `git pull --ff-only origin main`.
3. Copy **the contents** of the extracted ZIP over the working repository, including the `docs/` directory and the hidden `.github/` directory. Keep the working repository's `.git/` folder; do **not** delete it, run `git init`, or force-push.
4. Inspect and upload the changes:

   ```bash
   git status
   git add -A
   git commit -m "Redesign GitHub Pages landing page for Markflow v2"
   git push origin main
   ```

5. Open your repository's **Actions** tab. Verify the `Source and browser checks` workflow passes. The new website test verifies demo controls, screenshots, responsive widths, and the privacy page.

> You can also edit/upload `docs/index.html`, `docs/site.css`, `docs/site.js`, `docs/privacy.html`, `docs/assets/*` and `.github/workflows/release-asset.yml` through GitHub's web interface. Cloning and pushing via Git is easier for nested folders and hidden files.

## B. Enable/update the GitHub Pages website

1. Open the repository: https://github.com/Kami80/Highlighter
2. Choose **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch **`main`**, folder **`/docs`**, and click **Save**. If already configured this way, simply pushing the new website files triggers the update.
5. Open https://kami80.github.io/highlighter/ after the Pages deployment finishes.
6. Test the **Explore**, **Privacy**, **Get Markflow**, and **Download for Chrome** links; try the interactive sample and tabbed screenshot gallery on mobile and desktop.

The website is static. No domain purchase, database, cloud function, npm build, or GitHub Pages deployment key is needed. Pages serves **`docs/index.html`** as the home page, plus `docs/site.css` and `docs/site.js`.

## C. Publish the actual extension through GitHub Releases

**A GitHub repository or Pages website is not an extension installer.** To let other people install Markflow in Chrome, publish the packaged ZIP as a GitHub **Release asset**.

### If you have not created a v2.0.0 Release

1. Go to https://github.com/Kami80/Highlighter/releases and choose **Draft a new release**.
2. Choose an existing **`v2.0.0`** tag, or create it from `main` if it does not exist yet.
3. Set title **`Markflow v2.0.0 — Local-first Web Annotator`**.
4. Copy the notes from `RELEASE-NOTES.md` into the description. Mark it as a release (not pre-release) when you are ready.
5. **Publish release.** The included `.github/workflows/release-asset.yml` automatically validates and generates the package, then attaches `markflow-v2.0-extension-only.zip` to this release.
6. In **Actions**, look for **Attach Chrome extension to release**. Wait for it to succeed, then refresh the Release page and verify the ZIP is listed in **Assets**.

**Manual fallback:** If the workflow is disabled or fails, download the release-ready ZIP from this package (`dist/markflow-v2.0-extension-only.zip`), edit the release, upload that ZIP under **Assets**, and save. Do not attach GitHub's automatically generated `Source code (zip)` as the installable extension; it has an extra folder and additional project files.

### If you already have a v2.0.0 Release

There is no need to create the tag again. Open the existing Release → **Edit** → attach `dist/markflow-v2.0-extension-only.zip` if missing → **Update release**. A newly published `release` event triggers the automatic workflow; editing an existing release does not necessarily trigger the `published` event.

### Optional command-line release using GitHub CLI

Run from your cloned repo with GitHub CLI authenticated:

```bash
python scripts/verify_release.py
python scripts/package_release.py
# Only if the v2.0.0 tag / release does not exist:
gh release create v2.0.0 dist/markflow-v2.0-extension-only.zip --repo Kami80/Highlighter --title "Markflow v2.0.0" --notes-file RELEASE-NOTES.md
```

If the release already exists and you need to add/replace its asset:

```bash
gh release upload v2.0.0 dist/markflow-v2.0-extension-only.zip --repo Kami80/Highlighter --clobber
```

**Direct release ZIP once attached:**

https://github.com/Kami80/Highlighter/releases/latest/download/markflow-v2.0-extension-only.zip

## D. How users install the extension (Chrome)

1. On the GitHub Release page, download **`markflow-v2.0-extension-only.zip`** from **Assets**.
2. Extract the ZIP to a **permanent folder**, such as `Documents/Markflow`.
3. Open Chrome and navigate to **`chrome://extensions`**.
4. Turn on **Developer mode**.
5. Click **Load unpacked** and select the extracted folder containing **`manifest.json`** at the root.
6. Pin Markflow, open a normal public webpage, and click its extension icon.

GitHub-installed unpacked extensions **do not auto-update**. To update, back up notes as JSON, replace files inside the *same* unpacked folder, then click **Reload** in `chrome://extensions`. Avoid uninstalling, which could remove local IndexedDB data or change the extension ID.

## E. Verification checklist

- [ ] `README.md` displays normal Markdown headings and images on GitHub.
- [ ] `docs/index.html`, `docs/site.css`, and `docs/site.js` are committed and accessible.
- [ ] GitHub Pages source is `main` → `/docs`.
- [ ] The redesigned website loads and the interactive preview works on desktop/mobile.
- [ ] Privacy link opens `/highlighter/privacy.html`.
- [ ] Latest GitHub Release has a binary asset named `markflow-v2.0-extension-only.zip`.
- [ ] Unzipping the release asset reveals `manifest.json` at its root.
- [ ] The extracted extension installs with **Load unpacked** in Chrome.
- [ ] Existing annotation data survives an upgrade after a JSON backup is made.
- [ ] No personal JSON backups, Chrome profile contents, keys, or secret files are committed.

### Notes on release tags

This source tree is version `2.0.0`. If you later publish `v2.0.1` or `v2.1.0`, first update `manifest.json`, the validation script, release asset naming, and the release workflow consistently. Don't create mismatched tags and manifest versions.

## Official GitHub documentation

- [Configure GitHub Pages deployment](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Create and manage Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
