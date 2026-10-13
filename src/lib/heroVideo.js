// NEVO GROUP — hero fon video boshqaruvchisi (home va katalog uchun umumiy).
// Fon video desktopda to'liq, mobilda esa faqat ruxsat berilgan brauzerlarda (Chrome, Safari, Firefox, Samsung)
// 720p manba bilan xavfsiz holda yuklanadi.
// Xiaomi/MIUI va boshqa nosoz OEM/WebView brauzerlarda user-agent bo'yicha o'chiriladi.

function mq(query) {
  try {
    return typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false;
  } catch {
    return false;
  }
}

export function isMobileOrTouch() {
  return mq('(max-width: 899px)') || mq('(pointer: coarse)');
}

export function isMobileViewport() {
  return isMobileOrTouch();
}

/**
 * Hostile / nosoz mobil brauzerlarni aniqlash:
 * Xiaomi/MIUI, UC, Quark, Huawei/Honor, Oppo/HeyTap, Vivo, Baidu, QQ, WeChat,
 * hamda in-app WebView'lar (Telegram, Instagram, Facebook, Android WebView "; wv")
 * @param {string} ua
 * @returns {boolean}
 */
export function isVideoHostileBrowser(ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '')) {
  if (!ua) return false;

  // 1. Xiaomi / MIUI / Mint
  if (/miuibrowser|xiaomi|mint browser/i.test(ua)) return true;

  // 2. UC Browser / Quark
  if (/ucbrowser|ubrowser|ucweb|quark/i.test(ua)) return true;

  // 3. Huawei / Honor
  if (/huaweibrowser|hbpc|honorbrowser/i.test(ua)) return true;

  // 4. Oppo / HeyTap
  if (/heytapbrowser|oppobrowser/i.test(ua)) return true;

  // 5. Vivo
  if (/vivobrowser/i.test(ua)) return true;

  // 6. Baidu / QQ / WeChat
  if (/baidubrowser|baiduboxapp|mqqbrowser|\bqq\/|micromessenger/i.test(ua)) return true;

  // 7. In-app WebViews (Telegram, Instagram, Facebook, TikTok)
  if (/telegram|instagram|fban|fbav|fb_iab|bytedance|musical_ly|tiktok/i.test(ua)) return true;

  // 8. Android WebView signaturalari: "; wv", "Build/... wv" yoki Android Version/X.X Chrome/XX Mobile
  if (/;\s*wv[\);]|build\/.*wv|\bwv\b/i.test(ua)) return true;
  if (/android.*version\/[0-9.]+\s+(?:chrome\/[0-9.]+\s+)?mobile/i.test(ua)) return true;

  return false;
}

/**
 * Mobilda video faqat Chrome, Safari, Firefox va Samsung Internet uchun ruxsat etiladi.
 * @param {string} ua
 * @returns {boolean}
 */
export function isAllowedMobileBrowser(ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '')) {
  if (isVideoHostileBrowser(ua)) return false;

  const isSamsung = /samsungbrowser/i.test(ua);
  const isFirefox = /firefox|fxios/i.test(ua);
  const isChrome = /chrome|crios/i.test(ua);
  const isSafari = /safari/i.test(ua) && !isChrome && !isSamsung;

  return isChrome || isSafari || isFirefox || isSamsung;
}

/**
 * ?hv=1 majburan yoqadi, ?hv=0 majburan o'chiradi (faqat sinov uchun)
 */
export function getHvOverride() {
  if (typeof window === 'undefined') return null;
  try {
    const p = new URLSearchParams(window.location.search);
    const val = p.get('hv');
    if (val === '1' || val === 'true') return true;
    if (val === '0' || val === 'false') return false;
  } catch {}
  return null;
}

export function shouldLoadHeroVideo() {
  if (typeof window === 'undefined') return false;

  const hv = getHvOverride();
  if (hv !== null) return hv;

  if (mq('(prefers-reduced-motion: reduce)')) return false;
  const conn = navigator.connection;
  if (conn && conn.saveData) return false;

  return true;
}

/**
 * <html class="no-hero-video"> belgisini sinxronlashtirish
 */
export function syncHeroVideoHtmlClass() {
  if (typeof document === 'undefined') return;
  if (!shouldLoadHeroVideo()) {
    document.documentElement.classList.add('no-hero-video');
  } else {
    document.documentElement.classList.remove('no-hero-video');
  }
}

// Modul yuklanganda darhol sinxronlashtirish
if (typeof document !== 'undefined') {
  syncHeroVideoHtmlClass();
}

/**
 * @param {HTMLVideoElement|null} video
 * @param {{ poster?: string, sources: {src:string,type:string}[], observeEl?: Element|null, onReady?: () => void, onFallback?: () => void }} opts
 * @returns {boolean} yuklash boshlandimi
 */
export function initHeroVideo(video, { poster, sources, observeEl, onReady, onFallback }) {
  if (!video || !sources || sources.length === 0 || !shouldLoadHeroVideo()) {
    syncHeroVideoHtmlClass();
    return false;
  }

  const isMobile = isMobileOrTouch();
  let fallbackTriggered = false;
  let playTimer = null;
  let stallTimer = null;
  let ready = false;

  const triggerFallback = () => {
    if (fallbackTriggered) return;
    fallbackTriggered = true;

    if (playTimer) {
      clearTimeout(playTimer);
      playTimer = null;
    }
    if (stallTimer) {
      clearTimeout(stallTimer);
      stallTimer = null;
    }

    try {
      video.pause();
      while (video.firstChild) {
        video.removeChild(video.firstChild);
      }
      video.removeAttribute('src');
      video.removeAttribute('poster');
      video.load();
    } catch {}

    const layer = video.closest('.hero-video-layer, .catalog-bg-video-layer') || video.parentElement;
    if (layer) {
      layer.style.display = 'none';
    }

    const backdrop = document.getElementById('nevo-hero-slideshow') || document.getElementById('catalog-hero-bg') || observeEl;
    if (backdrop) {
      backdrop.classList.remove('is-video-ready');
    }
    const heroSection = document.querySelector('.hero-section-nevo, .catalog-hero-fullscreen') || document.getElementById('catalog-hero');
    if (heroSection) {
      heroSection.classList.remove('has-video');
    }

    const soundBtn = document.getElementById('hero-sound-toggle');
    if (soundBtn) {
      soundBtn.hidden = true;
    }

    document.documentElement.classList.add('no-hero-video');

    if (typeof onFallback === 'function') {
      try { onFallback(); } catch {}
    }
  };

  // Video elementiga barcha mobil/desktop atributlarini o'rnatish
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;

  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.setAttribute('x5-playsinline', '');
  video.setAttribute('x5-video-player-type', 'h5-page');
  video.setAttribute('x5-video-player-fullscreen', 'false');
  video.setAttribute('disablePictureInPicture', '');
  video.setAttribute('disableRemotePlayback', '');
  video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
  video.setAttribute('tabindex', '-1');
  video.setAttribute('aria-hidden', 'true');

  video.disablePictureInPicture = true;
  video.disableRemotePlayback = true;

  if (poster) {
    video.poster = poster;
  }
  video.preload = 'auto';

  // Himoyalar faqat nosoz mobil brauzerlar uchun (desktopda video hech qachon o'chirilmaydi)
  if (isMobile) {
    playTimer = setTimeout(() => {
      if (!ready) {
        triggerFallback();
      }
    }, 6000);
  }

  const fullscreenEvents = [
    'webkitbeginfullscreen',
    'enterpictureinpicture',
    'webkitpresentationmodechanged',
    'fullscreenchange',
  ];
  fullscreenEvents.forEach((evt) => {
    video.addEventListener(evt, () => triggerFallback());
  });

  video.addEventListener('error', () => {
    triggerFallback();
  });

  video.addEventListener('stalled', () => {
    if (!stallTimer) {
      stallTimer = setTimeout(() => {
        triggerFallback();
      }, 5000);
    }
  });

  video.addEventListener('timeupdate', () => {
    if (stallTimer) {
      clearTimeout(stallTimer);
      stallTimer = null;
    }
  });

  // Source'larni qo'shish
  for (const s of sources) {
    const el = document.createElement('source');
    el.src = s.src;
    el.type = s.type;
    video.appendChild(el);
  }

  video.addEventListener(
    'playing',
    () => {
      if (playTimer) {
        clearTimeout(playTimer);
        playTimer = null;
      }
      if (stallTimer) {
        clearTimeout(stallTimer);
        stallTimer = null;
      }
      if (ready) return;
      ready = true;
      if (onReady) onReady();
    },
    { once: true }
  );

  const tryPlay = () => {
    if (fallbackTriggered) return;
    try {
      video.muted = true;
      const p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          if (isMobile) triggerFallback();
        });
      }
    } catch {
      if (isMobile) triggerFallback();
    }
  };

  video.load();
  tryPlay();

  if ('IntersectionObserver' in window && observeEl) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!video.isConnected || fallbackTriggered) {
          io.disconnect();
          return;
        }
        entries.forEach((e) => {
          if (e.isIntersecting) tryPlay();
          else video.pause();
        });
      },
      { threshold: 0.1 }
    );
    io.observe(observeEl);
  }

  document.addEventListener('visibilitychange', () => {
    if (!video.isConnected || fallbackTriggered) return;
    if (document.hidden) video.pause();
    else if (ready) tryPlay();
  });

  return true;
}


/**
 * Mobil/touch qurilmalarda animatsiyali WebP fon ishlatilsinmi.
 * <video> emas, oddiy <img> bo'lgani uchun hech qanday brauzer uni pleyerga aylantirmaydi.
 */
export function shouldUseMotionImage() {
  if (typeof window === 'undefined') return false;
  if (!isMobileOrTouch()) return false;
  if (getHvOverride() === false) return false;
  if (mq('(prefers-reduced-motion: reduce)')) return false;
  const conn = navigator.connection;
  if (conn && conn.saveData) return false;
  if (conn && conn.effectiveType && conn.effectiveType !== '4g') return false;
  return true;
}

/**
 * Animatsiyali WebP fonni ishga tushiradi. Poster (statik 1-kadr) darhol ko'rsatiladi, shuning uchun
 * eski slayd rasmlari mobilda hech qachon ko'rinmaydi.
 * @param {{ host: Element|null, before?: Element|null, src: string, poster?: string, onReady?: () => void }} opts
 * @returns {boolean}
 */
export function initHeroMotionImage({ host, before, src, poster, onReady }) {
  if (!host || !src || !shouldUseMotionImage()) return false;
  const root = document.documentElement;
  const layer = document.createElement('div');
  layer.className = 'hero-motion-layer';
  layer.setAttribute('aria-hidden', 'true');
  if (poster) layer.style.backgroundImage = `url("${poster}")`;
  const img = document.createElement('img');
  img.className = 'hero-motion-img';
  img.alt = '';
  img.decoding = 'async';
  img.setAttribute('aria-hidden', 'true');
  img.addEventListener('load', () => {
    if (typeof onReady === 'function') onReady();
  }, { once: true });
  img.addEventListener('error', () => {
    layer.remove();
    root.classList.remove('has-motion-hero');
  }, { once: true });
  layer.appendChild(img);
  if (before && before.parentNode === host) host.insertBefore(layer, before);
  else host.appendChild(layer);
  root.classList.add('has-motion-hero');
  img.src = src;
  return true;
}

/**
 * Animatsiyani boshidan boshlash (kesh'dan, qayta yuklamasdan): img'ni klon bilan almashtiradi.
 */
export function restartHeroMotionImage(host) {
  const img = host && host.querySelector('.hero-motion-img');
  if (!img || !img.parentNode) return;
  const clone = img.cloneNode(false);
  img.replaceWith(clone);
}
