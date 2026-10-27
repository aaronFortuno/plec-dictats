/* Search lifecycle shared by the composer; no DOM, storage or seed changes. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PlecComposerSearch=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function create({seeds,randomNonce,AbortController:Abort=globalThis.AbortController}){
    let generation=0,controller=null,busy=false,continuation=null;
    function cancel(){generation++;controller?.abort();controller=null;busy=false;continuation=null;}
    const isCurrent=result=>result?.generation===generation;
    async function run({edition,recipe,required=[],previous=null,resume=false,onStart=()=>{},onProgress=()=>{}}){
      const saved=resume?continuation:null;
      cancel();
      const ticket=generation,abort=new Abort();controller=abort;busy=true;
      const outcome=value=>({...value,generation:ticket});
      try{
        // Copy caller-owned filters before any callback or asynchronous work.
        const requested={...recipe,tags:[...recipe.tags]},ids=saved?.required||[...required],prior=saved?.attempts||0;
        onStart();
        const prepared=saved?.prepared||seeds.prepare(edition,requested);
        let start=saved?.nextNonce??randomNonce();
        if(!saved&&previous&&previous.index===prepared.index&&previous.epoch===prepared.epoch&&start===previous.nonce)start=(start+1)%seeds.VARIANTS;
        const result=await seeds.search(prepared,ids,{start,maxAttempts:saved?.remaining??seeds.VARIANTS,signal:abort.signal,onProgress:attempts=>{if(ticket===generation&&controller===abort&&!abort.signal.aborted)onProgress(prior+attempts);}});
        if(ticket!==generation||abort.signal.aborted)return outcome({status:'stale'});
        const attempts=prior+result.attempts;
        if(!result.found){
          if(result.remaining)continuation={prepared,required:ids,nextNonce:result.nextNonce,remaining:result.remaining,attempts};
          return outcome({status:result.remaining?'paused':'exhausted',attempts});
        }
        return outcome({status:'found',code:seeds.encode({epoch:prepared.epoch,recipe:prepared.index,nonce:result.nonce}),attempts,required:ids});
      }catch(error){
        return outcome(ticket!==generation||abort.signal.aborted?{status:'stale'}:{status:'error',error});
      }finally{
        if(ticket===generation){busy=false;controller=null;}
      }
    }
    return {run,cancel,isCurrent,discardContinuation(){continuation=null;},get busy(){return busy;},get canResume(){return continuation!==null;}};
  }
  return {create};
});
