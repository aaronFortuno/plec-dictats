(function (root) {
  'use strict';
  const printable = value => value.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/[^\x20-\x7e\xa0-\xff€]/g, '?');
  async function build(options, teacher, categories, library = root.PDFLib, core = root.PlecCore) {
    if (!library) throw new Error('No s’ha carregat l’eina de PDF. Torna a obrir el web.');
    const { PDFDocument, StandardFonts, rgb } = library;
    const doc = await PDFDocument.create();
    doc.setTitle(`${options.title || 'Dictat'}${options.seedCode ? ' · ' + options.seedCode : ''}${teacher ? ' · Guia docent' : ''}`);
    doc.setAuthor('Plec'); doc.setSubject('Dictat autocorrectiu en català');
    const regular = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const PT = 72 / 25.4, page = doc.addPage([210 * PT, 297 * PT]);
    const shapes = teacher ? core.teacherSheet(options, [...categories, { id: 'custom', label: 'Personalitzada' }]) : core.worksheet({ ...options, hidden: false });
    const color = hex => rgb(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255);
    for (const s of shapes) {
      if (s.type === 'line') {
        page.drawLine({ start: { x: s.x * PT, y: (297 - s.y) * PT }, end: { x: s.x2 * PT, y: (297 - s.y2) * PT }, color: color(s.color), thickness: s.width * PT, ...(s.dash ? { dashArray: [1.5 * PT, 1.4 * PT] } : {}) });
      } else if (s.type === 'rect') {
        page.drawRectangle({ x: s.x * PT, y: (297 - s.y - s.h) * PT, width: s.w * PT, height: s.h * PT, color: color(s.color) });
      } else if (s.type === 'polyline') {
        const path = 'M '+s.points.map(p=>p.join(' ')).join(' L ')+(s.fill?' Z':'');
        page.drawSvgPath(path, {x:0,y:297*PT,scale:PT,borderWidth:s.width,borderColor:color(s.color),...(s.fill?{color:color(s.fill)}:{}),...(s.dash?{borderDashArray:[.8,.7]}:{})});
      } else {
        const value = printable(s.value), font = s.weight ? bold : regular;
        const width = font.widthOfTextAtSize(value, s.size);
        const size = s.maxWidth ? Math.min(s.size, s.size * s.maxWidth * PT / Math.max(1, width)) : s.size;
        const actualWidth = font.widthOfTextAtSize(value, size);
        const offset = s.align === 'right' ? actualWidth : s.align === 'center' ? actualWidth / 2 : 0;
        page.drawText(value, { x: s.x * PT - offset, y: (297 - s.y) * PT, size, font, color: color(s.color) });
      }
    }
    return doc.save();
  }
  root.PlecPdf = { build, printable };
  if (typeof module !== 'undefined') module.exports = root.PlecPdf;
})(typeof window === 'undefined' ? globalThis : window);
