'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const R=require('./run-pronunciation-sample.cjs'),P=require('./prepare-pronunciation-sample.cjs'),A=require('./audio-plan.cjs');

(async()=>{
  const sample=P.loadSample(),config=R.generationConfig(sample),plan=A.buildJobs(config.seed,config.manifest,config);
  assert.equal(plan.jobs.length,9);
  plan.jobs.forEach((job,i)=>{assert.equal(job.ssml,sample.jobs[i].ssml);assert.equal(job.billableCharacters,sample.jobs[i].billableCharacters);});
  const missing=structuredClone(config.seed);delete missing.catalog.entries[0].ipa;
  assert.throws(()=>A.buildJobs(missing,config.manifest,config));
  const invalid=structuredClone(config.seed);invalid.catalog.entries[0].ipa='not ipa';
  assert.throws(()=>A.buildJobs(invalid,config.manifest,config));
  const noOptIn=structuredClone(config.manifest);delete noOptIn.packs[0].generationPolicy;
  assert.throws(()=>A.buildJobs(config.seed,noOptIn,config));
  const g=R.prerequisiteGate;
  assert.equal(g({phase:'running'},{phase:'waiting'},true,true,true),'wait');
  assert.equal(g({phase:'completed'},{phase:'running'},true,false,true),'wait');
  assert.equal(g({phase:'running'},{phase:'waiting'},true,false,true),'blocked');
  assert.equal(g({phase:'completed'},{phase:'stopped'},false,false,false),'blocked');
  assert.equal(g({phase:'completed'},{phase:'completed'},true,false,false),'blocked');
  assert.equal(g({phase:'completed'},{phase:'completed'},false,false,false),'ready');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'plec-pronunciation-'));
  let requests=0,time=new Date('2026-10-24T17:00:00Z');
  const sent=[];
  const deps={outputRoot:temp,log:()=>{},env:{SPEECH_KEY:'not-a-key',SPEECH_REGION:'westeurope'},
    now:()=>new Date(time),requestSleep:async ms=>{time=new Date(+time+ms);},
    fetch:async(url,request)=>{requests++;sent.push(request.body);return new Response(Buffer.from([0x49,0x44,0x33,1]),{headers:{'content-type':'audio/mpeg'}});}
  };
  try{
    let result=await R.run({execute:true,afterCurrentBatches:true},{...deps,gate:()=> 'blocked'});
    assert.equal(result.ok,false);assert.equal(requests,0);
    let gates=0;
    result=await R.run({execute:true,afterCurrentBatches:true},{...deps,gate:()=>++gates===1?'wait':'ready',sleep:async()=>{assert.equal(requests,0);}});
    assert(result.ok);assert.equal(requests,9);assert(sent.every(body=>body.includes('<phoneme alphabet="ipa"')));
    assert(sent.some(body=>body.includes('ph="pə.ˈɣe.sin"')));
    const settings=A.readJson(path.join(temp,'audio',sample.pack.id,'settings.json'));
    assert.match(settings.ipaFingerprint,/^[a-f0-9]{64}$/);
    const ledger=fs.readFileSync(path.join(temp,'audio/usage.json'),'utf8');
    result=await R.run({execute:true,afterCurrentBatches:true},{...deps,gate:()=> 'ready'});
    assert(result.ok);assert.equal(result.skipped,9);assert.equal(requests,9);
    assert.equal(fs.readFileSync(path.join(temp,'audio/usage.json'),'utf8'),ledger);
    const changed=structuredClone(sample);changed.jobs.find(job=>job.text==='paguessin').ipa='pə.ɣə.ˈsin';
    result=await R.run({execute:true,afterCurrentBatches:true},{...deps,sample:changed,gate:()=> 'ready'});
    assert.equal(result.reason,'pack-settings');assert.equal(requests,9);
    const html=fs.readFileSync(path.join(temp,'audio/comparacio-pronunciacio.html'),'utf8');
    assert(html.includes('data-candidate=')&&html.includes('Original'));
    assert(!fs.existsSync(path.join(temp,'audio/usage.lock')));
    assert.equal(A.readJson(A.DEFAULT_MANIFEST).packs[0].status,'pending');
    console.log('Mostra IPA: espera de dos lots, SSML real, opt-in obligatori, quota compartida, represa, canvi de fonemes i comparació sense substituir originals. Xarxa simulada.');
  }finally{if(temp.startsWith(path.join(os.tmpdir(),'plec-pronunciation-')))fs.rmSync(temp,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
