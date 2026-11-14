'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const A = require('./audio-plan.cjs');
const G = require('./generate-audio.cjs');
const {mp3Header} = require('./verify-pseudo-audio.cjs');
const {batch, plan} = require('./run-spanish-audio.cjs');
const output = path.join(A.ROOT, 'output');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function completedBatch(jobs,pack) {
  const result = A.readJson(path.join(output,'results',pack.id+'-'+pack.mode+'.json'));
  const settings = A.readJson(path.join(output,'audio',pack.id,'settings.json'));
  const {language,locale,voice,rate,format,contentFingerprint} = pack;
  const identity = {language,locale,voice,rate,format};
  if (contentFingerprint) identity.contentFingerprint = contentFingerprint;
  if (pack.generationPolicy?.requireIpa) {
    const pronunciation = jobs.map(({id,text,ipa})=>({id,text,ipa})).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
    identity.ipaFingerprint = digest(JSON.stringify(pronunciation));
  }
  const fingerprint = digest(JSON.stringify(identity));
  if (settings.fingerprint!==fingerprint || settings.ipaFingerprint!==identity.ipaFingerprint ||
      Object.entries(identity).some(([key,value])=>settings[key]!==value) ||
      result.schemaVersion!==1 || result.pack!==pack.id || result.mode!==pack.mode ||
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
  return {assets,fingerprint,result,ipaFingerprint:identity.ipaFingerprint};
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

function combinedPack(manifest,addition,edition,expansion) {
  const originals = [['es-es-elvira-basic-v1','spanish-publication.json',350]];
  if (expansion===2) originals.push(['es-es-elvira-expansion-01','spanish-expansion-publication.json',706]);
  const retained = originals.map(([id,auditFile,count])=>{
    const pack = A.validatePack(manifest,id);
    const audit = A.readJson(path.join(A.ROOT,'audio',auditFile));
    if (pack.status!=='ready' || audit.fingerprint!==pack.fingerprint || audit.coverage!==count ||
        Object.keys(pack.files).length!==count ||
        ['language','locale','voice','rate','format','dialect'].some(key=>pack[key]!==addition[key])) {
      throw Error('El paquet anterior és incompatible: '+id);
    }
    for (const file of Object.values(pack.files)) {
      if (digest(fs.readFileSync(path.join(A.ROOT,pack.basePath,file)))!==audit.sha256[file]) {
        throw Error('Ha canviat un àudio publicat: '+file);
      }
    }
    return pack;
  });
  const basePath = 'assets/audio/es/';
  const files = {};
  for (const pack of [...retained,addition]) {
    if (!pack.basePath.startsWith(basePath)) throw Error('Ruta d’àudio incompatible.');
    for (const [id,file] of Object.entries(pack.files)) {
      if (Object.hasOwn(files,id)) throw Error('ID d’àudio duplicat: '+id);
      files[id] = pack.basePath.slice(basePath.length)+file;
    }
  }
  if (Object.keys(files).length!==edition.catalog.entries.length || edition.catalog.entries.some(({id})=>!files[id])) {
    throw Error('El paquet combinat no cobreix el catàleg castellà.');
  }
  return {...addition,id:'es-es-elvira-words-v'+(Number(expansion)+1),basePath,files,
    fingerprint:digest(JSON.stringify([...retained.map(item=>item.fingerprint),addition.fingerprint,files]))};
}

async function main(args) {
  const selections = ['--expansion','--expansion-02','--pseudo'];
  if (args.some(arg=>!['--publish',...selections].includes(arg)) ||
      selections.filter(flag=>args.includes(flag)).length>1) {
    throw Error('Ús: node tools/publish-spanish-audio.cjs [--expansion | --expansion-02 | --pseudo] [--publish]');
  }
  const pseudo = args.includes('--pseudo');
  const expansion = args.includes('--expansion-02')?2:args.includes('--expansion');
  const selection = pseudo?require('./plan-spanish-pseudo-audio.cjs'):batch(expansion);
  const {pack} = selection;
  const edition = pseudo?require('../catalogs/es/editions/seed-4-pseudo.json'):selection.edition;
  const revision = edition.catalog.revision;
  const jobs = pseudo?selection.jobs:plan(expansion);
  if (pseudo) {
    const index = A.readJson(path.join(A.ROOT,'audio/pronunciation/runtime/es-es-pseudo.json'));
    const frozen = edition.catalog.entries.filter(entry=>entry.mode==='pseudo');
    if (index.revision!==revision || frozen.length!==jobs.length || index.entries.length!==jobs.length ||
        jobs.some((job,i)=>frozen[i].id!==job.id||frozen[i].text!==job.text||
          index.entries[i].id!==job.id||index.entries[i].text!==job.text||
          index.entries[i].ipa!==selection.entries[i].ipa)) {
      throw Error('L’àudio i l’AFI no coincideixen amb l’edició de pseudoparaules.');
    }
  }
  const {assets,fingerprint,result,ipaFingerprint} = completedBatch(jobs,pack);
  const audit = await decode(assets);
  if (audit.decoded!==assets.length) throw Error('Descodificació incompleta.');
  console.log(JSON.stringify({pack:pack.id,...audit}));
  if (!args.includes('--publish')) return;
  const manifestFile = path.join(A.ROOT,'audio/manifest.json');
  const manifest = A.readJson(manifestFile);
  const prior = manifest.packs.find(item=>item.id===pack.id);
  if (prior && prior.fingerprint!==fingerprint) throw Error('El paquet públic té una identitat diferent.');
  const addition = {...pack,status:'ready',reviewStatus:'pending-auditory-review',fingerprint,catalogue:revision,files:result.files,
    ...(pseudo?{profile:'es-es-pseudo-v1',ipaFingerprint}: {})};
  const combined = expansion?combinedPack(manifest,addition,edition,expansion):null;
  const existingCombined = manifest.packs.find(item=>item.id===combined?.id);
  if (existingCombined && existingCombined.fingerprint!==combined.fingerprint) throw Error('El paquet combinat té una identitat diferent.');
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
  const auditFile = pseudo?'spanish-pseudo-publication.json':expansion===2?'spanish-expansion-02-publication.json':
    expansion?'spanish-expansion-publication.json':'spanish-publication.json';
  await G.atomicWriteJson(path.join(A.ROOT,'audio',auditFile),{
    schemaVersion:1,pack:pack.id,voice:pack.voice,locale:pack.locale,rate:pack.rate,catalogue:revision,fingerprint,
    coverage:assets.length,reviewStatus:addition.reviewStatus,source:pseudo?'ipa':'spelling',generatedAt:result.generatedAt,decode:audit,
    ...(pseudo?{ipaFingerprint}: {}),
    sha256:Object.fromEntries(assets.map(({job,hash})=>[job.relativePath,hash]))
  });
  const defaultId = manifest.defaultPacks.es;
  const currentDefault = manifest.packs.find(item=>item.id===defaultId);
  const promote = combined && Object.keys(combined.files).length >= Object.keys(currentDefault?.files||{}).length;
  await G.atomicWriteJson(manifestFile,{
    ...manifest,defaultPacks:{...manifest.defaultPacks,es:promote?combined.id:defaultId||pack.id},
    packs:[...manifest.packs.filter(item=>item.id!==pack.id&&item.id!==combined?.id),addition,...(combined?[combined]:[])]
  });
}
if (require.main===module) main(process.argv.slice(2)).catch(error=>{
  console.error(error.message);
  process.exitCode=1;
});
