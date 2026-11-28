'use strict';
// Offline word timing with the local Catalan or Spanish Vosk model. No cloud calls.
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {createHash}=require('node:crypto');
let playwright;try{playwright=require('playwright');}catch{playwright=require('C:/Users/afortun8/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');}
const {chromium}=playwright;
async function recognize(file,output,language='ca'){
  if(!['ca','es'].includes(language))throw Error('Unsupported alignment language');
  const name=language==='es'?'vosk-model-small-es-0.42':'vosk-model-small-ca-0.4';
  const sha256=createHash('sha256').update(await fs.readFile(file)).digest('hex');
  const cached=await fs.readFile(output,'utf8').then(JSON.parse).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
  if(cached?.sha256===sha256&&cached.language===language&&cached.model===name)return cached;
  const resources=process.env.VOSK_ASSETS_PATH??path.resolve(__dirname,'../../lectura-en-veu-alta/vendor');
  const modelFile=language==='es'?path.resolve(__dirname,'../tmp/vosk-es/vosk-model-small-es-0.42.tar.gz'):path.join(resources,name+'.tar.gz');
  const modelSha256=createHash('sha256').update(await fs.readFile(modelFile)).digest('hex');
  const files={'/raw.wav':file,'/engine.js':path.join(resources,'vosk.js'),'/model.tar.gz':modelFile};
  const server=http.createServer(async(req,res)=>{
    try{
      if(req.url==='/')return res.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><title>Revisió local</title><script src="/engine.js"></script>');
      const target=files[req.url];if(!target)throw Error('Not found');
      res.writeHead(200,{'Content-Type':req.url.endsWith('.js')?'text/javascript':req.url.endsWith('.wav')?'audio/wav':'application/gzip'}).end(await fs.readFile(target));
    }catch{res.writeHead(404).end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    const base='http://127.0.0.1:'+server.address().port;
    browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();
    await page.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
    await page.goto(base);await page.waitForFunction(()=>Boolean(window.Vosk));
    const result=await page.evaluate(async()=>{
      const model=new Vosk.Model(location.origin+'/model.tar.gz',-1);
      await new Promise((resolve,reject)=>{model.on('load',message=>message.result?resolve():reject(Error('Model unavailable')));model.on('error',reject);});
      const context=new OfflineAudioContext(1,16000,16000);
      const buffer=await context.decodeAudioData(await(await fetch('/raw.wav')).arrayBuffer());
      const samples=buffer.getChannelData(0);const rec=new model.KaldiRecognizer(16000);rec.setWords(true);
      try{
        return await new Promise((resolve,reject)=>{
          const words=[],text=[];let offset=0,flushing=false,timer;
          const send=()=>{clearTimeout(timer);timer=setTimeout(()=>reject(Error('Vosk timeout')),45000);if(offset===samples.length){flushing=true;rec.retrieveFinalResult();}else{const chunk=samples.subarray(offset,offset+4096);offset+=chunk.length;rec.acceptWaveformFloat(chunk,16000);}};
          const receive=({result,event})=>{if(event==='result'){if(result.text)text.push(result.text);words.push(...(result.result??[]));}if(flushing){clearTimeout(timer);resolve({duration:buffer.duration,sampleRate:buffer.sampleRate,text:text.join(' '),words});}else send();};
          rec.on('result',receive);rec.on('partialresult',receive);rec.on('error',reject);send();
        });
      }finally{rec.remove();model.terminate();}
    });
    const report={sha256,model:name,language,modelSha256,...result};
    if(!report.words.length)throw Error('No s’han obtingut marques de temps locals.');
    await fs.writeFile(output,JSON.stringify(report,null,2)+'\n');return report;
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
}
if(require.main===module)recognize(path.resolve(process.argv[2]),path.resolve(process.argv[3]),process.argv[4]||'ca').then(result=>console.log(JSON.stringify({duration:result.duration,words:result.words.length,localOnly:true}))).catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={recognize};
