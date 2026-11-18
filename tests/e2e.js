const { chromium } = require('playwright');
const URL = process.argv[2] || 'https://tintashift.vercel.app/';   // node tests/e2e.js [url]
const res = [];
const ok = (n, c, d = '') => res.push(`${c ? 'PASS' : 'FAIL'}  ${n}${d ? '  (' + d + ')' : ''}`);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [dev, vp] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: dev === 'phone' });
    const pg = await ctx.newPage();
    const errs = [], bad = [];
    pg.on('pageerror', (e) => errs.push(e.message));
    pg.on('response', (r) => { if (r.status() >= 400 && !/_vercel/.test(r.url())) bad.push(r.status() + ' ' + r.url().slice(-50)); });
    await pg.goto(URL + '?t=' + Date.now(), { waitUntil: 'networkidle' });
    await pg.waitForTimeout(1500);
    const t = (s) => pg.textContent(s).catch(() => '');
    ok(`${dev}: page loads with canvas`, await pg.isVisible('canvas'));
    ok(`${dev}: colour picker on opening shot`, await pg.isVisible('.panel-dots'));
    const sets = await pg.$$('.panel .set');
    ok(`${dev}: 5 nail sets`, sets.length === 5, sets.length);
    await sets[2].click(); await pg.waitForTimeout(900);
    ok(`${dev}: set switch marks chip`, (await sets[2].getAttribute('aria-checked')) === 'true');
    await pg.click('.cta-row .pill.outline'); await pg.waitForTimeout(1800);
    ok(`${dev}: Try it on opens close-up`, await pg.isVisible('.back'));
    ok(`${dev}: close-up shows colour drops`, await pg.isVisible('.panel-dots'));
    ok(`${dev}: headline hidden in close-up`, (await pg.$eval('.hero-copy', (e) => getComputedStyle(e).opacity)) === '0');
    await pg.click('.dot[aria-label="Cherry"]'); await pg.waitForTimeout(500);
    ok(`${dev}: colour name updates`, (await t('.panel-head b')).includes('Cherry'));
    await pg.click('.panel .pill.wide'); await pg.waitForTimeout(800);
    ok(`${dev}: Add to bag opens bag`, await pg.isVisible('.bag'));
    const href = await pg.getAttribute('.bag footer a', 'href');
    ok(`${dev}: checkout link to Shopify`, /tintashift\.store\/cart\/\d+:1/.test(href || ''), href);
    await pg.click('.bag header button'); await pg.waitForTimeout(600);
    await pg.click('.back'); await pg.waitForTimeout(1500);
    ok(`${dev}: back returns to opening`, !(await pg.isVisible('.back')));
    ok(`${dev}: bag count kept`, (await t('.bag-count')).trim() === '1');
    await pg.reload({ waitUntil: 'networkidle' });
    ok(`${dev}: bag survives reload`, (await t('.bag-count')).trim() === '1');
    const prods = await pg.$$eval('#shop .prod', (p) => p.length);
    ok(`${dev}: shop lists products`, prods >= 7, prods);
    await pg.evaluate(() => scrollTo(0, document.body.scrollHeight)); await pg.waitForTimeout(800);
    ok(`${dev}: no sideways scroll`, (await pg.evaluate(() => document.documentElement.scrollWidth)) <= vp.width);
    ok(`${dev}: no page errors`, errs.length === 0, errs.slice(0, 2).join(' | '));
    ok(`${dev}: no broken files`, bad.length === 0, bad.slice(0, 3).join(' | '));
    await ctx.close();
  }
  console.log(res.join('\n'));
  await b.close();
})();
