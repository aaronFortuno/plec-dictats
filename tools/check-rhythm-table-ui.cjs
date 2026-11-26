'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'playwright'):'playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4176'?route.continue():route.abort());
  await page.goto('http://127.0.0.1:4176/ca/?text=ca-ll-001-v1');await page.waitForSelector('#text-download:not([disabled])');
  await page.evaluate(()=>{window.clip='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.clip=text}});});
  await page.click('#rhythm-table-open');await page.waitForSelector('#rhythm-table-dialog[open]');
  assert.deepEqual(await page.locator('#rhythm-table-content caption').allTextContents(),['Pausa breu','Pausa habitual','Pausa llarga']);assert.equal(await page.locator('#rhythm-table-content table').count(),3);assert.equal(await page.locator('#rhythm-table-content img').count(),36);assert.equal(await page.locator('#rhythm-table-content input').count(),72);
  assert(await page.evaluate(()=>Promise.all([...document.querySelectorAll('#rhythm-table-content img')].map(i=>i.decode().then(()=>i.naturalWidth>0)))) .then(a=>a.every(Boolean)));
  assert(await page.locator('#rhythm-table-copy').isDisabled());
  await page.fill('#rhythm-code-ROSA','FLOR');await page.fill('#rhythm-picture-ROSA','una flor groga');await page.click('#rhythm-table-copy');
  const copy=await page.evaluate(()=>window.clip);assert(copy.includes('ROSA → FLOR [ID ROSA]'));assert(copy.includes('una flor groga'));assert(!copy.includes('[ID FAR]'));assert.equal(await page.evaluate(()=>PlecRhythmCode.encode({pace:6,rate:1},1)),'ROSA','Review must not change live profiles.');
  await page.fill('#rhythm-code-FAR','FLOR');assert(await page.locator('#rhythm-table-copy').isDisabled());assert.equal(await page.locator('#rhythm-code-ROSA').getAttribute('aria-invalid'),'true');await page.fill('#rhythm-code-FAR','ROSA');assert(await page.locator('#rhythm-table-copy').isDisabled());await page.fill('#rhythm-code-FAR','FAR');
  await page.locator('#rhythm-table-dialog [data-close]').click();await page.waitForSelector('#rhythm-table-dialog:not([open])',{state:'attached'});assert.equal(await page.evaluate(()=>document.activeElement.id),'rhythm-table-open');
  await page.reload();await page.click('#rhythm-table-open');assert.equal(await page.locator('#rhythm-code-ROSA').inputValue(),'FLOR');
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('blocked');}}}));await page.click('#rhythm-table-copy');assert(await page.locator('#rhythm-table-fallback').isVisible());assert((await page.locator('#rhythm-table-fallback').inputValue()).includes('ROSA → FLOR'));
  await page.click('#rhythm-table-reset');assert.equal(await page.locator('#rhythm-code-ROSA').inputValue(),'ROSA');assert(await page.locator('#rhythm-table-copy').isDisabled());assert(await page.locator('#rhythm-table-fallback').isHidden());
  await page.screenshot({path:'output/rhythm-table-desktop.png',animations:'disabled'});
  for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.evaluate(()=>document.documentElement.dataset.theme='dark');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);assert(await page.evaluate(()=>{const d=document.getElementById('rhythm-table-dialog'),s=d.querySelector('.rhythm-table-scroll');return d.scrollWidth<=d.clientWidth&&s.scrollWidth<=s.clientWidth;}));await page.screenshot({path:`output/rhythm-table-${width}.png`,animations:'disabled'});}
  // Same dialog becomes informational after editorial approval; old local drafts ignored.
  await page.route('**/rhythm-labels.js?*',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync('rhythm-labels.js','utf8').replace('"stage":"review"','"stage":"final"')}));
  await page.setViewportSize({width:1440,height:1000});await page.reload();await page.click('#rhythm-table-open');assert.equal(await page.locator('#rhythm-table-content input').count(),0);assert.equal(await page.locator('#rhythm-table-content b').count(),36);assert(await page.locator('#rhythm-table-actions').isHidden());assert(await page.locator('#rhythm-table-review').isHidden());
  await page.keyboard.press('Escape');await page.waitForSelector('#rhythm-table-dialog:not([open])',{state:'attached'});
  await page.goto('http://127.0.0.1:4176/ca/dictat/?text=ca-ll-001-v1');await page.waitForSelector('#tx-ready:not([hidden])');
  await page.fill('#tx-rhythm-input','cargol');await page.locator('#tx-rhythm-input').press('Enter');assert.equal(await page.locator('#tx-rhythm-input').inputValue(),'BOLA');assert.equal(await page.locator('#tx-rhythm-preview').getAttribute('alt'),'una bola de vidre');await page.locator('#tx-rhythm-preview').evaluate(i=>i.decode());assert.equal(await page.locator('#tx-pace').textContent(),'9–12');
  await page.fill('#tx-rhythm-input','rosa');await page.locator('#tx-rhythm-input').press('Enter');await page.locator('#tx-rhythm-preview').evaluate(i=>i.decode());assert.equal(await page.locator('#tx-rhythm-preview').getAttribute('alt'),'una rosa');
  await page.setViewportSize({width:320,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),320);await page.screenshot({path:'output/rhythm-picture-student.png',animations:'disabled'});
  assert.deepEqual(errors,[]);console.log('Rhythm table UI: 36 images, matrix, safe proposals, clipboard, fallback, persistence, duplicate/alias conflicts, reset, keyboard focus, narrow/dark view and final read-only stage passed. No synthesis.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
