'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const lib=name=>require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,name):name);
const {chromium}=lib('playwright'),{PDFDocument}=lib('pdf-lib');
(async()=>{const browser=await chromium.launch({channel:'chrome'});try{
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce',colorScheme:'light'}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
 await page.goto('http://127.0.0.1:4176/ca/?seed=ADZ52356A');await page.waitForSelector('#sheet-preview svg');
 const geometry=()=>page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};return {footer:rect('.site-footer'),preview:rect('.paper-viewport'),config:rect('.config'),management:rect('.management'),viewport:{width:innerWidth,height:innerHeight},pageWidth:document.documentElement.scrollWidth};});
 let g=await geometry();assert(g.config.right<=g.preview.x&&g.preview.right<=g.management.x);assert.equal(g.config.y,g.management.y);
 for(const width of [1199,1000,999,760,600,390,320]){
  await page.setViewportSize({width,height:844});await page.waitForFunction(()=>document.querySelector('#workspace-toggle-config').offsetWidth>0);g=await geometry();assert.equal(g.pageWidth,width);assert(g.footer.bottom<=844.1);assert(g.preview.height>200);assert(g.preview.width>200);
  await page.click('#workspace-toggle-management');assert(await page.locator('.management.drawer-open').isVisible());await page.click('#workspace-toggle-config');assert(await page.locator('.config.drawer-open').isVisible());assert.equal(await page.locator('.management.drawer-open').count(),0);assert((await page.locator('.config-scroll').evaluate(e=>e.clientHeight))>100);await page.keyboard.press('Escape');
 }
 // Crossing the exact drawer breakpoint must restore the columns and clear the
 // open state; this prevents old stacking rules from silently returning.
 await page.click('#workspace-toggle-config');await page.setViewportSize({width:1200,height:800});await page.waitForFunction(()=>!document.querySelector('.drawer-open'));assert(!await page.locator('#workspace-toggle-config').isVisible());g=await geometry();assert(g.config.right<=g.preview.x&&g.preview.right<=g.management.x);
 await page.locator('[data-theme-toggle]').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');await page.click('#help-open');const dialog=await page.locator('#help-dialog').boundingBox();assert(dialog.x>=0&&dialog.x+dialog.width<=1200);await page.locator('#help-dialog .dialog-head [data-close]').click();
 await page.setViewportSize({width:320,height:256});await page.click('#workspace-toggle-config');assert((await page.locator('.config-scroll').evaluate(e=>e.clientHeight))>100);await page.keyboard.press('Escape');
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({media:'print'});assert(!await page.locator('.workspace-toolbar').isVisible());assert(!await page.locator('.config').isVisible());const paper=await page.locator('.paper').boundingBox();assert(Math.abs(paper.width-210*96/25.4)<.1);assert(Math.abs(paper.height-297*96/25.4)<.1);
 fs.mkdirSync('output',{recursive:true});for(const width of [1440,1024,390]){await page.setViewportSize({width,height:900});const bytes=await page.pdf({path:'output/workspace-layout-print-'+width+'.pdf',preferCSSPageSize:true,printBackground:true});assert.equal((await PDFDocument.load(bytes)).getPageCount(),1);}assert.deepEqual(errors,[]);
 console.log('Workspace layout: desktop/drawer boundary, 320–1440px, mutual panels, footer, short-height reflow, dark help and one-page A4 browser print passed.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
