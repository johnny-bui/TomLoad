import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const script = await readFile(new URL('../dist/tomload.iife.js', import.meta.url));
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/tomload.js' ? 'application/javascript' : 'text/html');
  res.end(req.url === '/tomload.js' ? script : `<!doctype html><html><head></head><body>
  <article id="card" style="position:relative;width:360px;height:260px">
    <h2>TomLoad Demo</h2><p>Content stays in place</p><button id="action" style="opacity:.8">Action</button>
  </article><script src="/tomload.js"></script></body></html>`);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch({ headless: true });

test.after(async () => { await browser.close(); await new Promise(resolve => server.close(resolve)); });
test('destroy restores host class, inline styles, aria-busy and canvas layers', async () => {
  const page = await browser.newPage();
  await page.goto(base);
  const result = await page.evaluate(async () => {
    const host = document.querySelector('#card');
    const button = document.querySelector('#action');
    const g = TomLoad.glyph(host);
    g.hide({instant:true});
    g.loading(true);
    g.destroy();
    g.destroy();
    await new Promise(r => setTimeout(r, 450));
    return {hidden: host.classList.contains('tl-hide'), hostClass:host.classList.contains('tl-host'),
      busy:host.hasAttribute('aria-busy'), opacity:button.style.opacity, layers:host.querySelectorAll('.tl-layer').length};
  });
  assert.deepEqual(result,{hidden:false,hostClass:false,busy:false,opacity:'.8',layers:0});
  await page.close();
});
test('interrupted reveal settles and leaves no leaked layers', async () => {
  const page = await browser.newPage();
  await page.goto(base);
  const result = await page.evaluate(async () => {
    const host = document.querySelector('#card');
    const g = TomLoad.glyph(host);
    await g.hide({ instant: true });
    const promise = g.reveal({speed: .2});
    g.destroy();
    await promise;
    await new Promise(r=>setTimeout(r,50));
    return {layers:host.querySelectorAll('.tl-layer').length, hidden:host.classList.contains('tl-hide')};
  });
  assert.deepEqual(result,{layers:0,hidden:false});
  await page.close();
});
test('reduced motion reveal completes without a lingering layer', async () => {
  const page = await browser.newPage({ reducedMotion:'reduce' });
  await page.goto(base);
  const result = await page.evaluate(async () => {
    const host = document.querySelector('#card');
    const g = TomLoad.glyph(host);
    await g.hide({instant:true});
    await g.reveal();
    const result = {hidden:host.classList.contains('tl-hide'),layers:host.querySelectorAll('.tl-layer').length};
    g.destroy();
    return result;
  });
  assert.deepEqual(result,{hidden:false,layers:0});
  await page.close();
});
