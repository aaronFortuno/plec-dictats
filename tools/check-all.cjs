'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn,spawnSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');
const GROUPS={
  pure:['check.cjs','check-seeds.cjs','check-seeds-v2.cjs','check-dictation-session.cjs','check-dictation.cjs','check-catalog-browser.cjs','check-catalog-resources.cjs','check-composer-search.cjs','check-audio-varieties.cjs','check-analytics.cjs','check-dictation-analytics.cjs','check-site-links.cjs','check-local-files.cjs'],
  data:['check-catalogs.cjs','check-catalog-build-safety.cjs','check-focus-edition.cjs','check-basic-vocabulary.cjs','check-focus-sheet.cjs','check-lexicon.cjs','check-pronunciation-table.cjs','check-central-g2p.cjs','check-valencian-pilot.cjs','check-valencian-batch.cjs','check-mallorcan-g2p.cjs','check-mallorcan-pilot.cjs','check-pseudo-g2p.cjs','check-pseudo-audio.cjs','check-matxa-pilot.cjs','check-pseudo-publication.cjs','check-published-audio.cjs'],
  'audio-mock':['check-audio-tools.cjs','check-audio-retry.cjs','check-instructions.cjs','check-pronunciation-sample.cjs'],
  pdf:['check-pdf.cjs','check-seed-pdf.cjs'],
  browser:['check-basic-ui.cjs','check-interactions.cjs','check-layout-actions.cjs','check-accessibility-fixes.cjs','check-catalog-resilience.cjs','check-pseudo-ui.cjs','check-composer-lifecycle-ui.cjs'],
  compatibility:['check-catalog-audio.cjs','check-pronunciations.cjs','check-pronunciation-review.cjs']
};

// Preloaded by this runner only in test children. It does not affect npm install,
// the application or normal authoring commands. Mock fetch dependencies still work.
function installNetworkGuard(){
  const loopback=new Set(['localhost','127.0.0.1','::1','[::1]']);
  function guard(input){
    let host;
    if(typeof input==='string'||input instanceof URL)host=new URL(input).hostname;
    else if(input&&typeof input.url==='string')host=new URL(input.url).hostname;
    else host=input?.hostname||input?.host||'localhost';
    if(!loopback.has(String(host).toLowerCase()))throw Error('Quality checks forbid external network: '+host);
  }
  const realFetch=globalThis.fetch;
  globalThis.fetch=(input,...args)=>{guard(input);return realFetch(input,...args);};
  for(const protocol of ['node:http','node:https']){
    const api=require(protocol);
    for(const name of ['request','get']){const original=api[name];api[name]=function(input,...args){guard(input);return original.call(this,input,...args);};}
  }
}

function cleanEnvironment(){
  const env={...process.env};
  for(const key of Object.keys(env))if(/^(SPEECH_|AZURE_|ARM_)/i.test(key))delete env[key];
  return env;
}
function library(name){return require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,name):name);}
function validateDependencies(browser){
  const pkg=require('../package.json'),expectedNode=fs.readFileSync(path.join(ROOT,'.nvmrc'),'utf8').trim();
  if(process.versions.node!==expectedNode)throw Error('Node '+expectedNode+' required by .nvmrc; current '+process.versions.node+'. Select the pinned runtime before checking.');
  for(const name of ['pdf-lib',...(browser?['playwright']:[])]){
    let version;try{version=library(name+'/package.json').version;}catch{throw Error('Missing '+name+'. Run npm ci --ignore-scripts; see docs/DESENVOLUPAMENT.md.');}
    if(version!==pkg.devDependencies[name])throw Error(name+' version mismatch: '+version+'; expected '+pkg.devDependencies[name]+'. Run npm ci --ignore-scripts.');
  }
  console.log('Runtime: Node '+process.versions.node+'; exact development dependencies'+(process.env.PLEC_NODE_MODULES?' from explicit PLEC_NODE_MODULES.':'.'));
}
async function localServer(){
  const response=await fetch('http://127.0.0.1:4176/ca/',{signal:AbortSignal.timeout(1500)});
  if(!response.ok||(await response.text())!==fs.readFileSync(path.join(ROOT,'ca/index.html'),'utf8'))throw Error('Port 4176 is not serving this Plec workspace.');
}
async function prepareBrowser(startServer){
  let owned=null;
  try{await localServer();}
  catch(error){
    if(!startServer)throw Error('Browser checks require local Plec at http://127.0.0.1:4176/. Start node tools/serve.cjs or use --start-server. '+error.message);
    owned=spawn(process.execPath,['tools/serve.cjs'],{cwd:ROOT,env:{...cleanEnvironment(),PLEC_PORT:'4176'},stdio:['ignore','pipe','pipe'],windowsHide:true});
    let diagnostic='';owned.stderr.on('data',chunk=>{diagnostic+=chunk;});
    try{
      const deadline=Date.now()+15000;
      for(;;){
        if(owned.exitCode!==null)throw Error('Local server exited: '+diagnostic.trim());
        try{await localServer();break;}catch(error){if(Date.now()>=deadline)throw error;await new Promise(resolve=>setTimeout(resolve,150));}
      }
    }catch(error){owned.kill();throw error;}
  }
  try{
    const browser=await library('playwright').chromium.launch({channel:'chrome'});console.log('Browser: Chrome '+browser.version()+' (channel chrome).');await browser.close();
  }catch(error){if(owned)owned.kill();throw Error('Chrome could not start. Install Chrome locally; in disposable CI use npx playwright install --with-deps chrome. '+error.message);}
  return owned;
}
async function main(){
  const args=process.argv.slice(2),allowed=new Set(['--browser','--compatibility','--start-server','--list','--help']);
  if(args.some(arg=>!allowed.has(arg)))throw Error('Unknown argument. Use --help.');
  if(args.includes('--help')){
    console.log('node tools/check-all.cjs [--browser [--start-server]] [--compatibility] [--list]\nDefault: pure, data, mocked-audio and PDF checks. Browser and historical compatibility are explicit extra groups. No synthesis, no deployment check.');return;
  }
  if(args.includes('--start-server')&&!args.includes('--browser'))throw Error('--start-server requires --browser.');
  const classified=new Set(Object.values(GROUPS).flat());
  const unclassified=fs.readdirSync(path.join(ROOT,'tools')).filter(name=>/^check(?:-|\.)[^/]*\.cjs$/u.test(name)&&name!=='check-all.cjs'&&!classified.has(name));
  if(unclassified.length)throw Error('Unclassified checks: '+unclassified.join(', ')+'. Add their group to tools/check-all.cjs; no check is silently ignored.');
  const selected=['pure','data','audio-mock','pdf',...(args.includes('--browser')?['browser']:[]),...(args.includes('--compatibility')?['compatibility']:[])];
  if(!selected.includes('browser'))console.log('EXPLICITLY NOT RUN: browser (use --browser; requires local server and Chrome).');
  if(!selected.includes('compatibility'))console.log('EXPLICITLY NOT RUN: historical compatibility (use --compatibility; not a test of the current catalogue UI).');
  if(args.includes('--list')){for(const group of selected)console.log(group+': '+GROUPS[group].join(', '));return;}
  validateDependencies(selected.includes('browser'));
  let server=null,passed=0,failed=0;
  try{
    if(selected.includes('browser'))server=await prepareBrowser(args.includes('--start-server'));
    const began=Date.now();
    for(const group of selected){
      console.log('\n['+group+']');
      for(const name of GROUPS[group]){
        const started=Date.now(),file=path.join(ROOT,'tools',name);
        if(!fs.existsSync(file)){console.error('FAIL '+name+': listed check is absent.');failed++;continue;}
        const result=spawnSync(process.execPath,[file],{cwd:ROOT,env:{...cleanEnvironment(),PLEC_CHECK_CHILD:'1',NODE_OPTIONS:'--require "'+__filename.split(path.sep).join('/')+'"'},encoding:'utf8',timeout:group==='browser'?180000:120000,maxBuffer:8*1024*1024,windowsHide:true});
        if(result.status===0&&!result.error){passed++;console.log('PASS '+name+' ('+(Date.now()-started)+' ms)');}
        else{failed++;console.error('FAIL '+name+' ('+(Date.now()-started)+' ms)\n'+[result.error?.message,result.stdout,result.stderr].filter(Boolean).join('\n').slice(-12000));}
      }
    }
    console.log('\nResult: '+passed+' passed; '+failed+' failed; '+selected.join(', ')+'; '+((Date.now()-began)/1000).toFixed(1)+' s. No synthesis or remote deployment validation.');
    if(failed)process.exitCode=1;
  }finally{if(server){server.kill();await new Promise(resolve=>{if(server.exitCode!==null)resolve();else{server.once('exit',resolve);setTimeout(resolve,2000).unref();}});}}
}
if(process.env.PLEC_CHECK_CHILD==='1')installNetworkGuard();
else main().catch(error=>{console.error(error.message);process.exitCode=1;});
