(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PlecCatalogBrowser=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const LETTERS=Object.freeze('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
  const WHEEL_PAUSE=350;

  function normalize(value,locale='ca'){
    return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase(locale);
  }

  function initialFor(text,locale='ca'){
    return normalize(text,locale).toLocaleUpperCase(locale).match(/[A-Z]/)?.[0]||'';
  }

  function chooseInitial(counts,requestedInitial){
    if(requestedInitial&&counts[requestedInitial]>0)return requestedInitial;
    return counts.A>0?'A':LETTERS.find(letter=>counts[letter]>0)||null;
  }

  function nextInitial(counts,activeInitial){
    const start=LETTERS.indexOf(activeInitial);
    return start<0?null:LETTERS.slice(start+1).find(letter=>counts[letter]>0)||null;
  }

  function buildView(entries,{query='',requestedInitial=null,locale='ca',predicate=null}={}){
    const needle=normalize(query,locale).trim();
    const collator=new Intl.Collator(locale,{sensitivity:'variant'});
    const filtered=(entries||[]).filter(entry=>(!predicate||predicate(entry))&&(!needle||normalize(entry.text,locale).includes(needle))).sort((a,b)=>collator.compare(a.text,b.text));
    const groups=Object.fromEntries(LETTERS.map(letter=>[letter,[]]));
    for(const entry of filtered){
      const initial=initialFor(entry.text,locale);
      if(groups[initial])groups[initial].push(entry);
    }
    const counts=Object.fromEntries(LETTERS.map(letter=>[letter,groups[letter].length]));
    const activeInitial=chooseInitial(counts,requestedInitial);
    return{
      entries:filtered,
      groups,
      counts,
      total:filtered.length,
      activeInitial,
      visibleEntries:activeInitial?groups[activeInitial]:[],
      initialCount:activeInitial?counts[activeInitial]:0,
      nextInitial:nextInitial(counts,activeInitial)
    };
  }

  function createWheelState(){
    return{lastWheelAt:null,atBottom:false};
  }

  function noteWheelPosition(state,atBottom){
    return{...state,atBottom:Boolean(atBottom)};
  }

  function wheelGesture(state,{deltaY,atBottom,now},pauseMs=WHEEL_PAUSE){
    const separated=state.lastWheelAt===null||now-state.lastWheelAt>=pauseMs;
    const advance=deltaY>0&&atBottom&&state.atBottom&&separated;
    return{
      advance,
      state:{lastWheelAt:now,atBottom:advance?false:Boolean(atBottom)}
    };
  }

  return{LETTERS,WHEEL_PAUSE,normalize,initialFor,chooseInitial,nextInitial,buildView,createWheelState,noteWheelPosition,wheelGesture};
});
