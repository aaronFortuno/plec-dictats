'use strict';
const assert=require('node:assert/strict');
const {create}=require('../catalog-audio.js');
const entry={id:'a',text:'àudio'};
const manifest=(status='ready',file='words/àudio.mp3')=>({schemaVersion:1,defaultPacks:{ca:'central'},packs:[{id:'central',language:'ca',status,basePath:'audio/central/',files:{a:file,b:'words/be.mp3'}}]});
class FakeAudio{
 static instances=[];
 constructor(url){this.url=url;this.paused=false;this.removed=false;FakeAudio.instances.push(this);}
 play(){return Promise.resolve();}
 pause(){this.paused=true;}
 removeAttribute(name){if(name==='src')this.removed=true;}
}
async function make(m,extra={}){
 const requests=[];const controller=create({base:'https://example.test/plec/',language:'ca',Audio:FakeAudio,fetch:async url=>{requests.push(String(url));return {ok:true,json:async()=>m};},...extra});
 await Promise.all([controller.load(),controller.load()]);return {controller,requests};
}
(async()=>{
 const {controller:c,requests}=await make(manifest());
 assert.deepEqual(requests,['https://example.test/plec/audio/manifest.json']);
 assert.equal(FakeAudio.instances.length,0,'Opening the catalogue never starts audio');
 assert.equal(c.urlFor(entry),'https://example.test/plec/audio/central/words/%C3%A0udio.mp3');
 assert.equal(c.urlFor({id:'missing'}),null);
 c.play(entry);const a=FakeAudio.instances.at(-1),staleEnd=a.onended;
 c.play({id:'b'});const b=FakeAudio.instances.at(-1);
 assert(a.paused&&a.removed);staleEnd();assert.equal(c.getState().playingId,'b');
 b.onended();assert.equal(c.getState().playingId,null);
 c.play(entry);const repeat=FakeAudio.instances.at(-1);c.play(entry);assert(repeat.paused);assert.equal(c.getState().playingId,null);
 c.play(entry);FakeAudio.instances.at(-1).onerror();assert.equal(c.getState().errorId,'a');
 c.stop();assert.equal(c.getState().errorId,null);
 const varieties=manifest();varieties.packs[0].dialect='central';varieties.packs.push({id:'valencian',language:'ca',dialect:'valencia',status:'ready',basePath:'audio/valencian/',files:{a:'words/àudio.mp3'}});
 const {controller:vc}=await make(varieties);vc.play(entry);const oldVoice=FakeAudio.instances.at(-1);vc.selectPack('valencian');assert(oldVoice.paused&&oldVoice.removed);assert.equal(vc.getState().playingId,null);assert.equal(vc.urlFor(entry),'https://example.test/plec/audio/valencian/words/%C3%A0udio.mp3');assert.equal(vc.urlFor({id:'b'}),null,'No fallback across varieties');
 vc.selectPack('unknown');assert.equal(vc.getState().phase,'pending');assert.equal(vc.urlFor(entry),null);vc.selectPack(null);assert.equal(vc.getState().phase,'ready');assert(vc.urlFor(entry).includes('/central/'));
 for(const m of [manifest('pending'),manifest('ready','../bad.mp3'),manifest('ready','https://other.test/file.mp3'),manifest('ready','words/%2e.mp3')]){
  const {controller}=await make(m);assert.equal(controller.urlFor(entry),null);const before=FakeAudio.instances.length;controller.play(entry);assert.equal(FakeAudio.instances.length,before);
 }
 const local=await make(manifest(),{base:'http://127.0.0.1:4176/'});assert(local.requests[0].includes('/output/audio/catalog-preview-manifest.json'));
 const failed=await make(null,{fetch:async()=>{throw Error('offline');}});assert.equal(failed.controller.getState().phase,'unavailable');
 const invalid=await make({});assert.equal(invalid.controller.getState().phase,'unavailable');
 class RejectedAudio extends FakeAudio{play(){return Promise.reject(Error('blocked'));}}
 const rejected=await make(manifest(),{Audio:RejectedAudio});rejected.controller.play(entry);await Promise.resolve();assert.equal(rejected.controller.getState().errorId,'a');
 class BrokenAudio{constructor(){throw Error('unavailable');}}
 const broken=await make(manifest(),{Audio:BrokenAudio});broken.controller.play(entry);assert.equal(broken.controller.getState().errorId,'a');
 console.log('Catalogue audio: manifest paths, pending coverage, one player, cancellation, stale events and failures verified.');
})().catch(e=>{console.error(e);process.exitCode=1;});
