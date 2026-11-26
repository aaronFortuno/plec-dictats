/* Editorial rehearsal only. No audio client, credentials or approval mutations. */
(function(root,factory){const node=typeof module==='object'&&module.exports,api=factory(node?Object.fromEntries(require('./content/prosody/index.json').map(id=>[id,require('./content/prosody/'+id+'.json')])):root.PlecProsodyDraft);if(node)module.exports=api;else root.PlecProsody=api;})(typeof globalThis==='undefined'?this:globalThis,function(source){
 'use strict';
 const count=value=>value.trim().split(/\s+/u).filter(Boolean).length;
 function build(entry,draft=source?.[entry.id]){
  if(!draft||entry.id!==draft.textId)throw Error('Encara no hi ha escaleta per a aquest text.');
  const text=entry.paragraphs.join(' '),words=[],paragraphEnds=[];
  entry.paragraphs.forEach((paragraph,p)=>{paragraph.split(/\s+/u).forEach(value=>words.push({index:words.length+1,text:value,paragraph:p+1}));paragraphEnds.push(words.length);});
  if(text!==draft.sourceText||JSON.stringify(paragraphEnds)!==JSON.stringify(draft.paragraphEnds))throw Error('El text ha canviat: cal revisar l’escaleta.');
  const cueNames={',':'Coma',':':'Dos punts',';':'Punt i coma','?':'Signe d’interrogació','!':'Signe d’exclamació'};
  const cues=words.flatMap(word=>{
   const mark=/[.,:;?!]$/u.exec(word.text)?.[0];if(!mark)return [];
   const label=mark==='.'?(word.index===words.length?'Punt final':paragraphEnds.includes(word.index)?'Punt i a part':'Punt i seguit'):cueNames[mark];
   return [{afterWord:word.index,text:label,paragraph:word.paragraph,spokenWords:count(label)}];
  });
  const variants=draft.variants.map(variant=>{
   let previous=0;
   if(!paragraphEnds.every(end=>variant.ends.includes(end)))throw Error('Un fragment travessa un canvi de paràgraf.');
   const fragments=variant.ends.map((end,index)=>{
    if(!Number.isInteger(end)||end<=previous||end>words.length)throw Error('Talls d’escaleta invàlids.');
    const start=previous+1,items=words.slice(previous,end),fragmentCues=cues.filter(c=>c.afterWord>=start&&c.afterWord<=end),wordCount=end-previous;
    const exception=wordCount<variant.min||wordCount>variant.max,reason=variant.exceptions?.[end]||'';
    if(exception&&!reason)throw Error('Cal justificar el fragment fora del rang.');
    const last=items.at(-1).text,inflection=/[.!?]$/u.test(last)?'Tancament de frase':/:$/u.test(last)?'Suspensió abans de l’explicació':'Continuació cap al fragment següent';
    previous=end;
    return {number:index+1,start,end,paragraph:items[0].paragraph,wordCount,text:items.map(w=>w.text).join(' '),words:items,cues:fragmentCues,exception,reason,inflection,pauseMs:paragraphEnds.includes(end)?draft.pauses.paragraphMs:draft.pauses.fragmentMs,spokenWords:wordCount+fragmentCues.reduce((n,c)=>n+c.spokenWords,0)};
   });
   if(previous!==words.length)throw Error('L’escaleta no cobreix tot el text.');
   return {...variant,fragments,wordCount:fragments.reduce((n,f)=>n+f.wordCount,0),spokenWords:fragments.reduce((n,f)=>n+f.spokenWords,0),exceptionCount:fragments.filter(f=>f.exception).length};
  });
  return {...draft,words,cues,variants,wordCount:words.length,paragraphCount:paragraphEnds.length,spokenWordsPerVariant:words.length+cues.reduce((n,c)=>n+c.spokenWords,0)};
 }
 return {build,has:entry=>!!entry&&!!source?.[entry.id]};
});
