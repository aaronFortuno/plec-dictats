'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'playwright'):'playwright');
// Explicit local captures only; no synthesis, uploads or baseline replacement.
const args=process.argv.slice(2),capture=args[0]==='--record',compare=args[0]==='--compare';
if(!(capture&&args.length===2||compare&&args.length===4&&args[2]==='--output'))throw Error('Ús: node tools/compare-css-layout.cjs --record output/abans | --compare output/abans --output output/despres');
const root=path.resolve(__dirname,'..'),outputRoot=path.join(root,'output')+path.sep;
function directory(value){const absolute=path.resolve(root,value);if(!absolute.startsWith(outputRoot))throw Error('Les captures han de quedar dins output/.');return absolute;}
const mode=compare?'after':'before',baselineDir=compare?directory(args[1]):null,targetDir=directory(capture?args[1]:args[3]);
if(compare&&baselineDir===targetDir)throw Error('La referència i les captures noves han de ser diferents.');
if(fs.existsSync(targetDir)&&fs.readdirSync(targetDir).length)throw Error('La carpeta no és buida. Tria un altre nom per conservar les captures existents.');
fs.mkdirSync(targetDir,{recursive:true});
const widths=[1920,1700,1440,1366,1200,1199,1024,1000,999,900,899,761,760,720,640,600,480,390,320];
const cases=[];for(const w of widths)for(const theme of ['light','dark'])cases.push({name:`main-${w}-${theme}`,width:w,height:w<500?844:800,theme,scene:'main'});
for(const [w,h] of [[1440,900],[1024,768],[390,844],[320,256]])for(const theme of ['light','dark'])for(const scene of ['config','management','catalog','help','about','privacy','quarter','print'])cases.push({name:`${scene}-${w}x${h}-${theme}`,width:w,height:h,theme,scene});
for(const [w,h] of [[1440,900],[390,844]])for(const theme of ['light','dark'])for(const scene of ['student','guide'])cases.push({name:`${scene}-${w}-${theme}`,width:w,height:h,theme,scene});
const props=('display position top right bottom left width height min-width min-height max-width max-height box-sizing overflow-x overflow-y padding-top padding-right padding-bottom padding-left margin-top margin-right margin-bottom margin-left grid-template-columns grid-template-rows grid-template-areas grid-column-start grid-column-end grid-row-start grid-row-end flex-direction flex-wrap flex-grow flex-shrink flex-basis align-items align-self justify-content justify-items justify-self gap row-gap column-gap font-family font-size font-weight line-height letter-spacing color background-color background-image background-size border-top-width border-right-width border-bottom-width border-left-width border-top-style border-radius border-color box-shadow opacity visibility transform transform-origin z-index white-space word-break touch-action scrollbar-gutter animation-name transition-property transition-duration transition-timing-function').split(' ');
(async()=>{const browser=await chromium.launch({channel:'chrome'});const manifest=[];let failures=0;try{for(const c of cases){
  const context=await browser.newContext({viewport:{width:c.width,height:c.height},colorScheme:c.theme,reducedMotion:'reduce'}),p=await context.newPage(),errors=[];p.setDefaultTimeout(12000);p.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(theme=>{localStorage.clear();localStorage.setItem('plec-appearance-v1',theme);},c.theme);await p.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 const url=c.scene==='student'?'/ca/dictat/?seed=ADZ52356A':c.scene==='guide'?'/ca/pronunciacio/':'/ca/?seed=ADZ52356A';await p.goto('http://127.0.0.1:4176'+url);
 if(c.scene==='student')await p.waitForSelector('#ready-panel:not([hidden])');else if(c.scene!=='guide')await p.waitForSelector('#sheet-preview svg');await p.evaluate(()=>document.fonts.ready);
 const drawers=c.width<1200;
 if(['config','management','quarter'].includes(c.scene)&&drawers)await p.locator(c.scene==='management'?'#workspace-toggle-management':'#workspace-toggle-config').click();
 if(c.scene==='quarter')await p.selectOption('#fold-style-control','quarter');
 if(c.scene==='catalog'){await p.click('#catalog-open');await p.waitForSelector('.pronunciation-row');await p.waitForFunction(()=>[...document.querySelectorAll('.ipa-text')].every(e=>e.textContent!=='Carregant…'));}
 if(c.scene==='help')await p.click('#help-open');if(c.scene==='about')await p.click('#about-open');if(c.scene==='privacy')await p.locator('.site-footer [data-analytics-settings]').click();
 if(c.scene==='print')await p.emulateMedia({media:'print'});await p.waitForTimeout(50);
 const snap=await p.evaluate(props=>[...document.querySelectorAll('body,body *')].filter(e=>!['SCRIPT','STYLE','OPTION'].includes(e.tagName)).map((e,index)=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {index,tag:e.tagName,id:e.id||'',class:e.getAttribute('class')||'',rect:[r.x,r.y,r.width,r.height].map(n=>Math.round(n*64)/64),css:Object.fromEntries(props.map(k=>[k,s.getPropertyValue(k)]))};}),props);
 const image=await p.screenshot({path:path.join(targetDir,c.name+'.png'),animations:'disabled',caret:'hide'});const hash=crypto.createHash('sha256').update(image).digest('hex');fs.writeFileSync(path.join(targetDir,c.name+'.json'),JSON.stringify(snap));
 if(mode==='after'){const original=JSON.parse(fs.readFileSync(path.join(baselineDir,c.name+'.json'),'utf8')),diff=[];for(let i=0;i<Math.max(original.length,snap.length);i++){const a=original[i],b=snap[i];if(JSON.stringify(a)!==JSON.stringify(b)){const keys=a&&b?Object.keys(b.css).filter(k=>a.css[k]!==b.css[k]):['node'];diff.push({index:i,id:b?.id,tag:b?.tag,class:b?.class,rect:a&&b&&JSON.stringify(a.rect)!==JSON.stringify(b.rect)?[a.rect,b.rect]:null,changes:keys.map(k=>[k,a?.css[k],b?.css[k]])});}}if(diff.length){failures++;fs.writeFileSync(path.join(targetDir,c.name+'-diff.json'),JSON.stringify(diff,null,2));console.log(c.name,JSON.stringify(diff.slice(0,4)));}}
 assert.deepEqual(errors,[]);manifest.push({...c,hash,elements:snap.length});await context.close();if(manifest.length%20===0)console.log(mode,manifest.length+'/'+cases.length);
 }}finally{await browser.close();}fs.writeFileSync(path.join(targetDir,'manifest.json'),JSON.stringify(manifest,null,2));console.log(JSON.stringify({mode,cases:cases.length,computedFailures:failures}));if(failures)process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1;});
