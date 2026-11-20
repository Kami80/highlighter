"""Markflow 1.6 Chromium smoke tests, deterministic extension mock.
Does not assert live installed-extension/real Chrome service worker integration.
"""
import asyncio,base64,shutil,json,sys
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tests'))
from test_v15 import make_mock,selection,record

async def attach(page):
 css_uri='data:text/css;base64,'+base64.b64encode((ROOT/'ui.css').read_bytes()).decode()
 fn,args=make_mock(css_uri)
 await page.evaluate(fn,args)
 await page.evaluate('''()=>{
 const orig=chrome.runtime.sendMessage;
 chrome.runtime.sendMessage=async msg=>{
   if(msg.type==='MF_LAYERS_READ')return {ok:true,layers:[{id:'personal',name:'Personal',color:'#ff557e'},{id:'research',name:'Research',color:'#6c93ef'},{id:'review',name:'Review',color:'#46bf9f'}]};
   if(msg.type==='MF_LAYERS_WRITE')return {ok:true,layers:msg.layers};
   if(msg.type==='MF_OPEN_LIBRARY'){globalThis.__openedLibrary=true;return {ok:true,opened:true};}
   return orig(msg);
 };
 }''')
 await page.add_script_tag(content=(ROOT/'content.js').read_text())
 await page.wait_for_timeout(400)
 return "document.querySelector('#markflow-extension-host').shadowRoot"

async def live_checks(page):
 s=await attach(page)
 errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
 await page.evaluate('''()=>globalThis.__markflowListeners.at(-1)({type:'MARKFLOW_TOGGLE'})''')
 await selection(page,'#lead',4,45)
 await page.evaluate(f"{s}.querySelector('[data-action=quick-highlight]').click()")
 await page.wait_for_timeout(110)
 assert await page.evaluate(f"{s}.querySelectorAll('.mf-h-pill').length")>0
 # Layer panel, selecting research, changing visibility
 await page.evaluate(f"{s}.querySelector('[data-action=layers]').click()")
 assert await page.evaluate(f"!{s}.querySelector('#mf-layers').classList.contains('mf-hidden')")
 await page.evaluate(f'''()=>{{const s=document.querySelector('#markflow-extension-host').shadowRoot;
 const x=s.querySelector('input[name=mf-active-layer][value=research]');x.checked=true;x.dispatchEvent(new Event('change',{{bubbles:true}}));}}''')
 await selection(page,'#lead',48,88)
 await page.evaluate(f"{s}.querySelector('[data-action=quick-highlight]').click()")
 await page.wait_for_timeout(100)
 data=(await record(page))['annotations'];assert any(a.get('layer')=='research' for a in data)
 await page.evaluate(f'''()=>{{const s=document.querySelector('#markflow-extension-host').shadowRoot;
 const x=s.querySelector('[data-layer-visible=research]');x.checked=false;x.dispatchEvent(new Event('change',{{bubbles:true}}));}}''')
 assert await page.evaluate(f"{s}.querySelectorAll('.mf-h-pill').length")>0 # personal remains
 await page.evaluate(f'''()=>{{const s=document.querySelector('#markflow-extension-host').shadowRoot;
 const x=s.querySelector('[data-layer-visible=research]');x.checked=true;x.dispatchEvent(new Event('change',{{bubbles:true}}));}}''')
 await page.evaluate(f"{s}.querySelector('[data-action=close-layers]').click()")
 # image region and comment
 await page.evaluate(f"{s}.querySelector('[data-tool=image]').click()")
 await page.evaluate('''()=>{
 const img=document.querySelector('#sample-image'),r=img.getBoundingClientRect();
 img.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:r.left+20,clientY:r.top+18,button:0,pointerId:8}));
 img.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:r.left+130,clientY:r.top+92,button:0,pointerId:8}));
 img.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:r.left+130,clientY:r.top+92,button:0,pointerId:8}));
 }''')
 assert await page.evaluate(f"!{s}.querySelector('#mf-editor').classList.contains('mf-hidden')")
 await page.evaluate(f'''()=>{{const s=document.querySelector('#markflow-extension-host').shadowRoot;s.querySelector('#mf-draft-text').value='This illustration needs more contrast';s.querySelector('[data-action=save-comment]').click();}}''')
 await page.wait_for_timeout(90)
 data=(await record(page))['annotations'];assert any(a['type']=='image' and a['text'].startswith('This illustration') for a in data)
 assert await page.evaluate(f"{s}.querySelectorAll('.mf-image-region').length")>0
 # note rich title, pinned, collapsed
 await page.evaluate(f"{s}.querySelector('[data-tool=note]').click()")
 await page.evaluate(f"{s}.querySelector('[data-tool=note]').click()")
 await page.evaluate(f'''()=>{{const s=document.querySelector('#markflow-extension-host').shadowRoot;
 s.querySelector('[data-action=command]').click();}}''')
 assert await page.evaluate(f"!{s}.querySelector('#mf-command').classList.contains('mf-hidden')")
 await page.evaluate(f"{s}.querySelector('#mf-command-input').value='sticky note'")
 await page.evaluate(f"{s}.querySelector('#mf-command-input').dispatchEvent(new Event('input',{{bubbles:true}}))")
 await page.evaluate(f"{s}.querySelector('#mf-command-list button').click()")
 assert await page.evaluate(f"!{s}.querySelector('#mf-note-editor').classList.contains('mf-hidden')")
 await page.evaluate(f'''()=>{{const s=document.querySelector('#markflow-extension-host').shadowRoot;
 s.querySelector('#mf-note-rich').textContent='Important research TODO';s.querySelector('#mf-note-title').value='My research';
 s.querySelector('#mf-note-pinned').checked=true;s.querySelector('#mf-note-collapsed').checked=true;
 s.querySelector('[data-action=save-note]').click();}}''')
 await page.wait_for_timeout(100)
 data=(await record(page))['annotations'];assert any(a['type']=='note' and a.get('collapsed') and a.get('pinned') and a.get('title')=='My research' for a in data)
 assert await page.evaluate(f"{s}.querySelectorAll('.mf-note-collapsed').length")>0
 # anchor still matches after a DOM insertion shifts node paths
 await page.evaluate('''()=>{const lead=document.querySelector('#lead');lead.parentElement.insertBefore(document.createElement('p'),lead).textContent='Inserted paragraph shifts DOM child indices.';}''')
 await page.evaluate(f"{s}.querySelector('[data-action=list]').click()")
 await page.evaluate(f"{s}.querySelector('#mf-filter').value='highlight'")
 await page.evaluate(f"{s}.querySelector('#mf-filter').dispatchEvent(new Event('change',{{bubbles:true}}))")
 await page.wait_for_timeout(80)
 assert await page.evaluate(f"!{s}.querySelector('#mf-items').textContent.includes('Needs re-anchoring')")
 # reading mode reversible
 await page.evaluate(f"{s}.querySelector('[data-action=reading]').click()")
 assert await page.evaluate(f"!{s}.querySelector('#mf-reader').classList.contains('mf-hidden')")
 assert await page.evaluate(f"{s}.querySelector('#mf-reader-content').innerText.includes('Great ideas')")
 await page.evaluate(f"{s}.querySelector('[data-action=close-reading]').click()")
 assert await page.evaluate(f"{s}.querySelector('#mf-reader').classList.contains('mf-hidden')")
 # command palette library action
 await page.evaluate(f"{s}.querySelector('[data-action=command]').click()")
 await page.evaluate(f"{s}.querySelector('[data-command=library]').click()")
 assert await page.evaluate('globalThis.__openedLibrary')
 # manager new image filter
 await page.evaluate(f"{s}.querySelector('#mf-filter').value='image'")
 await page.evaluate(f"{s}.querySelector('#mf-filter').dispatchEvent(new Event('change',{{bubbles:true}}))")
 assert await page.evaluate(f"{s}.querySelector('#mf-items').textContent.includes('IMAGE COMMENT')")
 # screenshot UI overview + selected note editor
 await page.evaluate(f"{s}.querySelector('#mf-filter').value='all'")
 await page.evaluate(f"{s}.querySelector('#mf-filter').dispatchEvent(new Event('change',{{bubbles:true}}))")
 await page.evaluate(f"{s}.querySelector('[data-action=close-panel]').click()")
 await page.evaluate(f"{s}.querySelector('[data-action=list]').click()")
 await page.wait_for_timeout(650)
 await page.screenshot(path=str(ROOT/'tests/v1.6-workspace.png'),full_page=False)
 await page.evaluate(f"{s}.querySelector('[data-action=command]').click()")
 await page.wait_for_timeout(380)
 await page.screenshot(path=str(ROOT/'tests/v1.6-command-palette.png'),full_page=False)
 await page.evaluate(f"{s}.querySelector('#mf-command-input').dispatchEvent(new KeyboardEvent('keydown',{{key:'Escape',bubbles:true}}))")
 await page.evaluate(f"{s}.querySelector('[data-action=reading]').click()")
 await page.wait_for_timeout(250)
 await page.screenshot(path=str(ROOT/'tests/v1.6-reading-mode.png'),full_page=False)
 if errors:raise AssertionError('Browser JS errors: '+str(errors))
 print('PASS: v1.6 live UI: layers, image comments, command palette, rich notes, self-heal, reader, manager; generated screenshots')

async def dashboard(page):
 await page.set_content((ROOT/'library.html').read_text())
 await page.add_style_tag(content=(ROOT/'library.css').read_text())
 sample={ 'pages':[
 {'key':'https://wikipedia.org/wiki/Design','folder':'Research','updatedAt':1795000000000,'count':12,'snippets':[{'text':'The relationship between form and usability','type':'highlight'}]},
 {'key':'https://example.org/article','folder':'Unfiled','updatedAt':1794000000000,'count':6,'snippets':[{'text':'Review these findings before publishing','type':'note'}]},
 {'key':'https://developer.chrome.com/docs/extensions','folder':'Technical docs','updatedAt':1793900000000,'count':9,'snippets':[{'text':'Manifest V3 service worker lifecycle','type':'comment'}]},
 {'key':'https://arxiv.org/abs/2411.12345','folder':'Research','updatedAt':1793500000000,'count':4,'snippets':[{'text':'Future work and limitations','type':'highlight'}]}
 ]}
 await page.evaluate('''sample=>{globalThis.__testBackup=null;globalThis.chrome={runtime:{sendMessage:async msg=>{
 if(msg.type==='MF_LIBRARY_LIST')return {ok:true,pages:sample.pages};
 if(msg.type==='MF_COLLECTIONS_READ')return {ok:true,collections:['Research','Technical docs']};
 if(msg.type==='MF_LIBRARY_FOLDER')return {ok:true};
 if(msg.type==='MF_LIBRARY_SEARCH')return {ok:true,keys:sample.pages.filter(p=>[p.key,...p.snippets.map(s=>s.text)].join(' ').toLowerCase().includes(msg.query.toLowerCase())).map(p=>p.key)};
 if(msg.type==='MF_COLLECTIONS_WRITE')return {ok:true};
 if(msg.type==='MF_LIBRARY_BACKUP')return {ok:true,backup:{format:'markflow-backup',version:1,app:'markflow',pages:sample.pages,layers:[{id:'personal',name:'Personal',color:'#ff557e'}]}};
 if(msg.type==='MF_LIBRARY_RESTORE'){globalThis.__testBackup=msg;return {ok:true,restored:sample.pages.length,mode:msg.mode};}
 return {ok:false,error:'Unknown action '+msg.type};
 }}};}''',sample)
 await page.add_script_tag(content=(ROOT/'library.js').read_text())
 await page.wait_for_timeout(200)
 assert await page.locator('.page-card').count()==4
 await page.locator('#search').fill('service worker')
 assert await page.locator('.page-card').count()==1
 await page.locator('#search').fill('')
 await page.screenshot(path=str(ROOT/'tests/v1.6-library.png'),full_page=False)
 async with page.expect_download() as pending:
  await page.locator('#backup').click()
 download=await pending.value
 assert download.suggested_filename.startswith('markflow-backup-')
 print('PASS: v1.6 library dashboard: global search, sorting/rendering and JSON backup download')

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  ctx=await browser.new_context(viewport={'width':1440,'height':900},accept_downloads=True,device_scale_factor=1)
  page=await ctx.new_page();await page.goto('about:blank');await page.set_content((ROOT/'tests/preview-site.html').read_text())
  await page.evaluate('''()=>{const img=document.createElement('img');img.id='sample-image';img.alt='Design sample illustration';
  img.style.cssText='display:block;width:275px;height:155px;object-fit:cover;margin:16px 0;border-radius:17px;border:1px solid #ddd';
  img.src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="170"><rect width="300" height="170" rx="19" fill="#dbeafb"/><circle cx="95" cy="75" r="43" fill="#fc93ad"/><rect x="157" y="45" width="100" height="83" rx="17" fill="#6f95dd"/></svg>');
  document.querySelector('.tile.blue').append(img); }''')
  await live_checks(page)
  library=await ctx.new_page();await dashboard(library)
  await browser.close()

if __name__=='__main__':asyncio.run(main())
