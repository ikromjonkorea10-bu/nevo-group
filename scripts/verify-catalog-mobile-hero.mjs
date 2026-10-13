import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = '/Users/pardaev/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const PORT = 9995;
const ARTIFACT_DIR = '/Users/pardaev/.gemini/antigravity/brain/55a5adf3-24b4-4c6a-b63f-2b69de5de637';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getWsUrl() {
  for (let i = 0; i < 25; i++) {
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
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((res, rej) => {
      this.ws.onopen = res;
      this.ws.onerror = rej;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
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
    try { this.ws.close(); } catch {}
  }
}

async function main() {
  console.log('🚀 Starting Chrome CDP for Catalog Hero Mobile & Desktop Verification...');
  const tmpProfile = `/tmp/cdp-cat-profile-${Date.now()}`;
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--mute-audio',
    `--user-data-dir=${tmpProfile}`,
    'about:blank',
  ]);

  try {
    const wsUrl = await getWsUrl();
    const browserCdp = new CdpClient(wsUrl);
    await browserCdp.connect();

    const { targetId } = await browserCdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await browserCdp.send('Target.attachToTarget', { targetId, flatten: true });

    const sessionSend = (method, params = {}) => browserCdp.send('Target.sendMessageToTarget', {
      sessionId,
      message: JSON.stringify({ id: browserCdp.id++, method, params }),
    }).then(res => {
      // response comes through message event
    });

    // Alternatively connect directly to target WebSocket:
    const targetWsUrl = `ws://127.0.0.1:${PORT}/devtools/page/${targetId}`;
    const pageCdp = new CdpClient(targetWsUrl);
    await pageCdp.connect();

    await pageCdp.send('Page.enable');
    await pageCdp.send('Runtime.enable');

    // 1. Mobile verification (iPhone 14 / Safari)
    console.log('📱 Testing Mobile (iPhone 14 viewport 390x844)...');
    await pageCdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
      hasTouch: true,
    });
    await pageCdp.send('Network.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
    });

    await pageCdp.send('Page.navigate', { url: 'http://localhost:4173/katalog?preview=1' });
    await sleep(2500);

    const mobileEval = await pageCdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const video = document.getElementById('catalog-hero-video');
          const motionLayer = document.querySelector('.hero-motion-layer');
          const bgLayer = document.getElementById('catalog-hero-bg');
          return {
            videoFound: !!video,
            videoSrc: video ? (video.currentSrc || video.src) : null,
            videoDuration: video ? video.duration : null,
            videoPaused: video ? video.paused : null,
            videoReadyState: video ? video.readyState : null,
            motionLayerActive: !!motionLayer,
            bgHasVideoReadyClass: bgLayer ? bgLayer.classList.contains('is-video-ready') : false,
          };
        })()
      `,
      returnByValue: true,
    });

    console.log('📱 Mobile Evaluation Results:', mobileEval.result.value);

    // Mobile Screenshot
    const mobileScreenshot = await pageCdp.send('Page.captureScreenshot', { format: 'png' });
    const mobileShotPath = path.join(ARTIFACT_DIR, 'catalog_mobile_hero_verified.png');
    fs.writeFileSync(mobileShotPath, Buffer.from(mobileScreenshot.data, 'base64'));
    console.log(`📸 Mobile screenshot saved to ${mobileShotPath}`);

    // Fast-forward video to outro (17s) to capture NEVO GROUP golden logo reveal
    await pageCdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const video = document.getElementById('catalog-hero-video');
          if (video) {
            video.currentTime = 17.0;
          }
        })()
      `,
    });
    await sleep(600);

    const mobileOutroScreenshot = await pageCdp.send('Page.captureScreenshot', { format: 'png' });
    const mobileOutroPath = path.join(ARTIFACT_DIR, 'catalog_mobile_outro_verified.png');
    fs.writeFileSync(mobileOutroPath, Buffer.from(mobileOutroScreenshot.data, 'base64'));
    console.log(`📸 Mobile Outro screenshot saved to ${mobileOutroPath}`);

    // 2. Desktop verification (1440x900)
    console.log('💻 Testing Desktop (1440x900)...');
    await pageCdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
      hasTouch: false,
    });
    await pageCdp.send('Network.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    });

    await pageCdp.send('Page.navigate', { url: 'http://localhost:4173/katalog?preview=1' });
    await sleep(2000);

    const desktopEval = await pageCdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const video = document.getElementById('catalog-hero-video');
          return {
            videoFound: !!video,
            videoSrc: video ? (video.currentSrc || video.src) : null,
            videoDuration: video ? video.duration : null,
            videoPaused: video ? video.paused : null,
          };
        })()
      `,
      returnByValue: true,
    });
    console.log('💻 Desktop Evaluation Results:', desktopEval.result.value);

    // Fast-forward video to outro (17s)
    await pageCdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const video = document.getElementById('catalog-hero-video');
          if (video) {
            video.currentTime = 17.0;
          }
        })()
      `,
    });
    await sleep(600);

    const desktopScreenshot = await pageCdp.send('Page.captureScreenshot', { format: 'png' });
    const desktopShotPath = path.join(ARTIFACT_DIR, 'catalog_desktop_outro_verified.png');
    fs.writeFileSync(desktopShotPath, Buffer.from(desktopScreenshot.data, 'base64'));
    console.log(`📸 Desktop Outro screenshot saved to ${desktopShotPath}`);

    pageCdp.close();
    browserCdp.close();
    console.log('✅ Verification finished successfully!');
  } finally {
    chromeProc.kill('SIGKILL');
    fs.rmSync(tmpProfile, { recursive: true, force: true });
  }
}

main().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
