'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const P=require('../prosody.js'),T=require('../text-dictations.js'),entry=T.catalogue[0],plan=P.build(entry),draft=require('../content/prosody/ca-ll-001-v1.json');
const lib=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'pdf-lib'):'pdf-lib');
(async()=>{
 assert.equal(plan.status,'approved-for-pilot');assert.equal(plan.voice,'Aoede');assert.equal(plan.wordCount,63);assert.equal(plan.paragraphCount,3);assert.equal(plan.spokenWordsPerVariant,87);
 assert.deepEqual(plan.cues.map(c=>[c.afterWord,c.text]),[[2,'Coma'],[11,'Punt i seguit'],[22,'Punt i a part'],[33,'Punt i seguit'],[37,'Coma'],[43,'Punt i a part'],[47,'Dos punts'],[52,'Punt i seguit'],[53,'Coma'],[63,'Punt final']]);
 assert.deepEqual(plan.variants.map(v=>v.fragments.length),[26,14,9,6]);
 assert.deepEqual(plan.variants.map(v=>v.exceptionCount),[0,5,3,0]);
 for(const variant of plan.variants){
  assert.equal(variant.wordCount,63);assert.equal(variant.spokenWords,87);
  assert.equal(variant.fragments.map(f=>f.text).join(' '),T.text(entry));
  assert.deepEqual(variant.fragments.flatMap(f=>f.words.map(w=>w.index)),Array.from({length:63},(_,i)=>i+1));
  assert.deepEqual(variant.fragments.flatMap(f=>f.cues),plan.cues);
  assert(variant.fragments.every(f=>f.words.every(w=>w.paragraph===f.paragraph)));
  assert(variant.fragments.every(f=>!f.exception||f.reason.length>10));
 }
 assert(plan.variants[2].fragments.some(f=>f.cues.some(c=>c.text==='Punt i seguit'&&c.afterWord<f.end)),'Internal sentence punctuation remains locuted in a larger fragment');
 assert.throws(()=>P.build({...entry,paragraphs:[...entry.paragraphs,'Text nou.']}),/text ha canviat/);
 assert.throws(()=>P.build({...entry,paragraphs:[T.text(entry)]}),/text ha canviat/);
 const old=draft.variants[0].ends;try{draft.variants[0].ends=[...old];draft.variants[0].ends[0]=0;assert.throws(()=>P.build(entry),/Talls/);}finally{draft.variants[0].ends=old;}
 const result=await require('../prosody-pdf.js').build(entry,plan,lib),doc=await lib.PDFDocument.load(result.bytes);
 assert.equal(doc.getPageCount(),3);assert(doc.getPage(0).getWidth()>doc.getPage(0).getHeight());
 const shapes=result.pages.flat();assert.equal(shapes.filter(s=>s.size===10.5).length,252);assert.equal(shapes.filter(s=>s.value.startsWith('[')).length,40);
 const regular=await doc.embedFont(lib.StandardFonts.Helvetica),bold=await doc.embedFont(lib.StandardFonts.HelveticaBold);
 for(const s of shapes){const width=(s.weight?bold:regular).widthOfTextAtSize(s.value,s.size)*25.4/72;assert(s.x>=11.9&&s.x+width<=285.1);assert(s.y>=10&&s.y<=204.1);}
 fs.mkdirSync('output/pdf',{recursive:true});fs.writeFileSync('output/pdf/escaleta-prosodia-ll01.pdf',result.bytes);
 for(const entry of T.catalogue.filter(e=>e.status==='approved-text')){
  const plan=P.build(entry),source=require('../content/prosody/'+entry.id+'.json'),{createHash}=require('node:crypto'),reviewed={...source};delete reviewed.independentReview;
  reviewed.status=source.independentReview.statusAtReview||reviewed.status;
  assert.equal(source.independentReview.status,'passed');assert.equal(createHash('sha256').update(JSON.stringify(reviewed)).digest('hex'),source.independentReview.sourceSha256);
  assert.equal(plan.status,entry.audio?'approved-for-pilot':'pending-teacher-validation');assert.equal(plan.variants.length,4);assert.equal(plan.paragraphCount,3);
  for(const v of plan.variants){assert.equal(v.fragments.map(f=>f.text).join(' '),T.text(entry));assert.deepEqual(v.fragments.flatMap(f=>f.words.map(w=>w.index)),Array.from({length:plan.wordCount},(_,i)=>i+1));assert(v.fragments.every(f=>!f.exception||f.reason.length>10));assert.deepEqual(v.fragments.flatMap(f=>f.cues),plan.cues);}
  if(!entry.audio){assert(plan.variants.every(v=>v.fragments.every(f=>f.words.slice(0,-1).every(w=>!/[.!?]$/u.test(w.text)))));assert.equal(plan.cues.at(-1).text,entry.language==='es'?'Punto final':'Punt final');assert.equal(plan.voiceStatus,'proposed');}
  const output=await require('../prosody-pdf.js').build(entry,plan,lib),pdf=await lib.PDFDocument.load(output.bytes);assert.equal(pdf.getPageCount(),3);assert(pdf.getSubject().includes(entry.language==='es'?'por validar':entry.audio?'pendent':'per validar'));
  for(const s of output.pages.flat()){const w=(s.weight?bold:regular).widthOfTextAtSize(s.value,s.size)*25.4/72;assert(s.x>=11.9&&s.x+w<=285.1);assert(s.y>=10&&s.y<=204.1);}
  fs.writeFileSync('output/pdf/escaleta-prosodia-'+entry.code.toLowerCase()+'.pdf',output.bytes);
 }
 console.log('Prosody draft: identical canonical text in all four variants, 63 counted/87 locuted words, ten cues, stable word ranges, editorial exceptions, paragraph safety, stale draft rejection and three bounded landscape comparison pages passed. No synthesis.');
})().catch(e=>{console.error(e);process.exitCode=1;});
