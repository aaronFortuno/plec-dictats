const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {audit,reviewWords}=require('./audit-lexicon.cjs');
const {compare}=require('./review-diff.cjs');
const {assertStableCatalogue}=require('./catalog-policy.cjs');
const crypto=require('node:crypto');
async function main(){
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'plec-lexicon-'));
 const dictionary=path.join(folder,'dictionary.txt'),catalog=path.join(folder,'catalog.json');
 fs.writeFileSync(dictionary,'àrbitre àrbitre NCMS000\narbitre arbitrar VMIP1S0V\narbitrar arbitrar VMN00000\nciència ciència NCFS000\nrebel·lar rebel·lar VMN00000\n');
 const source={language:'ca',entries:['àrbitre','arbitre','ciencia','rebel·lar-se'].map(text=>({text,mode:'words'})).concat({text:'blis',mode:'pseudo'})};
 fs.writeFileSync(catalog,JSON.stringify(source));
 try{
   const result=await audit({dictionary,catalog});
   assert.equal(result.catalogue.total,4,'Excludes pseudowords');
   assert.equal(result.catalogue.exactMatches,2);
   assert.deepEqual(result.catalogue.pending,['ciencia','rebel·lar-se']);
   assert.equal(result.entries.find(e=>e.text==='arbitre').analyses[0].lemma,'arbitrar');
   assert.equal(result.entries.find(e=>e.text==='arbitre').analyses[0].tag,'VMIP1S0V');
   assert.equal(result.source.sha256.length,64);
   assert.deepEqual(compare(source,'àrbitre\narbitrar\nciencia\nrebel·lar-se\n'),{before:4,after:4,added:['arbitrar'],removed:['arbitre']});
   assert.deepEqual(reviewWords('\uFEFFciència\r\n# dubte pendent\r\nàrbitre\r\n'),['ciència','àrbitre']);
   assert.throws(()=>reviewWords('ciència\nciència\n'),/duplicats/);
   assert.throws(()=>reviewWords('blat de moro\n'),/sol mot/);
   assertStableCatalogue({...source,status:'draft'},'',null);
   const stable={...source,status:'stable',reviewedByTeacher:true},bytes=JSON.stringify(stable);
   assert.throws(()=>assertStableCatalogue(stable,bytes,null),/contrast lèxic/);
   const validation={strictLookup:{catalogueSHA256:crypto.createHash('sha256').update(bytes).digest('hex'),wordCount:4,exactMatches:4,pending:[]}};
   assertStableCatalogue(stable,bytes,validation);
   assert.throws(()=>assertStableCatalogue(stable,bytes+' ',validation),/actualitzat/);
   assert.throws(()=>assertStableCatalogue(stable,bytes,{strictLookup:{...validation.strictLookup,pending:['ciencia']}}),/pendents/);
 }finally{
   // Delete only this test's three known files; no recursive removal.
   fs.unlinkSync(dictionary);fs.unlinkSync(catalog);fs.rmdirSync(folder);
 }
 console.log('Contrast exacte, accents, compostos, anotacions i diferències de revisió: correctes.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
