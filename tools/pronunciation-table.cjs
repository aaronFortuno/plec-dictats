'use strict';
// Editable per-variety source, offline validation and derived open-data exports.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const A=require('./audio-plan.cjs');
const {analyzeIpa}=require('./ipa-inventory.cjs');
const ROOT=path.join(A.ROOT,'audio/pronunciation');
const HEADER=['mot','ipa','llengua','varietat','diccio','estat_ipa','base','fonts','notes','revisor','data_revisio','id'];
const STATES=['pendent','proposta','pendent-contrast','revisar-diccio','validada'];

function profile(id) {
  const registry=A.readJson(path.join(ROOT,'registry.json'));
  if(registry.schemaVersion!==1||!Array.isArray(registry.profiles))throw new Error('Registre fonètic invàlid.');
  const p=registry.profiles.find(p=>p.id===(id||registry.profiles[0]?.id));
  if(!p||!['ipa-azure-ca-ES','ipa-valencian-draft','ipa-mallorcan-draft'].includes(p.alphabet)||p.language!=='ca')throw new Error('Perfil o inventari fonètic no disponible.');
  if(p.mode!==undefined&&!['words','pseudo'].includes(p.mode))throw new Error('Mode de la taula fonètica desconegut.');
  for(const key of ['table','export','readable','catalogPath'])A.validateRelativePath(p[key],key);
  return p;
}
function catalogFor(p) {
  const catalog=A.readJson(path.join(A.ROOT,p.catalogPath)).catalog;
  if(catalog.language!==p.language||catalog.fingerprint!==p.catalogFingerprint)throw new Error('Edició del banc incompatible.');
  return catalog;
}
function parse(text) {
  const lines=text.replace(/^\uFEFF/u,'').trimEnd().split(/\r?\n/u);
  if(lines.shift()!==HEADER.join('\t'))throw new Error('Capçalera de la taula inesperada.');
  return lines.map((line,i)=>{
    const values=line.split('\t');if(values.length!==HEADER.length)throw new Error('Columnes incorrectes a la fila '+(i+2)+'.');
    return Object.fromEntries(HEADER.map((key,index)=>[key,values[index]]));
  });
}
function validate(rows,p,catalog) {
  const mode=p.mode||'words';if(!['words','pseudo'].includes(mode))throw new Error('Mode de la taula fonètica desconegut.');
  const words=catalog.entries.filter(e=>e.mode===mode),byId=new Map(words.map(e=>[e.id,e])),seen=new Set();
  if(rows.length!==words.length)throw new Error('La taula ha de cobrir tots els mots de l’edició.');
  for(const row of rows){
    const word=byId.get(row.id);
    if(!word||word.text!==row.mot||seen.has(row.id))throw new Error('ID, grafia o duplicat incorrectes: '+row.mot+'.');
    seen.add(row.id);
    if(row.llengua!==p.language||row.varietat!==p.dialect||row.diccio!==p.diction)throw new Error('La fila pertany a una altra varietat o dicció: '+row.mot+'.');
    if(!STATES.includes(row.estat_ipa))throw new Error('Estat IPA desconegut: '+row.mot+'.');
    if(row.ipa){
      analyzeIpa(row.ipa,{allowLabiodentalV:['ipa-valencian-draft','ipa-mallorcan-draft'].includes(p.alphabet)});
      if(row.estat_ipa==='pendent'||!row.base||(!row.fonts&&!row.notes))throw new Error('Falta documentar la proposta: '+row.mot+'.');
    }else if(row.estat_ipa!=='pendent')throw new Error('Falta IPA en una fila amb estat de proposta o validació: '+row.mot+'.');
    if(row.fonts&&row.fonts.split(' | ').some(url=>!/^https:\/\/[^\s|]+$/u.test(url)))throw new Error('Fonts invàlides: '+row.mot+'.');
    if(row.estat_ipa==='validada'&&(!row.revisor.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(row.data_revisio)||!Number.isFinite(Date.parse(row.data_revisio))||new Date(row.data_revisio).toISOString().slice(0,10)!==row.data_revisio))throw new Error('La validació necessita revisor i data: '+row.mot+'.');
  }
  return rows;
}
function load(id) {
  const p=profile(id),catalog=catalogFor(p);
  return {profile:p,catalog,rows:validate(parse(fs.readFileSync(path.join(ROOT,p.table),'utf8')),p,catalog)};
}
function serialize(rows) {
  return [HEADER.join('\t'),...rows.map(row=>HEADER.map(key=>{
    const value=row[key]||'';if(/[\t\r\n]/u.test(value))throw new Error('No introdueixis salts de línia ni tabulacions dins d’una cel·la.');return value;
  }).join('\t'))].join('\n')+'\n';
}
function sorted(rows) {return [...rows].sort((a,b)=>a.mot.localeCompare(b.mot,'ca'));}
function summary(rows) {return {words:rows.length,withIpa:rows.filter(row=>row.ipa).length,withoutIpa:rows.filter(row=>!row.ipa).length,validated:rows.filter(row=>row.estat_ipa==='validada').length};}

function initialize(id) {
  const p=profile(id),catalog=catalogFor(p),file=path.join(ROOT,p.table);
  if(fs.existsSync(file))throw new Error('La taula ja existeix; no se sobreescriu cap revisió manual.');
  const proposed=new Map();
  // A new variety starts blank; it never inherits central pronunciations by relabelling.
  if(p.id==='ca-central-didactic-v1'){
  const legacy=require('./prepare-ipa.cjs');legacy.loadPlan(); // validate the imported proposal before migration
  for(const row of legacy.parseTsv(fs.readFileSync(legacy.SOURCE,'utf8')))proposed.set(row.id,{
    ipa:row.ipa,estat_ipa:row.estat==='needs-review'?'pendent-contrast':'revisar-diccio',base:row.base,fonts:row.fonts,
    notes:[row.notes,'Importada de la proposta central formal de dièresis; pendent d’adaptació al model didàctic explícit.'].filter(Boolean).join(' ')
  });
  const sample=require('./prepare-pronunciation-sample.cjs').loadSample();
  const feedback=A.readJson(path.join(ROOT,'ca-central-feedback-2.json'));
  if(feedback.language!==p.language||feedback.dialect!==p.dialect||feedback.diction!==p.diction)throw new Error('Les propostes inicials són d’un altre perfil.');
  for(const row of [...sample.jobs.map(job=>({id:job.id,ipa:job.ipa,status:job.reviewStatus,basis:job.basis,sources:job.sources,note:job.note})),...feedback.entries]){
    proposed.set(row.id,{ipa:row.ipa,estat_ipa:row.status==='needs-review'?'pendent-contrast':'proposta',base:row.basis,fonts:row.sources.join(' | '),notes:row.note});
  }
  }
  const rows=sorted(catalog.entries.filter(e=>e.mode===(p.mode||'words')).map(entry=>({
    mot:entry.text,ipa:'',llengua:p.language,varietat:p.dialect,diccio:p.diction,estat_ipa:'pendent',base:'',fonts:'',notes:'',revisor:'',data_revisio:'',id:entry.id,...proposed.get(entry.id)
  })));
  if([...proposed.keys()].some(id=>!rows.some(row=>row.id===id)))throw new Error('Hi ha una proposta fora del banc.');
  validate(rows,p,catalog);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,serialize(rows),{encoding:'utf8',flag:'wx'});
  return {profile:p,catalog,rows};
}

function exportData(data,check=false) {
  validate(data.rows,data.profile,data.catalog);
  const rows=sorted(data.rows),p=data.profile;
  const entries=rows.map(row=>({id:row.id,text:row.mot,ipa:row.ipa||null,language:row.llengua,dialect:row.varietat,diction:row.diccio,
    status:row.estat_ipa,basis:row.base||null,sources:row.fonts?row.fonts.split(' | '):[],notes:row.notes,reviewer:row.revisor||null,reviewDate:row.data_revisio||null}));
  const content={schemaVersion:1,profile:p.id,...(p.mode?{mode:p.mode}:{}),language:p.language,dialect:p.dialect,diction:p.diction,alphabet:p.alphabet,
    catalogFingerprint:p.catalogFingerprint,status:p.status,audioApproval:false,
    revision:crypto.createHash('sha256').update(JSON.stringify(entries)).digest('hex'),summary:summary(rows),entries};
  const readable='# '+p.label+' · Propostes en revisió; no valida cap veu ni àudio.\n# mot\tIPA\testat de la proposta\n'+rows.filter(row=>row.ipa).map(row=>[row.mot,row.ipa,row.estat_ipa].join('\t')).join('\n')+'\n';
  for(const [name,text] of [[p.export,JSON.stringify(content,null,2)+'\n'],[p.readable,readable]]){
    const file=path.join(ROOT,name);
    if(check){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==text)throw new Error('Cal actualitzar l’exportació: '+name+'.');}
    else fs.writeFileSync(file,text,'utf8');
  }
  return content;
}

function planWords(data,words) {
  validate(data.rows,data.profile,data.catalog);
  const wanted=[...new Set(words.map(word=>word.trim().normalize('NFC')).filter(Boolean))];
  if(!wanted.length)throw new Error('Falten mots per al pla.');
  const byWord=new Map(data.rows.map(row=>[row.mot,row]));
  const rows=wanted.map(word=>{const row=byWord.get(word);if(!row||!row.ipa)throw new Error('Mot sense proposta IPA: '+word+'.');return row;});
  return {schemaVersion:1,kind:'offline-table-pronunciations',executable:false,profile:data.profile.id,...(data.profile.mode?{mode:data.profile.mode}:{}),catalogFingerprint:data.profile.catalogFingerprint,
    note:'Selecció de la taula editable; cal una prova de síntesi en un paquet separat i revisió de cada àudio.',
    entries:rows.map(row=>{
      let azureCaEsCompatible=true;try{analyzeIpa(row.ipa);}catch{azureCaEsCompatible=false;}
      return {id:row.id,text:row.mot,ipa:row.ipa,status:row.estat_ipa,sources:row.fonts.split(' | ').filter(Boolean),azureCaEsCompatible};
    })};
}
if(require.main===module){
  try{
    const args=process.argv.slice(2);let id,action='inspect',words;
    for(let i=0;i<args.length;i++){
      if(args[i]==='--profile'){id=args[++i];if(!id)throw new Error('Falta perfil.');}
      else if(['--init','--export','--check'].includes(args[i])){if(action!=='inspect')throw new Error('Tria una sola acció.');action=args[i].slice(2);}
      else if(args[i]==='--plan'){if(action!=='inspect'||!args[i+1])throw new Error('Falten mots o hi ha accions incompatibles.');action='plan';words=args[++i].split(',');}
      else throw new Error('Ús: node tools/pronunciation-table.cjs [--profile ID] [--init|--export|--check|--plan "mot,mot"]');
    }
    const data=action==='init'?initialize(id):load(id);
    if(['export','check'].includes(action))exportData(data,action==='check');
    if(action==='plan'){
      const file=path.join(A.ROOT,'output/audio/table-pronunciation-plan.json');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(planWords(data,words),null,2)+'\n');
    }
    console.log(JSON.stringify({profile:data.profile.id,...summary(data.rows),action,network:false}));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={ROOT,HEADER,STATES,profile,catalogFor,parse,validate,load,serialize,sorted,summary,initialize,exportData,planWords};
