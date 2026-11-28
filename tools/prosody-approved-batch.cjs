'use strict';
// Pure compiler. New requests still require the exact, frozen per-batch approval.
const {createHash}=require('node:crypto'),T=require('../text-dictations.js'),P=require('../prosody.js'),E=require('./prosody-estimate.cjs');
const codes=[...Array.from({length:6},(_,n)=>'CA'+String(n+7).padStart(3,'0')),...Array.from({length:12},(_,n)=>'ES'+String(n+1).padStart(3,'0'))],ids=new Set(codes.map(c=>c.toLowerCase()+'-four-rhythms-v1'));
const sha=v=>createHash('sha256').update(v).digest('hex');
function supports(id){return ids.has(id);}
function compile(batchId){
 if(!supports(batchId))throw Error('Lot desconegut.');
 const code=batchId.split('-')[0].toUpperCase(),language=code.slice(0,2).toLowerCase(),entry=T.find(code,language),es=language==='es';
 if(entry?.teacherReview?.status!=='approved'||entry.prosodyReview?.status!=='approved'||entry.synthesis?.status!=='approved'||entry.synthesis.maximumNewRequests!==1)throw Error('Text, escaleta, veu i lot han d’estar aprovats.');
 const source=require('../content/prosody/'+entry.id+'.json'),plan=P.build(entry,source),planHash=sha(JSON.stringify(source));
 if(source.status!=='approved-for-pilot'||source.voice!=='Aoede'||entry.prosodyReview.planHash!==planHash)throw Error('L’escaleta no coincideix amb l’aprovada.');
 const content=[],items=[],spokenLanguage=es?'Spain Spanish, with native peninsular pronunciation and s versus c/z distinction':'central Catalan, with native central Catalan vowel reduction';
 const common='Read four COMPLETE renditions of this dictation in '+spokenLanguage+', in order, with the SAME Aoede adult female voice. Repetition is intentional: omit nothing. Speak only transcript text and the supplied punctuation announcements in the SAME language, voice and base pace. Clear natural teacher diction at 130-145 words per minute, stable across all four renditions. Never rush the longer groups. Preserve lexical stress and natural consonants. No titles, directions, music or added speech. Metadata describes SILENCE, never spoken words.';
 for(const [index,variant]of plan.variants.entries())for(const fragment of variant.fragments){let run=[],start=fragment.start;
  function add(text,kind,first,last,cue){
   const initial=fragment.number===1&&first===1&&kind==='dictation';
   let style=initial?(index===0?common+' ':'')+plan.direction+' '+plan.punctuationDirection+' '+variant.direction+' '+(index?'Restart the complete transcript. ':'Clean consonant onset. '):'';
   style+=kind==='punctuation'?'Same voice and pace. '+(es?'Spanish':'Catalan')+' label. Silence 0.25 s before, 0.35 s after. ':/[.!?]$/u.test(text)?'Natural sentence-final fall. ':'Connected speech, continuing inflection. ';
   const end=last===fragment.end&&(!plan.cues.some(c=>c.afterWord===last)||kind==='punctuation');
   if(end)style+='Then '+((kind==='punctuation'?plan.pauses.afterCueMs:0)+fragment.pauseMs+(fragment.end===plan.wordCount&&index<3?3000:0))/1000+' seconds of SILENCE. Preserve the final phoneme.';
   content.push({type:'text',text,annotations:[{type:'speech_metadata',style:style.trim()}]});items.push({requestIndex:content.length-1,variant:variant.id,fragment:fragment.number,kind,start:first,end:last,...(cue?{cue}:{}),text});
  }
  for(const word of fragment.words){if(!run.length)start=word.index;run.push(word.text);const cue=fragment.cues.find(c=>c.afterWord===word.index);if(cue){add(run.join(' '),'dictation',start,word.index);run=[];add(cue.text+'.','punctuation',word.index,word.index,cue.text);}}
  if(run.length)add(run.join(' '),'dictation',start,fragment.end);
 }
 const body={model:'gemini-3.8-flash-tts',background:true,input:[{type:'user_input',content}],response_format:{type:'audio',mime_type:'audio/wav',sample_rate:24000},generation_config:{speech_config:[{voice:'Aoede'}]}};
 const estimate={...E.estimate(E.units(entry,plan)),nominalWpm:E.policy.nominalWpm,conservativeWpm:E.policy.conservativeWpm,safetyFactor:E.policy.safetyFactor,estimatedInputTokens:Math.ceil(Buffer.byteLength(JSON.stringify(body),'utf8')/3)};
 return {batchId,entryId:entry.id,entry,plan,body,items,estimate,requestHash:sha(JSON.stringify(body)),planHash};
}
module.exports={compile,supports,codes};
