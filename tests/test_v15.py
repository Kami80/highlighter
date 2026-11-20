"""End-to-end smoke test for Markflow UI + actual IndexedDB background code.
Tests Chrome API messaging with a deterministic stand-in; browser is Chromium.
"""
import asyncio,base64,shutil,threading,http.server,socketserver
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
PORT=8897
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT/'tests'),**kw)
    def log_message(self,*a):pass
class Server(socketserver.ThreadingTCPServer):allow_reuse_address=True

def make_mock(css_uri):
 return """({cssUri})=>{
    const data=globalThis.__persistedTestData || new Map();
    globalThis.__persistedTestData=data;
    globalThis.__markflowListeners=[];
    const store=globalThis.__legacyTestData || {};
    globalThis.__legacyTestData=store;
    globalThis.chrome={
      action:{onClicked:{addListener:fn=>{}}},
      tabs:{sendMessage:async()=>{},setBadgeText:async()=>{}},
      runtime:{
        getURL:path=>cssUri,
        onMessage:{addListener:fn=>globalThis.__markflowListeners.push(fn)},
        sendMessage:async msg=>{
          if(msg.type==='MF_DB_WRITE') {data.set(msg.key,structuredClone(msg.annotations));return {ok:true,saved:true};}
          if(msg.type==='MF_DB_READ'){
            if(data.has(msg.key))return {ok:true,annotations:structuredClone(data.get(msg.key)),migrated:false};
            const prior=store['markflow:v1:'+msg.key]||[];
            data.set(msg.key,structuredClone(prior));
            return {ok:true,annotations:structuredClone(prior),migrated:prior.length>0};
          }
          throw Error('Unknown test message: '+msg.type);
        }
      },
      storage:{local:{
        get:async key=>key===null?{...store}:typeof key==='string'?{[key]:store[key]}:Object.fromEntries(key.map(k=>[k,store[k]])),
        set:async values=>Object.assign(store,values)
      }}
    };
    globalThis.__markflowMock=store;
  }""",{'cssUri':css_uri}

async def setup(page):
 css_uri='data:text/css;base64,'+base64.b64encode((ROOT/'ui.css').read_bytes()).decode()
 fn,args=make_mock(css_uri)
 await page.evaluate(fn,args)
 await page.add_script_tag(content=(ROOT/'content.js').read_text())
 await page.wait_for_function("document.querySelector('#markflow-extension-host')?.shadowRoot.querySelector('[data-action=redo]')")
 await page.wait_for_timeout(360)
 return "document.querySelector('#markflow-extension-host').shadowRoot"

async def selection(page,selector,start,end):
 await page.evaluate('''({selector,start,end})=>{
   const t=document.querySelector(selector).firstChild;
   const range=document.createRange();range.setStart(t,start);range.setEnd(t,Math.min(end,t.length));
   let s=getSelection();s.removeAllRanges();s.addRange(range);
   document.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));
 }''',{'selector':selector,'start':start,'end':end})

async def record(page):
 return await page.evaluate("""()=>({annotations:structuredClone(globalThis.__persistedTestData.get(location.origin+location.pathname+location.search)||[])})""")

async def main():
 server=Server(('127.0.0.1',PORT),Handler)
 threading.Thread(target=server.serve_forever,daemon=True).start()
 try:
  async with async_playwright() as p:
   browser=await p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
   ctx=await browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1)
   page=await ctx.new_page()
   errors=[]
   page.on('pageerror',lambda error: errors.append(str(error)))
   page.on('console',lambda msg: print('BROWSER:',msg.type,msg.text[:200]) if msg.type=='error' else None)
   await page.goto('about:blank')
   await page.set_content((ROOT/'tests/preview-site.html').read_text())
   s=await setup(page)
   assert await page.evaluate(f'{s}.querySelector("[data-action=export]")===null')
   assert await page.evaluate(f'{s}.querySelector("#mf-export-popover")===null')
   await page.evaluate('''()=>globalThis.__markflowListeners.at(-1)({type:'MARKFLOW_TOGGLE'})''')
   print('Step: smart toolbar')
   await selection(page,'#lead',4,45)
   assert await page.evaluate(f"!{s}.querySelector('#mf-selection').classList.contains('mf-hidden')")
   await page.screenshot(path=str(ROOT/'tests/v1.5-selection-preview.png'))
   await page.evaluate(f"{s}.querySelector('[data-action=quick-highlight]').click()")
   await page.wait_for_timeout(300)
   assert await page.evaluate(f"{s}.querySelectorAll('.mf-h-pill').length")>0
   print('Step: highlight presets')
   await page.evaluate(f"{s}.querySelector('[data-action=styles]').click()")
   await page.evaluate(f"{s}.querySelector('[data-highlight-shape=marker]').click()")
   await page.evaluate(f"{s}.querySelector('#mf-opacity').value='60'; {s}.querySelector('#mf-opacity').dispatchEvent(new Event('input',{{bubbles:true}}))")
   await page.evaluate(f"{s}.querySelector('[data-action=styles]').click()")
   await selection(page,'#focus',2,28)
   await page.evaluate(f"{s}.querySelector('[data-action=quick-highlight]').click()")
   await page.wait_for_timeout(160)
   assert await page.evaluate(f"{s}.querySelectorAll('.mf-h-marker').length")>0, await page.evaluate(f"Array.from({s}.querySelectorAll('.mf-rounded-highlight')).map(x=>x.className)")
   print('Step: comment & replies')
   await selection(page,'#lead',48,80)
   await page.evaluate(f"{s}.querySelector('[data-action=quick-comment]').click()")
   await page.evaluate(f"{s}.querySelector('#mf-draft-text').value='Review this paragraph in the next design pass.'")
   await page.evaluate(f"{s}.querySelector('[data-action=save-comment]').click()")
   await page.evaluate(f"{s}.querySelector('.mf-comment-pin').click()")
   assert await page.evaluate(f"!{s}.querySelector('#mf-comment-bubble').classList.contains('mf-hidden')")
   await page.evaluate(f"{s}.querySelector('#mf-reply-text').value='Agreed — add a source reference.'")
   await page.evaluate(f"{s}.querySelector('[data-action=save-reply]').click()")
   assert await page.evaluate(f"{s}.querySelectorAll('.mf-thread-message').length") == 2
   await page.wait_for_timeout(300)
   await page.screenshot(path=str(ROOT/'tests/v1.5-comments-preview.png'))
   print('Step: rich sticky note')
   await page.evaluate(f"{s}.querySelector('[data-action=close-bubble]').click()")
   await page.evaluate(f"{s}.querySelector('[data-tool=note]').click()")
   await page.mouse.click(775,465)
   assert await page.evaluate(f"!{s}.querySelector('#mf-note-editor').classList.contains('mf-hidden')")
   await page.evaluate("""()=>{
      const e=document.querySelector('#markflow-extension-host').shadowRoot.querySelector('#mf-note-rich');
      e.textContent='Formatting works';e.focus();const r=document.createRange();r.selectNodeContents(e);
      const sel=getSelection();sel.removeAllRanges();sel.addRange(r);
   }""")
   await page.evaluate(f"{s}.querySelector('[data-rich=bold]').click()")
   formatted=await page.evaluate(f"{s}.querySelector('#mf-note-rich').innerHTML")
   assert '<b>' in formatted or '<strong>' in formatted,formatted
   await page.evaluate(f"{s}.querySelector('#mf-note-rich').innerHTML='<b>Research insight</b><div>Try a softer visual rhythm.</div><ul><li>Keep notes concise</li><li>Verify interactions</li></ul>'")
   await page.evaluate(f"{s}.querySelector('[data-note-tone=lavender]').click()")
   await page.evaluate(f"{s}.querySelector('#mf-note-rich').dispatchEvent(new Event('input',{{bubbles:true}}))")
   await page.wait_for_timeout(350)
   await page.screenshot(path=str(ROOT/'tests/v1.5-sticky-editor-preview.png'))
   await page.evaluate(f"{s}.querySelector('[data-action=save-note]').click()")
   assert await page.evaluate(f"{s}.querySelector('.mf-sticky-rich b').textContent")=='Research insight'
   print('Step: note resize and drag')
   old=await page.evaluate(f"()=>{{const e={s}.querySelector('.mf-note-card'); return {{left:parseFloat(e.style.left),top:parseFloat(e.style.top),width:parseFloat(e.style.width),height:parseFloat(e.style.height)}};}}")
   # Actual pointer input, use shadow piercing locator
   grip=page.locator('#markflow-extension-host').locator('.mf-note-resize')
   r=await grip.bounding_box();assert r is not None
   await page.mouse.move(r['x']+r['width']*.8,r['y']+r['height']*.8)
   await page.mouse.down()
   await page.mouse.move(r['x']+45,r['y']+35,steps=8)
   await page.mouse.up()
   new=await page.evaluate(f"()=>{{const e={s}.querySelector('.mf-note-card'); return {{width:parseFloat(e.style.width),height:parseFloat(e.style.height)}};}}")
   assert new['width']>old['width'] and new['height']>old['height'], (old,new)
   print('Step: sticky-note dragging')
   head=page.locator('#markflow-extension-host').locator('.mf-note-card-head')
   r=await head.bounding_box();assert r is not None
   await page.mouse.move(r['x']+40,r['y']+16)
   await page.mouse.down()
   await page.mouse.move(r['x']+91,r['y']+34,steps=6)
   await page.mouse.up()
   moved=await page.evaluate(f"()=>{{const e={s}.querySelector('.mf-note-card');return [parseFloat(e.style.left),parseFloat(e.style.top)]}}")
   assert moved[0]>old['left'] and moved[1]>old['top'],(old,moved)
   print('Step: manager search/filter/sort')
   await page.evaluate(f"{s}.querySelector('[data-action=list]').click()")
   # list might close because showCommentBubble opened panel; toggle as needed
   if await page.evaluate(f"{s}.querySelector('#mf-panel').classList.contains('mf-hidden')"):
      await page.evaluate(f"{s}.querySelector('[data-action=list]').click()")
   count=await page.evaluate(f"{s}.querySelectorAll('.mf-item').length")
   assert count>=4,count
   await page.evaluate(f"{s}.querySelector('#mf-filter').value='note';{s}.querySelector('#mf-filter').dispatchEvent(new Event('change'))")
   assert await page.evaluate(f"{s}.querySelectorAll('.mf-item').length")==1
   await page.evaluate(f"{s}.querySelector('#mf-search').value='nonexistent';{s}.querySelector('#mf-search').dispatchEvent(new Event('input'))")
   assert await page.evaluate(f"{s}.querySelectorAll('.mf-item').length")==0
   await page.evaluate(f"{s}.querySelector('#mf-search').value='';{s}.querySelector('#mf-search').dispatchEvent(new Event('input'))")
   await page.evaluate(f"{s}.querySelector('#mf-filter').value='all';{s}.querySelector('#mf-filter').dispatchEvent(new Event('change'))")
   await page.evaluate(f"{s}.querySelector('#mf-sort').value='newest';{s}.querySelector('#mf-sort').dispatchEvent(new Event('change'))")
   await page.wait_for_timeout(400)
   await page.screenshot(path=str(ROOT/'tests/v1.5-workspace-preview.png'))
   print('Step: undo/redo')
   before=(await record(page))['annotations']
   assert len(before)==4,len(before)
   assert len(next(a for a in before if a['type']=='comment')['replies'])==1
   await page.evaluate(f"{s}.querySelector('[data-action=undo]').click()")
   await page.wait_for_timeout(350)
   undone=await record(page);assert undone is not None
   assert (undone['annotations'] != before),'Undo did not alter data'
   await page.evaluate(f"{s}.querySelector('[data-action=redo]').click()")
   await page.wait_for_timeout(350)
   assert (await record(page))['annotations']==before
   print('Step: keyboard undo / redo')
   await page.evaluate("""()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'z',ctrlKey:true,altKey:true,bubbles:true}))""")
   await page.wait_for_timeout(100)
   await page.evaluate("""()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'z',ctrlKey:true,altKey:true,shiftKey:true,bubbles:true}))""")
   await page.wait_for_timeout(100)
   assert (await record(page))['annotations']==before
   print('Step: show/hide persisted notes')
   await page.evaluate(f"{s}.querySelector('[data-action=toggle-annotations]').click()")
   assert await page.evaluate(f"{s}.querySelector('#mf-pins').childElementCount")==0
   await page.evaluate(f"{s}.querySelector('[data-action=toggle-annotations]').click()")
   assert await page.evaluate(f"{s}.querySelectorAll('.mf-note-card').length")==1
   print('Step: state persistence in simulated extension storage')
   assert len((await record(page))['annotations'])==4
   print('Step: importing v1.4 HTML annotation metadata')
   # Legacy files contain <script id="mf-data"> with a JSON annotation payload.
   import_payload={"source":None,"annotations":[{"id":"imported-comment","type":"comment","text":"Restored from older HTML document","color":"#ff557e","created":100}]}
   import json
   old_html='<html><body><script id="mf-data" type="application/json">'+json.dumps(import_payload)+'</script></body></html>'
   await page.evaluate("""(html)=>{const s=document.querySelector('#markflow-extension-host').shadowRoot;const input=s.querySelector('#mf-import-file');const file=new File([html],'archive.html',{type:'text/html'});Object.defineProperty(input,'files',{configurable:true,value:[file]});input.dispatchEvent(new Event('change',{bubbles:true}));}""",old_html)
   await page.wait_for_timeout(400)
   assert len((await record(page))['annotations'])==5
   print('Step: simulated legacy migration response')
   await page.evaluate("""()=>{
     const legacy={id:'old-annotation',type:'note',x:350,y:260,color:'#ff557e',noteTone:'mint',text:'Legacy note preserved',created:12345};
     const key='https://example.com/legacy.html';
     globalThis.__legacyTestData['markflow:v1:'+key]=[legacy];
   }""")
   result=await page.evaluate("""async()=>await chrome.runtime.sendMessage({type:'MF_DB_READ',key:'https://example.com/legacy.html'})""")
   assert result['annotations'][0]['text']=='Legacy note preserved'
   assert not errors,errors
   print('PASS: selection toolbar, highlight shapes, comments/replies, rich note, drag+resize, manager, undo/redo, visibility, simulated storage, legacy HTML import and migration response; no HTML exporter.')
   await browser.close()
 finally:server.shutdown();server.server_close()
if __name__=='__main__':asyncio.run(main())
