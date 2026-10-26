'use strict';
// Browser projections only. Full editorial TSV/JSON remain the authoring exports.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),T=require('./pronunciation-table.cjs');
const PROFILES=[['central','ca-central-didactic-v1'],['valencian','ca-valencian-didactic-v1'],['mallorcan','ca-mallorcan-didactic-v1']];
function projections(){return PROFILES.map(([name,id])=>{const data=T.load(id);return {name,data:{schemaVersion:1,profile:id,language:data.profile.language,dialect:data.profile.dialect,status:data.profile.status,catalogFingerprint:data.profile.catalogFingerprint,entries:data.rows.map(row=>({id:row.id,text:row.mot,ipa:row.ipa,status:row.estat_ipa}))}};});}
function build(check=false){const planned=projections().map(({name,data})=>({file:path.join(T.ROOT,'runtime',name+'.json'),data,text:JSON.stringify(data)+'\n'}));
 for(const item of planned){if(check){if(!fs.existsSync(item.file)||fs.readFileSync(item.file,'utf8')!==item.text)throw Error('Cal actualitzar '+path.relative(T.ROOT,item.file));}else{fs.mkdirSync(path.dirname(item.file),{recursive:true});fs.writeFileSync(item.file,item.text,'utf8');}}
 return planned.map(item=>({file:path.relative(T.ROOT,item.file).replaceAll('\\','/'),words:item.data.entries.length,bytes:Buffer.byteLength(item.text),gzipBytes:zlib.gzipSync(item.text).length}));
}
if(require.main===module){try{if(process.argv.slice(2).some(arg=>arg!=='--check'))throw Error('Ús: node tools/build-pronunciation-index.cjs [--check]');console.log(JSON.stringify(build(process.argv.includes('--check'))));}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={PROFILES,projections,build};
