'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto'),T=require('../text-dictations.js'),P=require('../prosody.js'),B=require('./prosody-batch.cjs');
const lib=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'pdf-lib'):'pdf-lib'),sha=v=>createHash('sha256').update(v).digest('hex');
(async()=>{
 assert.deepEqual(T.catalogue.map(e=>e.code),['LL01','LL02']);assert.equal(T.wordCount(T.text(T.find('LL02'))),57);assert.equal(T.find('LL02','es'),undefined);
 const b=B.compile('ll02-four-rhythms-v1'),approval=require('../audio/texts/batches/ll02-four-rhythms-v1.json'),receipt=require('../audio/texts/batches/ll02-four-rhythms-v1-receipt.json');B.assertEstimate(b);assert.equal(b.requestHash,approval.requestHash);assert.equal(b.planHash,approval.planHash);assert.equal(receipt.newSynthesisRequests,1);assert.equal(receipt.actualSeconds,211.83);assert.equal(b.estimate.conservativeSeconds,359);
 for(const entry of T.catalogue){
  assert.deepEqual(Object.keys(entry.focusWords),entry.focusLabels);const tokens=T.text(entry).match(/[\p{L}\p{M}]+(?:[·-][\p{L}\p{M}]+)*/gu).map(w=>w.toLowerCase());
  for(const [focus,words]of Object.entries(entry.focusWords)){assert(words.length>0);assert.equal(new Set(words).size,words.length);assert(words.every(w=>tokens.includes(w)),focus+' highlights must be actual complete words in the text.');if(focus==='l·l')assert.deepEqual(words,[...new Set(tokens.filter(w=>w.includes('l·l')))]);}

  const plan=P.build(entry);assert(P.has(entry));assert.equal(entry.phrases.join(' '),T.text(entry));assert.equal(sha(T.text(entry)),entry.audio.sourceTextSha256);
  for(const [i,v]of plan.variants.entries()){
   const groups=T.fragments(entry,[2,4,6,10][i]),audio=entry.audio.variants[v.id];assert.equal(groups.length,v.fragments.length);assert.equal(groups.map(g=>g.text).join(' '),T.text(entry));assert.equal(groups.flatMap(g=>g.cues).length,10);assert.equal(sha(fs.readFileSync(audio.path)),audio.sha256);
   for(let n=0;n<groups.length;n++){assert.equal(groups[n].startWord,v.fragments[n].start);assert.equal(groups[n].endWord,v.fragments[n].end);if(n)assert.equal(groups[n].start,groups[n-1].end);}
  }
 }
 const entry=T.find('LL02');assert.equal(require('../prosody-review.js').create(entry,P.build(entry),{getItem:()=>null,setItem:()=>{}}).count(),7);
 for(const fold of ['vertical','horizontal'])for(const side of ['start','end']){const result=await require('../text-worksheet.js').prepare(entry,{fold,side},lib),pdf=await lib.PDFDocument.load(result.bytes);assert.equal(pdf.getPageCount(),1);assert.equal(new URL(result.url).searchParams.get('text'),entry.id);}
 console.log('Text catalogue: LL01 preserved, approved LL02/57 words, frozen batch, four MP3 hashes and ranges, separate review identity and four one-page fold layouts passed. No synthesis.');
})().catch(e=>{console.error(e);process.exitCode=1;});
