'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const A = require('./audio-plan.cjs');
const G = require('./generate-audio.cjs');
const {mp3Header} = require('./verify-pseudo-audio.cjs');
const {pack, plan} = require('./run-spanish-audio.cjs');
const revision = require('../catalogs/es/editions/manifest.json').editions[0].revision;
const output = path.join(A.ROOT, 'output');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function completedBatch() {
  const jobs = plan();
  const result = A.readJson(path.join(output,'results',pack.id+'-words.json'));
  const settings = A.readJson(path.join(output,'audio',pack.id,'settings.json'));
  const {language,locale,voice,rate,format,contentFingerprint} = pack;
  const identity = {language,locale,voice,rate,format,contentFingerprint};
  const fingerprint = digest(JSON.stringify(identity));
  if (settings.fingerprint!==fingerprint || settings.ipaFingerprint ||
      Object.entries(identity).some(([key,value])=>settings[key]!==value) ||
      result.schemaVersion!==1 || result.pack!==pack.id || result.mode!=='words' ||
      result.deferred?.length || Object.keys(result.files||{}).length!==jobs.length) {
    throw Error('El lot local no està complet o correspon a una altra síntesi.');
  }
  const assets = jobs.map(job => {
    if (result.files[job.id]!==job.relativePath) throw Error('Ruta incompatible: '+job.text);
    const file = G.resolveJobPath(output,pack.id,job.relativePath);
    const data = fs.readFileSync(file);
    const header = mp3Header(data);
    if (!G.isValidMp3(data) || header.sampleRate!==24000 || header.channels!==1 || header.bitrateKbps!==48) {
      throw Error('Format MP3 incompatible: '+job.text);
    }
    return {job,file,data,hash:digest(data)};
  });
  return {assets,fingerprint,result};
}

async function decode(assets) {
  const {chromium} = require(process.env.PLEC_NODE_MODULES ? path.join(process.env.PLEC_NODE_MODULES,'playwright') : 'playwright');
  const browser = await chromium.launch({channel:'chrome'});
  try {
    const page = await browser.newPage();
    const durations = [];
    for (let start=0; start<assets.length; start+=20) {
      const batch = assets.slice(start,start+20).map(({job,data})=>({word:job.text,bytes:data.toString('base64')}));
      durations.push(...await page.evaluate(async takes=>{
        const context = new OfflineAudioContext(1,1,24000);
        return Promise.all(takes.map(async ({word,bytes})=>{
          const buffer = Uint8Array.from(atob(bytes),char=>char.charCodeAt(0)).buffer;
          const sound = await context.decodeAudioData(buffer);
          if (sound.numberOfChannels!==1 || !Number.isFinite(sound.duration) || sound.duration<=0 ||
              !sound.getChannelData(0).some(sample=>Math.abs(sample)>.001)) throw Error('Àudio buit o invàlid: '+word);
          return sound.duration;
        }));
      },batch));
    }
    return {decoded:durations.length,minSeconds:Math.min(...durations),maxSeconds:Math.max(...durations)};
  } finally { await browser.close(); }
}

async function main(args) {
  if (args.some(arg=>arg!=='--publish')) throw Error('Ús: node tools/publish-spanish-audio.cjs [--publish]');
  const {assets,fingerprint,result} = completedBatch();
  const audit = await decode(assets);
  if (audit.decoded!==assets.length) throw Error('Descodificació incompleta.');
  console.log(JSON.stringify({pack:pack.id,...audit}));
  if (!args.includes('--publish')) return;
  const manifestFile = path.join(A.ROOT,'audio/manifest.json');
  const manifest = A.readJson(manifestFile);
  const prior = manifest.packs.find(item=>item.id===pack.id);
  if (prior && prior.fingerprint!==fingerprint) throw Error('El paquet públic té una identitat diferent.');
  const transfers = [];
  for (const {file,data,job,hash} of assets) {
    if (digest(fs.readFileSync(file))!==hash) throw Error('L’MP3 ha canviat durant la verificació: '+job.text);
    const destination = path.join(A.ROOT,pack.basePath,job.relativePath);
    if (fs.existsSync(destination)) {
      if (digest(fs.readFileSync(destination))!==hash) throw Error('El fitxer públic té un contingut diferent: '+job.text);
    } else transfers.push({destination,data});
  }
  for (const {destination,data} of transfers) {
    fs.mkdirSync(path.dirname(destination),{recursive:true});
    await G.writeCompleteFile(destination,data);
  }
  const addition = {...pack,status:'ready',reviewStatus:'pending-auditory-review',fingerprint,catalogue:revision,files:result.files};
  await G.atomicWriteJson(path.join(A.ROOT,'audio/spanish-publication.json'),{
    schemaVersion:1,pack:pack.id,voice:pack.voice,locale:pack.locale,rate:pack.rate,catalogue:revision,fingerprint,
    coverage:assets.length,reviewStatus:addition.reviewStatus,source:'spelling',generatedAt:result.generatedAt,decode:audit,
    sha256:Object.fromEntries(assets.map(({job,hash})=>[job.relativePath,hash]))
  });
  await G.atomicWriteJson(manifestFile,{
    ...manifest,defaultPacks:{...manifest.defaultPacks,es:pack.id},
    packs:[...manifest.packs.filter(item=>item.id!==pack.id),addition]
  });
}
if (require.main===module) main(process.argv.slice(2)).catch(error=>{
  console.error(error.message);
  process.exitCode=1;
});
