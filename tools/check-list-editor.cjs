'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const lib = name => require(process.env.PLEC_NODE_MODULES ? path.join(process.env.PLEC_NODE_MODULES, name) : name);
const { chromium } = lib('playwright'), { PDFDocument } = lib('pdf-lib');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4176' ? route.continue() : route.abort());
    await page.goto('http://127.0.0.1:4176/ca/');
    await page.waitForSelector('#sheet-preview svg');
    await page.click('#catalog-open');
    await page.check('#catalog-basic'); await page.selectOption('#catalog-stage', 'all');
    await page.click('#export-catalog-pdf');
    const ready = () => page.waitForFunction(() => !document.querySelector('#list-download').disabled);
    await ready();
    assert.equal(await page.locator('#list-title').inputValue(), 'Vocabulari bàsic');
    assert.equal(await page.locator('#list-page-number').textContent(), 'Pàgina 1 de 4');
    assert(await page.locator('#catalog-dialog').evaluate(el => el.open));
    await page.click('#list-next'); assert.equal(await page.locator('#list-page-number').textContent(), 'Pàgina 2 de 4');
    await page.fill('#list-title', 'El mural de cinquè');
    await page.fill('#list-font-size', '28'); await page.selectOption('#list-columns', '2'); await page.selectOption('#list-orientation', 'landscape');
    await ready();
    assert((await page.locator('#list-page').textContent()).includes('El mural de cinquè'));
    const ratio = await page.locator('#list-page svg').evaluate(el => el.viewBox.baseVal.width / el.viewBox.baseVal.height);
    assert(ratio > 1);
    const pending = page.waitForEvent('download'); await page.click('#list-download');
    const file = await pending; assert.equal(file.suggestedFilename(), 'plec-ca-vocabulari-basic.pdf');
    const pdf = await PDFDocument.load(fs.readFileSync(await file.path()));
    assert.equal(pdf.getTitle(), 'El mural de cinquè');
    assert(pdf.getPage(0).getWidth() > pdf.getPage(0).getHeight());
    assert.equal(await page.locator('#list-page-number').textContent(), `Pàgina 2 de ${pdf.getPageCount()}`);
    await page.screenshot({ path: 'output/list-editor-desktop.png', animations: 'disabled' });
    await page.fill('#list-font-size', '');
    await page.waitForFunction(() => document.querySelector('#list-preview-status').textContent.includes('entre 10 i 30'));
    assert(await page.locator('#list-download').isDisabled());
    await page.fill('#list-font-size', '18'); await ready();
    // A slow obsolete render must not replace the newest preview or downloadable bytes.
    await page.evaluate(() => {
      const original = PlecPdf.prepareWordList;
      PlecPdf.prepareWordList = async options => { if (options.title === 'Antic') await new Promise(r => setTimeout(r, 700)); return original(options); };
    });
    await page.fill('#list-title', 'Antic'); await page.waitForTimeout(300);
    await page.fill('#list-title', 'Actual'); await ready(); await page.waitForTimeout(750);
    assert((await page.locator('#list-page').textContent()).includes('Actual'));
    assert(!(await page.locator('#list-page').textContent()).includes('Antic'));
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
      const bounds = await page.locator('#list-editor').evaluate(el => {
        const r = el.getBoundingClientRect(), p = el.querySelector('.list-editor-preview').getBoundingClientRect();
        return { width: r.width, top: r.top, bottom: r.bottom, previewHeight: p.height, scroll: el.scrollWidth, client: el.clientWidth };
      });
      assert(bounds.width <= width && bounds.top >= 0 && bounds.bottom <= 844.1 && bounds.previewHeight >= 160);
      assert.equal(bounds.scroll, bounds.client);
      assert(await page.locator('#list-download').isVisible());
      await page.screenshot({ path: `output/list-editor-mobile-${width}.png`, animations: 'disabled' });
    }
    await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('#list-editor').open);
    assert(await page.locator('#catalog-dialog').evaluate(el => el.open));
    assert(await page.locator('#export-catalog-pdf').evaluate(el => el === document.activeElement));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.click('#export-focus-pdf'); await ready();
    assert.equal(await page.locator('#list-title').inputValue(), 'Vocabulari bàsic');
    assert((await page.locator('#list-page').textContent()).includes('Accentuació'));
    // Transient failure can be recovered by changing a control; no stale download is offered.
    await page.evaluate(() => { const original = PlecPdf.prepareWordList; let fail = true; PlecPdf.prepareWordList = options => { if (fail) { fail = false; throw Error('test-only'); } return original(options); }; });
    await page.fill('#list-title', 'Prova');
    await page.waitForFunction(() => document.querySelector('#list-preview-status').textContent.includes('No s’ha pogut'));
    assert(await page.locator('#list-download').isDisabled());
    await page.click('#list-reset'); await ready();
    await page.screenshot({ path: 'output/list-editor-focus-dark.png', animations: 'disabled' });
    assert.deepEqual(errors, []);
    console.log('List editor: A4 preview, complete pagination, title/font/columns/orientation, matching download, stale render protection, invalid input, recovery, focus return and dark mobile layout passed.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
