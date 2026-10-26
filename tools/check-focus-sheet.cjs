'use strict';
const assert=require('node:assert/strict'),K=require('../core.js'),Q=require('../worksheet-qr.js');
const entries=Array.from({length:24},(_,i)=>({text:'mot'+i,tags:[],mode:'words'})),labels=['Accentuació','Dièresi','Accentuació','  ','s / ss / c / ç / z'];
assert.equal(Q.urlFor('adz5-2356a','ca'),'https://plec.ortogra.fi/ca/dictat/?seed=ADZ52356A&variety=central');assert.equal(Q.urlFor('52E-4S3','es'),'https://plec.ortogra.fi/es/dictat/?seed=52E4S3');assert.throws(()=>Q.urlFor('invalid','ca'));assert.throws(()=>Q.urlFor('ADZ52356A','../'));
for(const foldStyle of ['thirds','quarter'])for(const modelSide of ['left','right']){
 const options={entries,foldStyle,modelSide,seedCode:'ADZ5-2356A',seedLanguage:'ca'},layout=K.foldLayout(foldStyle,modelSide),shapes=K.worksheet({...options,focusLabels:labels}),focus=shapes.filter(s=>s.role==='practice-focus'),text=focus.filter(s=>s.type==='text'),qr=shapes.filter(s=>s.role==='worksheet-qr');
 assert.equal(text[0].y,shapes.find(s=>s.value==='ESCRIC I REVISO').y);assert.equal(text[0].size,9);assert.equal(text[0].weight,true);assert.equal(text[0].color,'#222222');assert.equal(text.slice(0,2).map(s=>s.value).join(' '),'Aquest dictat treballa els següents focus:');assert.deepEqual(text.slice(2).map(s=>s.value),['Accentuació','Dièresi','s / ss / c / ç / z']);
 const outer=qr[0];assert.equal(outer.url,Q.urlFor(options.seedCode));assert.equal(outer.w,28);assert.equal(outer.y+outer.h,38);assert(qr.length>100);
 const links=shapes.filter(s=>s.role==='worksheet-link');assert.equal(links.map(s=>s.value).join(''),outer.url);assert(links.every(s=>s.maxWidth>0&&s.align==='center'&&s.size===7));assert(links[1].y<47);
 for(const s of [...focus,...qr]){const right=s.x+(s.w||s.maxWidth||0);assert(s.x>=Math.max(12,layout.blank[0]));assert(right<=Math.min(198,layout.blank[1]));assert(!layout.folds.some(f=>f>=s.x&&f<=right));assert(s.y<170);}
 assert.deepEqual(shapes.filter(s=>s.role!=='practice-focus'),K.worksheet(options));
 assert(!K.worksheet({entries,foldStyle,modelSide}).some(s=>s.role&&s.role!=='fold-guide'));
 const guide=shapes.filter(s=>s.role==='fold-guide');
 assert.deepEqual([...new Set(guide.filter(s=>s.foldStep).map(s=>s.foldStep))],[1,2,3]);
 assert(guide.filter(s=>s.type==='polyline').length>20);
 assert(!shapes.some(s=>s.type==='text'&&(/Revisa en aquesta mateixa columna|A4.*100/.test(s.value))));
 for(const s of guide){const points=s.points||[[s.x,s.y]];assert(points.every(([x,y])=>x>layout.blank[0]&&x<layout.blank[1]&&y>=180&&y<=287));}
}
console.log('Worksheet: aligned heading, coherent type, protected panel margins, unchanged writing/model geometry, valid canonical QR identity and both fold directions passed.');
