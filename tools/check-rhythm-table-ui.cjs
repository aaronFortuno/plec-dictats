'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'playwright'):'playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4176'?route.continue():route.abort());
  await page.addInitScript(()=>localStorage.setItem('plec-rhythm-label-proposals-v1',JSON.stringify({revision:'rhythm-labels-review-1',entries:{ROSA:{code:'FLOR',picture:'una flor groga'}}})));
  await page.goto('http://127.0.0.1:4176/ca/?text=ca-ll-001-v1');await page.waitForSelector('#text-download:not([disabled])');
  await page.click('#rhythm-table-open');await page.waitForSelector('#rhythm-table-dialog[open]');
  assert.deepEqual(await page.locator('#rhythm-table-content caption').allTextContents(),['Pausa breu','Pausa habitual','Pausa llarga']);assert.equal(await page.locator('#rhythm-table-content table').count(),3);assert.equal(await page.locator('#rhythm-table-content img').count(),36);assert.equal(await page.locator('#rhythm-table-content b').count(),36);
  assert.equal(await page.locator('#rhythm-table-dialog input, #rhythm-table-dialog textarea, #rhythm-table-review, #rhythm-table-actions, #rhythm-table-copy, #rhythm-table-reset').count(),0);
  const codes=await page.locator('#rhythm-table-content b').allTextContents();assert(codes.includes('ROSA'));assert(!codes.includes('FLOR'));assert.equal(await page.evaluate(()=>PlecRhythmCode.editable),false);
  assert(await page.evaluate(()=>Promise.all([...document.querySelectorAll('#rhythm-table-content img')].map(i=>i.decode().then(()=>i.naturalWidth>0)))).then(a=>a.every(Boolean)));
  await page.locator('#rhythm-table-dialog [data-close]').click();await page.waitForSelector('#rhythm-table-dialog:not([open])',{state:'attached'});assert.equal(await page.evaluate(()=>document.activeElement.id),'rhythm-table-open');await page.click('#rhythm-table-open');
  for(const [width,height] of [[1440,900],[1366,768],[1280,720],[1024,768]]){await page.setViewportSize({width,height});assert.equal(await page.locator('#rhythm-table-content table:visible').count(),3);assert(await page.evaluate(()=>{const d=document.querySelector('#rhythm-table-dialog'),s=d.querySelector('.rhythm-table-scroll');return s.scrollHeight<=s.clientHeight+1&&s.scrollWidth<=s.clientWidth+1&&d.getBoundingClientRect().bottom<=innerHeight&&d.getBoundingClientRect().bottom-d.querySelector('.rhythm-table-footer').getBoundingClientRect().bottom<30;}),'All three blocks must fit without scrolling at '+width+'×'+height);}
  await page.setViewportSize({width:1366,height:768});await page.screenshot({path:'output/rhythm-table-desktop.png',animations:'disabled'});
  for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.evaluate(()=>document.documentElement.dataset.theme='dark');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);assert(await page.evaluate(()=>{const d=document.getElementById('rhythm-table-dialog'),s=d.querySelector('.rhythm-table-scroll');return d.scrollWidth<=d.clientWidth&&s.scrollWidth<=s.clientWidth;}));assert.equal(await page.locator('#rhythm-table-content table:visible').count(),1);await page.click('[data-rhythm-pause="0.8"]');assert(await page.locator('table[data-pause="0.8"]').isVisible());await page.click('[data-rhythm-pause="1.25"]');assert(await page.locator('table[data-pause="1.25"]').isVisible());await page.click('[data-rhythm-pause="1"]');await page.screenshot({path:`output/rhythm-table-${width}.png`,animations:'disabled'});}
  await page.keyboard.press('Escape');await page.waitForSelector('#rhythm-table-dialog:not([open])',{state:'attached'});
  await page.goto('http://127.0.0.1:4176/ca/dictat/?text=ca-ll-001-v1');await page.waitForSelector('#tx-ready:not([hidden])');
  await page.fill('#tx-rhythm-input','cargol');await page.locator('#tx-rhythm-input').press('Enter');assert.equal(await page.locator('#tx-rhythm-input').inputValue(),'BOLA');assert.equal(await page.locator('#tx-rhythm-preview').getAttribute('alt'),'una bola de vidre');await page.locator('#tx-rhythm-preview').evaluate(i=>i.decode());assert.equal(await page.locator('#tx-pace').textContent(),'9–12');
  await page.fill('#tx-rhythm-input','rosa');await page.locator('#tx-rhythm-input').press('Enter');await page.locator('#tx-rhythm-preview').evaluate(i=>i.decode());assert.equal(await page.locator('#tx-rhythm-preview').getAttribute('alt'),'una rosa');
  await page.setViewportSize({width:320,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),320);await page.screenshot({path:'output/rhythm-picture-student.png',animations:'disabled'});
  assert.deepEqual(errors,[]);console.log('Rhythm table UI: 36 approved codes/images, no editing/export controls, stale proposals ignored, keyboard focus, compact desktop and narrow/dark views passed. No synthesis.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
