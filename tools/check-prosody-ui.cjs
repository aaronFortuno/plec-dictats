'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const library=name=>require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,name):name),{chromium}=library('playwright'),{PDFDocument}=library('pdf-lib');
(async()=>{
 const browser=await chromium.launch({channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4176'?route.continue():route.abort());
  await page.goto('http://127.0.0.1:4176/ca/?seed=ADZ52356A');await page.waitForSelector('#sheet-preview svg');assert(await page.locator('#prosody-open').isHidden());
  await page.click('[data-mode="text"]');await page.waitForFunction(()=>!document.querySelector('#text-download').disabled);
  await page.click('#prosody-open');assert(await page.locator('#prosody-dialog').isVisible());
  assert.equal(await page.locator('.prosody-paragraph').count(),3);assert.equal(await page.locator('.prosody-column:visible').count(),12);
  assert.equal(await page.locator('.prosody-fragment').count(),55);assert.equal(await page.locator('.prosody-cue').count(),40);
  assert((await page.locator('#prosody-summary').textContent()).includes('63 mots'));assert((await page.locator('.prosody-draft').textContent()).includes('Escaleta validada'));
  assert(await page.locator('#prosody-listening').isVisible());
  for(const id of ['r23','r45','r68','r912']){
   await page.selectOption('#prosody-audio-variant',id);await page.waitForFunction(()=>document.querySelector('#prosody-audio').readyState>=1);
   const media=await page.locator('#prosody-audio').evaluate(audio=>({src:audio.currentSrc,duration:audio.duration,paused:audio.paused}));
   assert(media.src.endsWith('/'+id+'.mp3'));assert(media.duration>40&&media.duration<75);assert(media.paused);
   assert.equal(await page.locator('#prosody-content').getAttribute('data-variant'),id);
  }
  await page.selectOption('#prosody-audio-variant','r23');await page.waitForFunction(()=>document.querySelector('#prosody-audio').readyState>=1);
  await page.locator('#prosody-audio').evaluate(async audio=>{await audio.play();audio.currentTime=window.PlecTexts.catalogue[0].audio.variants.r23.fragments[0].end+.1;});
  await page.waitForFunction(()=>document.querySelector('#prosody-audio').currentTime>PlecTexts.catalogue[0].audio.variants.r23.fragments[0].end+.3);
  assert.equal(await page.locator('#prosody-audio').evaluate(audio=>audio.paused),false,'Full-version listening does not stop at student fragment boundaries.');
  await page.selectOption('#prosody-audio-variant','r45');assert.equal(await page.locator('#prosody-audio').evaluate(audio=>audio.paused),true);
  await page.selectOption('#prosody-audio-variant','r23');
  const download=page.waitForEvent('download');await page.click('#prosody-pdf');const file=await download;assert.equal(file.suggestedFilename(),'plec-ll01-escaleta-prosodia.pdf');assert.equal((await PDFDocument.load(fs.readFileSync(await file.path()))).getPageCount(),3);
  await page.screenshot({path:'output/prosody-desktop.png',animations:'disabled'});
  await page.locator('.prosody-guidance summary').click();assert((await page.locator('#prosody-guidance').textContent()).includes('87 mots locutats'));await page.locator('.prosody-guidance summary').click();
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});await page.evaluate(()=>document.documentElement.dataset.theme='dark');
   assert.equal(await page.locator('.prosody-column:visible').count(),3);
   await page.click('[data-prosody-variant="r912"]');assert.equal(await page.locator('.prosody-fragment:visible').count(),6);
   await page.click('[data-prosody-variant="r45"]');assert.equal(await page.locator('.prosody-fragment:visible').count(),14);assert.equal(await page.locator('#prosody-audio-variant').inputValue(),'r45');
   const bounds=await page.locator('#prosody-dialog').evaluate(el=>({width:el.getBoundingClientRect().width,scroll:el.scrollWidth,client:el.clientWidth,body:el.querySelector('.prosody-scroll').clientHeight}));
   assert(bounds.width<=width&&bounds.body>180);assert.equal(bounds.scroll,bounds.client);
   await page.screenshot({path:`output/prosody-mobile-${width}.png`,animations:'disabled'});
  }
  await page.locator('#prosody-audio').evaluate(audio=>audio.play());
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#prosody-dialog').open);assert(await page.locator('#prosody-open').evaluate(el=>el===document.activeElement));assert.equal(await page.locator('#prosody-audio').evaluate(audio=>audio.paused),true);
  await page.setViewportSize({width:1440,height:900});await page.click('[data-mode="words"]');assert(await page.locator('#prosody-open').isHidden());
  assert.deepEqual(errors,[]);console.log('Prosody UI: discreet text-only preview action, same-modal four-rhythm comparison, four real MP3s with continuous playback across cuts, synchronized selectors, paused on switch/close, locution labels, print download, direction details, narrow/dark rhythm switching, no overflow and keyboard focus restoration passed. No synthesis.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
