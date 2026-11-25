/* Local editorial annotations are tied to the exact take; no network or synthesis. */
(function(root,factory){const node=typeof module==='object'&&module.exports,api=factory(node?require('./audio/texts/review-notes.json'):root.PlecTextAudioReview||{});if(node)module.exports=api;else root.PlecProsodyReview=api;})(typeof globalThis==='undefined'?this:globalThis,function(known){
 'use strict';
 const id=(variant,fragment)=>variant+':'+fragment;
 function create(entry,plan,storage){
  const take=entry.audio?.requestHash+':'+entry.audio?.rawSha256,key='plec-text-review-v1:'+entry.id+':'+take,valid=new Set(plan.variants.flatMap(v=>v.fragments.map(f=>id(v.id,f.number))));
  let marks={},error='',writable=true;
  const initial=known[entry.id];if(initial?.requestHash===entry.audio?.requestHash)for(const issue of initial.issues)if(valid.has(id(issue.variant,issue.fragment)))marks[id(issue.variant,issue.fragment)]=issue.note;
  try{if(!storage)throw Error('Storage unavailable');const saved=storage.getItem(key);if(saved){const parsed=JSON.parse(saved);if(!parsed||Array.isArray(parsed)||typeof parsed!=='object')throw Error('Invalid notes');marks=Object.fromEntries(Object.entries(parsed).filter(([k,v])=>valid.has(k)&&typeof v==='string').map(([k,v])=>[k,v.slice(0,1200)]));}}catch{writable=false;error='No es poden recuperar les marques desades. Copia les notes abans de sortir.';}
  function save(){if(!writable)return;try{storage.setItem(key,JSON.stringify(marks));error='';}catch{error='Les marques només es conserven en aquesta sessió. Copia-les abans de sortir.';}}
  return {get:k=>marks[k],count:()=>Object.keys(marks).length,error:()=>error,
   toggle(k){if(!valid.has(k))return;if(Object.hasOwn(marks,k))delete marks[k];else marks[k]='';save();},
   note(k,value){if(Object.hasOwn(marks,k)){marks[k]=String(value).slice(0,1200);save();}},
   text(){const rows=['Plec · Revisió d’àudio',entry.code+' · '+entry.title,'Veu: '+(entry.audio?.voice||'—'),'Presa: '+(entry.audio?.requestHash||'—'),''];
    for(const v of plan.variants)for(const f of v.fragments){const k=id(v.id,f.number);if(!Object.hasOwn(marks,k))continue;const audio=entry.audio?.variants?.[v.id],timing=audio?.fragments.find(g=>g.number===f.number);
     rows.push(v.label+' · '+v.id+' · F'+f.number+' · mots '+f.start+'–'+f.end,'Text: '+f.text,'Puntuació locutada: '+(f.cues.map(c=>c.text).join(' / ')||'cap'),...(timing?['Temps dins de la versió: '+timing.start.toFixed(2)+'–'+timing.end.toFixed(2)+' s']:[]),...(audio?['Àudio: '+audio.path,'SHA-256: '+audio.sha256]:[]),'Error: '+(marks[k].trim()||'Pronunciació per revisar.'),'');
    }return rows.join('\n');}
  };
 }
 return {create,id};
});
