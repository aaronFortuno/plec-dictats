'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const library = name => require(process.env.PLEC_NODE_MODULES ? path.join(process.env.PLEC_NODE_MODULES, name) : name);
const { chromium } = library('playwright');
const { PDFDocument } = library('pdf-lib');
const origin = 'http://127.0.0.1:4176';

async function main() {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [], audioRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      if (/^\/(?:assets\/)?audio\//.test(url.pathname)) audioRequests.push(url.pathname);
      return route.continue();
    });
    await page.goto(origin + '/ca/?seed=ADZ52356A');
    await page.waitForSelector('#sheet-preview svg');
    const menu = page.locator('#language-toggle');
    await menu.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Escape');
    assert(await menu.evaluate(element => element === document.activeElement));
    await menu.click();
    await page.getByRole('link', { name: 'Español' }).click();
    await page.waitForSelector('#sheet-preview svg');
    assert.equal(new URL(page.url()).pathname, '/es/');
    assert.equal(await page.locator('html').getAttribute('lang'), 'es');
    assert.equal(await page.locator('#word-total').textContent(), '350');
    assert(await page.locator('#mode-control').isHidden());
    assert.equal(await page.locator('#pronunciation-variety').inputValue(),'es-es');
    assert(await page.locator('#open-student').isVisible());
    await page.screenshot({ path: 'output/plec-es-preparador.png', animations: 'disabled' });

    await page.selectOption('#count-control', '12');
    await page.evaluate(() => {
      const options = [...document.querySelectorAll('#tag-options input')];
      for (const option of options) option.checked = option.value === 'bv';
      options[0].dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.fill('#required-word', 'biblioteca');
    await page.press('#required-word', 'Enter');
    await page.waitForFunction(() => document.querySelector('#search-status').textContent.includes('Código encontrado'));
    const code = await page.locator('#seed-code').textContent();
    assert.match(code, /^ES-/);
    const selected = await page.evaluate(code => PlecSeeds.resolve(PlecSeedRegistry.editions, code), code);
    assert(selected.entries.some(entry => entry.text === 'biblioteca'));
    assert(selected.entries.every(entry => entry.tags.includes('bv')));
    const worksheet = await page.locator('#sheet-preview').textContent();
    assert(worksheet.includes('ESCRIBO Y REVISO') && worksheet.includes('/es/dictat/'));
    assert(worksheet.includes('variety=es-es'));
    await page.selectOption('#fold-style-control', 'quarter');
    await page.locator('#model-side-control [data-side="right"]').click();
    assert.equal(await page.locator('#sheet-preview svg').getAttribute('data-model-side'), 'right');
    const worksheetDownload = page.waitForEvent('download');
    await page.click('#download-pdf');
    const worksheetFile = await (await worksheetDownload).path();
    assert.equal((await PDFDocument.load(fs.readFileSync(worksheetFile))).getPageCount(), 1);
    await page.reload();
    await page.waitForSelector('#sheet-preview svg');
    assert.equal(await page.locator('#seed-code').textContent(), code);
    await page.fill('#recover-code', code.toLowerCase().replaceAll('-', ' '));
    await page.locator('#recover-form button').click();
    assert.equal(await page.locator('#seed-code').textContent(), code);
    await page.fill('#recover-code', 'ADZ52356A');
    await page.locator('#recover-form button').click();
    assert.match(await page.locator('#status').textContent(), /prefijo ES/);

    await page.click('#catalog-open');
    assert.equal(await page.locator('#catalog-title').textContent(), 'El catálogo');
    assert.equal(await page.locator('#catalog-initials a').count(), 27);
    await page.fill('#catalog-search', 'nino');
    assert.equal(await page.locator('.pronunciation-row').count(), 0);
    await page.fill('#catalog-search', 'niño');
    assert.equal(await page.locator('.pronunciation-word').textContent(), 'niño');
    const play = page.getByRole('button',{name:'Escuchar niño con Elvira'});
    const catalogClip = page.waitForResponse(response=>decodeURIComponent(new URL(response.url()).pathname).endsWith('/words/niño.mp3')&&response.ok());
    await play.click();
    await catalogClip;
    const listDownload = page.waitForEvent('download');
    await page.click('#export-focus-pdf');
    const list = await listDownload;
    assert.equal(list.suggestedFilename(), 'plec-es-vocabulario-basico-grafias.pdf');
    const listDoc = await PDFDocument.load(fs.readFileSync(await list.path()));
    assert.equal(listDoc.getPageCount(), 2); // «niño» belongs to Sin tilde and Ñ / CH.
    await page.fill('#catalog-search', '');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'output/plec-es-catalogo-mobil.png', animations: 'disabled' });
    await page.locator('#catalog-dialog [data-close]').click();
    await page.waitForFunction(() => !document.querySelector('#catalog-dialog').open);
    await page.setViewportSize({ width: 320, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await menu.click();
    assert(await page.getByRole('link', { name: 'Català' }).isVisible());
    await page.screenshot({ path: 'output/plec-es-idioma-mobil.png', animations: 'disabled' });
    await page.keyboard.press('Escape');
    await page.click('#workspace-toggle-config');
    assert.equal(await page.locator('#workspace-toggle-config').getAttribute('aria-expanded'), 'true');
    await page.click('#workspace-toggle-config');
    await page.click('#workspace-toggle-management');
    assert.equal(await page.locator('#copy-link').getAttribute('aria-label'), 'Copiar el enlace de la hoja en el preparador');
    assert.equal(await page.locator('#copy-student-link').textContent(), 'Copiar el enlace para el alumnado');
    assert(await page.locator('.seed-code-row').evaluate(row => {
      const code = document.getElementById('seed-code');
      const copy = document.getElementById('copy-code');
      const share = document.getElementById('copy-link');
      return code.scrollWidth <= code.clientWidth &&
        copy.getBoundingClientRect().right < share.getBoundingClientRect().left &&
        share.getBoundingClientRect().right <= row.getBoundingClientRect().right;
    }), 'The full Spanish code and both icons fit at 320px');

    await page.goto(origin + '/es/dictat/?seed=' + code);
    await page.waitForSelector('#ready-panel:not([hidden])');
    assert.equal(await page.locator('#dictation-variety').textContent(),'Español de España · Elvira');
    assert.equal(await page.locator('[data-analytics-settings]').count(),0);
    assert.match(await page.locator('#instructions').textContent(), /12 palabras/);
    assert.equal(new URL(page.url()).searchParams.get('variety'),'es-es');
    await page.evaluate(()=>{ document.querySelector('#focus-root').requestFullscreen=()=>Promise.reject(Error('Fullscreen unavailable in test')); });
    await page.click('#start-dictation');
    await page.click('#windowed-start');
    assert.equal(await page.locator('#word-progress').textContent(),'Palabra 1 de 12');
    const studentClip = page.waitForResponse(response=>decodeURIComponent(new URL(response.url()).pathname).endsWith('/words/'+selected.entries[0].text+'.mp3')&&response.ok());
    await page.click('#listen-word');
    await studentClip;
    await page.waitForFunction(()=>document.querySelector('#listen-count').textContent==='1 de 3 escuchas');
    assert(audioRequests.some(url=>url.startsWith('/assets/audio/es/es-es-elvira-basic-v1/')));
    assert(!audioRequests.some(url=>url.startsWith('/assets/audio/ca/')||url.includes('/instructions/')));
    assert.deepEqual(errors, []);
    console.log('Spanish: filters, recovery, worksheet QR, catalogue audio, legacy link and real student playback passed.');
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
