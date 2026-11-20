#!/usr/bin/env python3
"""Lightweight static checks for GitHub release artifacts and website links."""
from pathlib import Path
import json, re, sys
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))
assert manifest['manifest_version']==3
assert manifest['version']=='2.0.0'
assert len(manifest['description'])<=132
assert manifest['background']['service_worker']=='background.js'
assert manifest['content_scripts'][0]['js']==['content.js']
assert all((ROOT/p).is_file() for p in ['README.md','LICENSE','CONTRIBUTING.md','SECURITY.md','GITHUB-PUBLISHING.md','RELEASE-NOTES.md','docs/index.html','docs/site.css','docs/site.js','docs/privacy.html','docs/.nojekyll','PUBLISHING-V2.md'])
assert not (ROOT/'export.js').exists() and not (ROOT/'viewer.js').exists()
assert 'markflow-v2.0-extension-only.zip' in (ROOT/'docs/index.html').read_text()
assert 'github.com/new' not in (ROOT/'docs/index.html').read_text()
assert 'https://github.com/kami80/highlighter/releases/latest' in (ROOT/'docs/index.html').read_text()
assert 'site.js' in (ROOT/'docs/index.html').read_text()
assert 'site.css' in (ROOT/'docs/index.html').read_text()
assert (ROOT/'.github/workflows/release-asset.yml').is_file()
# Check local assets referenced from HTML and CSS are packaged for GitHub Pages.
for asset in re.findall(r'(?:src|href)="(assets/[^"]+)"', (ROOT/'docs/index.html').read_text()):
  assert (ROOT/'docs'/asset).is_file(), f'Missing site asset: {asset}'
for icon in ['icon16.png','icon48.png','icon128.png']:
  assert (ROOT/'icons'/icon).stat().st_size>0
# Catch accidental private files inside the repository tree.
for item in ROOT.rglob('*'):
  if item.is_file() and not {'dist','node_modules','.git','__pycache__'}.intersection(item.relative_to(ROOT).parts):
    assert not item.name.lower().endswith(('.crx','.pem','.sqlite','.sqlite3')),(item,'Potential private file')
print('PASS: public repository files, release metadata, site links, no HTML exporter')
