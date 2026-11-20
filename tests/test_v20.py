"""Markflow v2.0 browser UI tests, using an in-page Chrome messaging mock.
Not a full live-extension test. Exercises actual v2 library.js and content.js in Chromium.
"""
import asyncio, shutil, sys, base64
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tests'))
from test_v15 import make_mock, selection

async def test_library(context):
    page=await context.new_page();errors=[]
    page.on('pageerror', lambda e:errors.append(str(e)))
    await page.goto('about:blank');await page.set_content((ROOT/'library.html').read_text())
    await page.add_style_tag(content=(ROOT/'library.css').read_text())
    sample={"pages":[
      {"key":"https://en.wikipedia.org/wiki/Design","folder":"Research","favorite":True,"updatedAt":1795000000000,"count":12,"snippets":[{"text":"The relationship between design, usability and experience","type":"highlight"}]},
      {"key":"https://arxiv.org/abs/2601.10001","folder":"Research","favorite":False,"updatedAt":1794950000000,"count":7,"snippets":[{"text":"Review experimental assumptions and methodology","type":"comment"}]},
      {"key":"https://developer.chrome.com/docs/extensions","folder":"Technical docs","favorite":True,"updatedAt":1794900000000,"count":9,"snippets":[{"text":"Manifest V3 and service worker lifecycle","type":"note"}]},
      {"key":"https://web.dev/articles/accessibility","folder":"Design reviews","favorite":False,"updatedAt":1794750000000,"count":6,"snippets":[{"text":"Accessible keyboard navigation patterns","type":"highlight"}]},
      {"key":"https://example.org/research-notes","folder":"Design reviews","favorite":False,"updatedAt":1794700000000,"count":4,"snippets":[{"text":"A private note about a helpful reference","type":"note"}]}
    ],"excluded":["example.com"]}
    await page.evaluate('''sample=>{
      globalThis.__data=sample;
      globalThis.chrome={runtime:{sendMessage:async msg=>{
        const s=globalThis.__data;
        if(msg.type==='MF_LIBRARY_LIST')return{ok:true,pages:s.pages};
        if(msg.type==='MF_COLLECTIONS_READ')return{ok:true,collections:['Research','Technical docs','Design reviews']};
        if(msg.type==='MF_LIBRARY_SEARCH')return{ok:true,keys:s.pages.filter(p=>[p.key,...p.snippets.map(x=>x.text)].join(' ').toLowerCase().includes(msg.query.toLowerCase())).map(p=>p.key)};
        if(msg.type==='MF_COLLECTIONS_WRITE'||msg.type==='MF_LIBRARY_FOLDER')return{ok:true};
        if(msg.type==='MF_LIBRARY_FAVORITE'){const item=s.pages.find(p=>p.key===msg.key);item.favorite=msg.favorite;return{ok:true,favorite:item.favorite};}
        if(msg.type==='MF_LIBRARY_DELETE'){s.pages=s.pages.filter(p=>p.key!==msg.key);return{ok:true,deleted:true};}
        if(msg.type==='MF_LIBRARY_HEALTH')return{ok:true,pages:s.pages.length,count:s.pages.reduce((t,p)=>t+p.count,0),approxBytes:148240,excludedCount:s.excluded.length,database:'markflow-annotations',schemaVersion:2,byType:{highlight:14,note:11,comment:8,image:5}};
        if(msg.type==='MF_PRIVACY_READ')return{ok:true,excluded:s.excluded};
        if(msg.type==='MF_PRIVACY_WRITE'){s.excluded=msg.sites;return{ok:true,excluded:s.excluded};}
        if(msg.type==='MF_LIBRARY_BACKUP')return{ok:true,backup:{app:'markflow',format:'markflow-backup',version:1,pages:s.pages,excludedSites:s.excluded,layers:[],collections:[]}};
        return{ok:false,error:'Unknown '+msg.type};
      }}};
    }''',sample)
    await page.add_script_tag(content=(ROOT/'library.js').read_text());await page.wait_for_timeout(300)
    assert await page.locator('.page-card').count()==5,errors
    assert await page.locator('#storage-used').inner_text()!='—'
    await page.screenshot(path=str(ROOT/'tests/v2.0-library.png'))
    await page.locator('#starred').click();assert await page.locator('.page-card').count()==2
    await page.locator('#all').click()
    await page.locator('.page-card').first.locator('.star-button').click()
    assert await page.locator('#starred-count').inner_text()=='1'
    await page.locator('#privacy-nav').click()
    assert await page.locator('#privacy-view').is_visible()
    assert await page.locator('#health-db').inner_text()=='markflow-annotations · schema 2'
    assert await page.locator('.excluded-site').count()==1
    await page.evaluate("document.querySelector('#toast').textContent=''")
    await page.screenshot(path=str(ROOT/'tests/v2.0-privacy.png'))
    await page.locator('#exclude-domain').fill('research.example.org');await page.locator('#exclude-form button').click()
    assert await page.locator('.excluded-site').count()==2
    await page.locator('.excluded-site').first.locator('button').click()
    assert await page.locator('.excluded-site').count()==1
    await page.locator('#privacy-back').click()
    assert await page.locator('.page-card').count()==5
    # Deletion requires confirmation in the custom modal.
    await page.locator('.page-card').last.locator('.delete-page').click()
    assert await page.locator('#dialog').is_visible()
    await page.locator('#dialog-buttons button').first.click()
    assert await page.locator('.page-card').count()==5
    assert not errors,errors
    print('PASS v2.0 library: starred, privacy, exclusions, storage diagnostics, deletion confirmation, render.')
    await page.close()

async def test_on_page(context):
    page=await context.new_page();errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
    await page.goto('about:blank');await page.set_content((ROOT/'tests/preview-site.html').read_text())
    css_uri='data:text/css;base64,'+base64.b64encode((ROOT/'ui.css').read_bytes()).decode()
    fn,args=make_mock(css_uri)
    await page.evaluate(fn,args)
    await page.evaluate('''()=>{
      const old=chrome.runtime.sendMessage;
      chrome.runtime.sendMessage=async msg=>{
        if(msg.type==='MF_PRIVACY_READ')return{ok:true,paused:false,excluded:[]};
        if(msg.type==='MF_DB_WRITE'&&globalThis.__triggerConflict){return{ok:true,saved:false,conflict:true,revision:7,conflictIds:['same-id']};}
        return old(msg);
      };
    }''')
    await page.add_script_tag(content=(ROOT/'content.js').read_text())
    await page.wait_for_timeout(250)
    s="document.querySelector('#markflow-extension-host').shadowRoot"
    await page.evaluate('''()=>globalThis.__markflowListeners.at(-1)({type:'MARKFLOW_TOGGLE'})''')
    await selection(page,'#lead',5,35)
    await page.evaluate(f"{s}.querySelector('[data-action=quick-highlight]').click()")
    await page.wait_for_timeout(200)
    assert await page.evaluate(f"{s}.querySelectorAll('.mf-h-pill').length")>0
    await page.evaluate(f"{s}.querySelector('[data-action=list]').click()")
    await page.wait_for_timeout(200)
    await page.evaluate(f"{s}.querySelector('#mf-toast').classList.add('mf-hidden')")
    await page.screenshot(path=str(ROOT/'tests/v2.0-workspace.png'))
    await page.evaluate('''()=>{globalThis.__triggerConflict=true;}''')
    await selection(page,'#lead',40,79)
    await page.evaluate(f"{s}.querySelector('[data-action=quick-highlight]').click()")
    await page.wait_for_timeout(250)
    assert await page.evaluate(f"!{s}.querySelector('#mf-storage-warning').classList.contains('mf-hidden')"), 'Conflict UI missing'
    assert not errors,errors
    print('PASS v2.0 webpage: highlights, persistence mock, conflict safety warning.')
    await page.close()

async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        ctx=await browser.new_context(viewport={'width':1440,'height':900},accept_downloads=True,device_scale_factor=1)
        await test_library(ctx);await test_on_page(ctx)
        await browser.close()
if __name__=='__main__':asyncio.run(main())
