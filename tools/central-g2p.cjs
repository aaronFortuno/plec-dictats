'use strict';
const fs=require('node:fs'),path=require('node:path'),g=require('./vendor/catalan2ipa/index.cjs'),T=require('./pronunciation-table.cjs'),V=require('./valencian-g2p.cjs'),{analyzeIpa}=require('./ipa-inventory.cjs');
function propose(word,hints){
 const hint=Object.hasOwn(hints.entries,word)?hints.entries[word]:null;let ipa=V.normalize(g(word,hint?{midVowelHint:hint.hint}:{})['ca']);
 if(/^(actu|canvi|continu|envi|esgla|estudi|tri)ï[ns]?$/.test(word)){const syllables=ipa.split('.'),stress=/^estudi/.test(word)?1:syllables.length-2;ipa=syllables.map((s,i)=>(i===stress?'ˈ':'')+s.replace('ˈ','')).join('.');}
 if(/ess(in|is|im)$/.test(word))ipa=ipa.replace(/(ˈ[^.]*?)ɛ/u,'$1e');
 if(/nt$/.test(word)&&ipa.endsWith('n'))ipa+='t';if(/nts$/.test(word))ipa=ipa.replace(/ns$/,'nts');
 if(/nc$/.test(word)&&ipa.endsWith('ŋ'))ipa+='k';if(/ncs$/.test(word))ipa=ipa.replace(/ŋs$/,'ŋks');
 analyzeIpa(ipa);return {ipa,hint};
}
function fill(){const data=T.load('ca-central-didactic-v1'),hints=JSON.parse(fs.readFileSync(path.join(T.ROOT,'ca/central-vowel-hints.json')));let added=0,corrected=0;
 for(const row of data.rows){
  if(row.ipa){if(/^continuï[ns]?$/.test(row.mot)){const p=propose(row.mot,hints);if(row.ipa!==p.ipa){row.ipa=p.ipa;row.notes+=' Accent del subjuntiu de continuar corregit; diferenciat de l’adjectiu contínua.';corrected++;}}continue;}
  const p=propose(row.mot,hints);Object.assign(row,{ipa:p.ipa,estat_ipa:'pendent-contrast',base:'g2p-central-editorial-proposal',fonts:'https://github.com/Connum/catalan2ipa',notes:'Proposta de la branca central del conversor, amb reducció vocàlica pròpia i finals nt/nc explícits per a la dicció didàctica. '+(p.hint?'Pista de vocal mitjana '+p.hint.hint+' ('+p.hint.basis+'). ':'')+'Pendent de contrast lingüístic; no valida la pronunciació de l’àudio existent.'});added++;
 }
 T.validate(data.rows,data.profile,data.catalog);fs.writeFileSync(path.join(T.ROOT,data.profile.table),T.serialize(data.rows));T.exportData(data);return {added,corrected,...T.summary(data.rows)};
}
if(require.main===module){if(process.argv[2]!=='--fill-missing')throw Error('Ús: node tools/central-g2p.cjs --fill-missing');console.log(JSON.stringify(fill()));}
module.exports={propose,fill};
