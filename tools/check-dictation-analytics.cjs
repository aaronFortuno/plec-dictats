'use strict';
// Exercise the real session and DOM controller, with local manifest/audio and clock doubles.
const assert=require('node:assert/strict');
const D=require('../dictation.js'),S=require('../seeds-v2.js'),sessions=require('../dictation-session.js');
const manifest=require('../audio/manifest.json'),edition=require('../catalogs/ca/editions/seed-1.json');
async function run(withAnalytics){
 let clock=0,audio;const elements=new Map(),docEvents={},rootEvents={},events=[];
 const doc={currentScript:{src:'https://plec.ortogra.fi/dictation.js'},visibilityState:'visible',fullscreenEnabled:false,
  querySelectorAll:()=>[],addEventListener:(name,fn)=>{docEvents[name]=fn;},
  removeEventListener:(name,fn)=>{if(docEvents[name]===fn)delete docEvents[name];},getElementById:element};
 function element(id){if(!elements.has(id))elements.set(id,{hidden:false,disabled:false,value:'',textContent:'',handlers:{},
  addEventListener(name,fn){this.handlers[name]=fn;},querySelector(){return null;},contains(other){return this===other;},hasAttribute(){return false;},setAttribute(){},focus(){doc.activeElement=this;}});return elements.get(id);}
 const root={document:doc,location:new URL('https://plec.ortogra.fi/ca/dictat/'),history:{replaceState(){}},
  PlecSeeds:S,PlecSeedRegistry:{editions:[edition]},PlecLanguage:{id:'ca'},PlecDictationSession:sessions,
  performance:{now:()=>clock},addEventListener:(name,fn)=>{rootEvents[name]=fn;},
  fetch:async url=>({ok:!String(url).includes('instructions/'),json:async()=>manifest}),
  Audio:class{constructor(){audio=this;}play(){return Promise.resolve();}pause(){}removeAttribute(){}}
 };
 if(withAnalytics)root.PlecAnalytics={track:(name,data)=>events.push({name,data})};
 const click=id=>element(id).handlers.click?.();
 D.initDom(root);element('student-code').value='TCD7-AAAAA';
 element('load-form').handlers.submit({preventDefault(){}});
 await new Promise(setImmediate);await new Promise(setImmediate);
 assert.equal(element('start-dictation').disabled,false);
 click('windowed-start');click('windowed-start');
 if(withAnalytics)assert.deepEqual(events,[{name:'dictation-started',data:{mode:'words',count:16,variety:'central'}}]);
 clock=60000;doc.visibilityState='hidden';docEvents.visibilitychange();
 clock+=3600000;doc.visibilityState='visible';docEvents.visibilitychange();click('resume-dictation');
 clock+=300000;
 for(let word=0;word<16;word++){
  for(let play=0;play<3;play++){click('listen-word');audio.onended();}
  click('next-word');
 }
 click('next-word');
 assert.equal(element('finished-panel').hidden,false);
 if(withAnalytics){
  assert.equal(events.length,2,'Only one start and completion, no per-word telemetry');
  assert.deepEqual(events[1],{name:'dictation-completed',data:{mode:'words',count:16,variety:'central',duration_bucket:'5to10'}});
  assert(!JSON.stringify(events).includes('TCD7'),'No code sent');
 }
}
(async()=>{await run(true);await run(false);console.log('Dictat i analítica: inici/final únics, temps sense pauses, cap mot/codi i funcionament sense tracker: correcte.');})().catch(error=>{console.error(error);process.exitCode=1;});
