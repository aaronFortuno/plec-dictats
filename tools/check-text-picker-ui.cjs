'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'playwright'):'playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4176'?route.continue():route.abort());
  const open=async()=>{await page.click('#text-picker-open');await page.waitForSelector('#text-picker-dialog[open]');};
  const close=async()=>{await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.getElementById('text-picker-dialog').open);};
  await page.goto('http://127.0.0.1:4176/ca/?text=ca-ll-001-v1');await page.waitForSelector('#text-download:not([disabled])');
  assert.equal(await page.locator('#text-selection').count(),0);assert.equal(await page.locator('#text-selected-focuses').textContent(),'l·l');assert((await page.locator('#text-selected-meta').textContent()).includes('63 mots'));
  await page.selectOption('#text-fold','horizontal');await page.fill('#text-font-size','13');await page.waitForSelector('#text-download:not([disabled])');await open();
  assert.equal(await page.locator('.text-picker-card').count(),2);assert.equal(await page.locator('.text-picker-card[aria-pressed=true]').getAttribute('data-text-id'),'ca-ll-001-v1');
  assert((await page.locator('[data-text-id="ca-ll-002-v1"]:is(.text-picker-card)').textContent()).includes('57 mots'));assert((await page.locator('.text-picker-card').first().textContent()).includes('Cicle superior'));
  await page.fill('#text-picker-search','exposicio');assert.equal(await page.locator('.text-picker-card').count(),1);assert.equal(await page.locator('.text-picker-card').getAttribute('data-text-id'),'ca-ll-001-v1');
  await page.fill('#text-picker-search','ll02');assert.equal(await page.locator('.text-picker-card').count(),1);await page.click('#text-picker-clear');assert.equal(await page.locator('.text-picker-card').count(),2);assert.equal(await page.evaluate(()=>document.activeElement.id),'text-picker-search');
  await page.click('[data-focus="l·l"]');assert.equal(await page.locator('[data-focus="l·l"]').getAttribute('aria-pressed'),'true');
  await page.fill('#text-picker-search','inexistent');assert(await page.locator('#text-picker-empty').isVisible());assert.equal(await page.locator('.text-picker-card').count(),0);await page.click('#text-picker-reset');assert.equal(await page.locator('.text-picker-card').count(),2);
  await page.click('.text-picker-card[data-text-id="ca-ll-002-v1"]');await page.waitForFunction(()=>!document.getElementById('text-picker-dialog').open);await page.waitForSelector('#text-download:not([disabled])');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'text-picker-open');assert.equal(await page.locator('#text-title').textContent(),'Llavors al jardí');assert((await page.locator('#text-selected-meta').textContent()).includes('57 mots'));assert((await page.locator('#sheet-preview').textContent()).includes('Llavors al jardí'));assert.equal(new URL(page.url()).searchParams.get('text'),'ca-ll-002-v1');assert.equal(await page.locator('#text-fold').inputValue(),'horizontal');assert.equal(await page.locator('#text-font-size').inputValue(),'13');
  await page.reload();await page.waitForSelector('#text-download:not([disabled])');assert.equal(await page.locator('#text-picker-open').getAttribute('data-text-id'),'ca-ll-002-v1');await open();
  assert.equal(await page.locator('#text-picker-search').inputValue(),'');assert.equal(await page.locator('.text-picker-card[aria-pressed=true]').getAttribute('data-text-id'),'ca-ll-002-v1');await page.screenshot({path:'output/text-picker-desktop.png',animations:'disabled'});await close();
  for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.evaluate(()=>document.documentElement.dataset.theme='dark');await page.click('#workspace-toggle-config');await open();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);assert(await page.evaluate(()=>{const d=document.getElementById('text-picker-dialog');return d.scrollWidth<=d.clientWidth;}));await page.screenshot({path:`output/text-picker-${width}.png`,animations:'disabled'});await close();assert.equal(await page.evaluate(()=>document.activeElement.id),'text-picker-open');await page.click('.config .workspace-drawer-close');}
  await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>document.documentElement.dataset.theme='light');
  // In-memory fixtures exercise multiple focuses and a growing bank; never published.
  await page.evaluate(()=>{const base=PlecTexts.catalogue[0];PlecTexts.catalogue.push({...base,id:'fixture-bv',code:'BV01',title:'Un text de prova',focusLabels:['b/v','Accentuació'],audio:null},{...base,id:'fixture-h',code:'H01',title:'Un altre text',focusLabels:['h'],audio:null});});
  await open();await page.click('[data-focus="b/v"]');assert.equal(await page.locator('.text-picker-card').count(),1);await page.click('[data-focus="h"]');assert.equal(await page.locator('.text-picker-card').count(),2);await page.click('[data-focus="Accentuació"]');assert.equal(await page.locator('.text-picker-card').count(),2,'Combining focuses uses OR and never duplicates a card.');await page.click('[data-focus="b/v"]');await page.click('[data-focus="h"]');assert.equal(await page.locator('.text-picker-card').count(),1);await close();
  await page.evaluate(()=>{const base=PlecTexts.catalogue[0];for(let i=0;i<30;i++)PlecTexts.catalogue.push({...base,id:'fixture-'+i,code:'TEST'+i,title:'Dictat de prova '+i});});await open();
  const controls=await page.locator('.text-picker-controls').boundingBox();await page.locator('.text-picker-scroll').evaluate(e=>{e.scrollTop=e.scrollHeight;});assert.deepEqual(await page.locator('.text-picker-controls').boundingBox(),controls);assert(await page.locator('.text-picker-scroll').evaluate(e=>e.scrollTop>0));await close();
  assert.deepEqual(errors,[]);console.log('Text picker: actual metadata, title/code search, focus union, empty/reset, selected state, preview/URL/settings/reload, reset on reopen, fixed controls with growing results, keyboard and mobile/dark passed. No synthesis.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
