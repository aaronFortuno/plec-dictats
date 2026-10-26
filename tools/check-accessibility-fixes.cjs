'use strict';
// Local keyboard, reflow and motion regressions. No synthesis or real telemetry.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'playwright'):'playwright');
const BASE='http://127.0.0.1:4176';
const fakeAnalytics='window.PlecAnalytics={track(){},getState(){return {status:"disabled",reason:"local"}},subscribe(f){f(this.getState());return ()=>{}},reportState:()=>"idle",reportAudio:async()=>false,refresh(){return this.getState()},disable(){},allowTemporarily:async()=>{}};';
(async()=>{fs.mkdirSync('output',{recursive:true});const browser=await chromium.launch({channel:'chrome'});try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/analytics.js?*',route=>route.fulfill({contentType:'application/javascript',body:fakeAnalytics}));
 await page.addInitScript(()=>{
  HTMLElement.prototype.requestFullscreen=()=>Promise.reject(Error('Local windowed test'));
  window.__testAudios=[];
  window.Audio=class{constructor(url){this.url=url;window.__testAudios.push(this);}play(){this.savedEnd=this.onended;this.savedError=this.onerror;return Promise.resolve();}pause(){}removeAttribute(){}};
 });
 async function finish(ok=true){await page.evaluate(ok=>{const audio=window.__testAudios.at(-1);(ok?audio.savedEnd:audio.savedError)?.();},ok);}
 await page.goto(BASE+'/ca/dictat/?seed=ADZ52356A');await page.waitForSelector('#ready-panel:not([hidden])');
 await page.click('#start-dictation');await page.click('#windowed-start');
 await page.locator('#listen-word').focus();
 for(let i=1;i<=3;i++){
  await page.keyboard.press('Enter');assert(await page.locator('#listen-word').isDisabled());
  await finish();assert.equal(await page.evaluate(()=>document.activeElement.id),i===3?'next-word':'listen-word');
  assert.equal(await page.locator('#listen-count').textContent(),i+' de 3 escoltes');
 }
 await page.keyboard.press('Enter');assert.equal(await page.locator('#word-progress').textContent(),'Paraula 2 de 24');
 await page.locator('#listen-word').focus();await page.keyboard.press('Enter');await finish(false);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'listen-word');assert(await page.locator('#playback-error').isVisible());assert.equal(await page.locator('#listen-count').textContent(),'0 de 3 escoltes');
 await page.keyboard.press('Enter');await page.keyboard.press('Shift+Tab');
 const chosen=await page.evaluate(()=>document.activeElement.id);assert(chosen&&chosen!=='listen-word');await finish();assert.equal(await page.evaluate(()=>document.activeElement.id),chosen,'Do not steal deliberately moved keyboard focus');
 await page.locator('#listen-word').focus();await page.keyboard.press('Enter');await page.locator('.d-header').click({position:{x:300,y:20}});await finish();assert.notEqual(await page.evaluate(()=>document.activeElement.id),'listen-word','An outside pointer action cancels focus restoration');
 await page.locator('#listen-word').focus();await page.keyboard.press('Enter');
 await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
 assert(await page.locator('#pause-panel').isVisible());const pauseFocus=await page.evaluate(()=>document.activeElement.id);await finish();assert.equal(await page.evaluate(()=>document.activeElement.id),pauseFocus,'Obsolete end callback must not move pause focus');
 await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'));});
 await page.click('#resume-dictation');assert.equal(await page.locator('#listen-count').textContent(),'2 de 3 escoltes');
 await page.locator('#listen-word').focus();await page.keyboard.press('Enter');await page.click('#exit-focus');await finish();assert(await page.locator('#setup-panel').isVisible());assert.equal(await page.evaluate(()=>document.activeElement.id),'setup-title','Old session must not restore focus');

 await page.goto(BASE+'/ca/?seed=ADZ52356A');await page.waitForSelector('#sheet-preview svg');
 for(const size of [{width:1440,height:900},{width:390,height:844},{width:320,height:720},{width:320,height:256}]){
  await page.setViewportSize(size);await page.waitForTimeout(240);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal page overflow');
  if(size.height>420)assert(await page.locator('.site-footer').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight+1),'Ordinary footer remains anchored');
  if(size.width<1200){
   for(const [toggle,panel,last] of [['#workspace-toggle-config','.config','#required-word'],['#workspace-toggle-management','.management','#copy-student-link']]){
    await page.locator(toggle).scrollIntoViewIfNeeded();await page.click(toggle);await page.waitForTimeout(240);
    const geometry=await page.locator(panel).evaluate(el=>{const box=el.getBoundingClientRect(),scroll=el.querySelector('.config-scroll,.management-scroll');return{top:box.top,bottom:box.bottom,height:box.height,scrollHeight:scroll.clientHeight};});
    assert(geometry.scrollHeight>80,'The drawer has a usable scroll area');
    if(size.height<=420)assert(geometry.top>=0&&geometry.bottom<=size.height,'Short-height drawer stays inside viewport');
    await page.locator(last).focus();await page.locator(last).scrollIntoViewIfNeeded();
    const visible=await page.locator(last).evaluate(el=>{const r=el.getBoundingClientRect(),p=el.closest('aside').getBoundingClientRect();return r.top>=p.top&&r.bottom<=p.bottom+1;});assert(visible,'Last drawer control is reachable');
    if(size.height===256)await page.screenshot({path:'output/a11y-fixed-'+(panel==='.config'?'filters':'management')+'-320x256.png'});
    await page.keyboard.press('Escape');await page.waitForTimeout(240);assert.equal(await page.evaluate(()=>document.activeElement.id),toggle.slice(1));
   }
  }
 }
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(240);
 assert.equal(await page.evaluate(()=>PlecMotion.duration),220);
 await page.click('#help-open');await page.evaluate(()=>{window.__testMQ=matchMedia('(prefers-reduced-motion: reduce)');window.__testEvents=[];__testMQ.addEventListener('change',e=>__testEvents.push(e.matches));window.__testMotion=PlecMotion.animate(document.querySelector('.config'),[{opacity:.5},{opacity:1}]);window.__testMotion.playbackRate=.1;PlecMotion.close(document.querySelector('#help-dialog'));});
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>PlecMotion.duration===0&&!document.querySelector('#help-dialog').open);
 assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--motion-duration').trim()),'0ms');
 assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.config')).transitionDuration),'0s');
 await page.waitForFunction(()=>window.__testMotion.playState==='finished',null,{timeout:1000});
 assert.deepEqual(await page.evaluate(()=>__testEvents),[true],'The live preference change was dispatched');
 await page.click('#help-open');await page.evaluate(()=>PlecMotion.close(document.querySelector('#help-dialog')));assert(!await page.locator('#help-dialog').evaluate(el=>el.open),'Reduced-motion dialog closes without animation delay');
 await page.click('[data-theme-toggle]');assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(20);assert.equal(await page.evaluate(()=>PlecMotion.duration),220);
 await page.goto(BASE+'/ca/dictat/?seed=ADZ52356A');await page.emulateMedia({reducedMotion:'reduce'});await page.waitForSelector('#ready-panel:not([hidden])');await page.click('#start-dictation');await page.click('#windowed-start');assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0,'Student scene respects reduced motion');
 assert.deepEqual(errors,[]);console.log('Accessibility fixes passed: keyboard playback/error/pause/stale focus, reachable short-height drawers, ordinary anchored footer, 220ms default and dynamic reduced motion.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exit(1);});
