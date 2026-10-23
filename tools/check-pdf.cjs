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
      for (const foldStyle of ['thirds', 'quarter']) for (const modelSide of ['left', 'right']) for (const teacher of [false, true]) {
        const bytes = await P.build({ ...options, modelSide, foldStyle }, teacher, C.categories, lib, K);
        const pdf = await lib.PDFDocument.load(bytes);
        assert.equal(pdf.getPageCount(), 1);
        const page = pdf.getPage(0); assert(Math.abs(page.getWidth() - 595.2756) < .01); assert(Math.abs(page.getHeight() - 841.8898) < .01);
        fs.writeFileSync(path.join(root, 'tmp', `${mode}-${count}-${foldStyle}-${modelSide}${teacher ? '-guia' : ''}.pdf`), bytes);
      }
      const folds = K.worksheet(options).filter(s => s.type === 'line' && s.dash);
      assert.deepEqual(folds.map(s => s.x), [70, 140]);
    }
  }
  const words = ['avió','cinema','passadís','metge','llapis','examen','cançó','tassa','plaça','hivern','ahir','coet','viatge','platja','vaixell','beure','carro','guitarra','mosquit','guineu','muntanya','motxilla','raïm','col·legi'];
  const entries = words.map(t => C.entries.find(e => e.text === t && e.mode === 'words')); assert(entries.every(Boolean));
  for(const foldStyle of ['thirds','quarter']) {
    const name=foldStyle==='thirds'?'tercos':'quart';
    fs.writeFileSync(path.join(root,'output','exemple-'+name+'-24.pdf'),await P.build({entries,mode:'words',foldStyle,modelSide:'left',title:'Dictat de paraules',code:'P-EXEMPLE'},false,C.categories,lib,K));
  }
  // Tots els caràcters del banc són codificables amb la font del PDF.
  const fontDoc = await lib.PDFDocument.create(), font = await fontDoc.embedFont(lib.StandardFonts.Helvetica);
  C.entries.forEach(e => font.encodeText(e.text));
  console.log('PDF: 80 variants d’una pàgina A4, dos formats i dues orientacions i tots els caràcters del banc comprovats. Dos exemples generats.');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
