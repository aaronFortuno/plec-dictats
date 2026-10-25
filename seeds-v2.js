/* Protocol 2: independent configuration prefix and 24.3 million variants.
   Definition and limits: docs/LLAVORS-V2.md.
   Protocol 1 codes retain their original reader and sampler in seeds.js. */
(function(root){
  'use strict';
  const V1=typeof module!=='undefined'?require('./seeds.js'):root.PlecSeeds;
  const ALPHABET=V1.ALPHABET,BASE=30,PREFIX_SPACE=BASE**4,VARIANTS=BASE**5;
  const EPOCHS=Math.floor(PREFIX_SPACE/V1.RECIPES),A=104729,B=420719;
  function inverse(a,m){let[t,n,r,s]=[0,1,m,a];while(s){const q=Math.floor(r/s);[t,n]=[n,t-q*n];[r,s]=[s,r-q*s];}return(t+m)%m;}
  const AI=inverse(A,PREFIX_SPACE),normalize=V1.normalize;
  function base30(value,width){let code='';for(let i=0;i<width;i++){code=ALPHABET[value%BASE]+code;value=Math.floor(value/BASE);}return code;}
  function integer(code){let value=0;for(const c of code)value=value*BASE+ALPHABET.indexOf(c);return value;}
  function format(code){const c=normalize(code);return c.length===6?V1.format(c):c.slice(0,4)+'-'+c.slice(4);}
  function encode({epoch=0,recipe,nonce}){
    const index=typeof recipe==='number'?recipe:V1.recipeIndex(recipe);
    if(!Number.isInteger(epoch)||epoch<0||epoch>=EPOCHS||!Number.isInteger(index)||index<0||index>=V1.RECIPES||!Number.isInteger(nonce)||nonce<0||nonce>=VARIANTS)throw new Error('Codi fora del rang admès.');
    return base30(((epoch*V1.RECIPES+index)*A+B)%PREFIX_SPACE,4)+'-'+base30(nonce,5);
  }
  function decode(code){
    const c=normalize(code);if(c.length===6)return{...V1.decode(c),protocol:1};
    if(c.length!==9||[...c].some(ch=>!ALPHABET.includes(ch)))throw new Error('Escriu el codi de 4 + 5 caràcters, sense I, L, O, U, 0 ni 1.');
    const block=((((integer(c.slice(0,4))-B)*AI)%PREFIX_SPACE)+PREFIX_SPACE)%PREFIX_SPACE;
    if(block>=EPOCHS*V1.RECIPES)throw new Error('Aquest prefix de codi no està assignat.');
    const epoch=Math.floor(block/V1.RECIPES),index=block%V1.RECIPES;
    return{protocol:2,code:format(c),epoch,index,nonce:integer(c.slice(4)),recipe:V1.recipeAt(index)};
  }
  function resolve(editions,code){
    const decoded=decode(code);if(decoded.protocol===1)return{...V1.resolve(editions,code),protocol:1};
    const edition=editions.find(e=>e.slot===decoded.epoch);if(!edition)throw new Error('Aquest codi pertany a una edició encara no disponible.');
    const prepared=V1.prepare(edition,decoded.recipe);
    return{...decoded,language:edition.language,catalogue:edition.catalog.revision,entries:V1.draw(prepared,decoded.nonce)};
  }
  function request(prepared,ids){
    const required=[...new Set(ids)];if(required.length>5)throw new Error('Pots demanar fins a cinc mots obligatoris.');
    const positions=new Map(prepared.pool.map((e,i)=>[e.id,i]));
    if(required.some(id=>!positions.has(id)))throw new Error('Un dels mots obligatoris queda fora dels filtres actuals.');
    return{required,positions};
  }
  // Reusable typed arrays reproduce the partial Fisher–Yates map exactly.
  // This checks membership without allocating a full dictation for every attempt.
  function matcher(prepared,ids){
    const{required,positions}=request(prepared,ids),{pool,recipe,index,epoch,salt}=prepared;
    const flags=new Uint8Array(pool.length),values=new Uint32Array(pool.length),stamps=new Uint32Array(pool.length);
    required.forEach((id,i)=>{flags[positions.get(id)]=1<<i;});const all=(1<<required.length)-1;let stamp=0;
    function mix(value){value=Math.imul(value^(value>>>16),0x85ebca6b);value=Math.imul(value^(value>>>13),0xc2b2ae35);return(value^(value>>>16))>>>0;}
    return nonce=>{
      if(!all)return true;
      if(++stamp===4294967296){stamps.fill(0);stamp=1;}
      let state=mix((nonce+1)^Math.imul(index+1,0x9e3779b9)^Math.imul(epoch+1,0x27d4eb2d)^salt),found=0;
      for(let i=0;i<recipe.count;i++){
        const n=pool.length-i,ceiling=Math.floor(4294967296/n)*n;let value;
        do{state=(state+0x6d2b79f5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);value=(t^(t>>>14))>>>0;}while(value>=ceiling);
        const j=value%n,last=n-1,at=stamps[j]===stamp?values[j]:j;
        values[j]=stamps[last]===stamp?values[last]:last;stamps[j]=stamp;
        found|=flags[at];if(found===all)return true;
      }
      return false;
    };
  }
  function options({start=0,maxAttempts=VARIANTS}={}){
    if(!Number.isInteger(start)||!Number.isInteger(maxAttempts)||maxAttempts<0||maxAttempts>VARIANTS)throw new Error('Rang de cerca no vàlid.');
    return{start:((start%VARIANTS)+VARIANTS)%VARIANTS,maxAttempts};
  }
  function result(prepared,start,maxAttempts,attempts,found=false){
    const nonce=(start+attempts-1)%VARIANTS;
    return{found,attempts,nextNonce:(start+attempts)%VARIANTS,remaining:maxAttempts-attempts,...(found?{nonce,entries:V1.draw(prepared,nonce)}:{})};
  }
  function searchSync(prepared,ids,opts={}){
    const{start,maxAttempts}=options(opts),matches=matcher(prepared,ids);let attempts=0;
    while(attempts<maxAttempts){const nonce=(start+attempts)%VARIANTS;attempts++;if(matches(nonce))return result(prepared,start,maxAttempts,attempts,true);}
    return result(prepared,start,maxAttempts,attempts);
  }
  async function search(prepared,ids,opts={}){
    const{start,maxAttempts}=options(opts),{signal,onProgress=()=>{},budgetMs=1800}=opts;
    if(!(budgetMs>0))throw new Error('Temps de cerca no vàlid.');
    const matches=matcher(prepared,ids),began=performance.now();let slice=began,attempts=0;
    while(attempts<maxAttempts){
      if(signal?.aborted)throw new Error('Cerca cancel·lada.');
      const nonce=(start+attempts)%VARIANTS;attempts++;
      if(matches(nonce))return result(prepared,start,maxAttempts,attempts,true);
      if(attempts%256===0){
        const now=performance.now();
        if(now-began>=budgetMs)break;
        if(now-slice>=8){onProgress(attempts);await new Promise(resolve=>setTimeout(resolve,0));slice=performance.now();}
      }
    }
    return result(prepared,start,maxAttempts,attempts);
  }
  const api={...V1,PROTOCOL:2,V1,PREFIX_SPACE,VARIANTS,EPOCHS,SPACE:PREFIX_SPACE*VARIANTS,format,encode,decode,resolve,matcher,searchSync,search};
  root.PlecSeeds=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
