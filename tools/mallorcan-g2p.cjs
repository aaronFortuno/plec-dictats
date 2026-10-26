'use strict';
// Offline, incomplete Mallorcan proposals. A missing lexical decision stays blank.
const fs=require('node:fs'),path=require('node:path');
const convert=require('./vendor/catalan2ipa/index.cjs');
const T=require('./pronunciation-table.cjs');
const {escapeXml,countCharacters}=require('./audio-plan.cjs');
const {normalize}=require('./valencian-g2p.cjs');
const {analyzeIpa}=require('./ipa-inventory.cjs');
const PROFILE='ca-mallorcan-didactic-v1';
const HINTS=path.join(T.ROOT,'ca/mallorcan-vowel-hints.json');
const SOURCE='https://github.com/Connum/catalan2ipa';
const BL_GL='https://blocs.uib.cat/galmic/fitxa/els-grups-bl-i-gl/';
const UNSTRESSED_O='https://blocs.uib.cat/galmic/fitxa/neutralitzacio-o-u-atones/';
const PILOT_CANDIDATES=[
  ['abella',['neutra-tonica','ll-formal']],['ceba',['neutra-tonica']],['pera',['neutra-tonica']],
  ['xocolata',['o-atona-conservada']],['conill',['harmonitzacio-o-u']],['formiga',['harmonitzacio-o-u']],
  ['barca',['b-bilabial']],['vaca',['v-labiodental']],['amable',['geminacio-bl']],['arreglar',['geminacio-gl']],
  ['atapeït',['dieresi-hiat-tonic']],['canviïn',['dieresi-hiat-atonic','accent-verbal','v-labiodental']],
  ['camp',['final-mp']],['banc',['final-nc']],['guant',['final-nt']],['col·legi',['ela-geminada']],
  ['passàvem',['accent-verbal','v-labiodental']],['brànquia',['nasal-velar','hiat-formal']]
];

function propose(word,hints=JSON.parse(fs.readFileSync(HINTS,'utf8'))){
  const hint=hints.entries[word];
  let raw;
  try{raw=convert(word,hint?{midVowelHint:hint.hint}:{})['ca-XB'];}
  catch(error){
    // Only the converter's explicit ambiguity is a legitimate linguistic gap.
    // A coding/data error must fail generation, not silently create a blank row.
    if(/^The stressed vowel "[eo]" is ambiguous\./u.test(error.message))return {ipa:'',hint:null,adjustments:[],reason:'vocal-mitjana-sense-pista-lexica'};
    throw error;
  }
  let ipa=normalize(raw);
  const adjustments=[];
  // Same morphological stress distinction as the other profiles; no graphies edited.
  if(/^(actu|canvi|continu|envi|esgla|estudi|tri)ï[ns]?$/u.test(word)){
    const syllables=ipa.split('.'),stress=/^estudi/u.test(word)?1:syllables.length-2;
    ipa=syllables.map((s,i)=>(i===stress?'ˈ':'')+s.replace('ˈ','')).join('.');
    adjustments.push('accent-del-subjuntiu-amb-dieresi');
  }
  // The ca-XB branch lacks the regular intervocalic bl/gl gemination described
  // by UIB. The syllable boundary preserves the single continuous long closure.
  const geminated=ipa.replace(/([aɔəeɛiou])\.(ˈ?)([bg])l([aɔəeɛiou])/gu,'$1$3.$2$3l$4');
  if(geminated!==ipa){ipa=geminated;adjustments.push('geminacio-intervocalica-bl-gl');}
  // Lexical o/u exceptions attested by UIB, not an indiscriminate o→u conversion.
  if(['cobert','obert'].includes(word)){
    const reduced=ipa.replace(/^[^aɔəeɛiou]*o/u,match=>match.replace('o','u'));
    if(reduced!==ipa){ipa=reduced;adjustments.push('excepcio-lexica-o-atona-u');}
  }
  analyzeIpa(ipa,{allowLabiodentalV:true});
  return {ipa,hint,adjustments,reason:null};
}

function reviewQueue(data){
  const basic=JSON.parse(fs.readFileSync(path.join(T.ROOT,'../../catalogs/ca/vocabulari-basic.json'),'utf8')).words;
  const basicSet=new Set(basic);
  const stats={...T.summary(data.rows),basicWords:basic.length,basicWithIpa:0,basicWithoutIpa:0,outsideDocumentedAzureInventory:0,stressedSchwa:0};
  const entries=data.rows.map(row=>{
    let azureCaEsCompatible=null;
    if(row.ipa){
      try{analyzeIpa(row.ipa);azureCaEsCompatible=true;}
      catch{azureCaEsCompatible=false;stats.outsideDocumentedAzureInventory++;}
      if(/ˈ[^.]*ə/u.test(row.ipa))stats.stressedSchwa++;
    }
    if(basicSet.has(row.mot))stats[row.ipa?'basicWithIpa':'basicWithoutIpa']++;
    return {id:row.id,text:row.mot,ipa:row.ipa||null,status:row.estat_ipa,basicVocabulary:basicSet.has(row.mot),azureCaEsCompatible};
  });
  return {schemaVersion:1,profile:data.profile.id,reference:'Palma · referència editorial mallorquina formal/didàctica amb neutra tònica; proposta incompleta pendent de contrast nadiu.',audioGenerated:true,audioStatus:'on-hold',listeningReview:'rejected-for-publication',audioScope:'18-word-local-three-voice-pilot-only',publicAudioAvailable:false,summary:stats,
    characterEstimates:{basis:'Unicode codepoints of XML-escaped prosody/phoneme body, excluding speak/voice; no synthesis pack or quota reservation.',rate:'-10%',available:estimateCharacters(data.rows),basic:estimateCharacters(data.rows.filter(row=>basicSet.has(row.mot))),pilotCandidates:pilotCandidates(data,basicSet).estimate},
    priorities:[{order:1,task:'Resoldre els mots bàsics sense IPA amb fonts lèxiques mallorquines.'},{order:2,task:'Contrastar les propostes dels 350 bàsics, vocals mitjanes, excepcions o/u i accent verbal.'},{order:3,task:'Resoldre els altres buits i revisar el corpus; després preparar una mostra auditiva curta.'}],
    basic:entries.filter(e=>e.basicVocabulary),pending:entries.filter(e=>!e.ipa)};
}
function estimateCharacters(rows){
  const available=rows.filter(row=>row.ipa);
  // Cost-only calculation: does not build a generation pack or mislabel its dialect
  // to bypass Azure's documented inventory. No speak/voice tags are counted.
  return {words:available.length,characters:available.reduce((total,row)=>total+countCharacters(`<prosody rate="-10%"><phoneme alphabet="ipa" ph="${escapeXml(row.ipa)}">${escapeXml(row.mot)}</phoneme></prosody>`),0)};
}
function pilotCandidates(data,basicSet=new Set(JSON.parse(fs.readFileSync(path.join(T.ROOT,'../../catalogs/ca/vocabulari-basic.json'),'utf8')).words)){
  const byWord=new Map(data.rows.map(row=>[row.mot,row]));
  const entries=PILOT_CANDIDATES.map(([word,traits])=>{
    const row=byWord.get(word);if(!row?.ipa)throw Error('Candidat de mostra sense IPA: '+word);
    let azureCaEsCompatible=true;try{analyzeIpa(row.ipa);}catch{azureCaEsCompatible=false;}
    return {id:row.id,text:word,ipa:row.ipa,status:row.estat_ipa,basicVocabulary:basicSet.has(word),traits,azureCaEsCompatible};
  });
  return {schemaVersion:1,kind:'offline-mallorcan-pilot-candidates',profile:PROFILE,executable:false,voice:null,pack:null,
    note:'Llistat per revisar abans d’una futura prova de veu. No autoritza síntesi, no reserva quota ni substitueix cap fonema absent de l’inventari documentat.',
    estimate:{...estimateCharacters(entries.map(entry=>({mot:entry.text,ipa:entry.ipa}))),rate:'-10%',excludes:'speak/voice, retries and repeated voice comparisons'},
    basicWords:entries.filter(entry=>entry.basicVocabulary).length,entries};
}
function exportReview(data,check=false){
  const queue=reviewQueue(data);
  const pilot=pilotCandidates(data,new Set(queue.basic.map(entry=>entry.text)));
  const files=[['ca/mallorcan-review-queue.json',JSON.stringify(queue,null,2)+'\n'],['ca/mallorcan-pending.txt',queue.pending.map(e=>e.text).join('\n')+'\n'],['ca/mallorcan-pilot-candidates.json',JSON.stringify(pilot,null,2)+'\n']];
  for(const [name,content] of files){const file=path.join(T.ROOT,name);if(check){if(fs.readFileSync(file,'utf8')!==content)throw Error('Cal actualitzar '+name);}else fs.writeFileSync(file,content,'utf8');}
  return queue.summary;
}
function fill(){
  const p=T.profile(PROFILE);
  const catalog=T.catalogFor(p);
  const data=fs.existsSync(path.join(T.ROOT,p.table))?T.load(PROFILE):{profile:p,catalog,rows:T.sorted(catalog.entries.filter(entry=>entry.mode==='words').map(entry=>({
    mot:entry.text,ipa:'',llengua:p.language,varietat:p.dialect,diccio:p.diction,estat_ipa:'pendent',base:'',fonts:'',notes:'',revisor:'',data_revisio:'',id:entry.id
  })))};
  const hints=JSON.parse(fs.readFileSync(HINTS,'utf8'));
  let added=0;
  for(const row of data.rows){
    // Never overwrite a manually reviewed or previously proposed transcription.
    if(row.ipa)continue;
    const proposal=propose(row.mot,hints);
    const sources=[SOURCE];if(proposal.hint)sources.push(proposal.hint.source);
    if(proposal.adjustments.includes('geminacio-intervocalica-bl-gl'))sources.push(BL_GL);
    if(proposal.adjustments.includes('excepcio-lexica-o-atona-u'))sources.push(UNSTRESSED_O);
    Object.assign(row,{ipa:proposal.ipa,estat_ipa:proposal.ipa?'pendent-contrast':'pendent',base:proposal.ipa?'g2p-mallorcan-editorial-proposal':'lexical-mid-vowel-unresolved',fonts:[...new Set(sources)].join(' | '),
      notes:proposal.ipa?'Proposta de la branca ca-XB, no importada del central. Model mallorquí amb neutra tònica; cal contrast de timbre, excepcions o/u, formes verbals i dicció. '+(proposal.hint?'Pista '+proposal.hint.hint+' ('+proposal.hint.basis+'). ':'')+(proposal.adjustments.length?'Ajustos: '+proposal.adjustments.join(', ')+'. ':'')+'Inventari ampli de síntesi amb /v/; l·l i finals explícits s’han de revisar com a dicció didàctica, no com a transcripció estreta de tots els parlars. No valida cap veu ni àudio.':'El conversor no pot decidir la vocal mitjana tònica. Cal pista lèxica mallorquina; es deixa buida sense copiar ni transformar una IPA central o valenciana.',revisor:'',data_revisio:''});
    if(proposal.ipa)added++;
  }
  T.validate(data.rows,data.profile,data.catalog);
  fs.writeFileSync(path.join(T.ROOT,p.table),T.serialize(data.rows),'utf8');
  T.exportData(data);
  return {added,...exportReview(data),network:false};
}
if(require.main===module){
  try{
    const action=process.argv[2];
    if(process.argv.length!==3||!['--fill-missing','--export-review'].includes(action))throw Error('Ús: node tools/mallorcan-g2p.cjs --fill-missing|--export-review; conserva totes les IPA existents.');
    console.log(JSON.stringify(action==='--fill-missing'?fill():{...exportReview(T.load(PROFILE)),network:false}));
  }
  catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={PROFILE,HINTS,propose,fill,reviewQueue,exportReview,estimateCharacters,pilotCandidates};
