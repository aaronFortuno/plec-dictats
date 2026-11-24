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
  // One layout for the browser preview and the downloadable PDF, in PDF points.
  async function prepareWordList({ entries, title = '', subtitle = () => '', locale, categories, fontSize = 16, columns = 3, orientation = 'portrait' }, library = root.PDFLib) {
    if (!library) throw new Error('No s’ha carregat l’eina de PDF. Torna a obrir el web.');
    const { PDFDocument, StandardFonts, rgb } = library;
    if (!entries.length) throw new Error('No hi ha mots per imprimir amb aquests filtres.');
    const collator = new Intl.Collator(locale);
    const ordered = [...entries].sort((a, b) => collator.compare(a.text, b.text));
    const groups = categories
      ? categories.map(({ id, label }) => ({ label, entries: ordered.filter(entry => entry.tags.includes(id)) })).filter(group => group.entries.length)
      : [{ label: '', entries: ordered }];
    if (!groups.length) throw new Error('No hi ha mots per imprimir amb aquests filtres.');

    const doc = await PDFDocument.create();
    doc.setTitle(title);
    doc.setAuthor('Plec');
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const ptPerMm = 72 / 25.4;
    const landscape = orientation === 'landscape';
    const width = (landscape ? 297 : 210) * ptPerMm;
    const height = (landscape ? 210 : 297) * ptPerMm;
    const margin = 40;
    const columnGap = 18;
    fontSize = Math.min(30, Math.max(10, Number(fontSize) || 16));
    columns = Math.min(4, Math.max(1, Math.round(Number(columns) || 3)));
    const columnWidth = (width - 2 * margin - (columns - 1) * columnGap) / columns;
    const rowHeight = fontSize * 1.3625;
    function wrap(value, font, size, maxLines = Infinity) {
      const lines = [''];
      for (const char of printable(String(value)).replace(/\s+/g, ' ').trim()) {
        const last = lines.length - 1;
        if (font.widthOfTextAtSize(lines[last] + char, size) > width - 2 * margin) {
          const space = lines[last].lastIndexOf(' ');
          const carry = space > 0 ? lines[last].slice(space + 1) : '';
          if (space > 0) lines[last] = lines[last].slice(0, space);
          if (lines.length === maxLines) { lines[last] = lines[last].slice(0, -3) + '...'; break; }
          lines.push((carry + char).trimStart());
        } else lines[last] += char;
      }
      return lines;
    }
    title = String(title).slice(0, 120).trim();
    const headings = wrap(title, bold, 25);
    const pages = [];
    for (const group of groups) {
      const caption = [group.label, subtitle(group.entries.length)].filter(Boolean).join(' · ');
      const captions = wrap(caption, regular, 11, 2);
      const headerExtra = (headings.length - 1) * 29 + (captions.length - 1) * 14;
      const firstRow = 123 + headerExtra + Math.max(0, fontSize - 16);
      const rowsPerColumn = Math.max(1, Math.floor((height - firstRow - 64) / rowHeight) + 1);
      const pageCapacity = columns * rowsPerColumn;
      for (let start = 0; start < group.entries.length; start += pageCapacity) {
        pages.push({ captions, headerExtra, firstRow, items: group.entries.slice(start, start + pageCapacity) });
      }
    }
    const ink = '#1a211f', muted = '#545c59', rule = '#c7ccca';
    const color = hex => rgb(...[1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255));
    let fittedCount = 0;
    const previews = [];
    for (const [index, { captions, headerExtra, firstRow, items }] of pages.entries()) {
      const page = doc.addPage([width, height]);
      const shapes = [];
      function text(value, x, top, size, weight = false, fill = ink) {
        page.drawText(value, { x, y: height - top, size, font: weight ? bold : regular, color: color(fill) });
        shapes.push({ type: 'text', value, x, y: top, size, weight, color: fill });
      }
      function line(top) {
        page.drawLine({ start: { x: margin, y: height - top }, end: { x: width - margin, y: height - top }, thickness: .6, color: color(rule) });
        shapes.push({ type: 'line', x: margin, x2: width - margin, y: top, color: rule });
      }
      const rows = Math.ceil(items.length / columns);
      headings.forEach((value, row) => text(value, margin, 59 + row * 29, 25, true));
      captions.forEach((value, row) => text(value, margin, 82 + (headings.length - 1) * 29 + row * 14, 11, false, muted));
      line(96 + headerExtra);

      items.forEach((entry, index) => {
        const word = printable(entry.text);
        const column = Math.floor(index / rows);
        const row = index % rows;
        const size = Math.min(fontSize, fontSize * columnWidth / regular.widthOfTextAtSize(word, fontSize));
        if (size < fontSize - .01) fittedCount++;
        text(word, margin + column * (columnWidth + columnGap), firstRow + row * rowHeight, size);
      });

      const number = `${index + 1} / ${pages.length}`;
      text('Plec · plec.ortogra.fi', margin, height - 33, 10, false, muted);
      text(number, width - margin - regular.widthOfTextAtSize(number, 10), height - 33, 10, false, muted);
      previews.push(shapes);
    }
    return { bytes: await doc.save(), pages: previews, width, height, fittedCount };
  }
  async function buildWordList(options, library = root.PDFLib) { return (await prepareWordList(options, library)).bytes; }
  root.PlecPdf = { build, buildWordList, prepareWordList, printable };
  if (typeof module !== 'undefined') module.exports = root.PlecPdf;
})(typeof window === 'undefined' ? globalThis : window);
