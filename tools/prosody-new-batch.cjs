'use strict';
// Pure compiler for the four explicitly approved CA003–CA006 batches.
const {createHash}=require('node:crypto'),T=require('../text-dictations.js'),P=require('../prosody.js'),E=require('./prosody-estimate.cjs');
const sha=value=>createHash('sha256').update(value).digest('hex');
function compile(batchId){
 if(!/^ca00[3-6]-four-rhythms-v1$/.test(batchId))throw Error('Lot desconegut.');
 const entry=T.find(batchId.split('-')[0].toUpperCase());
 if(entry?.teacherReview?.status!=='approved'||entry.prosodyReview?.status!=='approved')throw Error('Text i escaleta han d’estar validats.');
 const source=require('../content/prosody/'+entry.id+'.json'),plan=P.build(entry,source),planHash=sha(JSON.stringify(source));
 if(source.status!=='approved-for-pilot'||entry.prosodyReview.planHash!==planHash)throw Error('L’escaleta aprovada no coincideix.');
 const content=[],items=[],common='Read four complete renditions of this Catalan dictation in order, using the SAME Aoede adult female voice and native central Catalan pronunciation. Repetition is intentional; omit nothing. Speak only the transcript, including Catalan punctuation announcements. Clear natural teacher diction at 130-145 words per minute, with the SAME base pace across all four versions. Never rush the longer versions. Maintain lexical stress and complete initial/final consonants. Punctuation uses the same voice and base pace as the text. No Spanish words, titles, directions, music or added content. Metadata describes silent recording margins, not spoken words.';
 for(const [index,variant]of plan.variants.entries())for(const fragment of variant.fragments){
  let run=[],start=fragment.start;
  function add(text,kind,first,last,cue){
   const initial=fragment.number===1&&first===1&&kind==='dictation';
   let style=initial?(index===0?common+' ':'')+plan.direction+' '+variant.direction+' '+(index?'New rendition: restart the complete transcript. ':'Clean consonant onset. '):'';
   style+=kind==='punctuation'?'Same voice and pace. Catalan label; silence 0.25 s before, 0.35 s after. ':/[.!?]$/u.test(text)?'Natural sentence-final fall. ':'Connected speech; continuing inflection. ';
   const end=last===fragment.end&&(!plan.cues.some(c=>c.afterWord===last)||kind==='punctuation');
   if(end)style+='Then '+((kind==='punctuation'?plan.pauses.afterCueMs:0)+fragment.pauseMs+(fragment.end===plan.wordCount&&index<3?3000:0))/1000+' seconds of silence; preserve the final phoneme.';
   content.push({type:'text',text,annotations:[{type:'speech_metadata',style:style.trim()}]});items.push({requestIndex:content.length-1,variant:variant.id,fragment:fragment.number,kind,start:first,end:last,...(cue?{cue}:{}),text});
  }
  for(const word of fragment.words){if(!run.length)start=word.index;run.push(word.text);const cue=fragment.cues.find(c=>c.afterWord===word.index);if(cue){add(run.join(' '),'dictation',start,word.index);run=[];add(cue.text+'.','punctuation',word.index,word.index,cue.text);}}
  if(run.length)add(run.join(' '),'dictation',start,fragment.end);
 }
 const body={model:'gemini-3.8-flash-tts',background:true,input:[{type:'user_input',content}],response_format:{type:'audio',mime_type:'audio/wav',sample_rate:24000},generation_config:{speech_config:[{voice:'Aoede'}]}};
 const estimate={...E.estimate(E.units(entry,plan)),nominalWpm:E.policy.nominalWpm,conservativeWpm:E.policy.conservativeWpm,safetyFactor:E.policy.safetyFactor,estimatedInputTokens:Math.ceil(Buffer.byteLength(JSON.stringify(body),'utf8')/3)};
 return {batchId,entryId:entry.id,entry,plan,body,items,estimate,requestHash:sha(JSON.stringify(body)),planHash};
}
module.exports={compile};
