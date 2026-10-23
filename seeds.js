/* Seed protocol 1. Keep constants, ordering and integer operations immutable.
   See docs/LLAVORS.md. No browser state, clock, Intl sorting or Math.random. */
(function(root){
  'use strict';
  const ALPHABET='ABCDEFGHJKMNPQRSTVWXYZ23456789', BASE=30, SPACE=BASE**6;
  const COUNTS=[8,12,16,20,24],STAGES=['cm','cs','eso','all'];
  const WORD_FOCUSES=['accent','essa','hac','gej','beve','erra','qugu','vocals','digrafs','dieresi','signes','verbs'];
  const PSEUDO_FOCUSES=['simples','grups','pseudodigrafs','llargues'];
  const WORD_RECIPES=4095*4*5,RECIPES=WORD_RECIPES+15*5,EPOCHS=4,VARIANTS=Math.floor(SPACE/(RECIPES*EPOCHS));
  const USED=RECIPES*EPOCHS*VARIANTS, A=104729n,B=42070919n,M=BigInt(SPACE);
  function inverse(a,m){let [t,n,r,s]=[0n,1n,m,a];while(s){const q=r/s;[t,n]=[n,t-q*n];[r,s]=[s,r-q*s];}return(t+m)%m;}
  const AI=inverse(A,M);
  const normalize=code=>String(code).toUpperCase().replace(/[\s-]/g,'');
  function format(code){const c=normalize(code);return c.slice(0,3)+'-'+c.slice(3);}
  function recipeIndex({mode,count,stage,tags}){
    const focuses=mode==='words'?WORD_FOCUSES:mode==='pseudo'?PSEUDO_FOCUSES:null;
    if(!focuses||!COUNTS.includes(count)||!Array.isArray(tags)||!tags.length||tags.some(t=>!focuses.includes(t)))throw new Error('Configuració de dictat no vàlida.');
    let mask=0;for(const t of tags)mask|=1<<focuses.indexOf(t);
    if(mode==='words'){
      if(!STAGES.includes(stage))throw new Error('Nivell no vàlid.');
      return((mask-1)*4+STAGES.indexOf(stage))*5+COUNTS.indexOf(count);
    }
    return WORD_RECIPES+(mask-1)*5+COUNTS.indexOf(count);
  }
  function recipeAt(index){
    if(!Number.isInteger(index)||index<0||index>=RECIPES)throw new Error('Configuració no vàlida.');
    const words=index<WORD_RECIPES,offset=words?index:index-WORD_RECIPES;
    const count=COUNTS[offset%5],mask=Math.floor(offset/(words?20:5))+1;
    return{mode:words?'words':'pseudo',count,stage:words?STAGES[Math.floor(offset/5)%4]:'all',tags:(words?WORD_FOCUSES:PSEUDO_FOCUSES).filter((_,i)=>mask&(1<<i))};
  }
  function encode({epoch=0,recipe,nonce}){
    const index=typeof recipe==='number'?recipe:recipeIndex(recipe);
    if(!Number.isInteger(epoch)||epoch<0||epoch>=EPOCHS||!Number.isInteger(nonce)||nonce<0||nonce>=VARIANTS||!Number.isInteger(index)||index<0||index>=RECIPES)throw new Error('Llavors fora del rang admès.');
    let value=Number((BigInt((epoch*RECIPES+index)*VARIANTS+nonce)*A+B)%M),code='';
    for(let i=0;i<6;i++){code=ALPHABET[value%BASE]+code;value=Math.floor(value/BASE);}
    return format(code);
  }
  function decode(code){
    const c=normalize(code);if(c.length!==6||[...c].some(t=>!ALPHABET.includes(t)))throw new Error('Escriu les sis lletres o xifres del codi, sense I, L, O, U, 0 ni 1.');
    let value=0;for(const ch of c)value=value*BASE+ALPHABET.indexOf(ch);
    const packed=Number((((BigInt(value)-B)*AI)%M+M)%M);
    if(packed>=USED)throw new Error('Aquest codi no està assignat.');
    const nonce=packed%VARIANTS,block=Math.floor(packed/VARIANTS),epoch=Math.floor(block/RECIPES),index=block%RECIPES;
    return{code:format(c),epoch,index,nonce,recipe:recipeAt(index)};
  }
  function mix(value){value=Math.imul(value^(value>>>16),0x85ebca6b);value=Math.imul(value^(value>>>13),0xc2b2ae35);return(value^(value>>>16))>>>0;}
  function rng(seed){let state=seed>>>0;return()=>{state=(state+0x6d2b79f5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return(t^(t>>>14))>>>0;};}
  function stageMatch(e,stage,rules){if(e.mode==='pseudo'||stage==='all')return true;const r=rules[stage];const match=q=>(!q.vocabulary||q.vocabulary.includes(e.vocabulary))&&(!q.orthography||q.orthography.includes(e.orthography));return!!r&&(r.any?r.any.some(match):match(r));}
  function prepare(edition,recipe){
    const index=recipeIndex(recipe),canonical=recipeAt(index);
    const pool=edition.catalog.entries.filter(e=>e.mode===canonical.mode&&e.tags.some(t=>canonical.tags.includes(t))&&stageMatch(e,canonical.stage,edition.profile.stageRules));
    if(pool.length<canonical.count)throw new Error(`Només hi ha ${pool.length} mots disponibles. Amplia els focus o redueix la llargada.`);
    return{pool,recipe:canonical,index,epoch:edition.slot,salt:edition.salt};
  }
  function draw(prepared,nonce){
    const {pool,recipe,index,epoch,salt}=prepared;
    const next=rng(mix((nonce+1)^Math.imul(index+1,0x9e3779b9)^Math.imul(epoch+1,0x27d4eb2d)^salt));
    const remap=new Map(),picked=[];
    for(let i=0;i<recipe.count;i++){
      const n=pool.length-i,ceiling=Math.floor(4294967296/n)*n;let value;do{value=next();}while(value>=ceiling);
      const j=value%n,last=n-1;const at=remap.has(j)?remap.get(j):j;
      remap.set(j,remap.has(last)?remap.get(last):last);picked.push(pool[at]);
    }
    return picked;
  }
  function resolve(editions,code){const decoded=decode(code),edition=editions.find(e=>e.slot===decoded.epoch);if(!edition)throw new Error('Aquest codi pertany a una edició encara no disponible.');const prepared=prepare(edition,decoded.recipe);return{...decoded,language:edition.language,catalogue:edition.catalog.revision,entries:draw(prepared,decoded.nonce)};}
  function request(prepared,ids){
    const required=[...new Set(ids)];if(required.length>5)throw new Error('Pots demanar fins a cinc mots obligatoris.');
    if(required.some(id=>!prepared.pool.some(e=>e.id===id)))throw new Error('Un dels mots obligatoris queda fora dels filtres actuals.');
    if(required.length>prepared.recipe.count)throw new Error('Hi ha més mots obligatoris que espais al full.');
    return required;
  }
  function searchSync(prepared,ids,{start=0}={}){
    const required=request(prepared,ids);let attempts=0;
    for(let i=0;i<VARIANTS;i++){
      const nonce=((start+i)%VARIANTS+VARIANTS)%VARIANTS,entries=draw(prepared,nonce);attempts++;
      if(required.every(id=>entries.some(e=>e.id===id)))return{found:true,nonce,entries,attempts};
    }
    return{found:false,attempts};
  }
  async function search(prepared,ids,{start=0,signal,onProgress=()=>{},chunk=64}={}){
    const required=request(prepared,ids);let attempts=0;
    for(let i=0;i<VARIANTS;i++){
      if(signal?.aborted)throw new Error('Cerca cancel·lada.');
      const nonce=((start+i)%VARIANTS+VARIANTS)%VARIANTS,entries=draw(prepared,nonce);attempts++;
      if(required.every(id=>entries.some(e=>e.id===id)))return{found:true,nonce,entries,attempts};
      if(attempts%chunk===0){onProgress(attempts);await new Promise(resolve=>setTimeout(resolve,0));}
    }
    return{found:false,attempts};
  }
  root.PlecSeeds={ALPHABET,SPACE,COUNTS,STAGES,WORD_FOCUSES,PSEUDO_FOCUSES,RECIPES,EPOCHS,VARIANTS,normalize,format,recipeIndex,recipeAt,encode,decode,prepare,draw,resolve,search,searchSync,matchesStage:stageMatch};
  if(typeof module!=='undefined')module.exports=root.PlecSeeds;
})(typeof window==='undefined'?globalThis:window);
