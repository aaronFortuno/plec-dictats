'use strict';
// Assemble existing local WAVs and add silence; never invokes inference or Azure.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{isDeepStrictEqual}=require('node:util');
const {ROOT,DIRECTORIES,plan}=require('./prepare-matxa-pilot.cjs'),{escapeXml:esc}=require('./audio-plan.cjs');
const PAGE='output/audio/comparacio-matxa-lenta.html';
const RECORD='audio/pronunciation/recordings/ca-mallorcan-palma-matxa-v2-slow-pilot-v1-result.json';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(path.join(ROOT,file),'utf8'));
function pcm(buffer){
 if(buffer.length<44||buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WAVE'||buffer.readUInt32LE(4)+8!==buffer.length)throw Error('WAV incomplet.');
 let format,data;
 for(let offset=12;offset+8<=buffer.length;){const id=buffer.toString('ascii',offset,offset+4),length=buffer.readUInt32LE(offset+4),start=offset+8;if(start+length>buffer.length)throw Error('Bloc WAV truncat.');if(id==='fmt '){if(length<16)throw Error('Format WAV truncat.');format={encoding:buffer.readUInt16LE(start),channels:buffer.readUInt16LE(start+2),sampleRate:buffer.readUInt32LE(start+4),bits:buffer.readUInt16LE(start+14)};}if(id==='data'){if(data)throw Error('Més d’un bloc PCM.');data=buffer.subarray(start,start+length);}offset=start+length+(length%2);}
 if(!format||format.encoding!==1||format.channels!==1||format.sampleRate!==22050||format.bits!==16||!data?.length||data.length%2)throw Error('Cal PCM16 mono 22050 Hz.');
 return {...format,data,duration:data.length/2/format.sampleRate};
}
function prependSilence(buffer,milliseconds=250){
 if(!Number.isFinite(milliseconds)||milliseconds<0||milliseconds>1000)throw Error('Silenci fora de límits.');
 const input=pcm(buffer),samples=Math.round(input.sampleRate*milliseconds/1000),data=Buffer.concat([Buffer.alloc(samples*2),input.data]),output=Buffer.alloc(44+data.length);
 output.write('RIFF');output.writeUInt32LE(output.length-8,4);output.write('WAVE',8);output.write('fmt ',12);output.writeUInt32LE(16,16);output.writeUInt16LE(1,20);output.writeUInt16LE(1,22);output.writeUInt32LE(22050,24);output.writeUInt32LE(44100,28);output.writeUInt16LE(2,32);output.writeUInt16LE(16,34);output.write('data',36);output.writeUInt32LE(data.length,40);data.copy(output,44);
 return {buffer:output,leadingSamples:samples,leadingSeconds:samples/22050};
}
function corpus(variant){
 const directory=DIRECTORIES[variant],expected=plan(variant),saved=read(directory+'/plan.json'),identity=read(directory+'/identity.json'),result=read(directory+'/results.json'),status=read(directory+'/status.json');
 if(!isDeepStrictEqual(saved,expected)||!isDeepStrictEqual(identity.plan,expected)||identity.fingerprint!==result.fingerprint||status.phase!=='completed'||status.completed!==36||result.files.length!==36||new Set(result.files.map(f=>f.speakerId+':'+f.id)).size!==36)throw Error('Identitat o lot incomplet: '+variant);
 const files=expected.voices.flatMap(v=>expected.entries.map(e=>{
  const file=result.files.find(f=>f.speakerId===v.speakerId&&f.id===e.id),relative=directory+'/'+v.name.toLowerCase()+'/'+e.text+'.wav';
  if(!file||file.voice!==v.name||file.text!==e.text||file.inputText!==e.text||file.localPath!==relative)throw Error('Mot o veu incompatible.');
  const bytes=fs.readFileSync(path.join(ROOT,relative)),audio=pcm(bytes);if(digest(bytes)!==file.sha256||Math.abs(audio.duration-file.duration)>1e-8)throw Error('Àudio canviat.');
  return {...file,bytesBuffer:bytes};
 }));
 return {variant,plan:expected,fingerprint:result.fingerprint,files};
}
function prepare({write=false,record=false}={}){
 if(record&&!write)throw Error('Cal --write per desar el resultat.');
 const corpora=['original','slow'].map(corpus),derived=[],rows=plan().entries.map(entry=>{
  const cells=[0,1].flatMap(speakerId=>corpora.map(c=>{
   const f=c.files.find(f=>f.id===entry.id&&f.speakerId===speakerId),padding=prependSilence(f.bytesBuffer),relative=f.localPath.replace('/'+entry.text+'.wav','/'+entry.text+'-lead250.wav');
   derived.push({variant:c.variant,id:f.id,text:f.text,speakerId,source:f.localPath,sourceSha256:f.sha256,path:relative,sha256:digest(padding.buffer),leadingSamples:padding.leadingSamples,leadingSeconds:padding.leadingSeconds,buffer:padding.buffer});
   const url=rel=>rel.slice('output/audio/'.length).split('/').map(encodeURIComponent).join('/');
   return '<td><audio controls preload="none" aria-label="'+esc(entry.text+' · veu '+speakerId+' · '+(c.variant==='slow'?'lent':'original'))+'" data-original="'+url(f.localPath)+'" data-padded="'+url(relative)+'" src="'+url(f.localPath)+'"></audio><small>'+f.duration.toFixed(3)+' s</small></td>';
  }));return '<tr><th scope="row">'+esc(entry.text)+'</th>'+cells.join('')+'</tr>';
 });
 const totals=corpora.map(c=>({variant:c.variant,scale:c.plan.settings.lengthScale,seconds:c.files.reduce((s,f)=>s+f.duration,0)}));
 const html=`<!doctype html><html lang="ca"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Plec · Matxa, prova més lenta</title><style>:root{color-scheme:light dark;font:16px/1.6 system-ui}body{max-width:1250px;margin:28px auto;padding:0 18px}p{max-width:1000px}h1{font-size:28px}.controls{position:sticky;top:0;background:Canvas;padding:14px 0;z-index:1;border-block:1px solid #8885}label{display:inline-flex;align-items:center;gap:8px;margin-right:20px}input{width:18px;height:18px}button{font:inherit;padding:7px 12px}table{width:100%;min-width:1050px;border-collapse:collapse}th,td{padding:12px 8px;border-bottom:1px solid #8885;text-align:left;vertical-align:top}thead th{text-align:center}tbody th{min-width:120px}audio{width:100%;min-width:190px}small{display:block;color:GrayText}.scroll{overflow:auto}</style><h1>Matxa · original i nova síntesi més lenta</h1><p>Els mateixos 18 mots amb les veus 0 i 1. La nova síntesi fa servir una escala de durada d’1,25 (aproximadament un 20 % més lenta), mantenint model, grafia, temperatura i veus. No s’ha alentit l’enregistrament original: és una altra generació, de manera que el resultat també pot variar entre intents. La qualitat fonètica continua pendent de revisió; contrast nadiu ajornat.</p><p>Activa el silenci inicial per comparar si l’arrencada del reproductor fa menys perceptible el primer so. Afegeix uns 250 ms a cada àudio, conservant exactament les mostres de veu. No pot recuperar un fonema que el model no hagi generat. Les durades indicades són les de la veu, sense aquest silenci. Els noms Olga/Quim continuen pendents de confirmar: identifiquem les columnes pels IDs reals.</p><p>Prova local, sense quota Azure. <a href="comparacio-matxa-azure.html">Comparativa anterior amb Azure</a> · <a href="https://huggingface.co/BSC-LT/matxa-tts-v2-ca-multiaccent-graphemes">Model i condicions d’ús no comercial</a>.</p><div class="controls"><label><input type="checkbox" id="onset-padding">Silenci inicial · 250 ms</label><button type="button" id="pause-all">Atura la reproducció</button><span id="status" role="status"></span></div><div class="scroll"><table><thead><tr><th rowspan="2">Mot</th><th colspan="2">Veu 0</th><th colspan="2">Veu 1</th></tr><tr><th>Original</th><th>Nova · més lenta</th><th>Original</th><th>Nova · més lenta</th></tr></thead><tbody>${rows.join('')}</tbody></table></div><script>const players=[...document.querySelectorAll('audio')];function pauseAll(except){players.forEach(a=>{if(a!==except)a.pause();});}document.addEventListener('play',e=>{if(e.target.tagName==='AUDIO')pauseAll(e.target);},true);document.getElementById('pause-all').onclick=()=>pauseAll();document.getElementById('onset-padding').onchange=e=>{pauseAll();players.forEach(a=>{a.src=e.target.checked?a.dataset.padded:a.dataset.original;});document.getElementById('status').textContent=e.target.checked?'Amb silenci inicial':'Sense silenci inicial';};</script></html>`;
 const clean=({bytesBuffer,...file})=>file,summary={schemaVersion:1,kind:'local-matxa-slower-and-onset-audition',date:new Date().toISOString().slice(0,10),id:corpora[1].plan.id,model:corpora[1].plan.model,source:corpora[1].plan.source,sourceSha256:corpora[1].plan.sourceSha256,settings:corpora[1].plan.settings,words:18,voices:corpora[1].plan.voices,listeningReview:'pending',publicAudio:false,azureRequests:0,comparison:{original:totals[0],slow:totals[1],durationRatio:totals[1].seconds/totals[0].seconds,randomness:'Fresh synthesis; duration scale is not the only source of variation.'},files:corpora[1].files.map(clean),padding:derived.map(({buffer,...f})=>f)};
 if(write){
  for(const d of derived){const file=path.join(ROOT,d.path);if(fs.existsSync(file)&&!fs.readFileSync(file).equals(d.buffer))throw Error('Derivat existent incompatible.');}
  for(const d of derived)fs.writeFileSync(path.join(ROOT,d.path),d.buffer);
  fs.writeFileSync(path.join(ROOT,PAGE),html);fs.writeFileSync(path.join(ROOT,'output/audio/matxa-slow-comparison-result.json'),JSON.stringify(summary,null,2)+'\n');
  if(record)fs.writeFileSync(path.join(ROOT,RECORD),JSON.stringify(summary,null,2)+'\n');
 }
 return summary;
}
if(require.main===module){try{const args=process.argv.slice(2);if(args.some(a=>!['--write','--record'].includes(a)))throw Error('Ús: node tools/prepare-matxa-slow-comparison.cjs [--write --record]');const s=prepare({write:args.includes('--write'),record:args.includes('--record')});console.log(JSON.stringify({words:s.words,newWavs:s.files.length,paddedCopies:s.padding.length,comparison:s.comparison,page:PAGE,synthesis:false}));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={PAGE,RECORD,pcm,prependSilence,corpus,prepare};
