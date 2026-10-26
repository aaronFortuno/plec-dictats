'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'playwright'):'playwright');
(async()=>{fs.mkdirSync('output',{recursive:true});const browser=await chromium.launch({channel:'chrome'});try{
 const p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.testClipboard=text;}}}));
 await p.goto('http://127.0.0.1:4176/ca/');await p.waitForSelector('#sheet-preview svg');
 assert.equal(await p.locator('#teacher-pdf').count(),0);assert.equal(await p.locator('#download-pdf.primary').count(),1);assert.equal(await p.locator('#open-student.primary').count(),0);
 const order=await p.evaluate(()=>{const r=id=>document.getElementById(id).getBoundingClientRect();return [r('seed-code').bottom,r('download-pdf').top,r('new-dictation').top,r('recover-form').top,r('oral-management-heading').top];});assert(order.every((v,i)=>i===0||v>order[i-1]));
 assert.equal(await p.locator('#copy-code').evaluate(e=>e.parentElement.querySelector('output')?.id),'seed-code');
 const seed=await p.locator('#seed-code').textContent();await p.selectOption('#pronunciation-variety','valencia');
 await p.click('#copy-code');assert.equal(await p.evaluate(()=>window.testClipboard),seed);
 for(const [id,pathname] of [['copy-link','/ca/'],['copy-student-link','/ca/dictat/']]){await p.click('#'+id);const u=new URL(await p.evaluate(()=>window.testClipboard));assert.equal(u.origin,'https://plec.ortogra.fi');assert.equal(u.pathname,pathname);assert.equal(u.searchParams.get('seed'),seed.replace('-',''));assert.equal(u.searchParams.get('variety'),'valencia');}
 assert(!new URL(await p.locator('.dictation-nav').getAttribute('href')).searchParams.has('seed'));
 await p.locator('#focus-heading').hover();await p.waitForTimeout(300);assert.equal(await p.locator('#focus-help-toggle').getAttribute('aria-expanded'),'false');
 await p.locator('#focus-help-toggle').hover();await p.waitForFunction(()=>document.querySelector('#focus-help-toggle').getAttribute('aria-expanded')==='true');
 assert.equal(await p.locator('#focus-help').evaluate(e=>getComputedStyle(e).pointerEvents),'none');await p.check('#basic-vocabulary');assert(await p.locator('#basic-vocabulary').isChecked());await p.waitForFunction(()=>{try{return PlecSeeds.decode(document.querySelector('#seed-code').textContent).epoch===PlecSeedRegistry.basic;}catch{return false;}});
 const brand=await p.evaluate(()=>{
  function union(elements){const a=[...elements].map(e=>e.getBoundingClientRect()),x=Math.min(...a.map(r=>r.left)),y=Math.min(...a.map(r=>r.top));return{width:Math.max(...a.map(r=>r.right))-x,height:Math.max(...a.map(r=>r.bottom))-y};}
  const header=document.querySelectorAll('.site-header .brand-mark path'),mark=document.querySelectorAll('#sheet-preview [data-brand-part=mark]'),caption=document.querySelectorAll('#sheet-preview [data-brand-part=tagline]');
  return{header:union(header),mark:union(mark),caption:union(caption),pathsEqual:[...header].map(e=>e.getAttribute('d')).join() === [...mark].map(e=>e.getAttribute('d')).join()};
 });assert(brand.pathsEqual);assert(Math.abs(brand.header.width/brand.header.height-brand.mark.width/brand.mark.height)<.001,'Wordmark shape/aspect matches the web');assert(Math.abs(brand.mark.width-brand.caption.width)/brand.caption.width<.01,'Printed mark and slogan have the same ink width');
 await p.screenshot({path:'output/layout126-desktop.png'});
 const downloadEvent=p.waitForEvent('download');await p.click('#download-pdf');const pdf=await downloadEvent;await pdf.saveAs('output/layout126-sheet.pdf');
 await p.click('#help-open');await p.locator('.help-reference-notes').scrollIntoViewIfNeeded();assert((await p.locator('.basic-level-note').textContent()).includes('350'));assert.equal(await p.locator('.help-reference-notes p').first().evaluate(e=>getComputedStyle(e).fontSize),'12px');assert(!(await p.locator('#help-dialog').textContent()).includes('guia docent'));await p.screenshot({path:'output/layout126-help.png'});await p.locator('#help-dialog [data-close]').first().click();await p.waitForFunction(()=>!document.querySelector('#help-dialog').open);
 for(const width of [1280,1199,820,390,320]){
  await p.setViewportSize({width,height:844});await p.waitForTimeout(240);if(width<1200)await p.locator('.workspace-drawer-toggle').last().click();await p.waitForTimeout(240);
  const g=await p.evaluate(()=>{const panel=document.querySelector('.management').getBoundingClientRect(),code=document.querySelector('.seed-code-row').getBoundingClientRect(),copy=document.querySelector('#copy-code').getBoundingClientRect(),footer=document.querySelector('.site-footer').getBoundingClientRect();return{panelLeft:panel.left,panelRight:panel.right,codeLeft:code.left,copyRight:copy.right,footerBottom:footer.bottom,width:document.documentElement.scrollWidth};});
  assert(g.codeLeft>=g.panelLeft&&g.copyRight<g.panelRight);assert(g.footerBottom<=845);assert(g.width<=width+1);
  if(width===390)await p.screenshot({path:'output/layout126-mobile.png'});
  if(width<1200){await p.locator('.management .workspace-drawer-close').click();await p.waitForTimeout(240);}
 }
 await p.goto('http://127.0.0.1:4176/ca/dictat/');await p.waitForSelector('.d-brand .brand-mark');assert.equal(await p.locator('.d-brand .brand-mark path').count(),await p.locator('.d-brand path').count());
 assert.deepEqual(errors,[]);console.log('Unified brand geometry/equal caption width, PDF download, primary/secondary grouping, both share destinations, question-only helper, teacher-guide retirement, help typography and responsive code actions passed.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
