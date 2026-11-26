/* Versioned texts are independent of immutable word seed catalogues. */
(function(root,factory){const node=typeof module==='object'&&module.exports,api=factory(node?require('./audio/texts/index.json'):root.PlecTextAudio||{});if(node)module.exports=api;else root.PlecTexts=api;})(typeof globalThis==='undefined'?this:globalThis,function(audio){
 'use strict';
 const catalogue=[{
  id:'ca-ll-001-v1',code:'LL01',language:'ca',title:'Una exposició al col·legi',focuses:['signes'],focusLabels:['l·l'],stage:'Cicle superior',status:'pilot',
  paragraphs:[
   'Al col·legi, la Júlia prepara una petita exposició sobre les papallones. Ha enganxat una il·lustració groga al costat d’una col·lecció de fulles.',
   'El Marc col·labora amb ella i col·loca els cartells al passadís. Quan encenen la llum, una bombeta il·lumina tota la taula.',
   'La mestra els felicita: la feina ha quedat excel·lent. Demà, els companys de la classe visitaran l’exposició amb molta il·lusió.'
  ],
  // Phrase ends are editorial; timestamps are added only after receiving the take.
  phrases:[
   'Al col·legi,','la Júlia prepara','una petita exposició','sobre les papallones.',
   'Ha enganxat','una il·lustració groga','al costat','d’una col·lecció de fulles.',
   'El Marc col·labora','amb ella','i col·loca els cartells','al passadís.',
   'Quan encenen la llum,','una bombeta il·lumina','tota la taula.',
   'La mestra els felicita:','la feina ha quedat excel·lent.',
   'Demà, els companys de la classe','visitaran l’exposició','amb molta il·lusió.'
  ],
  audio:null
 }];
 for(const entry of catalogue)entry.audio=audio[entry.id]||null;
 const text=entry=>entry.paragraphs.join(' '),wordCount=value=>value.trim().split(/\s+/u).filter(Boolean).length;
 function find(id,language='ca'){return catalogue.find(e=>e.language===language&&(e.id===id||e.code===String(id).toUpperCase()));}
 function options(input={}){
  const rate=({'0.75':.8,'0.85':.9})[Number(input.rate)]??Number(input.rate);
  return {fold:input.fold==='horizontal'?'horizontal':'vertical',side:input.side==='start'?'start':'end',pace:Number(input.pace)===0?10:[2,4,6,10].includes(Number(input.pace))?Number(input.pace):6,rate:[.8,.9,1].includes(rate)?rate:1,fontSize:[12,13,14,15,16].includes(Number(input.fontSize))?Number(input.fontSize):14,lineSpacing:[8,9,10,11,12].includes(Number(input.lineSpacing))?Number(input.lineSpacing):10};
 }
 function fragments(entry,pace=6){
  const variant=entry.audio?.variants?.[({2:'r23',4:'r45',6:'r68',10:'r912',0:'r912'})[pace]];
  if(variant)return variant.fragments.map(f=>({...f,path:variant.path,duration:variant.seconds,words:f.endWord-f.startWord+1}));
  const units=entry.phrases.map((value,index)=>({text:value,words:wordCount(value),first:index,last:index})),groups=[];
  let group=null;
  for(const unit of units){
   if(group&&pace&&group.words>=Math.max(2,pace-2)&&group.words+unit.words>pace+2){groups.push(group);group=null;}
   if(!group)group={...unit};else{group.text+=' '+unit.text;group.words+=unit.words;group.last=unit.last;}
   if(/[.!?]$/u.test(unit.text)||(pace&&group.words>=pace)){groups.push(group);group=null;}
  }
  if(group)groups.push(group);
  return groups.map(g=>({...g,start:entry.audio?.bounds?.[g.first],end:entry.audio?.bounds?.[g.last+1]}));
 }
 function url(entry,input={},student=false,origin='https://plec.ortogra.fi/'){
  if(!catalogue.some(e=>e.id===entry.id&&e.language===entry.language))throw Error('Dictat de text desconegut.');
  const settings=options(input),link=new URL(entry.language+'/'+(student?'dictat/':''),origin);
  link.searchParams.set('text',entry.id);
  for(const key of student?['pace','rate']:['fold','side','pace','rate','fontSize','lineSpacing'])link.searchParams.set(key,settings[key]);
  return link.href;
 }
 // Rewind to the fragment containing the first uncommitted word; never skip ahead.
 const fragmentIndex=(groups,completedThrough)=>Math.max(0,groups.findIndex(g=>g.endWord>completedThrough));
 return {catalogue,text,wordCount,find,options,fragments,fragmentIndex,url};
});
