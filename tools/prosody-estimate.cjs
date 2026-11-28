'use strict';
// Duration planning only. No API client, credentials, request body or synthesis.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto'),T=require('../text-dictations.js'),P=require('../prosody.js');
const policy={maximumSeconds:390,nominalWpm:130,conservativeWpm:95,safetyFactor:1.2,betweenRenditionsSeconds:3,paddingSeconds:2};
function units(entry,plan=P.build(entry)){
 return plan.variants.map(variant=>({entryId:entry.id,code:entry.code,variant:variant.id,label:variant.label,fragments:variant.fragments.length,spokenWords:variant.spokenWords,cueCount:plan.cues.length,pauseSeconds:variant.fragments.reduce((n,f)=>n+f.pauseMs/1000,0)+plan.cues.length*(plan.pauses.beforeCueMs+plan.pauses.afterCueMs)/1000}));
}
function estimate(items){
 if(!items.length)throw Error('Cal una lectura com a mínim.');
 const spokenWords=items.reduce((n,item)=>n+item.spokenWords,0),cueCount=items.reduce((n,item)=>n+item.cueCount,0),plannedPauseSeconds=items.reduce((n,item)=>n+item.pauseSeconds,0)+(items.length-1)*policy.betweenRenditionsSeconds+policy.paddingSeconds;
 const nominalSeconds=Math.ceil(spokenWords*60/policy.nominalWpm+plannedPauseSeconds),conservativeSeconds=Math.ceil((spokenWords*60/policy.conservativeWpm+plannedPauseSeconds)*policy.safetyFactor);
 return {renditions:items.length,spokenWords,cueCount,plannedPauseSeconds:Number(plannedPauseSeconds.toFixed(2)),nominalSeconds,conservativeSeconds,maximumSeconds:policy.maximumSeconds,withinDurationBudget:conservativeSeconds<=policy.maximumSeconds,remainingSeconds:policy.maximumSeconds-conservativeSeconds};
}
function proposal(entries,options={}){
 const grouped=entries.map(entry=>units(entry)),all=grouped.flat();let groups=grouped;
 // Prefer all four versions of one text together when each fits the agreed budget.
 if(grouped.some(items=>!estimate(items).withinDurationBudget)){
  groups=[];
  for(const item of [...all].sort((a,b)=>estimate([b]).conservativeSeconds-estimate([a]).conservativeSeconds)){
   if(!estimate([item]).withinDurationBudget)throw Error('Una lectura sola supera el pressupost temporal.');
   const group=groups.find(group=>estimate([...group,item]).withinDurationBudget);if(group)group.push(item);else groups.push([item]);
  }
 }
 return {schemaVersion:1,id:options.id||'ca003-ca006-prosody-proposal-v1',status:options.status||'planning-only',voiceProposal:'Aoede',varietyProposal:options.variety||'Català central',synthesisAuthorized:false,newRequestsSent:0,inputBudgetValidated:false,requestBody:null,policy,minimumRequestsByDuration:Math.ceil((all.reduce((n,v)=>n+v.spokenWords*60/policy.conservativeWpm+v.pauseSeconds,0)*policy.safetyFactor)/policy.maximumSeconds),singleRequest:estimate(all),requests:groups.map((items,i)=>({id:'proposal-'+(i+1),versions:items,estimate:estimate(items),requestBody:null})),entries:entries.map(entry=>({code:entry.code,textId:entry.id,title:entry.title,words:T.wordCount(T.text(entry)),teacherValidation:entry.teacherReview.status,prosodyValidation:entry.prosodyReview.status,sourceTextSha256:createHash('sha256').update(T.text(entry)).digest('hex'),planSha256:createHash('sha256').update(JSON.stringify(require('../content/prosody/'+entry.id+'.json'))).digest('hex')}))};
}
if(require.main===module){
 const selected=process.argv.find(a=>a.startsWith('--proposal='))?.slice(11)||'ca003-ca006',scopes={'ca003-ca006':{codes:[3,4,5,6].map(n=>'CA00'+n)},'ca007-ca012':{codes:[7,8,9,10,11,12].map(n=>'CA'+String(n).padStart(3,'0')),status:'pending-prosody-validation'},'es001-es012':{codes:Array.from({length:12},(_,n)=>'ES'+String(n+1).padStart(3,'0')),variety:'Español de España',status:'pending-prosody-validation'}};
 const scope=scopes[selected];if(!scope)throw Error('Proposta desconeguda.');const entries=scope.codes.map(code=>T.find(code,code.startsWith('ES')?'es':'ca'));
 if(entries.some(entry=>entry?.teacherReview?.status!=='approved'))throw Error('Calen els textos validats pel docent.');
 const result=proposal(entries,{...scope,id:selected+'-prosody-proposal-v1'}),target=path.resolve(__dirname,'../audio/texts/batches/'+result.id+'.json');
 if(process.argv.includes('--write'))fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({singleRequest:result.singleRequest,requests:result.requests.map(r=>({codes:[...new Set(r.versions.map(v=>v.code))],...r.estimate})),newRequestsSent:0},null,2));
}
module.exports={units,estimate,proposal,policy};
