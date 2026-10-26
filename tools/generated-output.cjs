'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {replaceFileSync}=require('./local-files.cjs');

// Atomic replacement is per file, not a transaction across the whole collection.
// Source validation/rendering must finish before calling this publisher.
function publishOutputs(root,outputs,{io=fs,replace=replaceFileSync}={}){
  const directory=path.resolve(root);
  const planned=[...outputs].map(([name,text])=>{
    const destination=path.resolve(directory,name),relative=path.relative(directory,destination);
    if(!relative||relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw Error('Generated output outside workspace: '+name);
    if(typeof text!=='string')throw Error('Generated output must be text: '+name);
    return {destination,text};
  });
  for(const {destination,text} of planned){
    io.mkdirSync(path.dirname(destination),{recursive:true});
    const temporary=destination+'.'+process.pid+'.'+crypto.randomBytes(6).toString('hex')+'.tmp';
    let created=false,descriptor;
    try{
      descriptor=io.openSync(temporary,'wx');created=true;
      io.writeFileSync(descriptor,text,{encoding:'utf8'});
      io.closeSync(descriptor);descriptor=undefined;
      replace(temporary,destination);created=false;
    }finally{
      if(descriptor!==undefined)try{io.closeSync(descriptor);}catch{}
      if(created)try{io.unlinkSync(temporary);}catch{}
    }
  }
}
module.exports={publishOutputs};
