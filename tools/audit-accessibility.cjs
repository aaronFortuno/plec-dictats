'use strict';
// Local audit evidence, not a WCAG conformance check. Audio and analytics are simulated.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'playwright'):'playwright');
const BASE='http://127.0.0.1:4176',results={date:'2026-10-26',method:'Chrome local, keyboard, DOM and computed styles; no screen reader or compliance certification',checks:[]};
function record(name,data){results.checks.push({name,...(Array.isArray(data)?{samples:data}:data)});}
(async()=>{const b=await chromium.launch({channel:'chrome'});try{
 const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/analytics.js?*',r=>r.fulfill({contentType:'application/javascript',body:'window.PlecAnalytics={track(){},getState(){return {status:"disabled",reason:"local"}},subscribe(f){f(this.getState());return ()=>{}},reportState:()=>"idle",reportAudio:async()=>false,refresh(){return this.getState()},disable(){},allowTemporarily:async()=>{}};'}));
 await p.goto(BASE+'/ca/');await p.waitForSelector('#sheet-preview svg');
 record('page semantics',await p.evaluate(()=>({lang:document.documentElement.lang,title:document.title,main:document.querySelectorAll('main').length,headings:[...document.querySelectorAll('h1')].map(e=>({label:e.getAttribute('aria-label'),text:e.textContent})),skip:!!document.querySelector('a.skip[href="#composer"]')})));
 await p.keyboard.press('Tab');record('first keyboard stop',{active:await p.evaluate(()=>document.activeElement.outerHTML.slice(0,170))});
 await p.locator('#help-open').focus();await p.keyboard.press('Enter');await p.waitForTimeout(240);
 const modalFocus=await p.evaluate(()=>({id:document.activeElement.id,inside:document.querySelector('#help-dialog').contains(document.activeElement)}));
 await p.keyboard.press('Escape');await p.waitForTimeout(240);record('native help dialog keyboard',{onOpen:modalFocus,closed:!await p.locator('#help-dialog').evaluate(e=>e.open),restored:await p.evaluate(()=>document.activeElement.id)});
 await p.setViewportSize({width:390,height:844});await p.locator('#workspace-toggle-config').focus();await p.keyboard.press('Enter');
 await p.waitForTimeout(240);const drawer=[];for(let i=0;i<75;i++){drawer.push(await p.evaluate(()=>({id:document.activeElement.id,inside:document.querySelector('.config').contains(document.activeElement)})));await p.keyboard.press('Tab');}
 await p.keyboard.press('Escape');record('drawer keyboard cycle',{stops:drawer.length,escaped:drawer.filter(x=>!x.inside),restored:await p.evaluate(()=>document.activeElement.id)});
 await p.locator('#catalog-open').click();await p.waitForSelector('.pronunciation-row');await p.waitForTimeout(240);
 record('catalogue names and sizes',await p.evaluate(()=>({
  unnamedButtons:[...document.querySelectorAll('#catalog-dialog button')].filter(e=>!e.hidden&&!e.disabled&&e.getClientRects().length&&!((e.getAttribute('aria-label')||e.textContent||e.getAttribute('title')||'').trim())).map(e=>e.outerHTML.slice(0,180)),
  firstRow:[...document.querySelector('.pronunciation-row').querySelectorAll('button')].map(e=>({name:e.getAttribute('aria-label'),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})),
  alphabet:[...document.querySelectorAll('[data-initial]')].slice(0,4).map(e=>({text:e.textContent,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})),
  scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth
 })));
 await p.locator('#catalog-dialog [data-close]').click();await p.waitForTimeout(240);
 for(const height of [720,256]){await p.setViewportSize({width:320,height});await p.waitForTimeout(240);record('reflow '+height,await p.evaluate(()=>{const r=e=>{const q=e.getBoundingClientRect();return {top:q.top,bottom:q.bottom,width:q.width,height:q.height};};return{viewport:{width:innerWidth,height:innerHeight},bodyScroll:document.documentElement.scrollWidth,header:r(document.querySelector('.site-header')),footer:r(document.querySelector('.site-footer')),workspace:r(document.querySelector('.seed-workspace')),toolbar:r(document.querySelector('.workspace-toolbar'))};}));}
 await p.setViewportSize({width:1440,height:900});
 for(const theme of ['light','dark']){
  await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);await p.waitForTimeout(240);
  record('computed text colors '+theme,await p.evaluate(()=>['.header-caption','.site-footer','.field-label','.catalog-report-help','.required-heading','#download-pdf','#open-student'].flatMap(selector=>{const e=document.querySelector(selector);if(!e)return[];const s=getComputedStyle(e);let back=e,bg='';while(back){const c=getComputedStyle(back).backgroundColor;if(!/rgba\([^)]*,\s*0\)$/.test(c)&&c!=='transparent'){bg=c;break;}back=back.parentElement;}return[{selector,color:s.color,background:bg,font:s.fontSize,weight:s.fontWeight}];})));
 }
 await p.emulateMedia({reducedMotion:'reduce'});record('reduced motion',await p.evaluate(()=>({requested:matchMedia('(prefers-reduced-motion:reduce)').matches,duration:getComputedStyle(document.documentElement).getPropertyValue('--motion-duration'),controller:window.PlecMotion.duration})));
 await p.addInitScript(()=>{HTMLElement.prototype.requestFullscreen=()=>Promise.reject(Error('Windowed audit'));window.Audio=class{constructor(url){this.url=url;}play(){setTimeout(()=>this.onended?.(),150);return Promise.resolve();}pause(){}removeAttribute(){}};});
 await p.goto(BASE+'/ca/dictat/?seed=ADZ52356A');await p.waitForSelector('#ready-panel:not([hidden])');await p.click('#start-dictation');await p.click('#windowed-start');
 const audioFocus=[];for(let i=0;i<3;i++){await p.locator('#listen-word').focus();await p.keyboard.press('Enter');await p.waitForTimeout(190);audioFocus.push(await p.evaluate(()=>({id:document.activeElement.id,tag:document.activeElement.tagName,hidden:document.activeElement.hidden})));}
 await p.keyboard.press('Enter');await p.waitForTimeout(30);record('student keyboard progression',{afterPlays:audioFocus,afterNext:await p.evaluate(()=>({id:document.activeElement.id,tag:document.activeElement.tagName,progress:document.querySelector('#word-progress').textContent,live:document.querySelector('#word-progress').getAttribute('aria-live')}))});
 record('page errors',{errors});
 fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/audit-a11y-2026-10.json',JSON.stringify(results,null,2)+'\n');console.log('Local audit evidence: '+results.checks.length+' measurements written to output/audit-a11y-2026-10.json. No compliance score; consult docs/AUDITORIA-ACCESSIBILITAT-2026-10.md.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
