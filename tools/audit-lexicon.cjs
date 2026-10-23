/* Strict form lookup in the external Softcatala LanguageTool lexicon.
   No spelling suggestions, accent folding, affix generation or compound splitting.
   Generated reports contain third-party lexical annotations: see their source notice. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const readline = require('node:readline');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function reviewWords(text) {
  const words = text.replace(/^\uFEFF/, '').split(/\r?\n/).map(t => t.trim()).filter(t => t && !t.startsWith('#')).map(t=>t.normalize('NFC'));
  if (new Set(words).size !== words.length) throw new Error('La llista de revisió conté mots duplicats.');
  if (words.some(t=>/\s/.test(t))) throw new Error('Espera un sol mot per línia; les locucions s’han de revisar separadament.');
  return words;
}
async function lookup(dictionary, wanted) {
  const hits = new Map(), checksum = crypto.createHash('sha256');
  const stream = fs.createReadStream(dictionary);
  stream.on('data', chunk => checksum.update(chunk));
  let rows = 0;
  for await (const line of readline.createInterface({ input: stream, crlfDelay: Infinity })) {
    const match = /^(\S+)\s+(\S+)\s+(\S+)\s*$/.exec(line);
    if (!match) continue;
    rows++;
    const [, rawForm, lemma, tag] = match, form = rawForm.normalize('NFC');
    if (!wanted.has(form)) continue;
    if (!hits.has(form)) hits.set(form, []);
    if (!hits.get(form).some(a=>a.lemma===lemma&&a.tag===tag)) hits.get(form).push({ lemma, tag });
  }
  return { hits, dictionarySHA256: checksum.digest('hex'), dictionaryRows: rows };
}
async function audit({ dictionary, catalog, review, commit, out }) {
  const bytes = fs.readFileSync(catalog), source = JSON.parse(bytes);
  const official = source.entries.filter(e=>e.mode==='words').map(e=>e.text);
  const editedBytes = review ? fs.readFileSync(review) : null;
  const edited = editedBytes ? reviewWords(editedBytes.toString('utf8')) : null;
  const result = await lookup(dictionary, new Set([...official, ...(edited||[])]));
  const rows = words => words.map(text=>({text,status:result.hits.has(text)?'exact_match':'needs_review',analyses:result.hits.get(text)||[]}));
  const summarize = entries => ({ total: entries.length, exactMatches: entries.filter(e=>e.status==='exact_match').length, pending: entries.filter(e=>e.status!=='exact_match').map(e=>e.text) });
  const entries = rows(official), editedEntries = edited ? rows(edited) : null;
  const report = {
    method:'Exact NFC form lookup; accents, case, hyphens and middle dots preserved.',
    source:{repository:'https://github.com/Softcatala/catalan-dict-tools',commit:commit||null,path:'resultats/lt/diccionari.txt',sha256:result.dictionarySHA256,rows:result.dictionaryRows,license:'LGPL-2.1 OR GPL-2.0'},
    catalogue:{language:source.language,sha256:digest(bytes),...summarize(entries)},
    review:editedEntries?{file:review,sha256:digest(editedBytes),...summarize(editedEntries),added:edited.filter(t=>!official.includes(t)),removed:official.filter(t=>!edited.includes(t))}:null,
    entries,reviewEntries:editedEntries,
    limits:'A match attests presence in this lexical resource, not intended meaning, dialect choice, frequency, pedagogical suitability or infallible normative certification. Absence requires review, not automatic rejection as a nonword.'
  };
  if(out){
    fs.mkdirSync(path.dirname(out),{recursive:true});
    fs.writeFileSync(out+'.json',JSON.stringify(report,null,2)+'\n');
    const collator = new Intl.Collator('ca');
    const table=[...entries].sort((a,b)=>collator.compare(a.text,b.text));
    fs.writeFileSync(out+'.tsv',['paraula\tresultat\tlema i etiqueta',...table.map(e=>[e.text,e.status,e.analyses.map(a=>a.lemma+' ['+a.tag+']').join(' | ')].join('\t'))].join('\n')+'\n');
    fs.writeFileSync(out+'-FONT.txt','Anotacions lèxiques: Softcatalà / catalan-dict-tools, autors del projecte.\nFont: '+report.source.repository+'\nRevisió: '+(commit||'no especificada')+'\nFitxer: '+report.source.path+'\nSHA-256: '+report.source.sha256+'\nLlicència de les dades: LGPL 2.1 o GPL 2.0 (no la llicència MIT del codi de Plec).\nhttps://github.com/Softcatala/catalan-dict-tools/blob/'+(commit||'master')+'/LICENSE\nAquest informe és un contrast automàtic, no una certificació normativa ni pedagògica.\n');
  }
  return report;
}
if(require.main===module){
  const values={};const args=process.argv.slice(2);
  for(let i=0;i<args.length;i+=2){if(!args[i].startsWith('--')||!args[i+1])throw new Error('Arguments: --dictionary FITXER --catalog JSON [--review TXT] [--commit SHA] [--out PREFIX]');values[args[i].slice(2)]=args[i+1];}
  if(!values.dictionary||!values.catalog)throw new Error('Cal indicar --dictionary i --catalog.');
  audit(values).then(report=>{console.log(JSON.stringify({catalogue:report.catalogue,review:report.review},null,2));if(report.catalogue.pending.length||report.review?.pending.length)process.exitCode=2;}).catch(error=>{console.error(error.message);process.exitCode=1;});
}
module.exports={audit,lookup,reviewWords};
