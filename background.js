/* Markflow v2.0 — extension-origin IndexedDB, forwards-compatible with v1.5. */
'use strict';
const DB_NAME='markflow-annotations', DB_VERSION=2, PAGES='pages', SETTINGS='settings';
const DEFAULT_LAYERS=[{id:'personal',name:'Personal',color:'#ff557e'},{id:'research',name:'Research',color:'#6c93ef'},{id:'review',name:'Review',color:'#46bf9f'}];
let dbPromise;
function openDB(){
  if(!dbPromise) dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(PAGES))db.createObjectStore(PAGES,{keyPath:'key'});
      if(!db.objectStoreNames.contains(SETTINGS))db.createObjectStore(SETTINGS,{keyPath:'key'});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||Error('IndexedDB open failed'));
  }).catch(e=>{dbPromise=null;throw e;});
  return dbPromise;
}
async function read(store,key){const db=await openDB();return new Promise((resolve,reject)=>{
  const q=db.transaction(store,'readonly').objectStore(store).get(key);
  q.onsuccess=()=>resolve(q.result||null);q.onerror=()=>reject(q.error);
});}
async function list(store){const db=await openDB();return new Promise((resolve,reject)=>{
  const q=db.transaction(store,'readonly').objectStore(store).getAll();
  q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>reject(q.error);
});}
async function write(store,record){const db=await openDB();return new Promise((resolve,reject)=>{
  const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(record);
  tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
});}
function safeKey(v){if(typeof v!=='string'||v.length>4096)throw Error('Invalid page URL');const u=new URL(v);
  if(!['http:','https:'].includes(u.protocol))throw Error('Unsupported URL');return `${u.origin}${u.pathname}${u.search}`;
}
function validAnnotation(a){return a&&typeof a==='object'&&typeof a.id==='string'&&a.id.length<200&&['highlight','comment','note','pen','arrow','rect','image'].includes(a.type);}
function normalizeAnnotations(list){if(!Array.isArray(list)||list.length>12000)throw Error('Invalid annotation collection');const a=list.filter(validAnnotation);
  if(JSON.stringify(a).length>12_000_000)throw Error('Annotations too large');return a;
}
async function loadPage(key){let record=await read(PAGES,key);
  if(record)return{annotations:record.annotations||[],migrated:false,folder:record.folder||'Unfiled',revision:record.revision||0};
  const oldKey=`markflow:v1:${key}`,old=await chrome.storage.local.get(oldKey);
  const annotations=Array.isArray(old[oldKey])?old[oldKey].filter(validAnnotation):[];
  // Do not create empty records just because the user visited a webpage.
  if(annotations.length)await write(PAGES,{key,annotations,revision:0,updatedAt:Date.now(),folder:'Unfiled'});
  return{annotations,migrated:annotations.length>0,folder:'Unfiled',revision:0};
}
async function writePage(key,annotations){const old=await read(PAGES,key);
  await write(PAGES,{...old,key,annotations:normalizeAnnotations(annotations),revision:(old?.revision||0)+1,updatedAt:Date.now(),folder:old?.folder||'Unfiled'});
}

// Concurrent tabs: optimistic revision + three-way merge. Only annotations
// changed since the caller's base snapshot are written. If both tabs edit
// the same annotation, neither user's edit is silently discarded.
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
async function writePageSafe(key,local,base,expectedRevision){
  local=normalizeAnnotations(local);base=normalizeAnnotations(base);
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw Error('Invalid page revision');
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(PAGES,'readwrite'),store=tx.objectStore(PAGES);
    let response=null,failure=null;
    const req=store.get(key);
    req.onerror=()=>{failure=req.error||Error('Cannot read current annotations');};
    req.onsuccess=()=>{
      const old=req.result||{key,annotations:[],revision:0,folder:'Unfiled'};
      const remote=normalizeAnnotations(old.annotations||[]),rev=old.revision||0;
      let merged=local;
      if(rev!==expectedRevision){
        const b=new Map(base.map(x=>[x.id,x])),l=new Map(local.map(x=>[x.id,x])),r=new Map(remote.map(x=>[x.id,x]));
        const changed=new Set([...b.keys(),...l.keys()].filter(id=>!same(b.get(id),l.get(id))));
        const conflict=[...changed].filter(id=>!same(r.get(id),b.get(id))&&!same(r.get(id),l.get(id)));
        if(conflict.length){response={saved:false,conflict:true,conflictIds:conflict,revision:rev};return;}
        for(const id of changed){if(l.has(id))r.set(id,l.get(id));else r.delete(id);}
        merged=[...r.values()];
      }
      response={saved:true,merged:rev!==expectedRevision,revision:rev+1,count:merged.length,annotations:merged};
      store.put({...old,key,annotations:merged,revision:rev+1,updatedAt:Date.now(),folder:old.folder||'Unfiled'});
    };
    tx.oncomplete=()=>resolve(response);
    tx.onerror=()=>reject(failure||tx.error||Error('Storage transaction failed'));
    tx.onabort=()=>reject(tx.error||Error('Storage transaction aborted'));
  });
}
// Update page metadata inside a single transaction so concurrent annotation
// saves cannot be overwritten by a stale read-modify-write operation.
async function updatePageMetadata(key, changes){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(PAGES,'readwrite'),store=tx.objectStore(PAGES);
    let present=false;
    const req=store.get(key);
    req.onsuccess=()=>{
      const page=req.result;
      if(!page)return;
      present=true;
      store.put({...page,...changes});
    };
    tx.oncomplete=()=>present?resolve(true):reject(Error('Page not found'));
    tx.onerror=()=>reject(tx.error||Error('Metadata update failed'));
    tx.onabort=()=>reject(tx.error||Error('Metadata update aborted'));
  });
}
function normalizeDomain(domain){
  if(typeof domain!=='string'||domain.length>253)throw Error('Invalid hostname');
  const name=domain.trim().toLowerCase();
  if(!/^[a-z0-9.-]+$/.test(name)||!name.includes('.')||name.includes('..')||name.startsWith('.')||name.endsWith('.'))throw Error('Enter a hostname such as example.com');
  return name;
}
async function excludedSites(){return (await read(SETTINGS,'excludedSites'))?.sites||[];}

async function readLayers(){const record=await read(SETTINGS,'layers');return record?.items||DEFAULT_LAYERS;}
function cleanLayers(layers){if(!Array.isArray(layers)||layers.length>20)throw Error('Invalid layers');
  const list=layers.filter(x=>x&&typeof x.id==='string'&&/^[a-z0-9_-]{1,40}$/i.test(x.id)&&typeof x.name==='string'&&x.name.trim().length>0&&x.name.length<=45&&/^#[a-f0-9]{6}$/i.test(x.color)).map(x=>({id:x.id,name:x.name.trim(),color:x.color}));
  if(!list.some(x=>x.id==='personal'))throw Error('Personal layer cannot be removed');
  if(new Set(list.map(x=>x.id)).size!==list.length)throw Error('Duplicate layer names');return list;
}
const isTrustedPage=sender=>sender.url?.startsWith(`chrome-extension://${chrome.runtime.id}/`)===true;
function verifySender(key,sender){const u=new URL(sender.url||sender.tab?.url||'about:blank');const expected=`${u.origin}${u.pathname}${u.search}`;
  if(key!==expected)throw Error('Page key does not match sender');
}
async function handle(message,sender){
  if(!message||typeof message.type!=='string')throw Error('Malformed request');
  if(message.type==='MF_DB_READ'||message.type==='MF_DB_WRITE'){
    const key=safeKey(message.key);verifySender(key,sender);
    if(message.type==='MF_DB_READ')return loadPage(key);
    if(Array.isArray(message.baseAnnotations)&&Number.isSafeInteger(message.expectedRevision))return writePageSafe(key,message.annotations,message.baseAnnotations,message.expectedRevision);
    await writePage(key,message.annotations);return{saved:true,count:message.annotations.length};
  }
  if(message.type==='MF_PRIVACY_READ'){
    const page=isTrustedPage(sender)?null:new URL(sender.url||sender.tab?.url||'about:blank');
    const sites=await excludedSites();
    return isTrustedPage(sender)?{excluded:sites,paused:false}:{paused:sites.includes(page.hostname.toLowerCase())};
  }
  if(message.type==='MF_LAYERS_READ')return{layers:await readLayers()};
  if(message.type==='MF_LAYERS_WRITE'){
    const layers=cleanLayers(message.layers);await write(SETTINGS,{key:'layers',items:layers});return{layers};
  }
  if(message.type==='MF_COLLECTIONS_READ'){const result=await read(SETTINGS,'collections');return{collections:result?.items||[]};}
  if(message.type==='MF_COLLECTIONS_WRITE'){if(!isTrustedPage(sender))throw Error('Only the library can create folders');const folders=message.collections;if(!Array.isArray(folders)||folders.length>500||folders.some(f=>typeof f!=='string'||f.length>70))throw Error('Invalid collections');await write(SETTINGS,{key:'collections',items:[...new Set(folders)]});return{saved:true};}
  if(message.type==='MF_OPEN_LIBRARY'){
    await chrome.tabs.create({url:chrome.runtime.getURL('library.html')});return{opened:true};
  }
  // These operations may reveal or change data from multiple sites. Library UI only.
  if(!isTrustedPage(sender))throw Error('This operation is restricted to the Markflow library');
  if(message.type==='MF_PRIVACY_WRITE'){
    const sites=message.sites;
    if(!Array.isArray(sites)||sites.length>500)throw Error('Too many excluded websites');
    const normalized=[...new Set(sites.map(normalizeDomain))];
    await write(SETTINGS,{key:'excludedSites',sites:normalized});return{excluded:normalized};
  }
  if(message.type==='MF_LIBRARY_HEALTH'){
    const pages=await list(PAGES),sites=await excludedSites();
    const count=pages.reduce((n,p)=>n+(p.annotations||[]).length,0);
    const byType={};for(const page of pages)for(const a of page.annotations||[])byType[a.type]=(byType[a.type]||0)+1;
    const bytes=pages.reduce((n,p)=>n+JSON.stringify(p).length*2,0);
    return{pages:pages.filter(p=>p.annotations?.length).length,count,byType,approxBytes:bytes,excludedCount:sites.length,
      database:DB_NAME,schemaVersion:DB_VERSION,estimated:true};
  }
  if(message.type==='MF_LIBRARY_DELETE'){
    const key=safeKey(message.key),db=await openDB();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(PAGES,'readwrite');tx.objectStore(PAGES).delete(key);
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
    });
    return{deleted:true};
  }
  if(message.type==='MF_LIBRARY_FAVORITE'){
    const key=safeKey(message.key);await updatePageMetadata(key,{favorite:!!message.favorite});
    return{saved:true,favorite:!!message.favorite};
  }
  if(message.type==='MF_LIBRARY_LIST'){
    const pages=await list(PAGES);
    return{pages:pages.filter(p=>(p.annotations||[]).length>0).map(p=>({key:p.key,folder:p.folder||'Unfiled',favorite:!!p.favorite,updatedAt:p.updatedAt||0,count:p.annotations?.length||0,
      snippets:(p.annotations||[]).slice(0,1000).map(a=>({type:a.type,text:(a.text||a.anchor?.quote||'').slice(0,300),layer:a.layer||'personal'}))}))};
  }
  if(message.type==='MF_LIBRARY_SEARCH'){
    const query=String(message.query||'').toLocaleLowerCase().trim().slice(0,200);
    if(!query)return{keys:[]};
    const pages=await list(PAGES);
    const keys=pages.filter(p=>p.key.toLowerCase().includes(query)||(p.folder||'').toLocaleLowerCase().includes(query)||
      (p.annotations||[]).some(a=>`${a.text||''} ${a.title||''} ${a.anchor?.quote||''} ${(a.replies||[]).map(r=>r.text).join(' ')}`.toLocaleLowerCase().includes(query)))
      .map(p=>p.key);
    return{keys};
  }
  if(message.type==='MF_LIBRARY_BACKUP'){
    const pages=await list(PAGES), layers=await readLayers();
    const collections=(await read(SETTINGS,'collections'))?.items||[];
    return{backup:{app:'markflow',format:'markflow-backup',version:1,exportedAt:new Date().toISOString(),pages,layers,collections,excludedSites:await excludedSites()}};
  }
  if(message.type==='MF_LIBRARY_RESTORE'){
    const backup=message.backup;
    if(!backup||backup.format!=='markflow-backup'||backup.version!==1||!Array.isArray(backup.pages)||backup.pages.length>10000)throw Error('Unsupported backup file');
    const prepared=[];
    for(const page of backup.pages){
      const key=safeKey(page.key),annotations=normalizeAnnotations(page.annotations||[]);
      prepared.push({key,annotations,revision:Math.max(0,Number(page.revision)||0),favorite:!!page.favorite,updatedAt:Date.now(),folder:String(page.folder||'Unfiled').slice(0,70)});
    }
    const db=await openDB();const mode=message.mode==='replace'?'replace':'merge';
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(PAGES,'readwrite'),store=tx.objectStore(PAGES);
      if(mode==='replace')store.clear();
      for(const p of prepared){
        if(mode==='replace'){store.put(p);continue;}
        const req=store.get(p.key);
        req.onsuccess=()=>{
          const current=req.result;
          if(!current){store.put(p);return;}
          const ids=new Set((current.annotations||[]).map(x=>x.id));
          store.put({...current,annotations:[...(current.annotations||[]),...p.annotations.filter(a=>!ids.has(a.id))],revision:(current.revision||0)+1,updatedAt:Date.now()});
        };
      }
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
    });
    if(backup.layers)await write(SETTINGS,{key:'layers',items:cleanLayers(backup.layers)});
    if(Array.isArray(backup.collections))await write(SETTINGS,{key:'collections',items:[...new Set(backup.collections.filter(x=>typeof x==='string'&&x.length<=70))]});
    if(Array.isArray(backup.excludedSites))await write(SETTINGS,{key:'excludedSites',sites:[...new Set(backup.excludedSites.map(normalizeDomain))]});
    return{restored:prepared.length,mode};
  }
  if(message.type==='MF_LIBRARY_FOLDER'){
    const key=safeKey(message.key),folder=String(message.folder||'Unfiled').trim().slice(0,70)||'Unfiled';
    await updatePageMetadata(key,{folder});return{saved:true};
  }
  throw Error('Unknown command');
}
chrome.action.onClicked.addListener(async tab=>{
  if(!tab.id)return;
  try{await chrome.tabs.sendMessage(tab.id,{type:'MARKFLOW_TOGGLE'});await chrome.action.setBadgeText({tabId:tab.id,text:''});}
  catch(e){await chrome.action.setBadgeBackgroundColor({tabId:tab.id,color:'#F43F72'});await chrome.action.setBadgeText({tabId:tab.id,text:'N/A'});}
});
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
  handle(message,sender).then(result=>sendResponse({ok:true,...result}),e=>sendResponse({ok:false,error:String(e.message||e)}));return true;
});
