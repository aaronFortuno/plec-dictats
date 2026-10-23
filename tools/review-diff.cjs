/* Read-only review: an edited TXT is a proposal, never a silent JSON import. */
const fs=require('node:fs');
const {reviewWords}=require('./audit-lexicon.cjs');
function compare(source,text){
 const before=source.entries.filter(e=>e.mode==='words').map(e=>e.text),after=reviewWords(text);
 return {before:before.length,after:after.length,added:after.filter(t=>!before.includes(t)),removed:before.filter(t=>!after.includes(t))};
}
if(require.main===module){
 const file=process.argv[2]||'catalogs/ca/paraules.txt';
 const source=JSON.parse(fs.readFileSync('catalogs/ca/catalog.json','utf8'));
 console.log(JSON.stringify(compare(source,fs.readFileSync(file,'utf8')),null,2));
}
module.exports={compare};
