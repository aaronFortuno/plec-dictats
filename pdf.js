(function (root) {
  'use strict';
  const printable = value => value.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/[^\x20-\x7e\xa0-\xff€]/g, '?');
  async function build(options, library = root.PDFLib, core = root.PlecCore) {
    if (!library) throw new Error('No s’ha carregat l’eina de PDF. Torna a obrir el web.');
    const { PDFDocument, StandardFonts, rgb } = library;
    const doc = await PDFDocument.create();
    doc.setTitle(`${options.title || 'Dictat'}${options.seedCode ? ' · ' + options.seedCode : ''}`);
    doc.setAuthor('Plec'); doc.setSubject(root.PlecLanguageTools?.text('Dictat autocorrectiu en català') ?? 'Dictat autocorrectiu en català');
    const regular = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const PT = 72 / 25.4, page = doc.addPage([210 * PT, 297 * PT]);
    const shapes = core.worksheet(options);
    const color = hex => rgb(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255);
    for (const s of shapes) {
      if (s.type === 'line') {
        page.drawLine({ start: { x: s.x * PT, y: (297 - s.y) * PT }, end: { x: s.x2 * PT, y: (297 - s.y2) * PT }, color: color(s.color), thickness: s.width * PT, ...(s.dash ? { dashArray: [1.5 * PT, 1.4 * PT] } : {}) });
      } else if (s.type === 'rect') {
        page.drawRectangle({ x: s.x * PT, y: (297 - s.y - s.h) * PT, width: s.w * PT, height: s.h * PT, color: color(s.color) });
      } else if (s.type === 'path') {
        page.drawSvgPath(s.d,{x:s.x*PT,y:(297-s.y)*PT,scale:s.scale*PT,...(s.fill?{color:color(s.color)}:{borderColor:color(s.color),borderWidth:s.width,borderLineCap:1})});
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
  async function buildWordList({ entries, title, subtitle, locale, categories }, library = root.PDFLib) {
    if (!library) throw new Error('No s’ha carregat l’eina de PDF. Torna a obrir el web.');
    const { PDFDocument, StandardFonts, rgb } = library;
    if (!entries.length) throw new Error('No hi ha mots per imprimir amb aquests filtres.');
    const collator = new Intl.Collator(locale);
    const ordered = [...entries].sort((a, b) => collator.compare(a.text, b.text));
    const groups = categories
      ? categories.map(({ id, label }) => ({ label, entries: ordered.filter(entry => entry.tags.includes(id)) })).filter(group => group.entries.length)
      : [{ label: '', entries: ordered }];

    const doc = await PDFDocument.create();
    doc.setTitle(title);
    doc.setAuthor('Plec');
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const ptPerMm = 72 / 25.4;
    const width = 210 * ptPerMm;
    const height = 297 * ptPerMm;
    const margin = 40;
    const columnGap = 18;
    const columns = 3;
    const columnWidth = (width - 2 * margin - (columns - 1) * columnGap) / columns;
    const rowsPerColumn = 31;
    const rowHeight = 21.8;
    const pageCapacity = columns * rowsPerColumn;
    const pages = [];
    for (const group of groups) {
      for (let start = 0; start < group.entries.length; start += pageCapacity) {
        pages.push({ label: group.label, count: group.entries.length, items: group.entries.slice(start, start + pageCapacity) });
      }
    }
    const ink = rgb(.1, .13, .12), muted = rgb(.33, .36, .35), rule = rgb(.78, .8, .79);
    for (const [index, { label, count, items }] of pages.entries()) {
      const page = doc.addPage([width, height]);
      const rows = Math.ceil(items.length / columns);
      const heading = printable(label || title);
      const headingSize = Math.min(25, 25 * (width - 2 * margin) / bold.widthOfTextAtSize(heading, 25));
      const caption = subtitle(count);
      let fittedCaption = printable((label ? title + ' · ' + caption : caption).replace(/\s+/g, ' ').trim().slice(0, 160));
      while (regular.widthOfTextAtSize(fittedCaption, 11) > width - 2 * margin) {
        fittedCaption = fittedCaption.replace(/.{2}$/, '…');
      }
      page.drawText(heading, { x: margin, y: height - 59, size: headingSize, font: bold, color: ink });
      page.drawText(fittedCaption, { x: margin, y: height - 82, size: 11, font: regular, color: muted });
      page.drawLine({ start: { x: margin, y: height - 96 }, end: { x: width - margin, y: height - 96 }, thickness: .6, color: rule });

      items.forEach((entry, index) => {
        const word = printable(entry.text);
        const column = Math.floor(index / rows);
        const row = index % rows;
        const size = Math.min(16, 16 * columnWidth / regular.widthOfTextAtSize(word, 16));
        page.drawText(word, { x: margin + column * (columnWidth + columnGap), y: height - 123 - row * rowHeight, size, font: regular, color: ink });
      });

      const number = `${index + 1} / ${pages.length}`;
      page.drawText('Plec · plec.ortogra.fi', { x: margin, y: 33, size: 10, font: regular, color: muted });
      page.drawText(number, { x: width - margin - regular.widthOfTextAtSize(number, 10), y: 33, size: 10, font: regular, color: muted });
    }
    return doc.save();
  }
  root.PlecPdf = { build, buildWordList, printable };
  if (typeof module !== 'undefined') module.exports = root.PlecPdf;
})(typeof window === 'undefined' ? globalThis : window);
