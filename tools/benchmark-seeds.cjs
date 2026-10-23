const fs=require('node:fs'),os=require('node:os');
const {performance}=require('node:perf_hooks');
const S=require('../seeds.js'),E=[require('../catalogs/ca/editions/seed-1.json')];
let state=0x17ac3511;const random=n=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state%n;};
const cases=30,rows=[];
for(const tags of [S.WORD_FOCUSES,['dieresi'],['signes']]){
 const recipe={mode:'words',count:24,stage:'all',tags},p=S.prepare(E[0],recipe);
 for(let n=1;n<=5;n++){
  const elapsed=[],attempts=[];let found=0;
  for(let i=0;i<cases;i++){
   const required=new Set();while(required.size<n)required.add(p.pool[random(p.pool.length)].id);
   const start=performance.now(),result=S.searchSync(p,[...required]);elapsed.push(performance.now()-start);attempts.push(result.attempts);if(result.found)found++;
  }
  elapsed.sort((a,b)=>a-b);
  rows.push({focuses:tags.join(','),pool:p.pool.length,required:n,cases,found,medianMs:+elapsed[Math.floor(cases/2)].toFixed(3),p95Ms:+elapsed[Math.floor(cases*.95)].toFixed(3),maxAttempts:Math.max(...attempts)});
 }
}
const report={date:new Date().toISOString(),runtime:process.version,cpu:os.cpus()[0].model,platform:process.platform,variantsPerRecipe:S.VARIANTS,casesSelection:'Independent deterministic sampling of target words; not chosen from known successful seeds.',rows};
fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/benchmark-seeds.json',JSON.stringify(report,null,2)+'\n');console.table(rows);
