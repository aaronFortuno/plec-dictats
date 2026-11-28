'use strict';
// Durable, bounded job for the eighteen specifically authorized batches.
const fs=require('node:fs/promises'),path=require('node:path'),{spawn}=require('node:child_process'),{setTimeout:wait}=require('node:timers/promises');
const root=path.resolve(__dirname,'..'),shared=path.resolve(root,'../output/sentit-primera-tanda'),directory=path.join(root,'output/audio/phrase-production-v1'),queue=require('../audio/texts/batches/ca007-es012-production-v1.json');
const day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles'}),quotaDay=()=>day.format(new Date());
async function read(file,fallback){try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}}
function command(args){return new Promise((resolve,reject)=>{const c=spawn(process.execPath,args,{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});let error='';c.stdout.on('data',b=>process.stdout.write(b));c.stderr.on('data',b=>{error+=b.toString();process.stderr.write(b);});c.on('error',reject);c.on('exit',code=>code===0?resolve():reject(Error(error.trim()||'Subprocés aturat: '+code)));});}
async function main(){
 const allowed=new Set(['--run-authorized-queue','--publish','--today']);
 if(!process.argv.includes('--run-authorized-queue')||process.argv.slice(2).some(arg=>!allowed.has(arg)))throw Error('Cal --run-authorized-queue per executar els divuit lots aprovats.');
 if(queue.status!=='authorized'||queue.minimumIntervalMs!==120000||queue.maximumDailyRequests!==10||queue.batches.length!==18)throw Error('Cua no autoritzada.');
 await fs.mkdir(directory,{recursive:true});const lockFile=path.join(directory,'runner.lock'),lock=await fs.open(lockFile,'wx');await lock.writeFile(JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}));
 let current=null;async function status(phase,extra={}){await fs.writeFile(path.join(directory,'status.json'),JSON.stringify({phase,current,updatedAt:new Date().toISOString(),quotaDay:quotaDay(),...extra},null,2)+'\n');}
 try{for(const item of queue.batches){current=item.batchId;const folder=path.join(root,'output/audio',item.batchId,item.requestHash.slice(0,12)),attempt=await read(path.join(folder,'attempt.json'),null);
   const registry=await read(path.join(root,'audio/texts/index.json'),{}),receipt=await read(path.join(root,'audio/texts/batches',item.batchId+'-receipt.json'),null),known=require('./phrase-production-policy.cjs').recorded(item,registry[item.entryId],receipt);
   // A clone can lack ignored raw responses while retaining published receipts.
   // Their absence must never turn a completed batch into another POST.
   if(known&&!attempt){await status('recorded-in-published-source');continue;}
   if(attempt?.status==='received'){if(attempt.requestHash!==item.requestHash||attempt.planHash!==item.planHash)throw Error('La presa rebuda no correspon al lot aprovat.');if(process.argv.includes('--publish')){await status('integrating-and-publishing');await command(['tools/publish-phrase-batch.cjs','--batch='+item.batchId,'--publish']);}continue;}
   if(attempt){await status('needs-review',{reason:'Existeix un intent previ; recuperar només amb ID conegut, mai reenviar.'});throw Error('Intent previ a revisar: '+current);}
   for(;;){
    require('../../sentit/tools/audio-quota.cjs').assertQuota(await read(path.join(shared,'last-api-error.json'),null));
    const log=await read(path.join(shared,'request-log.json'),[]),slot=require('./phrase-production-policy.cjs').slot(log),count=slot.requests;
    if(slot.full){await status('waiting-next-quota-day',{sharedRequests:count});if(process.argv.includes('--today'))return;await wait(55000);continue;}
    const until=slot.waitMs,other=await read(path.join(shared,'production.lock'),null);
    if(until>121000)throw Error('El rellotge no concorda amb el registre.');
    if(until>0||other){await status('waiting-interval-or-shared-lock',{sharedRequests:count});await wait(Math.min(55000,Math.max(1000,until>0?until:10000)));continue;}
    break;
   }
   const B=require('./prosody-batch.cjs'),built=B.compile(item.batchId);if(built.requestHash!==item.requestHash||built.planHash!==item.planHash)throw Error('La petició ha canviat: '+current);
   await status('synthesizing');await command(['tools/prosody-batch.cjs','--batch='+item.batchId,'--generate','--max-requests=1']);await status('received');
   if(process.argv.includes('--publish')){await status('integrating-and-publishing');await command(['tools/publish-phrase-batch.cjs','--batch='+item.batchId,'--publish']);}
  }await status(process.argv.includes('--publish')?'all-published':'all-received');
 }catch(e){await status('needs-review',{reason:e.message});throw e;}finally{await lock.close();await fs.unlink(lockFile);}
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={quotaDay};
