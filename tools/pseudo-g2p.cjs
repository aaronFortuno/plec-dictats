'use strict';
// Nonwords have no dictionary pronunciation. These are explicit editorial readings.
const fs=require('node:fs'),path=require('node:path');
const convert=require('./vendor/catalan2ipa/index.cjs'),T=require('./pronunciation-table.cjs');
const {normalize}=require('./valencian-g2p.cjs'),{analyzeIpa}=require('./ipa-inventory.cjs');
const {escapeXml,countCharacters}=require('./audio-plan.cjs');
const SOURCE='https://github.com/Connum/catalan2ipa';
const ACCENT='https://oiec.iec.cat/';
const PROFILES=[['central','ca-central-pseudo-didactic-v1','ca'],['valencia','ca-valencian-pseudo-didactic-v1','ca-valencia'],['mallorqui','ca-mallorcan-pseudo-didactic-v1','ca-XB']];
const PILOT=['sclaf','fepo','platoll','cunyi','jufell','xanufi','feixum','dofípol'];
function propose(text,dialect){
 const definition=PROFILES.find(item=>item[0]===dialect);if(!definition)throw Error('Varietat de pseudoparaules desconeguda.');
 let generated,hint=null;
 try{generated=convert(text);}
 catch(error){
  const vowel=/^The stressed vowel "([eo])" is ambiguous\./u.exec(error.message)?.[1];
  if(!vowel)throw error;
  // In an invented word there is no lexical authority: choose a closed vowel
  // only for the unresolved case, and keep that choice separate from spelling.
  hint={vowel,value:vowel==='e'?'é':'ó',basis:'editorial-closed-mid-vowel-for-unresolved-nonword'};
  generated=convert(text,{midVowelHint:hint.value});
 }
 const ipa=normalize(generated[definition[2]]),analysis=analyzeIpa(ipa,{allowLabiodentalV:dialect!=='central'});
 return {ipa,hint,...analysis};
}
function estimate(rows){return rows.reduce((n,row)=>n+countCharacters(`<prosody rate="-10%"><phoneme alphabet="ipa" ph="${escapeXml(row.ipa)}">${escapeXml(row.mot)}</phoneme></prosody>`),0);}
function report(data){
 const sourceOrder=data.catalog.entries.filter(e=>e.mode==='pseudo');
 const byId=new Map(data.rows.map(row=>[row.id,row]));
 return {profile:data.profile.id,mode:'pseudo',words:data.rows.length,withIpa:data.rows.filter(row=>row.ipa).length,validated:data.rows.filter(row=>row.estat_ipa==='validada').length,estimatedCharacters:estimate(data.rows),rate:'-10%',
  note:'Cost-only estimate of XML-escaped optional SSML, no speak/voice, no retries; does not execute or reserve quota.',
  sourceOrder:sourceOrder.map(e=>e.id),pilot:PILOT.map(text=>{const row=data.rows.find(r=>r.mot===text);return {id:row.id,text,ipa:row.ipa,status:row.estat_ipa};}),
  decisions:sourceOrder.map(entry=>{const row=byId.get(entry.id),p=propose(entry.text,data.profile.dialect),actual=analyzeIpa(row.ipa,{allowLabiodentalV:data.profile.dialect!=='central'});return {id:entry.id,text:entry.text,ipa:row.ipa,stressedSyllable:actual.stressedSyllable,syllables:actual.syllables,midVowelHint:p.ipa===row.ipa?p.hint:null,generatedReadingMatchesCurrentIpa:p.ipa===row.ipa,status:row.estat_ipa};})};
}
function fill(){
 const reports=[];
 for(const [dialect,id] of PROFILES){
  const profile=T.profile(id),file=path.join(T.ROOT,profile.table);
  const data=fs.existsSync(file)?T.load(id):T.initialize(id);
  for(const row of data.rows){
   if(row.ipa)continue;
   const proposal=propose(row.mot,dialect);
   Object.assign(row,{ipa:proposal.ipa,estat_ipa:'pendent-contrast',base:'editorial-nonword-reading-'+dialect,fonts:SOURCE+' | '+ACCENT,
    notes:'Pseudoparaula: model de lectura editorial, no pronunciació de diccionari ni ortografia normativa única. Accent regular segons la grafia; branca '+PROFILES.find(p=>p[0]===dialect)[2]+'. '+
     (proposal.hint?'Vocal mitjana no resolta: tria editorial tancada /'+(proposal.hint.vowel==='e'?'e':'o')+'/ (pista '+proposal.hint.value+'), sense modificar la grafia. ':'Timbre i reduccions proposats per les regles del conversor, pendents de contrast; no són una decisió lèxica normativa. ')+
     (row.mot==='sclaf'?'Es conserva el grup inicial /skl/ sense inserir vocal: estructura extraordinària en català, explícita com a estímul. ':'')+
     'Les altres grafies compatibles amb el so dictat es valoren segons el focus. No s’afegeixen vocals ni s’ometen consonants per adaptar-se a Azure. Cap veu ni enregistrament validat.',revisor:'',data_revisio:''});
  }
  T.validate(data.rows,data.profile,data.catalog);fs.writeFileSync(file,T.serialize(data.rows),'utf8');T.exportData(data);reports.push(report(data));
 }
 const summary={schemaVersion:1,kind:'offline-nonword-reading-proposals',executable:false,language:'ca',catalogFingerprint:T.profile(PROFILES[0][1]).catalogFingerprint,
  note:'Ninety-six unchanged spellings/IDs; three independent dialect branches. IPA proposals do not make a nonword spelling normative. Mallorcan Azure audio stays paused.',profiles:reports};
 fs.writeFileSync(path.join(T.ROOT,'ca/pseudo-decisions.json'),JSON.stringify(summary,null,2)+'\n');return summary;
}
function check(){const reports=PROFILES.map(([,id])=>{const data=T.load(id);T.exportData(data,true);return report(data);});const saved=JSON.parse(fs.readFileSync(path.join(T.ROOT,'ca/pseudo-decisions.json'),'utf8'));if(JSON.stringify(saved.profiles)!==JSON.stringify(reports))throw Error('Cal actualitzar les decisions de pseudoparaules.');return reports;}
if(require.main===module){try{if(process.argv.length!==3||!['--fill-missing','--check'].includes(process.argv[2]))throw Error('Ús: node tools/pseudo-g2p.cjs --fill-missing|--check');const result=process.argv[2]==='--check'?check():fill().profiles;console.log(JSON.stringify(result.map(({profile,words,withIpa,validated,estimatedCharacters})=>({profile,words,withIpa,validated,estimatedCharacters,network:false,synthesis:false}))));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={PROFILES,PILOT,propose,estimate,report,fill,check};
