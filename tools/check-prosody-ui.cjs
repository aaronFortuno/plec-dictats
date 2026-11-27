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
  assert.equal(await page.locator('.has-error').count(),2);assert((await page.locator('#prosody-review-count').textContent()).includes('2 fragments'));
  const marked=page.locator('[data-review-key="r45:2"]');await marked.locator('.prosody-mark').click();await marked.locator('textarea').fill('El mot sona dubtós.');assert.equal(await page.locator('.has-error').count(),3);
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedReview=text;}}});});
  await page.click('#prosody-review-copy');assert.match(await page.evaluate(()=>copiedReview),/r45 · F2/);assert.match(await page.evaluate(()=>copiedReview),/El mot sona dubtós/);assert.match(await page.evaluate(()=>copiedReview),/Ha enganjat/);
  await marked.locator('.prosody-mark').focus();await page.keyboard.press('Space');assert(await marked.locator('textarea').isHidden());
  await page.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw Error('Denied');};});await page.click('#prosody-review-copy');assert(await page.locator('#prosody-review-fallback').isVisible());assert.match(await page.locator('#prosody-review-fallback').inputValue(),/col·leja/);
  await page.keyboard.press('Escape');await page.click('#prosody-open');assert.equal(await page.locator('.has-error').count(),2);assert(await page.locator('#prosody-review-fallback').isHidden());
  const before=await page.locator('#prosody-listening').boundingBox();await page.locator('.prosody-scroll').evaluate(el=>el.scrollTop=el.scrollHeight);const after=await page.locator('#prosody-listening').boundingBox();assert.equal(after.y,before.y);assert(await page.locator('#prosody-review-copy').isVisible());await page.locator('.prosody-scroll').evaluate(el=>el.scrollTop=0);
  assert.equal(await page.locator('#prosody-audio-grid audio').count(),4);assert.equal(await page.locator('#prosody-listening select').count(),0);
  for(const id of ['r23','r45','r68','r912']){
   await page.waitForFunction(id=>document.getElementById('prosody-audio-'+id).readyState>=1,id);
   const media=await page.locator('#prosody-audio-'+id).evaluate(audio=>({src:audio.currentSrc,duration:audio.duration,paused:audio.paused}));
   assert(media.src.endsWith('/'+id+'.mp3'));assert(media.duration>40&&media.duration<75);assert(media.paused);
   const playerBox=await page.locator('.prosody-audio-card[data-variant="'+id+'"]').boundingBox(),columnBox=await page.locator('.prosody-column[data-variant="'+id+'"]').first().boundingBox();assert(Math.abs(playerBox.x-columnBox.x)<2);assert(Math.abs(playerBox.width-columnBox.width)<2);
  }
  const first=page.locator('#prosody-audio-r23'),second=page.locator('#prosody-audio-r45');
  await first.evaluate(async audio=>{await audio.play();audio.currentTime=window.PlecTexts.catalogue[0].audio.variants.r23.fragments[0].end+.1;});
  await page.waitForFunction(()=>document.querySelector('#prosody-audio-r23').currentTime>PlecTexts.catalogue[0].audio.variants.r23.fragments[0].end+.3);
  assert.equal(await first.evaluate(audio=>audio.paused),false,'Continuous playback crosses student fragment boundaries.');
  const position=await first.evaluate(audio=>audio.currentTime);await second.evaluate(audio=>audio.play());assert.equal(await first.evaluate(audio=>audio.paused),true);assert.equal(await second.evaluate(audio=>audio.paused),false);
  await first.evaluate(audio=>audio.play());assert.equal(await second.evaluate(audio=>audio.paused),true);assert(await first.evaluate((audio,before)=>audio.currentTime>=before,position));await first.evaluate(audio=>audio.pause());
  const download=page.waitForEvent('download');await page.click('#prosody-pdf');const file=await download;assert.equal(file.suggestedFilename(),'plec-ca001-escaleta-prosodia.pdf');assert.equal((await PDFDocument.load(fs.readFileSync(await file.path()))).getPageCount(),3);
  await page.screenshot({path:'output/prosody-desktop.png',animations:'disabled'});
  await page.locator('.prosody-guidance summary').click();assert((await page.locator('#prosody-guidance').textContent()).includes('87 mots locutats'));await page.locator('.prosody-guidance summary').click();
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});await page.evaluate(()=>document.documentElement.dataset.theme='dark');
   assert.equal(await page.locator('.prosody-column:visible').count(),3);
   await page.click('[data-prosody-variant="r912"]');assert.equal(await page.locator('.prosody-fragment:visible').count(),6);
   await page.click('[data-prosody-variant="r45"]');assert.equal(await page.locator('.prosody-fragment:visible').count(),14);assert(await page.locator('.prosody-audio-card[data-variant="r45"]').isVisible());assert.equal(await page.locator('.prosody-audio-card:visible').count(),1);
   const bounds=await page.locator('#prosody-dialog').evaluate(el=>({width:el.getBoundingClientRect().width,scroll:el.scrollWidth,client:el.clientWidth,body:el.querySelector('.prosody-scroll').clientHeight}));
   assert(bounds.width<=width&&bounds.body>180);assert.equal(bounds.scroll,bounds.client);
   await page.screenshot({path:`output/prosody-mobile-${width}.png`,animations:'disabled'});
  }
  await page.setViewportSize({width:844,height:390});
  assert(await page.locator('.prosody-scroll').evaluate(el=>el.clientHeight>80));
  assert(await page.locator('#prosody-review-copy').evaluate(el=>el.getBoundingClientRect().bottom<390));
  await page.locator('#prosody-audio-r45').evaluate(audio=>audio.play());
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#prosody-dialog').open);assert(await page.locator('#prosody-open').evaluate(el=>el===document.activeElement));assert(await page.locator('#prosody-audio-grid audio').evaluateAll(players=>players.every(audio=>audio.paused)));
  await page.setViewportSize({width:1440,height:900});await page.click('#text-picker-open');await page.click('.text-picker-card[data-text-id=\"ca-ll-002-v1\"]');await page.click('#text-picker-confirm');await page.waitForFunction(()=>!document.querySelector('#text-picker-dialog').open);await page.waitForFunction(()=>!document.querySelector('#text-download').disabled);await page.click('#prosody-open');assert.equal(await page.locator('.prosody-fragment').count(),52);assert.equal(await page.locator('.prosody-cue').count(),40);assert.equal(await page.locator('.has-error').count(),7);assert((await page.locator('[data-review-key="r912:6"] textarea').inputValue()).includes('punto final'));assert((await page.locator('#prosody-text-title').textContent()).includes('CA002'));await page.waitForFunction(()=>document.querySelector('#prosody-audio-r912').readyState>=1);assert((await page.locator('#prosody-audio-r912').getAttribute('src')).includes('ll02-four-v1'));assert.equal(await page.locator('#prosody-audio-grid audio').count(),4);await page.keyboard.press('Escape');
  await page.click('[data-mode="words"]');assert(await page.locator('#prosody-open').isHidden());
  assert.deepEqual(errors,[]);console.log('Prosody UI: discreet text-only preview action, same-modal four-rhythm comparison, local fragment marks/notes, keyboard toggles, clipboard/fallback, saved annotations and fixed player while scrolling, four real MP3s with continuous playback across cuts, four aligned independent players, retained positions, no overlapping playback, mobile tabs and pause-all on close, locution labels, print download, direction details, narrow/dark rhythm switching, no overflow and keyboard focus restoration passed. No synthesis.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
