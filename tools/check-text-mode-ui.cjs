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
  await page.selectOption('#text-selection','ca-ll-002-v1');await page.waitForFunction(()=>!document.querySelector('#text-download').disabled);assert.equal(await page.locator('#text-code').textContent(),'LL02');assert((await page.locator('#sheet-preview').textContent()).includes('Llavors al jardí'));assert.equal(new URL(page.url()).searchParams.get('text'),'ca-ll-002-v1');
  await page.reload();await page.waitForFunction(()=>!document.querySelector('#text-download').disabled);assert.equal(await page.locator('#text-selection').inputValue(),'ca-ll-002-v1');
  await page.selectOption('#text-selection','ca-ll-001-v1');await page.waitForFunction(()=>!document.querySelector('#text-download').disabled);
  assert.equal(await page.locator('#text-side').inputValue(),'end');
  assert.equal(await page.locator('#text-font-size').inputValue(),'14');assert.equal(await page.locator('#text-line-spacing').inputValue(),'10');
  assert.equal(await page.locator('#text-font-size').getAttribute('type'),'number');assert.equal(await page.locator('#text-line-spacing').getAttribute('type'),'number');
  await page.locator('#text-font-size').focus();await page.keyboard.press('ArrowUp');assert.equal(await page.locator('#text-font-size').inputValue(),'15');await page.waitForFunction(()=>!document.querySelector('#text-download').disabled);
  await page.keyboard.press('ArrowDown');assert.equal(await page.locator('#text-font-size').inputValue(),'14');await page.waitForFunction(()=>!document.querySelector('#text-download').disabled);
  await page.fill('#text-line-spacing','');assert(await page.locator('#text-download').isDisabled());
  await page.fill('#text-line-spacing','10');await page.waitForFunction(()=>!document.querySelector('#text-download').disabled);
  assert.equal(await page.locator('#text-preview-body').count(),0);
  assert.equal(await page.locator('.text-config details').count(),0);
  assert.equal(await page.locator('.focus-settings').isVisible(),false);assert.equal(await page.locator('#download-pdf').isVisible(),false);
  assert((await page.locator('#sheet-preview').textContent()).includes('Una exposició al col·legi'));
  assert.equal(new URL(page.url()).searchParams.get('text'),'ca-ll-001-v1');
  await page.screenshot({path:'output/text-blocks-composer.png',animations:'disabled'});
  await page.fill('#text-font-size','16');await page.fill('#text-line-spacing','12');
  await page.waitForFunction(()=>!document.querySelector('#text-layout-error').hidden);
  assert(await page.locator('#text-download').isDisabled());assert.equal(await page.locator('#sheet-preview svg').count(),0);
  await page.fill('#text-font-size','13');await page.fill('#text-line-spacing','11');await page.waitForFunction(()=>!document.querySelector('#text-download').disabled);
  assert(await page.locator('#text-layout-error').isHidden());
  await page.selectOption('#text-fold','horizontal');await page.selectOption('#text-side','end');await page.selectOption('#text-pace','10');await page.selectOption('#text-rate','0.9');
  await page.waitForFunction(()=>!document.querySelector('#text-download').disabled);
  const pending=page.waitForEvent('download');await page.click('#text-download');const download=await pending;assert.equal(download.suggestedFilename(),'plec-ll01-horizontal.pdf');
  await page.screenshot({path:'output/text-composer.png',animations:'disabled'});
  await page.reload();await page.waitForFunction(()=>!document.querySelector('#text-download').disabled);
  assert.equal(await page.locator('#text-fold').inputValue(),'horizontal');assert.equal(await page.locator('#text-pace').inputValue(),'10');
  assert.equal(await page.locator('#text-font-size').inputValue(),'13');assert.equal(await page.locator('#text-line-spacing').inputValue(),'11');
  assert.equal(await page.locator('#text-side option:checked').textContent(),'A baix');
  await page.click('[data-mode="words"]');await page.waitForSelector('#sheet-preview svg');assert.equal(await page.locator('#seed-code').textContent(),seed);
  assert(!new URL(page.url()).searchParams.has('text'));
  await page.click('[data-mode="pseudo"]');await page.waitForSelector('#sheet-preview svg');await page.click('[data-mode="text"]');await page.waitForFunction(()=>!document.querySelector('#text-download').disabled);await page.click('[data-mode="pseudo"]');assert.equal(await page.locator('[data-mode="pseudo"]').getAttribute('aria-pressed'),'true');
  for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.click('#workspace-toggle-config');await page.click('[data-mode="text"]');await page.waitForFunction(()=>!document.querySelector('#text-download').disabled);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);await page.screenshot({path:`output/text-composer-${width}.png`,animations:'disabled'});await page.keyboard.press('Escape');}
  await page.goto('http://127.0.0.1:4176/ca/dictat/?text=ca-ll-001-v1&pace=6&rate=1');await page.waitForSelector('#tx-ready:not([hidden])');
  assert(await page.locator('#tx-start').isEnabled());assert(await page.locator('#tx-setup-error').isHidden());
  const durations=await page.evaluate(async()=>{
   const variants=Object.values(PlecTexts.catalogue[0].audio.variants);
   return Promise.all(variants.map(v=>new Promise((resolve,reject)=>{const audio=new Audio('../../'+v.path);audio.onloadedmetadata=()=>resolve({actual:audio.duration,expected:v.seconds});audio.onerror=()=>reject(Error('Published pilot does not decode'));audio.load();})));
  });assert.equal(durations.length,4);assert(durations.every(d=>Math.abs(d.actual-d.expected)<.15));
  await page.goto('http://127.0.0.1:4176/ca/dictat/?text=ca-ll-002-v1');await page.waitForSelector('#tx-ready:not([hidden])');assert(await page.locator('#tx-start').isEnabled());assert((await page.locator('#tx-summary').textContent()).includes('57 paraules'));
  const secondDurations=await page.evaluate(async()=>Promise.all(Object.values(PlecTexts.find('LL02').audio.variants).map(v=>new Promise((resolve,reject)=>{const audio=new Audio('../../'+v.path);audio.onloadedmetadata=()=>resolve(Math.abs(audio.duration-v.seconds)<.15);audio.onerror=()=>reject(Error('LL02 media'));audio.load();}))));assert(secondDurations.every(Boolean));
  await page.goto('http://127.0.0.1:4176/ca/dictat/?text=ca-ll-001-v1&pace=6&rate=1');
  // A local media double exercises the player. It neither synthesizes nor downloads speech.
  await page.route('**/text-audio.js?*',route=>route.fulfill({contentType:'text/javascript',body:'window.PlecTextAudio='+JSON.stringify({'ca-ll-001-v1':{...T.catalogue[0].audio,variants:Object.fromEntries(Object.entries(T.catalogue[0].audio.variants).map(([id,v])=>[id,{...v,path:'test-only-'+id+'.mp3',seconds:300}]))}})}));
  await page.addInitScript(()=>{
   window.Audio=class extends EventTarget{constructor(){super();this.duration=300;this.currentTime=0;this.started=false;window.testTextAudio=this;}load(){setTimeout(()=>this.dispatchEvent(new Event('loadedmetadata')),0);}play(){this.started=true;return Promise.resolve();}pause(){this.started=false;}};
   Element.prototype.requestFullscreen=()=>Promise.reject(Error('unavailable in test'));
  });
  await page.reload();await page.waitForSelector('#tx-ready:not([hidden])');await page.locator('#tx-ready-controls [data-adjust=pace][data-step="-1"]').click();
  assert(await page.locator('#tx-auto-ready').isChecked());await page.uncheck('#tx-auto-ready');await page.click('#tx-start');assert(await page.locator('#tx-player').isVisible());assert(await page.locator('#tx-next').isHidden());
  const groups=T.fragments(T.catalogue[0],4);assert.equal(await page.locator('#tx-player select, #tx-player details').count(),0);assert(await page.locator('#tx-adjust').isVisible());
  await page.click('#tx-listen');await page.waitForFunction(()=>testTextAudio.started);await page.evaluate(()=>testTextAudio.onerror());assert((await page.locator('#tx-listen-count').textContent()).startsWith('0 de'));assert(await page.locator('#tx-error').isVisible());
  for(let i=0;i<3;i++){await page.click('#tx-listen');await page.waitForFunction(()=>window.testTextAudio?.started);await page.evaluate(end=>{testTextAudio.currentTime=end;},groups[0].end);await page.waitForFunction(n=>document.querySelector('#tx-listen-count').textContent.startsWith(n+' de'),i+1);}
  assert(await page.locator('#tx-listen').isDisabled());assert.equal(await page.locator('#tx-number').textContent(),'1');
  assert(await page.locator('#tx-listen').evaluate(button=>button.querySelector('#tx-listen-label').getBoundingClientRect().bottom<=button.getBoundingClientRect().bottom-12));
  assert(!(await page.locator('#tx-player').textContent()).includes('col·legi'));
  assert(await page.locator('#tx-adjust').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight));await page.screenshot({path:'output/text-player-mobile.png',animations:'disabled'});
  await page.click('#tx-next');assert.equal(await page.locator('#tx-number').textContent(),'2');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});assert(await page.locator('#tx-paused').isVisible());
  await page.click('#tx-resume');assert.equal(await page.locator('#tx-number').textContent(),'2');
  await page.click('#tx-listen');await page.waitForFunction(()=>testTextAudio.started);await page.evaluate(()=>window.previousAudio=testTextAudio);
  await page.locator('#tx-adjust [data-adjust=rate][data-step="-1"]').click();assert.equal(await page.evaluate(()=>testTextAudio.playbackRate),.9);assert.equal(await page.evaluate(()=>testTextAudio.started),true);
  await page.locator('#tx-adjust [data-adjust=rate][data-step="-1"]').click();assert.equal(await page.evaluate(()=>testTextAudio.playbackRate),.8);assert(await page.locator('#tx-adjust [data-adjust=rate][data-step="-1"]').isDisabled());
  await page.locator('#tx-adjust [data-adjust=rate][data-step="1"]').click();await page.locator('#tx-adjust [data-adjust=rate][data-step="1"]').click();assert.equal(await page.evaluate(()=>testTextAudio.playbackRate),1);
  await page.locator('#tx-adjust [data-adjust=pace][data-step="-1"]').click();
  assert.equal(await page.evaluate(()=>previousAudio.started),false);await page.evaluate(()=>previousAudio.onended?.());assert((await page.locator('#tx-listen-count').textContent()).startsWith('0 de'));assert.equal(await page.locator('#tx-number').textContent(),'2');assert.equal(new URL(page.url()).searchParams.get('pace'),'2');
  await page.locator('#tx-adjust [data-adjust=rate][data-step="-1"]').click();await page.locator('#tx-adjust [data-adjust=rate][data-step="-1"]').click();assert.equal(await page.locator('#tx-number').textContent(),'2');
  await page.locator('#tx-adjust [data-adjust=pace][data-step="1"]').click();await page.locator('#tx-adjust [data-adjust=pace][data-step="1"]').click();assert.equal(await page.locator('#tx-number').textContent(),'1');
  await page.click('#exit-focus');assert(await page.locator('#tx-ready').isVisible());await page.locator('#tx-ready-controls [data-adjust=pace][data-step="-1"]').click();
  await page.click('#tx-start');
  for(let i=0;i<groups.length;i++){await page.click('#tx-listen');await page.waitForFunction(()=>testTextAudio.started);await page.evaluate(()=>{testTextAudio.currentTime=300;});await page.waitForFunction(()=>document.querySelector('#tx-listen-count').textContent.startsWith('1 de'));await page.click('#tx-next');}
  assert(await page.locator('#tx-finished').isVisible());
  // Accelerated browser clock verifies writing waits without real-time sleeps.
  await page.clock.install();await page.goto('http://127.0.0.1:4176/ca/dictat/?text=ca-ll-001-v1&pace=2&rate=1');await page.waitForSelector('#tx-ready:not([hidden])');
  assert(await page.locator('#tx-auto-ready').isChecked());await page.click('#tx-start');await page.waitForFunction(()=>testTextAudio.started);
  await page.evaluate(()=>testTextAudio.onended());assert((await page.locator('#tx-countdown').textContent()).includes('4 s'));
  await page.screenshot({path:'output/text-auto-countdown-mobile.png',animations:'disabled'});
  await page.clock.fastForward(3000);assert.equal(await page.evaluate(()=>testTextAudio.started),false);
  await page.clock.fastForward(1100);await page.waitForFunction(()=>testTextAudio.started);assert((await page.locator('#tx-listen-count').textContent()).startsWith('1 de'));
  await page.evaluate(()=>testTextAudio.onended());await page.clock.fastForward(4100);await page.waitForFunction(()=>testTextAudio.started);await page.evaluate(()=>testTextAudio.onended());
  assert((await page.locator('#tx-listen-count').textContent()).startsWith('3 de'));assert(await page.locator('#tx-countdown').isHidden());await page.clock.fastForward(60000);assert.equal(await page.locator('#tx-number').textContent(),'1');assert.equal(await page.evaluate(()=>testTextAudio.started),false);
  await page.click('#tx-next');await page.waitForFunction(()=>testTextAudio.started);assert.equal(await page.locator('#tx-number').textContent(),'2');
  await page.click('#tx-auto');assert.equal(await page.evaluate(()=>testTextAudio.started),false);assert((await page.locator('#tx-listen-count').textContent()).startsWith('0 de'));await page.clock.fastForward(60000);assert.equal(await page.evaluate(()=>testTextAudio.started),false);
  await page.click('#tx-auto');await page.waitForFunction(()=>testTextAudio.started);await page.evaluate(()=>testTextAudio.onended());assert((await page.locator('#tx-countdown').textContent()).includes('5 s'));
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});assert(await page.locator('#tx-paused').isVisible());await page.clock.fastForward(60000);assert.equal(await page.evaluate(()=>testTextAudio.started),false);
  await page.evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,value:false}));await page.click('#tx-resume');assert((await page.locator('#tx-countdown').textContent()).includes('5 s'));assert.equal(await page.evaluate(()=>testTextAudio.started),false);
  await page.click('#exit-focus');await page.clock.fastForward(60000);assert.equal(await page.evaluate(()=>testTextAudio.started),false);assert(await page.locator('#tx-ready').isVisible());
  await page.goto('http://127.0.0.1:4176/ca/dictat/?text=unknown');await page.waitForSelector('#tx-ready:not([hidden])');assert(await page.locator('#tx-start').isDisabled());
  await page.goto('http://127.0.0.1:4176/es/');await page.waitForSelector('#sheet-preview svg');assert(await page.locator('[data-mode="text"]').isDisabled());
  assert.deepEqual(errors,[]);console.log('Text mode: composer switching, preserved word/pseudoword seeds, PDF, URL reload, mobile drawers, four real MP3 decodes, mock playback/ranges/three repeats, automatic repeats up to three, proportional countdowns, no automatic next fragment, pause/visibility/exit cancellation, in-session rhythm/speed controls without skips, no text shown, pause/resume and invalid/language routes passed. No synthesis.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
