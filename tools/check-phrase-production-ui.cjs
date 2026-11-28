'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),T=require('../text-dictations.js'),queue=require('../audio/texts/batches/ca007-es012-production-v1.json');
const {chromium}=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'playwright'):'playwright');
(async()=>{const browser=await chromium.launch({channel:'chrome'});try{
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4176'?route.continue():route.abort());
 let recordings=0;
 for(const item of queue.batches){const entry=T.find(item.entryId,item.language);if(!entry.audio)continue;
  await page.goto('http://127.0.0.1:4176/'+entry.language+'/?text='+entry.code);await page.waitForSelector('#text-download:not([disabled])');assert.equal(await page.locator('#text-code').textContent(),entry.code);assert(await page.locator('#text-open-student').isEnabled());
  assert((await page.locator('#text-audio-note').textContent()).includes(entry.language==='es'?'España':'central'));
  await page.click('#prosody-open');await page.waitForSelector('#prosody-dialog[open]');assert.equal(await page.locator('#prosody-dialog audio').count(),4);
  for(const [id,v]of Object.entries(entry.audio.variants)){const player=page.locator('#prosody-audio-'+id);await player.evaluate(el=>new Promise((resolve,reject)=>{if(el.readyState>=1)return resolve();el.addEventListener('loadedmetadata',resolve,{once:true});el.addEventListener('error',()=>reject(Error('MP3 unavailable')),{once:true});el.load();}));assert(Math.abs(await player.evaluate(el=>el.duration)-v.seconds)<.2);assert(new URL(await player.getAttribute('src'),page.url()).pathname.endsWith('/'+v.path));recordings++;}
  await page.goto('http://127.0.0.1:4176/'+entry.language+'/dictat/?text='+entry.code);await page.waitForFunction(code=>document.getElementById('tx-summary').textContent.startsWith(code),entry.code);assert(await page.locator('#tx-start').isEnabled());assert((await page.locator('#tx-ready .tx-pilot').textContent()).includes(entry.language==='es'?'España':'central'));
  if(entry.language==='es'){assert.equal(await page.locator('#tx-start').textContent(),'Comenzar a pantalla completa');assert((await page.locator('#tx-ready-controls').textContent()).includes('Palabras'));assert((await page.locator('#tx-ready-controls').textContent()).includes('Velocidad'));}
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({publishedPilotTexts:recordings/4,realMp3MetadataLoads:recordings,localBrowser:true,newSynthesisRequests:0,remoteDeploymentChecked:false}));
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
