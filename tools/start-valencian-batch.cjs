'use strict';
// Detached, hidden, resumable local job; credentials stay in the private loader.
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),A=require('./audio-plan.cjs');
const directory=path.join(A.ROOT,'output/audio');fs.mkdirSync(directory,{recursive:true});
for(const name of ['usage.lock','valencian-batch-runner.lock']){
 const file=path.join(directory,name);if(!fs.existsSync(file))continue;
 const record=A.readJson(file);if(!Number.isSafeInteger(record.pid)||record.pid<1)throw Error('PID de bloqueig invàlid.');let alive=false;try{process.kill(record.pid,0);alive=true;}catch(e){if(e.code!=='ESRCH')throw Error('No es pot comprovar el procés del lock; no es considera orfe.');}
 if(alive)throw Error('Ja hi ha un generador actiu: '+name);
 throw Error('Lock d’un procés acabat; comprova’l abans de retirar-lo: '+name);
}
const out=fs.openSync(path.join(directory,'valencian-batch.log'),'a'),err=fs.openSync(path.join(directory,'valencian-batch-errors.log'),'a');
const child=spawn(process.execPath,['tools/run-valencian-batch.cjs','--execute'],{cwd:A.ROOT,detached:true,windowsHide:true,stdio:['ignore',out,err]});
child.on('error',()=>{console.error('No s’ha pogut iniciar el procés.');process.exitCode=1;});
child.on('spawn',()=>{
 const launch={pid:child.pid,startedAt:new Date().toISOString()},record=()=>fs.writeFileSync(path.join(directory,'valencian-launch.json'),JSON.stringify(launch,null,2)+'\n');record();
 const powerLog=fs.openSync(path.join(directory,'keep-awake.log'),'a'),powerError=fs.openSync(path.join(directory,'keep-awake-errors.log'),'a');
 const powerExe=path.join(process.env.SystemRoot||'C:/Windows','System32/WindowsPowerShell/v1.0/powershell.exe');
 const power=spawn(powerExe,['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(__dirname,'keep-audio-awake.ps1'),'-BatchPid',String(child.pid)],{cwd:A.ROOT,detached:true,windowsHide:true,stdio:['ignore',powerLog,powerError]});
 power.on('error',()=>{launch.powerError='start-failed';record();});power.on('spawn',()=>{launch.powerPid=power.pid;record();});power.unref();fs.closeSync(powerLog);fs.closeSync(powerError);
 console.log(JSON.stringify({started:true,pid:child.pid,status:'output/audio/valencian-batch-status.json',log:'output/audio/valencian-batch.log'}));child.unref();fs.closeSync(out);fs.closeSync(err);
});
