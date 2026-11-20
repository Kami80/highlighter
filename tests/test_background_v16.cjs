// Deterministic IndexedDB contract test. Real browser UI tested separately.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const tables=new Map(),listeners=[];let version=0;
function openRequest(){const db={
 objectStoreNames:{contains:name=>tables.has(name)},
 createObjectStore:name=>{tables.set(name,new Map());},
 transaction:(name,mode)=>{
   const map=tables.get(name),tx={oncomplete:null,onerror:null,onabort:null};let pending=0,completing=false;
   const done=()=>{if(pending||completing)return;completing=true;setTimeout(()=>{if(!pending)tx.oncomplete?.();else completing=false;},0);};
   const request=produce=>{pending++;const q={onsuccess:null,onerror:null,result:undefined};queueMicrotask(()=>{try{q.result=produce();q.onsuccess?.();}catch(e){q.error=e;q.onerror?.();tx.error=e;tx.onerror?.();}finally{pending--;done();}});return q;};
   tx.objectStore=()=>({get:key=>request(()=>structuredClone(map.get(key))),getAll:()=>request(()=>structuredClone([...map.values()])),put:val=>request(()=>{map.set(val.key,structuredClone(val));return val.key;}),clear:()=>request(()=>{map.clear();})});return tx;
 }
};const q={result:db,onupgradeneeded:null,onsuccess:null,onerror:null};
 queueMicrotask(()=>{if(version<2){q.onupgradeneeded?.();version=2;}q.onsuccess?.();});return q;}
const indexedDB={open:openRequest};
const legacy={'markflow:v1:https://example.org/article':[{id:'old',type:'note',x:12,y:18,text:'Legacy v1.4 saved note'}]};
const chrome={runtime:{id:'abc',getURL:path=>'chrome-extension://abc/'+path,onMessage:{addListener:fn=>listeners.push(fn)}},action:{onClicked:{addListener:()=>{}}},tabs:{create:async()=>{}},storage:{local:{get:async key=>({[key]:legacy[key]})}}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','background.js'),'utf8'),{chrome,indexedDB,URL,Date,Promise,queueMicrotask,setTimeout,clearTimeout,console,structuredClone});
const send=(type,body={},sender='chrome-extension://abc/library.html')=>new Promise((resolve,reject)=>{
 let settled=false;listeners[0]({type,...body},{url:sender},reply=>{settled=true;resolve(reply);});setTimeout(()=>{if(!settled)reject(Error('Background timed out '+type));},1800);
});
(async()=>{
 const key='https://example.org/article';let r=await send('MF_DB_READ',{key},key);assert.equal(r.ok,true);assert.equal(r.migrated,true);assert.equal(r.annotations[0].id,'old');
 r=await send('MF_DB_WRITE',{key,annotations:[{id:'new',type:'image',text:'Picture note',image:{path:[1],region:{x:0.1,y:0.2,w:0.6,h:0.5}}}]},key);assert.equal(r.saved,true);
 r=await send('MF_LAYERS_READ',{},key);assert.equal(r.layers.length,3);
 r=await send('MF_LAYERS_WRITE',{layers:[{id:'personal',name:'Personal',color:'#ff557e'},{id:'work',name:'Work',color:'#5588ee'}]},key);assert.equal(r.layers.length,2);
 r=await send('MF_LIBRARY_FOLDER',{key,folder:'Work'});assert.equal(r.saved,true);
 r=await send('MF_COLLECTIONS_WRITE',{collections:['Work','Research']});assert.equal(r.saved,true);
 r=await send('MF_COLLECTIONS_READ');assert.equal(r.collections[0],'Work');
 r=await send('MF_LIBRARY_LIST');assert.equal(r.pages.length,1);assert.equal(r.pages[0].folder,'Work');
 r=await send('MF_LIBRARY_BACKUP');assert.equal(r.backup.format,'markflow-backup');assert.equal(r.backup.pages.length,1);assert.ok(r.backup.collections.includes('Research'));
 const backup=r.backup;
 r=await send('MF_LIBRARY_RESTORE',{backup,mode:'merge'});assert.equal(r.ok,true);
 r=await send('MF_DB_READ',{key},key);assert.equal(r.annotations.length,1);
 // A replacement backup swaps all pages and restores original annotation shape.
 backup.pages=[{key:'https://example.org/article',folder:'Archive',annotations:[{id:'from-backup',type:'note',text:'Recovered'}]}];
 r=await send('MF_LIBRARY_RESTORE',{backup,mode:'replace'});assert.equal(r.restored,1);
 r=await send('MF_DB_READ',{key},key);assert.equal(r.annotations[0].id,'from-backup');
 r=await send('MF_LIBRARY_LIST',{},key);assert.equal(r.ok,false);assert.match(r.error,/restricted/);
 r=await send('MF_DB_READ',{key:'https://unrelated.org/'},key);assert.equal(r.ok,false);assert.match(r.error,/does not match/);
 console.log('PASS: IndexedDB mock: v1.4 migration, v1.5 compatibility, images, layered settings, folders, global search metadata, backup, merge, replace, access restrictions.');
})().catch(e=>{console.error(e);process.exitCode=1;});
