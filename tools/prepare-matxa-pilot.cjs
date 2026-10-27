'use strict';
// Offline plan for one authorized 18-word audition; no model download or inference.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const SOURCE='audio/pronunciation/recordings/ca-mallorcan-palma-pilot-v1.json';
const MODEL={repository:'BSC-LT/matxa-tts-v2-ca-multiaccent-graphemes',revision:'00f32fa221aef52e0146422935bf87fc7d71db6f',file:'matxa_v2_multiaccent_graphemes_20_steps_wavenext.onnx',bytes:272805633,sha256:'4c19bfd51665e39f75d6fe69c61127bf06cfb53a501f14ccd348084d0dfa46ae',localPath:'tmp/matxa-model/model.onnx',codeRevision:'2e15c908f0acce72d4a8f0c0f8627c54fbe62fb2',symbolsSha256:'70ea183ad85240ffb5fbe6ee25f84dcb52979ef7055c675d386fc00f679a9c97'};
function plan(){
 const raw=fs.readFileSync(path.join(ROOT,SOURCE),'utf8'),source=JSON.parse(raw);
 if(source.entries.length!==18||new Set(source.entries.map(e=>e.id)).size!==18)throw Error('Expected the original 18 unique pilot words.');
 return {schemaVersion:1,id:'ca-mallorcan-palma-matxa-v2-pilot-v1',source:SOURCE,sourceSha256:crypto.createHash('sha256').update(raw).digest('hex'),language:'ca',provider:'BSC-LT/Matxa',model:MODEL,input:'graphemes-basic-cleaners',reference:'Veus etiquetades balears pel proveïdor; la procedència concreta de Palma no està verificada.',voices:[{name:'Olga',speakerId:0},{name:'Quim',speakerId:1}],settings:{sampleRate:22050,temperature:0.667,lengthScale:1.0,odeSteps:20,threads:4,device:'CPU'},license:{id:'custom-ro-nc-openrail-m',source:'https://huggingface.co/BSC-LT/matxa-tts-v2-ca-multiaccent-graphemes/blob/main/LICENSE.md',use:'local-non-commercial-audition-only',publicAudio:false},entries:source.entries.map(e=>({id:e.id,text:e.text,inputText:e.text,azureComparisonIpa:e.ipa})),listeningReview:'pending'};
}
if(require.main===module){try{const args=process.argv.slice(2);if(args.some(a=>a!=='--write'))throw Error('Usage: node tools/prepare-matxa-pilot.cjs [--write]');const data=plan();if(args.includes('--write')){const dir=path.join(ROOT,'output/audio/matxa-v2-balear-pilot');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'plan.json'),JSON.stringify(data,null,2)+'\n');}console.log(JSON.stringify({network:false,inference:false,words:data.entries.length,voices:data.voices,files:data.entries.length*data.voices.length,modelBytes:MODEL.bytes}));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={ROOT,SOURCE,MODEL,plan};
