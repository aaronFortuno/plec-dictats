'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto'),T=require('../text-dictations.js'),P=require('../prosody.js'),B=require('./prosody-batch.cjs');
const lib=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'pdf-lib'):'pdf-lib'),sha=v=>createHash('sha256').update(v).digest('hex');
(async()=>{
 assert.deepEqual(T.catalogue.map(e=>e.code),['CA','ES'].flatMap(prefix=>Array.from({length:12},(_,n)=>prefix+String(n+1).padStart(3,'0'))));assert.equal(T.wordCount(T.text(T.find('CA002'))),57);assert.equal(T.find('CA002','es'),undefined);
 const b=B.compile('ll02-four-rhythms-v1'),approval=require('../audio/texts/batches/ll02-four-rhythms-v1.json'),receipt=require('../audio/texts/batches/ll02-four-rhythms-v1-receipt.json');B.assertEstimate(b);assert.equal(b.requestHash,approval.requestHash);assert.equal(b.planHash,approval.planHash);assert.equal(receipt.newSynthesisRequests,1);assert.equal(receipt.actualSeconds,211.83);assert.equal(b.estimate.conservativeSeconds,359);
 assert.equal(new Set(T.catalogue.map(e=>e.code)).size,T.catalogue.length);assert(T.catalogue.every(e=>new RegExp('^'+e.language.toUpperCase()+'\\d{3}$').test(e.code)));assert.equal(T.find('LL01'),undefined);
 const planning=require('../audio/texts/batches/ca003-ca006-prosody-proposal-v1.json');assert.equal(planning.synthesisAuthorized,false);assert.equal(planning.requestBody,null);assert.equal(planning.newRequestsSent,0);assert.equal(planning.entries.length,4);assert.throws(()=>B.compile(planning.id),/Lot desconegut/);
 for(const entry of T.catalogue){
  assert.deepEqual(Object.keys(entry.focusWords),entry.focusLabels);const tokens=T.text(entry).match(/[\p{L}\p{M}]+(?:[·-][\p{L}\p{M}]+)*/gu).map(w=>w.toLowerCase());
  for(const [focus,words]of Object.entries(entry.focusWords)){assert(words.length>0);assert.equal(new Set(words.map(w=>w.toLowerCase())).size,words.length);assert(words.every(w=>tokens.includes(w.toLowerCase())),focus+' highlights must be actual complete words in the text.');if(focus==='l·l')assert.deepEqual(words,[...new Set(tokens.filter(w=>w.includes('l·l')))]);}

  if(!entry.audio){
   assert.equal(entry.teacherReview.status,'approved');assert.equal(entry.synthesis.status,'not-requested');assert.equal(entry.prosodyReview.status,'pending');assert.equal(P.has(entry),true);assert.equal(P.build(entry).status,'pending-teacher-validation');assert.equal(sha(T.text(entry)),entry.teacherReview.sourceTextSha256);assert.equal(entry.editorialReview.status,'passed');assert.equal(T.find(entry.code,entry.language),entry);assert.equal(T.find(entry.code,entry.language==='ca'?'es':'ca'),undefined);assert.equal(entry.phrases.join(' '),T.text(entry));assert.equal(entry.paragraphs.length,3);
   assert(T.wordCount(T.text(entry))>=50&&T.wordCount(T.text(entry))<=70);
   const patterns=entry.language==='es'?{tilde:/[áéíóú]/iu,'sin-tilde':/^[^áéíóú]+$/iu,h:/h/iu,gj:/j|g[eéií]/iu,bv:/[bv]/iu,rr:/r/iu,cquz:/c(?!h)|z|qu/iu,ggu:/g[aáoóuú]|gu[eéií]|gü[eéií]/iu,lly:/ll|y/iu,'enye-ch':/ñ|ch/iu,x:/x/iu}:{accent:/[àèéíòóú]/iu,erra:/r/iu,digrafs:/ll|ny|x|ix|tx|ig/iu};
   const pattern=patterns[entry.focuses[0]];if(pattern)assert(Object.values(entry.focusWords).flat().every(w=>pattern.test(w)),entry.code+' highlighted words must contain the target spelling.');
   const fields=['code','title','stage','focuses','focusLabels','paragraphs','phrases','focusWords'];assert.equal(sha(JSON.stringify(Object.fromEntries(fields.map(k=>[k,entry[k]])))),entry.editorialReview.sourceSha256);
   for(const fold of ['vertical','horizontal']){const r=await require('../text-worksheet.js').prepare(entry,{fold},lib);assert.equal((await lib.PDFDocument.load(r.bytes)).getPageCount(),1);assert.equal(new URL(r.url).pathname,'/'+entry.language+'/dictat/');assert(r.shapes.some(s=>s.value===(entry.language==='es'?'Escribo y reviso':'Escric i reviso')));}
   continue;
  }

  if(entry.status==='approved-text'){
   assert(entry.audio);assert.equal(entry.editorialReview.status,'passed');assert.equal(entry.teacherReview.status,'approved');assert.equal(entry.prosodyReview.status,'approved');assert.equal(entry.synthesis.status,'approved');assert(P.has(entry));assert.equal(P.build(entry).status,'approved-for-pilot');assert.equal(sha(T.text(entry)),entry.teacherReview.sourceTextSha256);
   const fields=['code','title','stage','focuses','focusLabels','paragraphs','phrases','focusWords'];assert.equal(sha(JSON.stringify(Object.fromEntries(fields.map(key=>[key,key==='code'?entry.editorialReview.codeAtReview:entry[key]])))),entry.editorialReview.sourceSha256);assert.equal(entry.phrases.join(' '),T.text(entry));
   for(const fold of ['vertical','horizontal']){const result=await require('../text-worksheet.js').prepare(entry,{fold},lib);assert.equal((await lib.PDFDocument.load(result.bytes)).getPageCount(),1);}
  }
  const plan=P.build(entry);assert(P.has(entry));assert.equal(entry.phrases.join(' '),T.text(entry));assert.equal(sha(T.text(entry)),entry.audio.sourceTextSha256);
  for(const [i,v]of plan.variants.entries()){
   const groups=T.fragments(entry,[2,4,6,10][i]),audio=entry.audio.variants[v.id];assert.equal(groups.length,v.fragments.length);assert.equal(groups.map(g=>g.text).join(' '),T.text(entry));assert.equal(groups.flatMap(g=>g.cues).length,plan.cues.length);assert.equal(sha(fs.readFileSync(audio.path)),audio.sha256);
   for(let n=0;n<groups.length;n++){assert.equal(groups[n].startWord,v.fragments[n].start);assert.equal(groups[n].endWord,v.fragments[n].end);if(n)assert.equal(groups[n].start,groups[n-1].end);}
  }
 }
 const entry=T.find('CA002');assert.equal(require('../prosody-review.js').create(entry,P.build(entry),{getItem:()=>null,setItem:()=>{}}).count(),7);
 for(const fold of ['vertical','horizontal'])for(const side of ['start','end']){const result=await require('../text-worksheet.js').prepare(entry,{fold,side},lib),pdf=await lib.PDFDocument.load(result.bytes);assert.equal(pdf.getPageCount(),1);assert.equal(new URL(result.url).searchParams.get('text'),entry.id);}
 for(const lang of ['ca','es']){const expected=require('../catalogs/'+lang+'/catalog.json').categories.filter(c=>c.mode==='words').map(c=>c.id),found=new Set(T.catalogue.filter(e=>e.language===lang).flatMap(e=>e.focuses));assert(expected.every(f=>found.has(f)),lang+' covers every practice focus.');}
 console.log('Text catalogue: six frozen audio pilots preserved, eighteen reviewed drafts across two languages, complete focus coverage, isolated approval gates, exact highlights and one-page fold layouts passed. No synthesis.');
})().catch(e=>{console.error(e);process.exitCode=1;});
