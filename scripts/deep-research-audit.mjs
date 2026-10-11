import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = '/Users/pardaev/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const PORT = 9444;

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
    this.consoleErrors = [];
    this.failedRequests = [];
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
      if (msg.method === 'Network.responseReceived') {
        if (msg.params.response.status >= 400) {
          this.failedRequests.push({ url: msg.params.response.url, status: msg.params.response.status });
        }
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

async function runDeepAudit() {
  console.log('🚀 Launching Deep Research Chrome Auditor...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1440,900'
  ], { stdio: 'ignore' });

  const screenshotDir = path.join(process.cwd(), 'docs', 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  try {
    const wsUrl = await getWsUrl();
    const cdp = new CdpClient(wsUrl);
    await cdp.connect();

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
    await sendSession('Network.enable');

    const routes = [
      { id: 'home', path: '/?preview=1&lang=uz', name: 'Home Page' },
      { id: 'catalog-index', path: '/katalog?preview=1&lang=uz', name: 'Catalog Index' },
      { id: 'category-truba', path: '/katalog/truba-va-fitinglar?preview=1&lang=uz', name: 'Category: Truba' },
      { id: 'category-zapor', path: '/katalog/zapor-armatura?preview=1&lang=uz', name: 'Category: Zapor' },
      { id: 'product-detail', path: '/katalog/mahsulot/vrezka-xomuti-20-15-nevo?preview=1&lang=uz', name: 'Product Detail' },
      { id: 'cart', path: '/savat?preview=1&lang=uz', name: 'Cart Page' },
      { id: 'selection-guide', path: '/tanlash?preview=1&lang=uz', name: 'Selection Guide' },
      { id: 'bulk-orders', path: '/katta-buyurtma?preview=1&lang=uz', name: 'Bulk Order Page' },
      { id: 'contact', path: '/aloqa?preview=1&lang=uz', name: 'Contact Page' },
      { id: 'privacy', path: '/maxfiylik-siyosati?preview=1&lang=uz', name: 'Privacy Policy' },
    ];

    const report = {
      routes: [],
      globalFindings: {
        totalConsoleErrors: 0,
        totalFailedRequests: 0,
        unlabelledButtons: [],
        missingAltImages: [],
        overflowIssues: []
      }
    };

    for (const r of routes) {
      console.log(`\nAuditing route: ${r.name} (${r.path})`);
      cdp.consoleErrors = [];
      cdp.failedRequests = [];

      // 1. Desktop (1440x900)
      await sendSession('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false
      });

      await sendSession('Page.navigate', { url: `http://localhost:4173${r.path}` });
      await sleep(r.id === 'home' ? 3200 : 1500);

      // Desktop screenshot
      const { data: dData } = await sendSession('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
      fs.writeFileSync(path.join(screenshotDir, `${r.id}-desktop.jpg`), Buffer.from(dData, 'base64'));

      // Check overflow & DOM inspection
      const pageEval = await sendSession('Runtime.evaluate', {
        expression: `(async () => {
          const body = document.body;
          const docEl = document.documentElement;
          const scrollWidth = Math.max(body.scrollWidth, docEl.scrollWidth);
          const clientWidth = docEl.clientWidth;
          const hasHorizontalOverflow = scrollWidth > clientWidth;

          const images = Array.from(document.images);
          const brokenImages = [];
          for (const img of images) {
            try {
              if (img.loading === 'lazy') img.loading = 'eager';
              await img.decode();
              if (img.naturalWidth === 0) brokenImages.push(img.src);
            } catch {
              brokenImages.push(img.src);
            }
          }
          const missingAlt = images.filter(img => !img.hasAttribute('alt') || img.getAttribute('alt').trim() === '').map(img => img.src);

          const buttons = Array.from(document.querySelectorAll('button, a[role="button"]'));
          const unlabelledBtns = buttons.filter(b => {
            const text = b.innerText.trim();
            const ariaLabel = b.getAttribute('aria-label');
            const title = b.getAttribute('title');
            return !text && !ariaLabel && !title;
          }).map(b => b.outerHTML.slice(0, 100));

          const landmarks = {
            hasHeader: !!document.querySelector('header'),
            hasMain: !!document.querySelector('main'),
            hasNav: !!document.querySelector('nav'),
            hasFooter: !!document.querySelector('footer'),
          };

          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => ({
            tag: h.tagName,
            text: h.textContent.trim().slice(0, 60)
          }));

          const metaRobots = document.querySelector('meta[name="robots"]')?.getAttribute('content');
          const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
          const description = document.querySelector('meta[name="description"]')?.getAttribute('content');

          const domNodesCount = document.querySelectorAll('*').length;

          return {
            title: document.title,
            canonical,
            metaRobots,
            description,
            hasHorizontalOverflow,
            scrollWidth,
            clientWidth,
            totalImages: images.length,
            brokenImages,
            missingAlt,
            totalButtons: buttons.length,
            unlabelledBtns,
            landmarks,
            headings,
            domNodesCount
          };
        })()`,
        awaitPromise: true,
        returnByValue: true
      });

      const desktopResult = pageEval.result.value;

      // 2. Mobile (390x844)
      await sendSession('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        mobile: true
      });
      await sleep(800);

      const { data: mData } = await sendSession('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
      fs.writeFileSync(path.join(screenshotDir, `${r.id}-mobile.jpg`), Buffer.from(mData, 'base64'));

      const mobileEval = await sendSession('Runtime.evaluate', {
        expression: `(() => {
          const body = document.body;
          const docEl = document.documentElement;
          const scrollWidth = Math.max(body.scrollWidth, docEl.scrollWidth);
          const clientWidth = docEl.clientWidth;
          const hasHorizontalOverflow = scrollWidth > clientWidth;

          // Check interactive touch targets < 44px
          const clickables = Array.from(document.querySelectorAll('button, a, input, select'));
          const smallTargets = clickables.filter(el => {
            const rect = el.getBoundingClientRect();
            return (rect.width > 0 && rect.height > 0) && (rect.width < 32 || rect.height < 32);
          }).map(el => ({
            tag: el.tagName,
            class: el.className,
            text: el.textContent.trim().slice(0, 30),
            w: Math.round(el.getBoundingClientRect().width),
            h: Math.round(el.getBoundingClientRect().height)
          }));

          return {
            hasHorizontalOverflow,
            scrollWidth,
            clientWidth,
            smallTargetsCount: smallTargets.length,
            sampleSmallTargets: smallTargets.slice(0, 5)
          };
        })()`,
        returnByValue: true
      });

      const mobileResult = mobileEval.result.value;

      const errors = [...cdp.consoleErrors];
      const failedReqs = [...cdp.failedRequests];

      report.routes.push({
        name: r.name,
        path: r.path,
        desktop: desktopResult,
        mobile: mobileResult,
        errors,
        failedRequests: failedReqs
      });

      console.log(`  Title: ${desktopResult.title}`);
      console.log(`  DOM Nodes: ${desktopResult.domNodesCount}`);
      console.log(`  Landmarks: ${JSON.stringify(desktopResult.landmarks)}`);
      console.log(`  Images: ${desktopResult.totalImages} | Broken: ${desktopResult.brokenImages.length} | Missing Alt: ${desktopResult.missingAlt.length}`);
      console.log(`  Buttons: ${desktopResult.totalButtons} | Unlabelled: ${desktopResult.unlabelledBtns.length}`);
      console.log(`  Desktop Overflow: ${desktopResult.hasHorizontalOverflow} (${desktopResult.scrollWidth} > ${desktopResult.clientWidth})`);
      console.log(`  Mobile Overflow: ${mobileResult.hasHorizontalOverflow} (${mobileResult.scrollWidth} > ${mobileResult.clientWidth})`);
      console.log(`  Mobile Touch Targets <32px: ${mobileResult.smallTargetsCount}`);
      console.log(`  Console Errors: ${errors.length}`);
      console.log(`  Failed Requests: ${failedReqs.length}`);
    }

    fs.writeFileSync(path.join(process.cwd(), 'docs', 'deep-research-results.json'), JSON.stringify(report, null, 2), 'utf8');
    console.log('\n✅ Deep Research audit finished! Results saved to docs/deep-research-results.json');
  } finally {
    chrome.kill();
  }
}

runDeepAudit().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
