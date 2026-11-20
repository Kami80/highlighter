#!/usr/bin/env python3
"""Smoke test of the public GitHub Pages experience (no extension APIs)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
import sys, base64, mimetypes, re
from bs4 import BeautifulSoup

def render_inline(name):
    html=(ROOT/'docs'/name).read_text()
    soup=BeautifulSoup(html,'html.parser')
    for link in soup.select('link[href="site.css"]'): link.decompose()
    for script in soup.select('script[src="site.js"]'): script.decompose()
    for img in soup.select('img[src^="assets/"]'):
        path=ROOT/'docs'/img['src']; img['src']='data:image/png;base64,'+base64.b64encode(path.read_bytes()).decode()
    return str(soup)

def inject(page,name):
    page.set_content(render_inline(name),wait_until='load')
    page.add_style_tag(content=(ROOT/'docs/site.css').read_text())
    if name=='index.html':
        js=(ROOT/'docs/site.js').read_text()
        for file in (ROOT/'docs/assets').glob('*.png'):
            js=js.replace("'assets/"+file.name+"'", "'data:image/png;base64,"+base64.b64encode(file.read_bytes()).decode()+"'")
        page.add_script_tag(content=js)
ROOT=Path(__file__).resolve().parents[1]
URL=(ROOT/'docs/index.html').as_uri()
OUT=ROOT/'tests'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium') or None,headless=True,args=['--no-sandbox','--disable-gpu'])
    errors=[]
    page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
    page.on('pageerror',lambda exc: errors.append(str(exc)))
    inject(page,"index.html")
    page.locator('.hero h1').wait_for()
    assert 'every thought' in page.locator('.hero h1').inner_text().lower()
    assert page.locator('#demo-comment').is_visible()
    page.locator('#demo-tool-comment').click()
    assert 'is-hidden' in (page.locator('#demo-comment').get_attribute('class') or '')
    page.locator('#demo-tool-comment').click()
    assert 'is-hidden' not in (page.locator('#demo-comment').get_attribute('class') or '')
    page.locator('.color-dot[data-color="#45c69b"]').click()
    assert 'rgba(83,213,176,.34)' in (page.locator('#demo-highlight').get_attribute('style') or '')
    page.locator('#demo-tool-eye').click()
    assert 'is-hidden' in (page.locator('#demo-note').get_attribute('class') or '')
    page.locator('#demo-tool-eye').click()
    assert 'is-hidden' not in (page.locator('#demo-note').get_attribute('class') or '')
    page.locator('[data-gallery="library"]').click()
    assert 'library' in page.locator('#gallery-image').get_attribute('alt').lower()
    page.locator('[data-gallery="privacy"]').click()
    assert 'Privacy' in page.locator('#gallery-panel').inner_text() or 'Your space' in page.locator('#gallery-panel').inner_text()
    page.locator('[data-gallery="annotate"]').click()
    page.locator('#theme-toggle').click()
    assert page.evaluate('document.documentElement.dataset.theme')=='dark'
    page.locator('#theme-toggle').click()
    assert page.evaluate('document.documentElement.dataset.theme')=='light'
    # Verify scroll reveals in ordinary user flow, and reveal all cards for a
    # full-page screenshot (Chromium's full-page capture does not scroll itself).
    page.evaluate('scrollTo(0, 1600)')
    page.wait_for_timeout(350)
    assert page.locator('.spotlight').first.get_attribute('class').find('is-revealed') >= 0
    page.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('is-revealed'))")
    page.set_viewport_size({'width':1440,'height':1160})
    page.evaluate('scrollTo(0, 0)')
    page.wait_for_timeout(450)
    page.screenshot(path=str(OUT/'site-desktop-hero.png'))
    page.screenshot(path=str(OUT/'site-desktop-full.png'),full_page=True)
    # verify no horizontal overflow at common widths
    for width in [1440,1024,768,390,360]:
        page.set_viewport_size({'width':width,'height':850})
        page.wait_for_timeout(120)
        overflow=page.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
        if overflow>2:
            bad=page.evaluate("""() => [...document.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+2 && getComputedStyle(e).position!=='fixed'}).slice(0,25).map(e=>[e.tagName,e.className?.baseVal||e.className,e.getBoundingClientRect().right])""")
            raise AssertionError(f'Horizontal overflow at {width}px: {overflow}px {bad}')
    page.set_viewport_size({'width':390,'height':920})
    page.evaluate('scrollTo(0,0)')
    page.wait_for_timeout(350)
    page.screenshot(path=str(OUT/'site-mobile-hero.png'))
    page.screenshot(path=str(OUT/'site-mobile-full.png'),full_page=True)
    inject(page, 'privacy.html')
    assert page.locator('.policy-paper h2').count()>=4
    assert page.locator('a[href="./"]').count()>0
    assert not errors, errors
    print('PASS: desktop/mobile responsiveness, interactive demo, gallery, theme, privacy and JS console')
    browser.close()
