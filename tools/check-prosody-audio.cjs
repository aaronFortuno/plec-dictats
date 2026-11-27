'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{createHash}=require('node:crypto'),{spawnSync}=require('node:child_process');
const B=require('./prosody-batch.cjs'),T=require('../text-dictations.js'),P=require('../prosody.js'),b=B.compile(),entry=T.catalogue[0],plan=P.build(entry),approval=require('../audio/texts/batches/ll01-four-rhythms-v1.json'),receipt=require('../audio/texts/batches/ll01-four-rhythms-v1-receipt.json');
const sha=v=>createHash('sha256').update(v).digest('hex');
B.assertEstimate(b);assert.equal(b.estimate.spokenWords,348);assert.equal(b.estimate.cueCount,40);assert(b.estimate.conservativeSeconds<390);assert(b.estimate.estimatedInputTokens<7900);
assert.equal(b.requestHash,approval.requestHash);assert.equal(b.planHash,approval.planHash);assert.equal(approval.maximumNewRequests,1);assert.equal(receipt.newSynthesisRequests,1);assert.equal(receipt.actualSeconds,entry.audio.seconds);assert(receipt.actualSeconds<390);
assert.equal(entry.audio.requestHash,b.requestHash);assert.equal(entry.audio.sourceTextSha256,sha(T.text(entry)));assert.equal(entry.audio.pronunciationValidated,false);
assert.equal(b.body.generation_config.speech_config.length,1);assert.equal(b.body.generation_config.speech_config[0].voice,'Aoede');assert.equal(b.body.background,true);
for(const [i,pace]of [2,4,6,10].entries()){
 const groups=T.fragments(entry,pace),variant=entry.audio.variants[plan.variants[i].id];assert.equal(groups.length,[26,14,9,6][i]);assert.equal(groups.map(g=>g.text).join(' '),T.text(entry));
 assert.equal(groups[0].startWord,1);assert.equal(groups.at(-1).endWord,63);assert.equal(groups[0].start,0);assert.equal(groups.at(-1).end,variant.seconds);
 assert.equal(groups.flatMap(g=>g.cues).length,10);assert.equal(sha(fs.readFileSync(variant.path)),variant.sha256);assert.equal(fs.statSync(variant.path).size,variant.bytes);
 for(const [j,group]of groups.entries()){assert(group.end>group.start);assert.equal(group.path,variant.path);if(j){assert.equal(group.start,groups[j-1].end);assert.equal(group.startWord,groups[j-1].endWord+1);}}
 for(let through=0;through<63;through++){const g=groups[T.fragmentIndex(groups,through)];assert(g.startWord<=through+1&&g.endWord>=through+1,'Switching rhythm never skips an uncommitted word.');}
}
assert.equal(T.options({pace:0}).pace,10);assert.equal(T.options({pace:2}).pace,2);
assert.throws(()=>B.assertEstimate({...b,estimate:{...b.estimate,conservativeSeconds:391}}),/topall/);
const dry=spawnSync(process.execPath,['tools/prosody-batch.cjs'],{encoding:'utf8',windowsHide:true});assert.equal(dry.status,0);assert.equal(JSON.parse(dry.stdout).requestHash,b.requestHash);
const blocked=spawnSync(process.execPath,['tools/prosody-batch.cjs','--generate'],{encoding:'utf8',windowsHide:true});assert.equal(blocked.status,1);assert.match(blocked.stderr,/única petició/);
for(let n=3;n<=6;n++){
 const id='ca00'+n+'-four-rhythms-v1',built=B.compile(id),approved=require('../audio/texts/batches/'+id+'.json'),done=require('../audio/texts/batches/'+id+'-receipt.json'),e=T.find('CA00'+n),p=P.build(e);B.assertEstimate(built);
 assert.equal(built.requestHash,approved.requestHash);assert.equal(built.planHash,approved.planHash);assert.equal(approved.maximumNewRequests,1);assert.equal(done.newSynthesisRequests,1);assert.equal(done.pronunciationValidated,false);assert.equal(e.audio.rawSha256,done.rawSha256);assert.equal(e.audio.requestHash,built.requestHash);assert.equal(e.prosodyReview.planHash,built.planHash);assert.equal(e.audio.sourceTextSha256,sha(T.text(e)));assert.deepEqual(built.body.generation_config.speech_config,[{voice:'Aoede'}]);
 assert.equal(Object.keys(e.audio.variants).length,4);assert(done.actualSeconds<390);assert(Math.abs(Object.values(e.audio.variants).reduce((sum,v)=>sum+v.seconds,0)-done.actualSeconds)<.001);
 for(const [i,variant]of p.variants.entries()){
  const a=e.audio.variants[variant.id],groups=T.fragments(e,[2,4,6,10][i]);assert.equal(sha(fs.readFileSync(a.path)),a.sha256);assert.equal(fs.statSync(a.path).size,a.bytes);assert.equal(groups.length,variant.fragments.length);assert.equal(groups.map(g=>g.text).join(' '),T.text(e));assert.equal(groups.flatMap(g=>g.cues).length,p.cues.length);assert.equal(groups[0].start,0);assert.equal(groups.at(-1).end,a.seconds);
  for(const [j,g]of groups.entries()){assert(g.end>g.start);assert.equal(g.startWord,variant.fragments[j].start);assert.equal(g.endWord,variant.fragments[j].end);if(j)assert.equal(g.start,groups[j-1].end);}
  for(let through=0;through<p.wordCount;through++){const g=groups[T.fragmentIndex(groups,through)];assert(g.startWord<=through+1&&g.endWord>=through+1);}
 }
 for(const cut of done.cuts){assert(cut.time>0&&cut.time<done.actualSeconds);if(cut.estimatedConnectedBoundary)assert(cut.requiresListening&&done.timingProposals);else assert(cut.rms<.012);}
 const rejected=spawnSync(process.execPath,['tools/prosody-batch.cjs','--batch='+id,'--generate'],{encoding:'utf8',windowsHide:true});assert.equal(rejected.status,1);assert.match(rejected.stderr,/única petició/);
}
console.log('Six four-rhythm pilots: frozen approvals, one request each, same Aoede punctuation, 24 MP3 hashes, complete gapless word ranges, timing proposals explicitly pending listening and rhythm-switch safety passed. No network.');
