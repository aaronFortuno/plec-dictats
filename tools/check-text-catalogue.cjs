'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto'),T=require('../text-dictations.js'),P=require('../prosody.js'),B=require('./prosody-batch.cjs');
const lib=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'pdf-lib'):'pdf-lib'),sha=v=>createHash('sha256').update(v).digest('hex');
(async()=>{
 assert.deepEqual(T.catalogue.map(e=>e.code),['CA001','CA002','CA003','CA004','CA005','CA006']);assert.equal(T.wordCount(T.text(T.find('CA002'))),57);assert.equal(T.find('CA002','es'),undefined);
 const b=B.compile('ll02-four-rhythms-v1'),approval=require('../audio/texts/batches/ll02-four-rhythms-v1.json'),receipt=require('../audio/texts/batches/ll02-four-rhythms-v1-receipt.json');B.assertEstimate(b);assert.equal(b.requestHash,approval.requestHash);assert.equal(b.planHash,approval.planHash);assert.equal(receipt.newSynthesisRequests,1);assert.equal(receipt.actualSeconds,211.83);assert.equal(b.estimate.conservativeSeconds,359);
 assert.equal(new Set(T.catalogue.map(e=>e.code)).size,T.catalogue.length);assert(T.catalogue.every(e=>/^CA\d{3,}$/.test(e.code)));assert.equal(T.find('LL01'),undefined);
 const planning=require('../audio/texts/batches/ca003-ca006-prosody-proposal-v1.json');assert.equal(planning.synthesisAuthorized,false);assert.equal(planning.requestBody,null);assert.equal(planning.newRequestsSent,0);assert.equal(planning.entries.length,4);assert.throws(()=>B.compile(planning.id),/Lot desconegut/);
 for(const entry of T.catalogue){
  assert.deepEqual(Object.keys(entry.focusWords),entry.focusLabels);const tokens=T.text(entry).match(/[\p{L}\p{M}]+(?:[·-][\p{L}\p{M}]+)*/gu).map(w=>w.toLowerCase());
  for(const [focus,words]of Object.entries(entry.focusWords)){assert(words.length>0);assert.equal(new Set(words.map(w=>w.toLowerCase())).size,words.length);assert(words.every(w=>tokens.includes(w.toLowerCase())),focus+' highlights must be actual complete words in the text.');if(focus==='l·l')assert.deepEqual(words,[...new Set(tokens.filter(w=>w.includes('l·l')))]);}

  if(entry.status==='approved-text'){
   assert.equal(entry.audio,null);assert.equal(entry.editorialReview.status,'passed');assert.equal(entry.teacherReview.status,'approved');assert.equal(entry.synthesis.status,'not-requested');assert(P.has(entry));assert.equal(P.build(entry).status,'pending-teacher-validation');assert.equal(sha(T.text(entry)),entry.teacherReview.sourceTextSha256);
   const fields=['code','title','stage','focuses','focusLabels','paragraphs','phrases','focusWords'];assert.equal(sha(JSON.stringify(Object.fromEntries(fields.map(key=>[key,key==='code'?entry.editorialReview.codeAtReview:entry[key]])))),entry.editorialReview.sourceSha256);assert.equal(entry.phrases.join(' '),T.text(entry));
   for(const fold of ['vertical','horizontal']){const result=await require('../text-worksheet.js').prepare(entry,{fold},lib);assert.equal((await lib.PDFDocument.load(result.bytes)).getPageCount(),1);}continue;
  }
  const plan=P.build(entry);assert(P.has(entry));assert.equal(entry.phrases.join(' '),T.text(entry));assert.equal(sha(T.text(entry)),entry.audio.sourceTextSha256);
  for(const [i,v]of plan.variants.entries()){
   const groups=T.fragments(entry,[2,4,6,10][i]),audio=entry.audio.variants[v.id];assert.equal(groups.length,v.fragments.length);assert.equal(groups.map(g=>g.text).join(' '),T.text(entry));assert.equal(groups.flatMap(g=>g.cues).length,10);assert.equal(sha(fs.readFileSync(audio.path)),audio.sha256);
   for(let n=0;n<groups.length;n++){assert.equal(groups[n].startWord,v.fragments[n].start);assert.equal(groups[n].endWord,v.fragments[n].end);if(n)assert.equal(groups[n].start,groups[n-1].end);}
  }
 }
 const entry=T.find('CA002');assert.equal(require('../prosody-review.js').create(entry,P.build(entry),{getItem:()=>null,setItem:()=>{}}).count(),7);
 for(const fold of ['vertical','horizontal'])for(const side of ['start','end']){const result=await require('../text-worksheet.js').prepare(entry,{fold,side},lib),pdf=await lib.PDFDocument.load(result.bytes);assert.equal(pdf.getPageCount(),1);assert.equal(new URL(result.url).searchParams.get('text'),entry.id);}
 console.log('Text catalogue: CA001 preserved, approved CA002/57 words, frozen batch, four MP3 hashes and ranges, separate review identity and four one-page fold layouts passed. No synthesis.');
})().catch(e=>{console.error(e);process.exitCode=1;});
