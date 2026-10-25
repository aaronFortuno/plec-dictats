'use strict';
// Offline proposals, never a claim of dictionary/linguistic validation.
const fs=require('node:fs'),path=require('node:path');
const convert=require('./vendor/catalan2ipa/index.cjs'),T=require('./pronunciation-table.cjs'),A=require('./audio-plan.cjs'),{analyzeIpa}=require('./ipa-inventory.cjs');
const HINTS=path.join(T.ROOT,'ca/valencian-vowel-hints.json');
function normalize(raw){
 let ipa=raw.replace(/^\/|\/$/g,'').replaceAll('ɡ','g').replaceAll('d͡z','dz').replaceAll('t͡s','ts').replaceAll('ˌ','');
 const count=(ipa.match(/ˈ/g)||[]).length;if(count>1){let n=0;ipa=ipa.replace(/ˈ/g,()=>++n<count?'':'ˈ');}
 ipa=ipa.replace(/([^\.])ˈ/g,'$1.ˈ');if(!ipa.includes('ˈ'))ipa='ˈ'+ipa;
 return ipa;
}
function propose(word,hints){
 const hint=hints.entries[word];let ipa=normalize(convert(word,hint?{midVowelHint:hint.hint}:{})['ca-valencia']);
 const syllables=ipa.split('.');
 // The converter treats final ï as stressed even in these present-subjunctive forms.
 if(/^(actu|canvi|continu|envi|esgla|estudi|tri)ï[ns]?$/.test(word)){
  const stress=/^estudi/.test(word)?1:syllables.length-2;
  ipa=syllables.map((s,i)=>(i===stress?'ˈ':'')+s.replace('ˈ','')).join('.');
 }
 // Valencian imperfect-subjunctive -és is closed /e/ also without a written accent.
 if(/essin$|essis$|essim$/.test(word))ipa=ipa.replace(/(ˈ[^.]*?)ɛ/u,'$1e');
 analyzeIpa(ipa,{allowLabiodentalV:true});return {ipa,hint};
}
function fill(){
 const data=T.load('ca-valencian-didactic-v1'),hints=A.readJson(HINTS);let added=0;
 for(const row of data.rows){if(row.ipa)continue;const proposal=propose(row.mot,hints);
  Object.assign(row,{ipa:proposal.ipa,estat_ipa:'pendent-contrast',base:'g2p-valencian-editorial-proposal',
   fonts:'https://github.com/Connum/catalan2ipa',notes:'Proposta automàtica valenciana, amb consonants finals i l·l explícites. Adaptació de símbols al motor: ɡ→g; d͡z/t͡s→dz/ts. '+(proposal.hint?'Vocal mitjana amb pista '+proposal.hint.hint+' ('+proposal.hint.basis+'), pendent de contrast lèxic. ':'')+'No és una transcripció importada d’un diccionari ni una validació lingüística.',revisor:'',data_revisio:''});added++;
 }
 T.validate(data.rows,data.profile,data.catalog);fs.writeFileSync(path.join(T.ROOT,data.profile.table),T.serialize(data.rows));T.exportData(data);return {added,...T.summary(data.rows)};
}
if(require.main===module){if(process.argv[2]!=='--fill-missing')throw Error('Ús: node tools/valencian-g2p.cjs --fill-missing; conserva qualsevol IPA existent.');console.log(JSON.stringify(fill()));}
module.exports={normalize,propose,fill};
