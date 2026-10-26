const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const S=require('../seeds-v2.js'),R=require('../catalogs/ca/editions/index.js'),K=require('../core.js'),P=require('../pdf.js');
const library=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'pdf-lib'):'pdf-lib');
async function main(){
 const result=S.resolve(R.editions,'M6QM-AAVN4'),edition=R.editions.find(e=>e.slot===result.epoch);
 fs.mkdirSync('output',{recursive:true});
 for(const foldStyle of ['thirds','quarter'])for(const modelSide of ['left','right']){
  const options={entries:result.entries,title:'Dictat de paraules',mode:'words',seedCode:result.code,seedLanguage:'ca',foldStyle,modelSide};
  const layout=K.foldLayout(foldStyle,modelSide),shapes=K.worksheet(options);
  const code=shapes.find(s=>s.type==='text'&&s.value.includes('CA / '+result.code));assert(code,'Printed language and recoverable code');
  {assert.equal(code.x,layout.writingArea.x);assert.equal(code.maxWidth,layout.writingArea.width);}
  const bytes=await P.build(options,library,K);
  const doc=await library.PDFDocument.load(bytes);assert.equal(doc.getPageCount(),1);assert(doc.getTitle().includes(result.code));
  assert(Math.abs(doc.getPage(0).getWidth()-595.2756)<.01);
  if(foldStyle==='quarter'&&modelSide==='left')fs.writeFileSync('output/'+'exemple-codi-v2-quart-24'+'.pdf',bytes);
 }
 console.log('Seed PDF: four fold/side combinations without a separate teacher guide, code, language, A4 and metadata passed. One example exported.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
