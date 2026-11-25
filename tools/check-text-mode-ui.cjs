'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'playwright'):'playwright'),T=require('../text-dictations.js');
(async()=>{
 const browser=await chromium.launch({channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4176'?route.continue():route.abort());
  await page.goto('http://127.0.0.1:4176/ca/?seed=ADZ52356A');await page.waitForSelector('#sheet-preview svg');
  const seed=await page.locator('#seed-code').textContent();
  await page.click('[data-mode="text"]');await page.waitForFunction(()=>!document.querySelector('#text-download').disabled);
  assert.equal(await page.locator('[data-mode="text"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.focus-settings').isVisible(),false);assert.equal(await page.locator('#download-pdf').isVisible(),false);
  assert((await page.locator('#sheet-preview').textContent()).includes('Una exposició al col·legi'));
  assert.equal(new URL(page.url()).searchParams.get('text'),'ca-ll-001-v1');
  await page.selectOption('#text-fold','horizontal');await page.selectOption('#text-side','end');await page.selectOption('#text-pace','10');await page.selectOption('#text-rate','0.85');
  await page.waitForFunction(()=>!document.querySelector('#text-download').disabled);
  const pending=page.waitForEvent('download');await page.click('#text-download');const download=await pending;assert.equal(download.suggestedFilename(),'plec-ll01-horizontal.pdf');
  await page.screenshot({path:'output/text-composer.png',animations:'disabled'});
  await page.reload();await page.waitForFunction(()=>!document.querySelector('#text-download').disabled);
  assert.equal(await page.locator('#text-fold').inputValue(),'horizontal');assert.equal(await page.locator('#text-pace').inputValue(),'10');
  await page.click('[data-mode="words"]');await page.waitForSelector('#sheet-preview svg');assert.equal(await page.locator('#seed-code').textContent(),seed);
  assert(!new URL(page.url()).searchParams.has('text'));
  await page.click('[data-mode="pseudo"]');await page.waitForSelector('#sheet-preview svg');await page.click('[data-mode="text"]');await page.waitForFunction(()=>!document.querySelector('#text-download').disabled);await page.click('[data-mode="pseudo"]');assert.equal(await page.locator('[data-mode="pseudo"]').getAttribute('aria-pressed'),'true');
  for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.click('#workspace-toggle-config');await page.click('[data-mode="text"]');await page.waitForFunction(()=>!document.querySelector('#text-download').disabled);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);await page.screenshot({path:`output/text-composer-${width}.png`,animations:'disabled'});await page.keyboard.press('Escape');}
  await page.goto('http://127.0.0.1:4176/ca/dictat/?text=ca-ll-001-v1&pace=6&rate=1');await page.waitForSelector('#tx-ready:not([hidden])');
  assert(await page.locator('#tx-start').isDisabled());assert((await page.locator('#tx-setup-error').textContent()).includes('preparació'));
  // A local media double exercises the player. It neither synthesizes nor downloads speech.
  await page.route('**/text-audio.js?*',route=>route.fulfill({contentType:'text/javascript',body:'window.PlecTextAudio='+JSON.stringify({'ca-ll-001-v1':{path:'test-only.mp3',bounds:Array.from({length:21},(_,i)=>i)}})}));
  await page.addInitScript(()=>{
   window.Audio=class extends EventTarget{constructor(){super();this.duration=20;this.currentTime=0;this.started=false;window.testTextAudio=this;}load(){setTimeout(()=>this.dispatchEvent(new Event('loadedmetadata')),0);}play(){this.started=true;return Promise.resolve();}pause(){this.started=false;}};
   Element.prototype.requestFullscreen=()=>Promise.reject(Error('unavailable in test'));
  });
  await page.reload();await page.waitForSelector('#tx-ready:not([hidden])');await page.selectOption('#tx-pace','4');
  await page.click('#tx-start');assert(await page.locator('#tx-player').isVisible());assert(await page.locator('#tx-next').isHidden());
  const groups=T.fragments(T.catalogue[0],4);
  for(let i=0;i<3;i++){await page.click('#tx-listen');await page.waitForFunction(()=>window.testTextAudio?.started);await page.evaluate(end=>{testTextAudio.currentTime=end;},groups[0].last+1);await page.waitForFunction(n=>document.querySelector('#tx-listen-count').textContent.startsWith(n+' de'),i+1);}
  assert(await page.locator('#tx-listen').isDisabled());assert.equal(await page.locator('#tx-number').textContent(),'1');
  assert(await page.locator('#tx-listen').evaluate(button=>button.querySelector('#tx-listen-label').getBoundingClientRect().bottom<=button.getBoundingClientRect().bottom-12));
  assert(!(await page.locator('#tx-player').textContent()).includes('col·legi'));
  await page.screenshot({path:'output/text-player-mobile.png',animations:'disabled'});
  await page.click('#tx-next');assert.equal(await page.locator('#tx-number').textContent(),'2');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});assert(await page.locator('#tx-paused').isVisible());
  await page.click('#tx-resume');assert.equal(await page.locator('#tx-number').textContent(),'2');
  await page.click('#exit-focus');assert(await page.locator('#tx-ready').isVisible());
  await page.click('#tx-start');
  for(let i=0;i<groups.length;i++){await page.click('#tx-listen');await page.waitForFunction(()=>testTextAudio.started);await page.evaluate(()=>{testTextAudio.currentTime=20;});await page.waitForFunction(()=>document.querySelector('#tx-listen-count').textContent.startsWith('1 de'));await page.click('#tx-next');}
  assert(await page.locator('#tx-finished').isVisible());
  await page.goto('http://127.0.0.1:4176/ca/dictat/?text=unknown');await page.waitForSelector('#tx-ready:not([hidden])');assert(await page.locator('#tx-start').isDisabled());
  await page.goto('http://127.0.0.1:4176/es/');await page.waitForSelector('#sheet-preview svg');assert(await page.locator('[data-mode="text"]').isDisabled());
  assert.deepEqual(errors,[]);console.log('Text mode: composer switching, preserved word/pseudoword seeds, PDF, URL reload, mobile drawers, pending audio, mock playback/ranges/three repeats, no text shown, pause/resume and invalid/language routes passed. No synthesis.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
