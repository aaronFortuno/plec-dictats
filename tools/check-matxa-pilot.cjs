'use strict';
// No inference, model download, or credentials. Optional local WAV integrity only.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {ROOT,SOURCE,plan}=require('./prepare-matxa-pilot.cjs');
const p=plan(),source=JSON.parse(fs.readFileSync(path.join(ROOT,SOURCE),'utf8'));
assert.deepEqual(p.entries.map(e=>[e.id,e.text,e.azureComparisonIpa]),source.entries.map(e=>[e.id,e.text,e.ipa]));
assert.equal(p.entries.length,18);assert(p.entries.every(e=>e.inputText===e.text),'Matxa v2 receives graphemes, not the Azure IPA');
assert.deepEqual(p.voices,[{name:'Olga',speakerId:0},{name:'Quim',speakerId:1}],'V2 speaker IDs differ from V1');
assert.equal(p.settings.device,'CPU');assert.equal(p.settings.sampleRate,22050);assert.equal(p.settings.lengthScale,1);assert.equal(p.settings.odeSteps,20);
assert.equal(p.model.bytes,272805633);assert(/^[a-f0-9]{64}$/.test(p.model.sha256));assert(/^[a-f0-9]{64}$/.test(p.model.symbolsSha256));
assert.equal(p.license.publicAudio,false);assert.equal(p.license.use,'local-non-commercial-audition-only');assert.equal(p.listeningReview,'pending');
assert.equal(p.sourceSha256,crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,SOURCE))).digest('hex'));
const published=JSON.parse(fs.readFileSync(path.join(ROOT,'audio/pronunciation/recordings/ca-mallorcan-palma-matxa-pilot-v1-result.json'),'utf8'));
assert.equal(published.files.length,36);assert.equal(published.publicAudio,false);
for(const f of published.files){const entry=p.entries.find(e=>e.id===f.id);assert(entry);assert.equal(f.text,entry.text);assert.equal(f.inputText,entry.inputText);assert.equal(f.localPath,'output/audio/matxa-v2-balear-pilot/'+f.voice.toLowerCase()+'/'+f.text+'.wav');assert(p.voices.some(v=>v.name===f.voice));}
if(process.argv.includes('--local-audio')){
 const result=JSON.parse(fs.readFileSync(path.join(ROOT,'output/audio/matxa-v2-balear-pilot/results.json'),'utf8'));
 assert.equal(result.files.length,36);assert.equal(new Set(result.files.map(f=>f.voice+':'+f.id)).size,36);
 for(const f of result.files){const file=path.resolve(ROOT,f.localPath);assert(file.startsWith(path.join(ROOT,'output','audio','matxa-v2-balear-pilot')+path.sep));const bytes=fs.readFileSync(file);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');assert.equal(bytes.readUInt16LE(22),1);assert.equal(bytes.readUInt32LE(24),22050);assert.equal(bytes.readUInt16LE(34),16);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),f.sha256);assert(f.duration>.12&&f.duration<15);assert(Number.isFinite(f.modelPeak));}
 console.log('Local Matxa audition: 36 WAVs, two voices, SHA-256, PCM16 mono 22050Hz and duration passed; pronunciation not evaluated.');
}
console.log('Matxa plan: frozen 18-word identity, grapheme input, V2 speaker IDs, CPU settings, provenance and non-public audition license passed; no inference.');
