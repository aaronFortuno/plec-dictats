'use strict';
// Local browser only. Start our own server when necessary, close only that server.
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
async function main(){let server;try{
 const own=async()=>{const r=await fetch('http://127.0.0.1:4176/ca/',{signal:AbortSignal.timeout(1000)});if(!r.ok||await r.text()!==fs.readFileSync(path.resolve(__dirname,'../ca/index.html'),'utf8'))throw Error('El port local no correspon a aquest projecte.');};
 try{await own();}catch(error){if(error.message.includes('no correspon'))throw error;server=spawn(process.execPath,['tools/serve.cjs'],{windowsHide:true,stdio:'ignore'});const deadline=Date.now()+15000;for(;;){try{await own();break;}catch(e){if(server.exitCode!==null||Date.now()>=deadline)throw e;await new Promise(resolve=>setTimeout(resolve,200));}}}
 const child=spawn(process.execPath,['tools/check-phrase-production-ui.cjs'],{stdio:'inherit',windowsHide:true});
 const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});if(code)throw Error('La comprovació local de Frases no ha passat.');
}finally{server?.kill();}}
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
