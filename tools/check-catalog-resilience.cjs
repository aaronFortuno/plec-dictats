'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'playwright'):'playwright');
const BASE='http://127.0.0.1:4176';
(async()=>{const browser=await chromium.launch({channel:'chrome'});try{
 async function pageFor({blocked=[],delayMallorcan=0}={}){
  const p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],requests=[];p.setDefaultTimeout(12000);
  p.on('pageerror',error=>errors.push(error.message));p.on('request',r=>requests.push(new URL(r.url()).pathname));
  await p.addInitScript(()=>{window.testAudio=[];window.Audio=class{constructor(url){this.url=url;this.paused=false;window.testAudio.push(this);}play(){return Promise.resolve();}pause(){this.paused=true;}removeAttribute(){}};});
  for(const resource of blocked)await p.route('**/'+resource,route=>route.abort());
  if(delayMallorcan)await p.route('**/runtime/mallorcan.json',async route=>{await new Promise(resolve=>setTimeout(resolve,delayMallorcan));await route.continue().catch(()=>{});});
  await p.goto(BASE+'/ca/');await p.waitForSelector('#sheet-preview svg');await p.click('#catalog-open');await p.waitForSelector('.pronunciation-row');
  return {p,errors,requests};
 }
 const play=(p,variety)=>p.locator('[data-action=play][data-variety='+variety+'].review-icon').first();
 // A broken IPA resource cannot gate either audio manifest, identities or playback.
 {const {p,errors,requests}=await pageFor({blocked:['runtime/valencian.json']});await play(p,'central').waitFor({state:'visible'});await p.waitForFunction(()=>!document.querySelector('[data-action=play][data-variety=central].review-icon').disabled);
  await p.locator('[data-retry-resource=valencia]').waitFor();assert(await play(p,'valencia').isEnabled());assert.equal(await p.locator('[data-variety=valencia].ipa-play .ipa-text').first().textContent(),'—');
  assert((await p.locator('#review-notice').textContent()).includes('IPA valenciana'));assert(!requests.some(url=>/ca\/(?:central|valencian|mallorcan)-didactic\.json$/.test(url)),'No full editorial table is transferred to the browser');
  await play(p,'central').click();assert.equal(await p.evaluate(()=>window.testAudio.length),1);assert(/\/(?:assets|output)\/audio\//.test(await p.evaluate(()=>window.testAudio[0].url)));
  const before=requests.filter(url=>url.endsWith('runtime/central.json')).length;await p.unroute('**/runtime/valencian.json');await p.click('[data-retry-resource=valencia]');await p.waitForFunction(()=>document.querySelector('[data-variety=valencia] .ipa-text')?.textContent!=='—');assert.equal(requests.filter(url=>url.endsWith('runtime/central.json')).length,before,'Retry affects only failed resource');
  assert.equal(await p.evaluate(()=>window.testAudio[0].paused),false,'Late IPA success does not interrupt playback');
  await p.fill('#catalog-search','escola');await p.waitForTimeout(240);const pending=p.locator('[data-variety=mallorqui].ipa-play');assert.equal(await pending.locator('.ipa-text').textContent(),'—');assert.equal(await pending.getAttribute('aria-disabled'),'true');await pending.focus();assert((await pending.getAttribute('data-report-tooltip')).includes('Àudio en pausa'));
  assert(await p.locator('#catalog-dialog a[href*="github.com"]').isVisible());assert.equal(new URL(await p.locator('#pronunciation-criteria').getAttribute('href')).pathname,'/ca/pronunciacio/');
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(240);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),390);assert(await p.locator('[data-variety=mallorqui].ipa-play').isVisible());
  assert.deepEqual(errors,[]);await p.close();}
 // Audio metadata failures remain independent: public and review paths can each play.
 for(const resource of ['audio/manifest.json','output/audio/review-manifest.json']){const {p,errors}=await pageFor({blocked:[resource]});await p.waitForFunction(()=>!document.querySelector('[data-action=play][data-variety=central].review-icon').disabled);assert(await play(p,'valencia').isEnabled());await play(p,'central').click();assert.equal(await p.evaluate(()=>window.testAudio.length),1);assert.deepEqual(errors,[]);await p.close();}
 // If both manifests fail, IPA remains usable and the exact failures can be retried.
 {const {p,errors}=await pageFor({blocked:['audio/manifest.json','output/audio/review-manifest.json']});await p.locator('[data-retry-resource=published]').waitFor();await p.locator('[data-retry-resource=review]').waitFor();await p.waitForFunction(()=>!document.querySelector('[data-variety=central] .ipa-text').textContent.includes('Carregant'));
  assert(await play(p,'central').isDisabled());assert(!(await p.locator('[data-variety=central] .ipa-text').first().textContent()).includes('Carregant'));assert.deepEqual(errors,[]);await p.close();}
 // Mallorcan rows are informational while a resource is late; no audio is fabricated.
 {const {p,errors}=await pageFor({delayMallorcan:900});await p.waitForFunction(()=>!document.querySelector('[data-action=play][data-variety=central].review-icon').disabled);await play(p,'central').click();await p.waitForFunction(()=>document.querySelector('[data-variety=mallorqui] .ipa-text').textContent!=='Carregant…');assert.equal(await p.evaluate(()=>window.testAudio[0].paused),false);assert.deepEqual(errors,[]);await p.close();}
 console.log('Catalogue resilience passed: independent IPA/audio failures, selective retries, published/review playback, loading recovery, Mallorcan pending states and mobile layout.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exit(1);});
