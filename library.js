'use strict';
const $=id=>document.getElementById(id);
let pages=[],selectedFolder='All pages',folders=[],filePending=null,searchMatches=null,searchSequence=0,searchTimer=null,excluded=[];
async function rpc(type,extra={}){const r=await chrome.runtime.sendMessage({type,...extra});if(!r?.ok)throw Error(r?.error||'Unavailable');return r;}
function toast(text){$('toast').textContent=text;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').textContent='',4000);}
function shortSite(key){try{const u=new URL(key);return u.hostname.replace(/^www\./,'');}catch{return key;}}
function summary(p){return p.snippets?.find(s=>s.text)?.text||'A saved collection of webpage annotations.';}
function getFolders(){return [...new Set([...folders,'Unfiled',...pages.map(x=>x.folder||'Unfiled')])].sort();}
function updateFolders(){const all=getFolders();$('folders').replaceChildren();$('all-count').textContent=pages.length;
  for(const f of all){const b=document.createElement('button');b.className=`nav${selectedFolder===f?' active':''}`;b.textContent='◫  ';const s=document.createElement('span');s.textContent=f;b.append(s);b.addEventListener('click',()=>{showLibrary();selectedFolder=f;updateFolders();render();});$('folders').append(b);}
  $('all').classList.toggle('active',selectedFolder==='All pages');$('starred').classList.toggle('active',selectedFolder==='Starred');$('starred-count').textContent=pages.filter(p=>p.favorite).length;$('folders-count').textContent=all.length;
}
function render(){const term=$('search').value.toLocaleLowerCase().trim();let list=pages.filter(p=>(selectedFolder==='All pages'||(selectedFolder==='Starred'?p.favorite:p.folder===selectedFolder))&&(!term||(searchMatches?searchMatches.has(p.key):[p.key,p.folder,...(p.snippets||[]).map(s=>s.text)].join(' ').toLocaleLowerCase().includes(term))));
  const mode=$('sort').value;if(mode==='recent')list.sort((a,b)=>b.updatedAt-a.updatedAt);if(mode==='name')list.sort((a,b)=>a.key.localeCompare(b.key));if(mode==='count')list.sort((a,b)=>b.count-a.count);
  $('pages').replaceChildren();$('empty').hidden=list.length>0;$('result-count').textContent=`${list.length} page${list.length===1?'':'s'}`;$('title').textContent=selectedFolder==='All pages'?'All annotated pages':selectedFolder==='Starred'?'Starred research':selectedFolder;
  const allFolders=getFolders();for(const page of list){const card=document.createElement('article');card.className='page-card';const top=document.createElement('div');top.className='card-top';const icon=document.createElement('span');icon.className='site-icon';icon.textContent=shortSite(page.key)[0]?.toUpperCase()||'W';const date=document.createElement('small');date.textContent=page.updatedAt?new Date(page.updatedAt).toLocaleDateString():'Saved';top.append(icon,date);const star=document.createElement('button');star.type='button';star.className='star-button'+(page.favorite?' starred':'');star.setAttribute('aria-label',page.favorite?'Remove from starred':'Add to starred');star.setAttribute('aria-pressed',String(!!page.favorite));star.textContent=page.favorite?'★':'☆';star.addEventListener('click',async()=>{try{const result=await rpc('MF_LIBRARY_FAVORITE',{key:page.key,favorite:!page.favorite});page.favorite=result.favorite;updateFolders();render();toast(page.favorite?'Page starred':'Page unstarred');}catch(e){toast(e.message);}});top.append(star);
    const title=document.createElement('h3');title.textContent=shortSite(page.key);const url=document.createElement('div');url.className='url';url.textContent=page.key;
    const excerpt=document.createElement('div');excerpt.className='snippet';excerpt.textContent=summary(page);
    const bottom=document.createElement('div');bottom.className='card-bottom';const count=document.createElement('span');count.className='pill';count.textContent=`${page.count} annotations`;
    const folder=document.createElement('select');folder.className='folder-select';folder.setAttribute('aria-label','Choose collection');for(const name of allFolders){const opt=document.createElement('option');opt.value=name;opt.textContent=name;folder.append(opt);}folder.value=page.folder||'Unfiled';folder.addEventListener('change',async()=>{try{await rpc('MF_LIBRARY_FOLDER',{key:page.key,folder:folder.value});page.folder=folder.value;updateFolders();render();toast('Collection updated');}catch(e){toast(e.message);}});
    const link=document.createElement('a');link.href=page.key;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open ↗';const remove=document.createElement('button');remove.className='delete-page';remove.type='button';remove.textContent='Delete';remove.setAttribute('aria-label',`Delete annotations for ${shortSite(page.key)}`);remove.addEventListener('click',()=>modal('Delete saved annotations?',`This permanently deletes all ${page.count} annotations saved for ${shortSite(page.key)}. Make a JSON backup first if you need them.`,[{label:'Cancel'},{label:'Delete page',primary:true,click:async()=>{try{await rpc('MF_LIBRARY_DELETE',{key:page.key});await reload();toast('Saved page deleted');}catch(e){toast(e.message);}}}]));bottom.append(count,folder,link,remove);card.append(top,title,url,excerpt,bottom);$('pages').append(card);
  }
}
async function reload(){const result=await rpc('MF_LIBRARY_LIST');pages=result.pages||[];const saved=await rpc('MF_COLLECTIONS_READ');folders=saved.collections||[];$('pages-count').textContent=pages.length;$('annotations-count').textContent=pages.reduce((n,p)=>n+p.count,0);updateFolders();render();refreshHealth().catch(()=>{});}
function modal(title,description,buttons){$('dialog-title').textContent=title;$('dialog-description').textContent=description;$('dialog-buttons').replaceChildren();for(const item of buttons){const b=document.createElement('button');b.className='btn '+(item.primary?'primary':'light');b.textContent=item.label;b.onclick=()=>{if(item.dismiss!==false)$('dialog').hidden=true;item.click?.();};$('dialog-buttons').append(b);}$('dialog').hidden=false;}
async function backup(){try{const {backup}=await rpc('MF_LIBRARY_BACKUP');const json=JSON.stringify(backup,null,2);const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`markflow-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);toast(`Backup contains ${backup.pages.length} pages`);}catch(e){toast(`Backup failed: ${e.message}`);}}
async function restore(mode){if(!filePending)return;try{const result=await rpc('MF_LIBRARY_RESTORE',{backup:filePending,mode});filePending=null;await reload();toast(`Restored ${result.restored} pages (${mode})`);}catch(e){toast(`Restore failed: ${e.message}`);}}
$('backup').onclick=backup;$('import').onclick=()=>$('file').click();$('file').onchange=async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;if(f.size>30_000_000){toast('Backup exceeds 30 MB');return;}try{filePending=JSON.parse(await f.text());if(filePending.format!=='markflow-backup'||!Array.isArray(filePending.pages))throw Error('Not a Markflow backup');modal('Restore annotations',`This backup contains ${filePending.pages.length} pages. Merge keeps current notes. Replace deletes current notes and loads the backup.`,[{label:'Cancel'},{label:'Merge',primary:true,click:()=>restore('merge')},{label:'Replace all',click:()=>modal('Replace all local notes?', 'This will overwrite existing Markflow annotations in this Chrome profile.', [{label:'Cancel'},{label:'Replace permanently',primary:true,click:()=>restore('replace')}])}]);}catch(err){toast(err.message);}};
$('all').onclick=()=>{showLibrary();selectedFolder='All pages';updateFolders();render();};$('starred').onclick=()=>{showLibrary();selectedFolder='Starred';updateFolders();render();};$('new-folder').onclick=()=>{const name=prompt('Collection name (stored on this device):');if(!name||!name.trim())return;const folder=name.trim().slice(0,70);if(!folders.includes(folder))folders.push(folder);rpc('MF_COLLECTIONS_WRITE',{collections:folders}).catch(e=>toast(e.message));selectedFolder=folder;updateFolders();render();toast('Collection created. Assign pages to it from the page cards.');};
$('search').addEventListener('input',()=>{
  const q=$('search').value.trim(),seq=++searchSequence;
  clearTimeout(searchTimer);searchMatches=null;render();
  if(!q)return;
  searchTimer=setTimeout(async()=>{
    try{const result=await rpc('MF_LIBRARY_SEARCH',{query:q});if(seq!==searchSequence)return;searchMatches=new Set(result.keys||[]);render();}
    catch(e){toast(`Search unavailable: ${e.message}`);}
  },180);
});$('sort').addEventListener('change',render);$('dialog').addEventListener('click',e=>{if(e.target===$('dialog'))$('dialog').hidden=true;});
function showLibrary(){ $('collection-view').hidden=false;$('privacy-view').hidden=true;$('privacy-nav').classList.remove('active'); }
function showPrivacy(){ for(const e of document.querySelectorAll('.rail .nav.active'))e.classList.remove('active'); $('collection-view').hidden=true;$('privacy-view').hidden=false;$('privacy-nav').classList.add('active');$('all').classList.remove('active');$('starred').classList.remove('active');refreshPrivacy().catch(e=>toast(e.message)); }
const sizeText=n=>n<1024?`${n} B`:n<1024*1024?`${(n/1024).toFixed(1)} KB`:`${(n/1024/1024).toFixed(2)} MB`;
async function refreshHealth(){
  const r=await rpc('MF_LIBRARY_HEALTH');$('storage-used').textContent=sizeText(r.approxBytes);$('health-db').textContent=`${r.database} · schema ${r.schemaVersion}`;
  $('health-pages').textContent=r.pages;$('health-count').textContent=r.count;$('health-bytes').textContent=`~ ${sizeText(r.approxBytes)}`;
  $('health-excluded').textContent=r.excludedCount;
  $('type-breakdown').replaceChildren();for(const [kind,count] of Object.entries(r.byType||{})){
    const row=document.createElement('span');row.textContent=`${kind} · ${count}`;$('type-breakdown').append(row);
  }
}
async function refreshPrivacy(){
  const [p]=await Promise.all([rpc('MF_PRIVACY_READ'),refreshHealth()]);excluded=p.excluded||[];
  const list=$('exclude-list');list.replaceChildren();
  if(!excluded.length){const empty=document.createElement('p');empty.className='privacy-empty';empty.textContent='No excluded sites yet.';list.append(empty);}
  for(const domain of excluded){const row=document.createElement('div');row.className='excluded-site';const name=document.createElement('span');name.textContent=domain;
    const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.setAttribute('aria-label',`Remove ${domain} exclusion`);
    remove.addEventListener('click',async()=>{try{await rpc('MF_PRIVACY_WRITE',{sites:excluded.filter(d=>d!==domain)});await refreshPrivacy();toast('Exclusion removed · refresh website tab');}catch(e){toast(e.message);}});
    row.append(name,remove);list.append(row);
  }
}
$('privacy-nav').addEventListener('click',showPrivacy);
$('privacy-back').addEventListener('click',()=>{showLibrary();updateFolders();render();});
$('privacy-backup').addEventListener('click',backup);
$('exclude-form').addEventListener('submit',async e=>{e.preventDefault();const input=$('exclude-domain'),domain=input.value.trim().toLowerCase();
  try{await rpc('MF_PRIVACY_WRITE',{sites:[...excluded,domain]});input.value='';await refreshPrivacy();toast('Website paused · refresh open tab');}
  catch(error){toast(error.message);}
});
reload().catch(e=>toast(`Could not open IndexedDB: ${e.message}`));
