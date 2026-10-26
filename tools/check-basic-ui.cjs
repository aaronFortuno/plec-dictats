'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'playwright'):'playwright');
const fakeAnalytics=`window.PlecAnalytics={track(){},getState:()=>({status:'disabled',reason:'gpc'}),subscribe(f){f(this.getState());},refresh(){},disable(){},allowTemporarily:async()=>false,reportState:()=>'idle'};`;
(async()=>{fs.mkdirSync('output',{recursive:true});const b=await chromium.launch({channel:'chrome'});try{
 const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));
 const selection=()=>p.evaluate(()=>PlecSeeds.resolve(PlecSeedRegistry.editions,document.querySelector('#seed-code').textContent));
 const waitEpoch=epoch=>p.waitForFunction(e=>{try{return PlecSeeds.decode(document.querySelector('#seed-code').textContent).epoch===e;}catch{return false;}},epoch);
 await p.goto('http://127.0.0.1:4176/ca/');await p.waitForSelector('#sheet-preview svg');await waitEpoch(2);
 await p.check('#basic-vocabulary');await waitEpoch(3);assert((await selection()).entries.every(e=>e.basicVocabulary));assert.equal(await p.locator('#word-total').textContent(),'3299');
 await p.selectOption('#stage-control','cm');await waitEpoch(3);assert((await selection()).entries.every(e=>e.basicVocabulary&&['low','medium'].includes(e.orthography)));
 await p.uncheck('#basic-vocabulary');await waitEpoch(2);
 await p.fill('#recover-code','ADZ52356A');await p.locator('#recover-form button').click();await waitEpoch(1);assert(!await p.locator('#basic-vocabulary').isChecked());
 await p.click('#all-tags');await waitEpoch(2);await p.check('#basic-vocabulary');await waitEpoch(3);
 await p.evaluate(()=>{const inputs=[...document.querySelectorAll('#tag-options input')];inputs.forEach(e=>e.checked=e.value==='accent');inputs[0].dispatchEvent(new Event('change',{bubbles:true}));});
 await p.waitForFunction(()=>{try{return PlecSeeds.resolve(PlecSeedRegistry.editions,document.querySelector('#seed-code').textContent).recipe.tags.join()==='accent';}catch{return false;}});
 await p.fill('#required-word','perquè, cançó,');await p.waitForFunction(()=>document.querySelector('#search-status').textContent.includes('Codi trobat'));
 const chosen=await selection();assert(chosen.entries.every(e=>e.basicVocabulary&&e.tags.includes('accent')));assert(['perquè','cançó'].every(t=>chosen.entries.some(e=>e.text===t)));
 const newCode=chosen.code;await p.reload();await p.waitForSelector('#sheet-preview svg');assert.equal((await selection()).code,newCode);assert(await p.locator('#basic-vocabulary').isChecked());
 await p.screenshot({path:'output/composer125.png'});
 const header=await p.evaluate(()=>{const h=document.querySelector('.site-header').getBoundingClientRect(),c=document.querySelector('.header-caption').getBoundingClientRect();return {header:h.y+h.height/2,caption:c.y+c.height/2};});assert(Math.abs(header.caption-header.header)<=5);
 await p.click('#help-open');await p.waitForTimeout(260);assert.equal(await p.locator('#fold-map').count(),0);assert.equal(await p.locator('.fold-guide').count(),0);
 const art=await p.locator('#help-dialog .art-paper').evaluateAll(papers=>papers.map(el=>{const text=el.querySelector('b,span'),r=el.getBoundingClientRect(),t=text?.getBoundingClientRect();return t?{top:t.top,bottom:t.bottom,paperTop:r.top,paperBottom:r.bottom}:null;}).filter(Boolean));assert(art.every(r=>r.top>=r.paperTop&&r.bottom<=r.paperBottom),'Example words remain inside the paper');
 async function checkScroll(id){const g=await p.locator('#'+id).evaluate(el=>{const s=el.querySelector(':scope>.dialog-scroll'),a=el.getBoundingClientRect(),r=s.getBoundingClientRect();return {outer:getComputedStyle(el).overflowY,top:r.top-a.top,bottom:a.bottom-r.bottom,right:a.right-r.right,inner:getComputedStyle(s).overflowY,buttons:getComputedStyle(s,'::-webkit-scrollbar-button').display,scroll:s.scrollHeight-s.clientHeight};});assert.equal(g.outer,'hidden');assert.equal(g.inner,'auto');assert(g.top>15&&g.bottom>15&&g.right>12);assert.equal(g.buttons,'none');assert(g.scroll>0);}
 await checkScroll('help-dialog');await p.screenshot({path:'output/help125-desktop.png'});await p.locator('#help-dialog [data-close]').first().click();await p.waitForFunction(()=>!document.querySelector('#help-dialog').open);
 await p.click('#catalog-open');await p.waitForSelector('.pronunciation-row');assert(await p.locator('#catalog-basic').isChecked());assert((await p.locator('#catalog-count').textContent()).startsWith('350 mots'));
 await p.selectOption('#catalog-tag','accent');const bank=require('../catalogs/ca/catalog.js'),byId=new Map(bank.entries.map(e=>[e.id,e]));const displayed=await p.locator('.pronunciation-row').evaluateAll(rows=>rows.map(r=>r.dataset.word));assert(displayed.every(id=>byId.get(id).basicVocabulary&&byId.get(id).tags.includes('accent')));
 const downloaded=p.waitForEvent('download');await p.click('#export-basic-text');const download=await downloaded;await download.saveAs('output/basic125.txt');assert.equal(fs.readFileSync('output/basic125.txt','utf8').trim().split('\n').length,350);
 assert.equal((await selection()).code,newCode);await p.screenshot({path:'output/catalog125-basic.png'});
 await p.locator('#catalog-dialog [data-close]').click();await p.waitForFunction(()=>!document.querySelector('#catalog-dialog').open);
 await p.route('**/analytics.js?*',r=>r.fulfill({contentType:'text/javascript',body:fakeAnalytics}));await p.addInitScript(()=>Object.defineProperty(navigator,'brave',{value:{isBrave:async()=>true}}));await p.reload();await p.waitForSelector('#sheet-preview svg');
 await p.locator('.site-footer [data-analytics-settings]').click();await p.waitForTimeout(260);await checkScroll('analytics-dialog');await p.screenshot({path:'output/privacy125-desktop.png'});
 await p.evaluate(()=>document.documentElement.dataset.theme='dark');await checkScroll('analytics-dialog');assert.equal(await p.locator('#analytics-dialog>.dialog-scroll').evaluate(el=>getComputedStyle(el).scrollbarColor),'auto');await p.waitForTimeout(350);await p.screenshot({path:'output/privacy125-dark.png',animations:'disabled'});await p.evaluate(()=>document.documentElement.dataset.theme='light');
 for(const width of [390,320]){await p.setViewportSize({width,height:844});await p.waitForTimeout(250);await checkScroll('analytics-dialog');await p.screenshot({path:'output/privacy125-'+width+'.png'});}
 await p.locator('[data-analytics-close]').click();await p.waitForFunction(()=>!document.querySelector('#analytics-dialog').open);await p.click('#help-open');await p.waitForTimeout(250);await checkScroll('help-dialog');await p.screenshot({path:'output/help125-mobile.png'});
 await p.goto('http://127.0.0.1:4176/ca/dictat/?seed='+newCode.replace('-','')+'&variety=valencia');await p.waitForSelector('#ready-panel:not([hidden])');assert.equal(await p.locator('#dictation-variety').textContent(),'Valencià');assert(!await p.locator('#start-dictation').isDisabled());
 assert.deepEqual(errors,[]);console.log('Basic filter+focus+level+required words, URL/reload/old-code recovery, full catalogue/download, both audio routes, header/help art and inset shared modal scrollbars passed.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
