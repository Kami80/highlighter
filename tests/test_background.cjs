// Mock IndexedDB smoke test for background.js' migration and message contract.
// The browser's actual IndexedDB API is not substituted by this test.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const records=new Map();let exists=false;const listeners=[];
const db={
  objectStoreNames:{contains:()=>exists},
  createObjectStore:()=>{exists=true;},
  transaction:(store,mode)=>{
    const tx={oncomplete:null,onerror:null,onabort:null};
    tx.objectStore=()=>({
      get:(key)=>{const request={result:null,onerror:null,onsuccess:null};queueMicrotask(()=>{request.result=records.get(key)||undefined;request.onsuccess?.();});return request;},
      put:(value)=>{records.set(value.key,structuredClone(value));queueMicrotask(()=>tx.oncomplete?.());}
    });return tx;
  }
};
const indexedDB={open:()=>{
  const request={result:db,onsuccess:null,onerror:null,onupgradeneeded:null};
  queueMicrotask(()=>{if(!exists)request.onupgradeneeded?.();request.onsuccess?.();});
  return request;
}};
const legacy={'markflow:v1:https://example.org/article':[
  {id:'legacy-note',type:'note',x:42,y:200,text:'Retain this old note',created:111}
]};
const chrome={
  action:{onClicked:{addListener:()=>{}}},
  runtime:{onMessage:{addListener:fn=>listeners.push(fn)}},
  storage:{local:{get:async key=>({[key]:legacy[key]})}}
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','background.js'),'utf8'),{chrome,indexedDB,URL,console,Date,setTimeout,clearTimeout,structuredClone,Promise,queueMicrotask});
assert.equal(listeners.length,1);
const dispatch=(message,senderURL='https://example.org/article')=>new Promise((resolve,reject)=>{
  let completed=false;
  const result=listeners[0](message,{url:senderURL},value=>{completed=true;resolve(value);});
  if(!result)reject(Error('Message not handled'));
  setTimeout(()=>{if(!completed)reject(Error('Response timed out'));},1200);
});
(async()=>{
  const first=await dispatch({type:'MF_DB_READ',key:'https://example.org/article'});
  assert.equal(first.ok,true);assert.equal(first.migrated,true);
  assert.equal(first.annotations[0].text,'Retain this old note');
  const newer=[{id:'new-note',type:'note',x:55,y:250,text:'This lives in IndexedDB',created:200}];
  const saved=await dispatch({type:'MF_DB_WRITE',key:'https://example.org/article',annotations:newer});
  assert.equal(saved.ok,true);assert.equal(saved.count,1);
  const second=await dispatch({type:'MF_DB_READ',key:'https://example.org/article'});
  assert.equal(second.migrated,false);assert.equal(second.annotations[0].id,'new-note');
  const blocked=await dispatch({type:'MF_DB_READ',key:'https://another.org/page'});
  assert.equal(blocked.ok,false);assert.match(blocked.error,/does not match sender/);
  console.log('PASS: service worker IndexedDB message flow, v1.4 migration, write/read, and sender-key validation (with a mock IndexedDB implementation).');
})().catch(e=>{console.error(e);process.exitCode=1;});
