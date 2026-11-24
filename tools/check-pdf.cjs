/* Executa amb les biblioteques del runtime o amb pdf-lib instal·lat en local. */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const C = require('../catalog.js'), K = require('../core.js'), P = require('../pdf.js');
const lib = require(process.env.PLEC_NODE_MODULES ? path.join(process.env.PLEC_NODE_MODULES, 'pdf-lib') : 'pdf-lib');
const root = path.resolve(__dirname, '..');
async function main() {
  fs.mkdirSync(path.join(root, 'tmp'), { recursive: true }); fs.mkdirSync(path.join(root, 'output'), { recursive: true });
  for (const mode of ['words', 'pseudo']) {
    for (const count of [8, 12, 16, 20, 24]) {
      const entries = C.entries.filter(e => e.mode === mode).slice(0, count);
      const options = { entries, mode, title: mode === 'words' ? 'Dictat de paraules' : 'Dictat de pseudoparaules', group: '5è A', code: 'P-PROVA24' };
      for (const foldStyle of ['thirds', 'quarter']) for (const modelSide of ['left', 'right']) {
        const bytes = await P.build({ ...options, modelSide, foldStyle }, lib, K);
        const pdf = await lib.PDFDocument.load(bytes);
        assert.equal(pdf.getPageCount(), 1);
        const page = pdf.getPage(0); assert(Math.abs(page.getWidth() - 595.2756) < .01); assert(Math.abs(page.getHeight() - 841.8898) < .01);
        fs.writeFileSync(path.join(root, 'tmp', `${mode}-${count}-${foldStyle}-${modelSide}.pdf`), bytes);
      }
      const folds = K.worksheet(options).filter(s => s.type === 'line' && s.dash);
      assert.deepEqual(folds.map(s => s.x), [70, 140]);
    }
  }
  const words = ['avió','cinema','passadís','metge','llapis','examen','cançó','tassa','plaça','hivern','ahir','coet','viatge','platja','vaixell','beure','carro','guitarra','mosquit','guineu','muntanya','motxilla','raïm','col·legi'];
  const entries = words.map(t => C.entries.find(e => e.text === t && e.mode === 'words')); assert(entries.every(Boolean));
  for(const foldStyle of ['thirds','quarter']) {
    const name=foldStyle==='thirds'?'tercos':'quart';
    fs.writeFileSync(path.join(root,'output','exemple-'+name+'-24.pdf'),await P.build({entries,mode:'words',foldStyle,modelSide:'left',title:'Dictat de paraules',code:'P-EXEMPLE'},lib,K));
  }
  // Tots els caràcters del banc són codificables amb la font del PDF.
  const fontDoc = await lib.PDFDocument.create(), font = await fontDoc.embedFont(lib.StandardFonts.Helvetica);
  C.entries.forEach(e => font.encodeText(e.text));
  // The preview uses exactly the PDF's measured positions, including pagination.
  const basic = C.entries.filter(e => e.mode === 'words' && e.basicVocabulary);
  const listOptions = { entries: basic, title: 'Vocabulari bàsic', subtitle: count => count + ' mots', locale: 'ca' };
  const normal = await P.prepareWordList(listOptions, lib);
  assert.equal(normal.pages.length, 4);
  assert.equal((await lib.PDFDocument.load(normal.bytes)).getPageCount(), normal.pages.length);
  const custom = await P.prepareWordList({ ...listOptions, title: 'Paraules de la nostra classe: revisem els mots de cada dia i preparem el mural de vocabulari', fontSize: 28, columns: 2, orientation: 'landscape' }, lib);
  const customDoc = await lib.PDFDocument.load(custom.bytes);
  assert(custom.width > custom.height);
  assert.equal(customDoc.getPage(0).getWidth(), custom.width);
  assert.equal(customDoc.getPageCount(), custom.pages.length);
  assert(customDoc.getTitle().startsWith('Paraules de la nostra classe'));
  const printed = custom.pages.flatMap(shapes => shapes.filter(s => s.type === 'text' && !s.weight && s.color === '#1a211f'));
  assert.equal(printed.length, basic.length);
  assert.deepEqual(printed.map(s => s.value), basic.map(e => e.text).sort(new Intl.Collator('ca').compare));
  assert(printed.some(s => s.size === 28));
  for (const settings of [{ fontSize: 10, columns: 4 }, { fontSize: 30, columns: 1 }, { fontSize: 30, columns: 4, orientation: 'landscape', title: 'Títol llarg '.repeat(10) }]) {
    const layout = await P.prepareWordList({ ...listOptions, ...settings }, lib);
    for (const shapes of layout.pages) for (const s of shapes.filter(s => s.type === 'text')) {
      const face = s.weight ? await fontDoc.embedFont(lib.StandardFonts.HelveticaBold) : font;
      assert(s.x >= 39.99 && s.x + face.widthOfTextAtSize(s.value, s.size) <= layout.width - 39.99);
      assert(s.y >= 33 && s.y <= layout.height - 32.99);
    }
  }
  const grouped = await P.prepareWordList({ ...listOptions, categories: C.categories.filter(c => c.mode === 'words') }, lib);
  const groupedWords = grouped.pages.flatMap(shapes => shapes.filter(s => s.type === 'text' && !s.weight && s.color === '#1a211f'));
  assert.equal(groupedWords.length, basic.reduce((n,e) => n + e.tags.length, 0));
  assert(groupedWords.filter(s => s.value === 'cançó').length > 1);
  fs.mkdirSync(path.join(root, 'output/pdf'), { recursive: true });
  fs.writeFileSync(path.join(root, 'output/pdf/llista-personalitzada.pdf'), custom.bytes);
  console.log('PDF: 40 variants d’una pàgina A4, dos formats i dues orientacions i tots els caràcters del banc comprovats. Dos exemples generats.');
  console.log('Lists: shared preview/PDF geometry, custom title, wrapping, font sizes 10–30, columns 1–4, landscape, pagination, complete alphabetical order and repeated focus words passed.');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
