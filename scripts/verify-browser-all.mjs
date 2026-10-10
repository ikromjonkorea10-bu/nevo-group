import { spawn } from 'node:child_process';
import http from 'node:http';

const CHROME_PATH = '/Users/pardaev/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const PORT = 9333;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getWsUrl() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const data = await res.json();
      if (data.webSocketDebuggerUrl) return data.webSocketDebuggerUrl;
    } catch {
      await sleep(200);
    }
  }
  throw new Error('Chrome did not start in time');
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
    this.events = [];
    this.consoleErrors = [];
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((res, rej) => {
      this.ws.onopen = res;
      this.ws.onerror = rej;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        if (msg.params.type === 'error') {
          const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
          this.consoleErrors.push(text);
        }
      }
      if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
        this.consoleErrors.push(msg.params.entry.text);
      }
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runAudit() {
  console.log('🚀 Starting Chrome for Testing headless verification...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1440,900'
  ], { stdio: 'ignore' });

  try {
    const wsUrl = await getWsUrl();
    const cdp = new CdpClient(wsUrl);
    await cdp.connect();

    await cdp.send('Target.setDiscoverTargets', { discover: true });
    // Create new target
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

    async function sendSession(method, params = {}) {
      const id = cdp.id++;
      return new Promise((resolve, reject) => {
        cdp.callbacks.set(id, { resolve, reject });
        cdp.ws.send(JSON.stringify({ id, sessionId, method, params }));
      });
    }

    await sendSession('Page.enable');
    await sendSession('Runtime.enable');
    await sendSession('Log.enable');

    const testUrls = [
      { name: 'Home (UZ)', url: 'http://localhost:4173/?preview=1&lang=uz' },
      { name: 'Home (RU)', url: 'http://localhost:4173/?preview=1&lang=ru' },
      { name: 'Home (EN)', url: 'http://localhost:4173/?preview=1&lang=en' },
      { name: 'Catalog Index (UZ)', url: 'http://localhost:4173/katalog?preview=1&lang=uz' },
      { name: 'Catalog Index (RU)', url: 'http://localhost:4173/katalog?preview=1&lang=ru' },
      { name: 'Catalog Index (EN)', url: 'http://localhost:4173/katalog?preview=1&lang=en' },
      { name: 'Category: Truba (UZ)', url: 'http://localhost:4173/katalog/truba-va-fitinglar?preview=1&lang=uz' },
      { name: 'Category: Zapor (RU)', url: 'http://localhost:4173/katalog/zapor-armatura?preview=1&lang=ru' },
      { name: 'Category: Yongin Low-Stock (UZ)', url: 'http://localhost:4173/katalog/yongin-jihozlari?preview=1&lang=uz' },
      { name: 'Category: Elektr Low-Stock (UZ)', url: 'http://localhost:4173/katalog/elektr-jihozlari?preview=1&lang=uz' }
    ];

    console.log('\n========================================================================');
    console.log('REAL BROWSER VERIFICATION (Chrome for Testing)');
    console.log('========================================================================\n');

    let totalBrokenImages = 0;
    let totalConsoleErrors = 0;

    for (const test of testUrls) {
      cdp.consoleErrors = [];
      await sendSession('Page.navigate', { url: test.url });
      await sleep(1500);

      const evalRes = await sendSession('Runtime.evaluate', {
        expression: `(async () => {
          const title = document.title;
          const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || 'NONE';
          const ogUrl = document.querySelector('meta[property="og:url"]')?.getAttribute('content') || 'NONE';
          
          const brokenImages = [];
          for (const img of Array.from(document.images)) {
            try {
              if (img.loading === 'lazy') img.loading = 'eager';
              await img.decode();
              if (img.naturalWidth === 0) {
                brokenImages.push({ src: img.src, id: img.id, className: img.className });
              }
            } catch (err) {
              brokenImages.push({ src: img.src, id: img.id, error: err?.message || 'Decode error' });
            }
          }
          const totalImages = document.images.length;
          const brandsLabel = document.querySelector('.brands-marquee-label')?.textContent?.trim() || '';
          const comingSoonBadges = Array.from(document.querySelectorAll('.coming-soon-badge, .coming-soon-pill, .category-notice-banner'))
            .map(el => el.textContent.trim());
          const stats = Array.from(document.querySelectorAll('.nevo-gauge-item')).map(el => {
            const num = el.querySelector('.nevo-metric-big-num')?.textContent?.trim();
            const title = el.querySelector('.nevo-gauge-title')?.textContent?.trim();
            return \`\${num} \${title}\`;
          });
          return {
            title,
            canonical,
            ogUrl,
            totalImages,
            brokenImages,
            brandsLabel,
            comingSoonBadges,
            stats
          };
        })()`,
        awaitPromise: true,
        returnByValue: true
      });

      const res = evalRes.result.value;
      const errors = [...cdp.consoleErrors];
      totalConsoleErrors += errors.length;
      totalBrokenImages += res.brokenImages.length;

      console.log(`TEST: ${test.name}`);
      console.log(`  URL:             ${test.url}`);
      console.log(`  <title>:         ${res.title}`);
      console.log(`  Canonical:       ${res.canonical}`);
      console.log(`  Total Images:    ${res.totalImages}`);
      console.log(`  Broken Images:   ${res.brokenImages.length} ${res.brokenImages.length ? JSON.stringify(res.brokenImages) : '✓'}`);
      console.log(`  Console Errors:  ${errors.length} ${errors.length ? JSON.stringify(errors) : '✓'}`);
      if (res.brandsLabel) {
        console.log(`  Brands Label:    "${res.brandsLabel}"`);
      }
      if (res.stats && res.stats.length) {
        console.log(`  Home Gauges:     [${res.stats.join(', ')}]`);
      }
      if (res.comingSoonBadges && res.comingSoonBadges.length) {
        console.log(`  Coming Soon:     Found ${res.comingSoonBadges.length} badge(s)`);
      }
      console.log('');
    }

    console.log('========================================================================');
    console.log(`SUMMARY: Total Broken Images: ${totalBrokenImages} | Total Console Errors: ${totalConsoleErrors}`);
    console.log('========================================================================');

    if (totalBrokenImages > 0 || totalConsoleErrors > 0) {
      process.exitCode = 1;
    }
  } finally {
    chrome.kill();
  }
}

runAudit().catch(err => {
  console.error('Fatal error during audit:', err);
  process.exit(1);
});
