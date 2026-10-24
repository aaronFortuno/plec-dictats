const fs=require('node:fs'),os=require('node:os'),{performance}=require('node:perf_hooks');
const S=require('../seeds-v2.js'),E=require('../catalogs/ca/editions/seed-1.json');
let state=0x17ac3511;const random=n=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state%n;};
const rows=[],cases=10;
for(const tags of [S.WORD_FOCUSES,['dieresi'],['signes']]){
 const p=S.prepare(E,{mode:'words',count:24,stage:'all',tags});
 for(let n=1;n<=5;n++){
  const elapsed=[],attempts=[];let found=0;
  const maxAttempts=n<=3?S.VARIANTS:1000000;
  for(let c=0;c<cases;c++){
   const required=new Set();while(required.size<n)required.add(p.pool[random(p.pool.length)].id);
   const began=performance.now(),r=S.searchSync(p,[...required],{maxAttempts});elapsed.push(performance.now()-began);attempts.push(r.attempts);if(r.found)found++;
  }
  elapsed.sort((a,b)=>a-b);const row={focuses:tags.join(','),pool:p.pool.length,required:n,cases,found,medianMs:+elapsed[Math.floor(cases/2)].toFixed(3),attemptLimit:maxAttempts,maxAttempts:Math.max(...attempts)};rows.push(row);console.log(JSON.stringify(row));
 }
}
const examples=[];
for(const stage of ['cs','all']){
 const recipe={mode:'words',count:24,stage,tags:S.WORD_FOCUSES},p=S.prepare(E,recipe),ids=['perquè','orquestra'].map(text=>p.pool.find(e=>e.text===text).id),began=performance.now(),r=S.searchSync(p,ids);
 examples.push({stage,words:['perquè','orquestra'],found:r.found,attempts:r.attempts,elapsedMs:+(performance.now()-began).toFixed(3),code:S.encode({epoch:0,recipe,nonce:r.nonce})});
}
const report={date:new Date().toISOString(),protocol:2,runtime:process.version,cpu:os.cpus()[0].model,variantsPerRecipe:S.VARIANTS,cases,note:'Independent target sets. For 1–3 targets the whole domain is available; for 4–5 at most one million variants per case. Failure in a limited range does not mean exhaustion of the 24.3 million variants. CPU timings are not mobile or total browser wall times.',rows,examples};
fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/benchmark-seeds-v2.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({examples}));
