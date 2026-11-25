'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const lib=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'pdf-lib'):'pdf-lib');
const T=require('../text-dictations.js'),W=require('../text-worksheet.js'),entry=T.catalogue[0];
(async()=>{
 assert.equal(T.text(entry),entry.phrases.join(' '));assert.equal(T.wordCount(T.text(entry)),63);
 assert.equal(T.find('LL01'),entry);assert.equal(T.find('ca-ll-001-v1','es'),undefined);
 assert.deepEqual(T.options({pace:999,rate:3,fold:'bad',side:'invalid'}),{pace:6,rate:1,fold:'vertical',side:'start'});
 for(const pace of [4,6,10,0]){
  const segments=T.fragments(entry,pace);assert.equal(segments.map(s=>s.text).join(' '),T.text(entry));
  assert.equal(segments[0].first,0);assert.equal(segments.at(-1).last,entry.phrases.length-1);
  if(pace===0)assert.equal(segments.length,6);
 }
 assert(T.fragments(entry,4).length>T.fragments(entry,10).length);
 const link=new URL(T.url(entry,{pace:10,rate:.85},true));assert.equal(link.host,'plec.ortogra.fi');assert.equal(link.pathname,'/ca/dictat/');assert.equal(link.searchParams.get('pace'),'10');assert.equal(link.searchParams.get('rate'),'0.85');assert(!link.searchParams.has('seed'));
 fs.mkdirSync('output/pdf',{recursive:true});
 for(const fold of ['vertical','horizontal'])for(const side of ['start','end']){
  const result=await W.prepare(entry,{fold,side},lib),doc=await lib.PDFDocument.load(result.bytes);
  assert.equal(doc.getPageCount(),1);assert(doc.getTitle().includes(entry.code));
  const creases=result.shapes.filter(s=>s.dash);assert.equal(creases.length,1);
  assert.equal(fold==='vertical'?creases[0].x:creases[0].y,fold==='vertical'?105:148.5);
  const writing=result.shapes.find(s=>s.value==='Escric i reviso'),model=result.shapes.find(s=>s.value==='Model de correcció');
  assert((fold==='vertical'?writing.x>model.x:writing.y>model.y)===(side==='start'));
  assert(result.shapes.some(s=>s.role==='worksheet-qr'&&new URL(s.url).searchParams.get('text')===entry.id));
  const font=await doc.embedFont(lib.StandardFonts.Helvetica);
  for(const shape of result.shapes.filter(s=>s.type==='text')){assert(shape.y>0&&shape.y<297);assert(shape.x>=9);assert(shape.x+font.widthOfTextAtSize(shape.value,shape.size)*25.4/72<=201.1);}
  fs.writeFileSync(`output/pdf/text-ll01-${fold}-${side}.pdf`,result.bytes);
 }
 const blocked=spawnSync(process.execPath,['tools/synthesize-text-pilot.cjs','--generate'],{encoding:'utf8',windowsHide:true});
 assert.equal(blocked.status,1);assert.match(blocked.stderr,/Síntesi no autoritzada/);
 const publish=spawnSync(process.execPath,['tools/prepare-text-pilot.cjs'],{encoding:'utf8',windowsHide:true});
 assert.equal(publish.status,1);assert.match(publish.stderr,/Publicació d’àudio no autoritzada/);
 console.log('Text pilot: complete text/phrases, safe defaults, grouping, language URLs, four A4 half-fold worksheets, QR, bounded typography and explicit synthesis/publication gates passed. No network.');
})().catch(e=>{console.error(e);process.exitCode=1;});
