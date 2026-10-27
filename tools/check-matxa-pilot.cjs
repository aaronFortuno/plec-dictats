'use strict';
// No inference, model download, or credentials. Optional local WAV integrity only.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {ROOT,SOURCE,plan}=require('./prepare-matxa-pilot.cjs');
const slowTools=require('./prepare-matxa-slow-comparison.cjs');
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
const slow=plan('slow');assert.equal(slow.settings.lengthScale,1.25);assert.notEqual(slow.id,p.id);assert.deepEqual({...slow.settings,lengthScale:1},p.settings);assert.deepEqual(slow.entries,p.entries);assert.deepEqual(slow.model,p.model);assert.throws(()=>plan('unknown'));
// A tiny non-silent PCM fixture proves padding inserts zeros without deleting,
// attenuating or moving any original speech samples relative to each other.
const fixture=Buffer.alloc(50);fixture.write('RIFF');fixture.writeUInt32LE(42,4);fixture.write('WAVEfmt ',8);fixture.writeUInt32LE(16,16);fixture.writeUInt16LE(1,20);fixture.writeUInt16LE(1,22);fixture.writeUInt32LE(22050,24);fixture.writeUInt32LE(44100,28);fixture.writeUInt16LE(2,32);fixture.writeUInt16LE(16,34);fixture.write('data',36);fixture.writeUInt32LE(6,40);fixture.writeInt16LE(1234,44);fixture.writeInt16LE(-4321,46);fixture.writeInt16LE(99,48);
const padded=slowTools.prependSilence(fixture);assert.equal(padded.leadingSamples,5513);assert(slowTools.pcm(padded.buffer).data.subarray(0,11026).every(byte=>byte===0));assert.deepEqual(slowTools.pcm(padded.buffer).data.subarray(11026),slowTools.pcm(fixture).data);assert.deepEqual(slowTools.pcm(slowTools.prependSilence(fixture,0).buffer).data,slowTools.pcm(fixture).data);assert.throws(()=>slowTools.prependSilence(fixture,-1));assert.throws(()=>slowTools.pcm(fixture.subarray(0,45)));const stereo=Buffer.from(fixture);stereo.writeUInt16LE(2,22);assert.throws(()=>slowTools.pcm(stereo));
const slowResult=JSON.parse(fs.readFileSync(path.join(ROOT,slowTools.RECORD),'utf8'));assert.equal(slowResult.publicAudio,false);assert.equal(slowResult.azureRequests,0);assert.equal(slowResult.listeningReview,'pending');assert.deepEqual(slowResult.settings,slow.settings);assert.equal(slowResult.files.length,36);assert.equal(slowResult.padding.length,72);
for(const f of slowResult.files){assert(slow.entries.some(e=>e.id===f.id&&e.text===f.text));assert.equal(f.localPath,'output/audio/matxa-v2-balear-slow-pilot/'+f.voice.toLowerCase()+'/'+f.text+'.wav');assert(slow.voices.some(v=>v.speakerId===f.speakerId&&v.name===f.voice));}
if(process.argv.includes('--local-audio')){
 const result=JSON.parse(fs.readFileSync(path.join(ROOT,'output/audio/matxa-v2-balear-pilot/results.json'),'utf8'));
 assert.equal(result.files.length,36);assert.equal(new Set(result.files.map(f=>f.voice+':'+f.id)).size,36);
 for(const f of result.files){const file=path.resolve(ROOT,f.localPath);assert(file.startsWith(path.join(ROOT,'output','audio','matxa-v2-balear-pilot')+path.sep));const bytes=fs.readFileSync(file);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');assert.equal(bytes.readUInt16LE(22),1);assert.equal(bytes.readUInt32LE(24),22050);assert.equal(bytes.readUInt16LE(34),16);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),f.sha256);assert(f.duration>.12&&f.duration<15);assert(Number.isFinite(f.modelPeak));}
 console.log('Local Matxa audition: 36 WAVs, two voices, SHA-256, PCM16 mono 22050Hz and duration passed; pronunciation not evaluated.');
 const comparison=slowTools.prepare();for(const d of comparison.padding){const bytes=fs.readFileSync(path.join(ROOT,d.path)),original=slowTools.pcm(fs.readFileSync(path.join(ROOT,d.source))).data;assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),d.sha256);const data=slowTools.pcm(bytes).data;assert(data.subarray(0,d.leadingSamples*2).every(byte=>byte===0));assert.deepEqual(data.subarray(d.leadingSamples*2),original);}
 console.log('Slow audition: 36 fresh WAVs and 72 padded copies preserve the original PCM exactly; no inference.');
}
console.log('Matxa plan: frozen 18-word identity, grapheme input, V2 speaker IDs, CPU settings, provenance and non-public audition license passed; no inference.');
