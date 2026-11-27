'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const lib=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'pdf-lib'):'pdf-lib');
const T=require('../text-dictations.js'),W=require('../text-worksheet.js'),entry=T.catalogue[0];
(async()=>{
 assert.equal(T.text(entry),entry.phrases.join(' '));assert.equal(T.wordCount(T.text(entry)),63);
 assert.equal(T.find('CA001'),entry);assert.equal(T.find('ca-ll-001-v1','es'),undefined);
 assert.deepEqual(T.options({pace:999,rate:3,fold:'bad',side:'invalid',fontSize:99,lineSpacing:-1}),{pace:6,rate:1,fold:'vertical',side:'end',fontSize:14,lineSpacing:10});
 assert.equal(entry.paragraphs.length,3);assert.equal(T.options().side,'end');assert.equal(T.options({rate:.85}).rate,.9);assert.equal(T.options({rate:.75}).rate,.8);for(const rate of [.8,.9,1])assert.equal(T.options({rate}).rate,rate);
 for(const pace of [2,4,6,10,0]){
  const segments=T.fragments(entry,pace);assert.equal(segments.map(s=>s.text).join(' '),T.text(entry));
  assert.equal(segments[0].startWord,1);assert.equal(segments.at(-1).endWord,63);
  if(pace===0)assert.equal(segments.length,6);
 }
 assert(T.fragments(entry,4).length>T.fragments(entry,10).length);
 const link=new URL(T.url(entry,{pace:10,rate:.85},true));assert.equal(link.host,'plec.ortogra.fi');assert.equal(link.pathname,'/ca/dictat/');assert.equal(link.searchParams.get('pace'),'10');assert.equal(link.searchParams.get('rate'),'0.9');assert(!link.searchParams.has('seed'));
 const printLink=new URL(T.url(entry,{fontSize:13,lineSpacing:11}));assert.equal(printLink.searchParams.get('fontSize'),'13');assert.equal(printLink.searchParams.get('lineSpacing'),'11');assert(!link.searchParams.has('fontSize'));
 fs.mkdirSync('output/pdf',{recursive:true});
 for(const fold of ['vertical','horizontal'])for(const side of ['start','end']){
  const result=await W.prepare(entry,{fold,side},lib),doc=await lib.PDFDocument.load(result.bytes);
  assert.equal(doc.getPageCount(),1);assert(doc.getTitle().includes(entry.code));
  const creases=result.shapes.filter(s=>s.dash);assert.equal(creases.length,1);
  assert.equal(fold==='vertical'?creases[0].x:creases[0].y,fold==='vertical'?(side==='start'?85:125):(side==='start'?127:170));
  const writing=result.shapes.find(s=>s.value==='Escric i reviso'),model=result.shapes.find(s=>s.value==='Model de correcció');
  assert((fold==='vertical'?writing.x>model.x:writing.y>model.y)===(side==='start'));
  assert(result.shapes.some(s=>s.role==='worksheet-qr'&&new URL(s.url).searchParams.get('text')===entry.id));
  const {model:modelArea,writing:writingArea,rowHeight,bodyTop}=result.layout;
  assert.equal(bodyTop,80);assert(fold==='vertical'?writingArea.w>modelArea.w:writingArea.h>modelArea.h);
  const qr=result.shapes.find(s=>s.role==='worksheet-qr');
  assert(qr.x>=writingArea.x&&qr.x+qr.w<=writingArea.x+writingArea.w);
  assert(qr.y>=writingArea.y&&qr.y+qr.h<=writingArea.y+40);
  const address=result.shapes.filter(s=>s.role==='text-dictation-url');
  assert(address.length>0&&address.length<=2);
  assert(address.every(s=>s.align==='right'&&s.x===qr.x+qr.w&&s.y>qr.y+qr.h));
  assert.equal(address.map(s=>s.value).join(''),result.url.replace('https://',''));
  const body=result.shapes.filter(s=>s.role==='text-model-line'),rules=result.shapes.filter(s=>s.role==='text-writing-rule');
  assert(body.every(s=>s.size===14));assert.equal(rowHeight,10);
  const paragraphs=[0,1,2].map(index=>body.filter(s=>s.paragraph===index));
  assert(paragraphs.every(rows=>rows.length));
  if(fold==='vertical'){
   assert(body.every(s=>rules.some(rule=>rule.paragraph===s.paragraph&&rule.y-writingArea.y===s.y-modelArea.y)),'Each model line aligns with its writing block');
   const blocks=[0,1,2].map(index=>rules.filter(s=>s.paragraph===index));
   for(let i=0;i<blocks.length;i++){
    assert.equal(blocks[i].length,paragraphs[i].length+1,'One extra writing line in every paragraph');
    assert(blocks[i].every((s,j)=>!j||s.y-blocks[i][j-1].y===rowHeight));
    if(i){const a=blocks[i-1].at(-1).y,b=blocks[i][0].y;assert.equal(b-a,2*rowHeight);assert(!rules.some(s=>s.y>a&&s.y<b),'No ruling across the paragraph break');}
   }
  }else{assert(rules.every((s,i)=>!i||s.y-rules[i-1].y===rowHeight));assert(rules.every(s=>s.paragraph===undefined));}
  const font=await doc.embedFont(lib.StandardFonts.Helvetica);
  for(const shape of result.shapes.filter(s=>s.type==='text')){const width=font.widthOfTextAtSize(shape.value,shape.size)*25.4/72,left=shape.align==='right'?shape.x-width:shape.x;assert(shape.y>0&&shape.y<297);assert(left>=9);assert(left+width<=201.1);if(shape.role==='text-dictation-url')assert(left>=writingArea.x+63&&width<=52);}
  fs.writeFileSync(`output/pdf/text-ll01-${fold}-${side}.pdf`,result.bytes);
 }
 for(const fold of ['vertical','horizontal']){
  const custom=await W.prepare(entry,{fold,fontSize:13,lineSpacing:11},lib);
  assert(custom.shapes.filter(s=>s.role==='text-model-line').every(s=>s.size===13));
  const rules=custom.shapes.filter(s=>s.role==='text-writing-rule');
  assert.equal(custom.layout.rowHeight,11);
  if(fold==='vertical')assert(custom.shapes.filter(s=>s.role==='text-model-line').every(s=>rules.some(r=>r.paragraph===s.paragraph&&r.y-custom.layout.writing.y===s.y-custom.layout.model.y)));
  fs.writeFileSync(`output/pdf/text-custom-${fold}.pdf`,custom.bytes);
 }
 await assert.rejects(W.prepare(entry,{fontSize:16,lineSpacing:12},lib),/no cap al full/);
 const blocked=spawnSync(process.execPath,['tools/synthesize-text-pilot.cjs','--generate'],{encoding:'utf8',windowsHide:true});
 assert.equal(blocked.status,1);assert.match(blocked.stderr,/Síntesi no autoritzada/);
 const publish=spawnSync(process.execPath,['tools/prepare-text-pilot.cjs'],{encoding:'utf8',windowsHide:true});
 assert.equal(publish.status,1);assert.match(publish.stderr,/Publicació d’àudio no autoritzada/);
 console.log('Text pilot: unchanged speech, asymmetric panels, four fold variants, top writing QR, extra writing lines, unruled paragraph breaks, aligned vertical/custom rules, continuous horizontal rules, shared layout URLs, overflow rejection and approval gates passed. No network.');
})().catch(e=>{console.error(e);process.exitCode=1;});
