#!/usr/bin/env python3
"""Create and validate an installable Markflow extension ZIP (no external deps)."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json, sys
ROOT=Path(__file__).resolve().parents[1]
VERSION=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))['version']
FILES=[
  'manifest.json','background.js','content.js','ui.css',
  'library.html','library.css','library.js',
  'icons/icon16.png','icons/icon48.png','icons/icon128.png'
]
def main():
    out=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else ROOT/'dist'/'markflow-v2.0-extension-only.zip'
    out.parent.mkdir(parents=True, exist_ok=True)
    for name in FILES:
        if not (ROOT/name).is_file(): raise SystemExit(f'Missing required extension file: {name}')
    with ZipFile(out,'w',compression=ZIP_DEFLATED,compresslevel=9) as archive:
        for name in FILES: archive.write(ROOT/name,arcname=name)
    with ZipFile(out) as archive:
        assert sorted(archive.namelist())==sorted(FILES)
        manifest=json.loads(archive.read('manifest.json'))
        assert manifest['manifest_version']==3 and manifest['version']==VERSION
        assert not any('/tests/' in n or n.startswith('dist/') for n in archive.namelist())
        assert not any(n.endswith(('export.js','viewer.js')) for n in archive.namelist())
        assert archive.testzip() is None
    print(f'PASS: {out} ({out.stat().st_size:,} bytes, {len(FILES)} files)')
if __name__=='__main__': main()
