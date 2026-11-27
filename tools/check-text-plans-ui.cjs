'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),T=require('../text-dictations.js');
const {chromium}=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'playwright'):'playwright');
(async()=>{const browser=await chromium.launch({channel:'chrome'});try{
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:4176'?r.continue():r.abort());
 await page.goto('http://127.0.0.1:4176/ca/?text=CA001');await page.waitForSelector('#text-download:not([disabled])');assert.equal(await page.locator('#text-code').textContent(),'CA001');
 for(const entry of T.catalogue.filter(e=>e.status==='approved-text')){
  await page.click('#text-picker-open');await page.fill('#text-picker-search',entry.code);assert.equal(await page.locator('.text-picker-card').count(),1);assert((await page.locator('.text-picker-card').textContent()).includes('Escaleta per validar'));assert(await page.locator('.text-picker-review-note').isVisible());assert.deepEqual(await page.locator('.text-picker-prose p').allTextContents(),entry.paragraphs);assert((await page.locator('.text-picker-prose mark').count())>0);
  if(entry.code==='CA006'){await page.click('[data-focus="Dièresi"]');assert.deepEqual(await page.locator('.text-picker-prose mark').allTextContents(),['intuïa','reduïssin']);await page.click('[data-focus="Formes verbals"]');assert.equal(await page.locator('.text-picker-prose mark').count(),10);}
  if(entry.code==='CA003')await page.screenshot({path:'output/text-draft-ca003.png',animations:'disabled'});
  await page.click('#text-picker-confirm');await page.waitForFunction(()=>!document.getElementById('text-picker-dialog').open);await page.waitForSelector('#text-download:not([disabled])');assert.equal(await page.locator('#text-code').textContent(),entry.code);assert(await page.locator('#text-open-student').isDisabled());assert(await page.locator('#prosody-open').isVisible());assert((await page.locator('#text-audio-note').textContent()).includes('Text validat'));
  await page.click('#prosody-open');await page.waitForSelector('#prosody-dialog[open]');assert((await page.locator('.prosody-draft').textContent()).includes('Escaleta per validar'));assert(await page.locator('#prosody-listening').isHidden());assert.equal(await page.locator('#prosody-dialog audio').count(),0);assert(await page.locator('.prosody-review-export').isHidden());assert.equal(await page.locator('button.prosody-mark').count(),0);assert(await page.locator('#prosody-budget').isVisible());assert((await page.locator('#prosody-budget').textContent()).includes('6 min 30 s'));
  const plan=await page.evaluate(id=>PlecProsody.build(PlecTexts.find(id)),entry.id);assert.equal(await page.locator('.prosody-fragment').count(),plan.variants.reduce((n,v)=>n+v.fragments.length,0));await page.locator('.prosody-readonly').first().click();
  if(entry.code==='CA003'){
   await page.screenshot({path:'output/prosody-ca003-desktop.png',animations:'disabled'});
   for(const [width,height]of [[390,844],[844,390]]){await page.setViewportSize({width,height});assert(await page.locator('.prosody-scroll').evaluate(e=>e.clientHeight>80));await page.click('[data-prosody-variant="r912"]');assert.equal(await page.locator('.prosody-column:visible').count(),3);await page.screenshot({path:'output/prosody-ca003-'+width+'.png',animations:'disabled'});}await page.setViewportSize({width:1440,height:900});
   const pending=page.waitForEvent('download');await page.click('#prosody-pdf');const download=await pending;assert.equal(download.suggestedFilename(),'plec-ca003-escaleta-prosodia.pdf');
  }
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#prosody-dialog').open);

 }
 await page.goto('http://127.0.0.1:4176/ca/dictat/?text=CA006');await page.waitForSelector('#tx-ready:not([hidden])');assert(await page.locator('#tx-start').isDisabled());assert((await page.locator('#tx-setup-error').textContent()).includes('pendent de validació'));
 await page.goto('http://127.0.0.1:4176/ca/dictat/');await page.fill('#student-code','ca001');await page.locator('#student-code').press('Enter');await page.waitForSelector('#tx-ready:not([hidden])');assert((await page.locator('#tx-summary').textContent()).startsWith('CA001'));assert(await page.locator('#tx-start').isEnabled());
 await page.goto('http://127.0.0.1:4176/ca/');await page.waitForSelector('#sheet-preview svg');await page.fill('#recover-code','CA002');await page.locator('#recover-code').press('Enter');await page.waitForSelector('#text-download:not([disabled])');assert.equal(await page.locator('#text-code').textContent(),'CA002');
 assert.deepEqual(errors,[]);console.log('Text plans: four validated texts, pending prosody labels, focus union, PDF readiness, audio still blocked, and short code recovery for teacher/student passed. No synthesis.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
