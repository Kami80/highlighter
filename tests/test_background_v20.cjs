// Markflow 2.0 deterministic service-worker/IndexedDB contract test.
// This is a mock; a real installed Chrome extension must still be tested separately.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const tables=new Map(),listeners=[];let version=0;
function openRequest(){
 const db={objectStoreNames:{contains:name=>tables.has(name)},createObjectStore:name=>{tables.set(name,new Map());},
 transaction:(name,mode)=>{
   const map=tables.get(name),tx={oncomplete:null,onerror:null,onabort:null};let pending=0,completing=false;
   const done=()=>{if(pending||completing)return;completing=true;setTimeout(()=>{if(!pending)tx.oncomplete?.();else completing=false;},0);};
   const request=fn=>{pending++;const q={onsuccess:null,onerror:null,result:undefined};queueMicrotask(()=>{
      try{q.result=fn();q.onsuccess?.();}catch(e){q.error=e;tx.error=e;q.onerror?.();tx.onerror?.();}
      finally{pending--;done();}
   });return q;};
   tx.objectStore=()=>({get:key=>request(()=>structuredClone(map.get(key))),getAll:()=>request(()=>structuredClone([...map.values()])),put:v=>request(()=>{map.set(v.key,structuredClone(v));return v.key;}),clear:()=>request(()=>map.clear())});return tx;
 }};
 const q={result:db,onupgradeneeded:null,onsuccess:null,onerror:null};queueMicrotask(()=>{if(version<2){q.onupgradeneeded?.();version=2;}q.onsuccess?.();});return q;
}
const legacy={'markflow:v1:https://example.org/article':[{id:'old',type:'note',x:12,y:18,text:'Prior version saved note'}]};
const chrome={runtime:{id:'abc',getURL:p=>'chrome-extension://abc/'+p,onMessage:{addListener:fn=>listeners.push(fn)}},action:{onClicked:{addListener:()=>{}}},tabs:{create:async()=>{}},storage:{local:{get:async key=>({[key]:legacy[key]})}}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','background.js'),'utf8'),{chrome,indexedDB:{open:openRequest},URL,Date,Promise,queueMicrotask,setTimeout,clearTimeout,console,structuredClone});
const send=(type,body={},sender='chrome-extension://abc/library.html')=>new Promise((resolve,reject)=>{
 let settled=false;listeners[0]({type,...body},{url:sender},reply=>{settled=true;resolve(reply);});setTimeout(()=>{if(!settled)reject(Error('Timed out: '+type));},2000);
});
(async()=>{
 const key='https://example.org/article';
 let r=await send('MF_DB_READ',{key},key);assert.equal(r.ok,true);assert.equal(r.revision,0);assert.equal(r.annotations[0].id,'old');
 const base=r.annotations;
 const a=[...base,{id:'a',type:'highlight',anchor:{quote:'First annotation'}}];
 r=await send('MF_DB_WRITE',{key,annotations:a,baseAnnotations:base,expectedRevision:0},key);
 assert.equal(r.saved,true);assert.equal(r.revision,1);
 const b=[...base,{id:'b',type:'note',text:'Second independent tab'}];
 r=await send('MF_DB_WRITE',{key,annotations:b,baseAnnotations:base,expectedRevision:0},key);
 assert.equal(r.saved,true);assert.equal(r.merged,true);assert.equal(r.revision,2);assert.equal(r.annotations.length,3);
 const merged=r.annotations;
 const edit1=merged.map(x=>x.id==='old'?{...x,text:'tab one'}:x);
 const edit2=merged.map(x=>x.id==='old'?{...x,text:'tab two'}:x);
 r=await send('MF_DB_WRITE',{key,annotations:edit1,baseAnnotations:merged,expectedRevision:2},key);assert.equal(r.saved,true);
 r=await send('MF_DB_WRITE',{key,annotations:edit2,baseAnnotations:merged,expectedRevision:2},key);
 assert.equal(r.saved,false);assert.equal(r.conflict,true);assert.deepEqual([...r.conflictIds],['old']);
 r=await send('MF_DB_READ',{key},key);assert.equal(r.revision,3);assert.equal(r.annotations.find(x=>x.id==='old').text,'tab one');
 // Extensions cannot allow arbitrary webpages to mutate global privacy rules.
 r=await send('MF_PRIVACY_WRITE',{sites:['example.org']},key);assert.equal(r.ok,false);
 r=await send('MF_PRIVACY_WRITE',{sites:['example.org','www.example.org']});assert.equal(r.ok,true);
 r=await send('MF_PRIVACY_READ',{},key);assert.equal(r.paused,true);
 r=await send('MF_PRIVACY_READ',{},'https://unrelated.org/');assert.equal(r.paused,false);
 r=await send('MF_PRIVACY_WRITE',{sites:['not valid host']});assert.equal(r.ok,false);
 r=await send('MF_PRIVACY_READ');assert.deepEqual([...r.excluded],['example.org','www.example.org']);
 r=await send('MF_LIBRARY_FAVORITE',{key,favorite:true});assert.equal(r.favorite,true);
 r=await send('MF_LIBRARY_LIST');assert.equal(r.pages[0].favorite,true);
 r=await send('MF_LIBRARY_HEALTH');assert.equal(r.count,3);assert.equal(r.excludedCount,2);assert.ok(r.approxBytes>100);
 r=await send('MF_LIBRARY_BACKUP');assert.equal(r.backup.pages[0].favorite,true);assert.equal(r.backup.excludedSites.length,2);
 const backup=r.backup;
 r=await send('MF_PRIVACY_WRITE',{sites:[]});assert.equal(r.excluded.length,0);
 r=await send('MF_LIBRARY_RESTORE',{backup,mode:'merge'});assert.equal(r.ok,true);
 r=await send('MF_PRIVACY_READ');assert.equal(r.excluded.length,2);
 r=await send('MF_LIBRARY_HEALTH',{},key);assert.equal(r.ok,false);
 console.log('PASS v2.0: old data migration, atomic independent edits, same-ID conflict protection, privacy exclusions, favorites, diagnostics, backup compatibility.');
})().catch(e=>{console.error(e);process.exitCode=1;});
