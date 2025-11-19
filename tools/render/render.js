const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node render.js <url>');
    process.exit(1);
  }
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);
  // Some sites require a UA to avoid bot-challenges
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36');

  await page.goto(url, { waitUntil: 'networkidle2' });
  // Wait for the app root to render visible content
  await page.waitForSelector('#app', { timeout: 45000 });
  // Heuristic: wait for any input fields or buttons to appear
  await page.waitForFunction(() => {
    const el = document.querySelector('#app');
    if (!el) return false;
    const inputs = el.querySelectorAll('input, button, select, textarea');
    return inputs.length > 0;
  }, { timeout: 45000 });

  // Grab the outer HTML of the body
  const html = await page.content();

  // Save full page HTML
  const outDir = path.resolve(__dirname, '../../public-source');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'remote-render.html');
  fs.writeFileSync(outFile, html);

  // Additionally, capture a screenshot for reference
  const shotsDir = path.resolve(__dirname, '../../public-source');
  await page.setViewport({ width: 1440, height: 1200 });
  await page.screenshot({ path: path.join(shotsDir, 'render.png'), fullPage: true });

  await browser.close();
  console.log('Saved:', outFile);
})();
