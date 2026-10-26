'use strict';
const assert=require('node:assert/strict'),R=require('../catalog-resources.js');
(async()=>{
 let calls=[],fail=true;const resources=R.create({audio:{url:'audio'},central:{url:'central'},valencia:{url:'valencia'}},{timeout:25,fetcher:async url=>{calls.push(url);if(url==='valencia'&&fail)throw Error('offline');return {ok:true,json:async()=>({id:url})};}});
 await resources.start();assert.equal(resources.get('audio').status,'ready');assert.equal(resources.get('central').status,'ready');assert.equal(resources.get('valencia').status,'error');
 await resources.start();assert.equal(calls.length,3,'Failed resources do not retry in a loop');fail=false;await resources.load('valencia',{retry:true});assert.equal(resources.get('valencia').status,'ready');assert.deepEqual(calls,['audio','central','valencia','valencia']);
 let aborted=false;const delayed=R.create({ipa:{url:'ipa'}},{timeout:10,fetcher:(_url,{signal})=>new Promise(()=>signal.addEventListener('abort',()=>{aborted=true;}))});await delayed.start();assert(aborted);assert.equal(delayed.get('ipa').status,'error');assert.equal(delayed.get('ipa').error,'timeout');
 let resolve;const coalesced=R.create({audio:{url:'audio'}},{fetcher:()=>new Promise(done=>{resolve=()=>done({ok:true,json:async()=>({})});})});const a=coalesced.load('audio'),b=coalesced.load('audio');assert.equal(a,b);await Promise.resolve();resolve();await a;assert.equal(coalesced.get('audio').status,'ready');
 assert.throws(()=>R.validateIndex({schemaVersion:1,profile:'wrong',language:'ca',entries:[]},'right'));
 assert.throws(()=>R.validateIndex({schemaVersion:1,profile:'right',language:'ca',entries:[{id:'p-x',text:'mot',ipa:'',status:'pendent'},{id:'p-x',text:'mot',ipa:'',status:'pendent'}]},'right'));
 for(const [file,profile] of require('./build-pronunciation-index.cjs').PROFILES)R.validateIndex(require('../audio/pronunciation/runtime/'+file+'.json'),profile);
 require('./build-pronunciation-index.cjs').build(true);
 console.log('Independent catalogue resources: partial failure, selective retry, timeout/abort, concurrent coalescing and lightweight index identity passed.');
})().catch(error=>{console.error(error);process.exit(1);});
