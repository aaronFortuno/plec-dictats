'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'output/audio/text-ll01'),sha=b=>createHash('sha256').update(b).digest('hex');
function recoverWave(bytes){const {audio,report}=require('./streamed-text-wave.cjs').recoverStreamedWave(bytes);return {wav:audio,report:{...report,rawSha256:report.recoveredWaveSha256,newRequests:0,pronunciationValidated:false}};}
async function main(){
 const response=JSON.parse(await fs.readFile(path.join(folder,'response.json'))),clips=(response.steps??[]).flatMap(s=>s.content??[]).filter(c=>c.type==='audio');
 if(response.status!=='completed'||clips.length!==1)throw Error('Review the provider response first.');
 const original=Buffer.from(clips[0].data,'base64'),{wav,report}=recoverWave(original);
 await fs.writeFile(path.join(folder,'received.wav'),original);await fs.writeFile(path.join(folder,'raw.wav'),wav);await fs.writeFile(path.join(folder,'recovery.json'),JSON.stringify(report,null,2)+'\n');
 const attempt=JSON.parse(await fs.readFile(path.join(folder,'attempt.json')));Object.assign(attempt,{status:'received',recovery:'recovery.json',rawSha256:report.rawSha256,providerId:response.id});await fs.writeFile(path.join(folder,'attempt.json'),JSON.stringify(attempt,null,2)+'\n');
 console.log(JSON.stringify(report));
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={recoverWave};
