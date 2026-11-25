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
console.log('Four-rhythm pilot: one frozen approved request, timing/input guards, same Aoede punctuation, 55 gapless editorial fragments, MP3 hashes, stable word positions and all rhythm-switch positions passed. No network.');
