// NEVO GROUP — hero fon video boshqaruvchisi (home va katalog uchun umumiy).
// Fon video desktopda va mobilda (tezkor internetda) ishlaydi; xatolik yoki pleyer buzilishida rasmli fallback'ga o'tadi.

function mq(query) {
  try {
    return typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false;
  } catch {
    return false;
  }
}

export function isMobileViewport() {
  return mq('(max-width: 899px)') || mq('(pointer: coarse)');
}

export function shouldLoadHeroVideo() {
  if (typeof window === 'undefined') return false;
  if (mq('(prefers-reduced-motion: reduce)')) return false;
  const conn = navigator.connection;
  if (conn && conn.saveData) return false;
  if (isMobileViewport() && conn && conn.effectiveType && conn.effectiveType !== '4g') return false;
  return true;
}

/**
 * @param {HTMLVideoElement|null} video
 * @param {{ poster?: string, sources: {src:string,type:string}[], observeEl?: Element|null, onReady?: () => void, onFallback?: () => void }} opts
 * @returns {boolean} yuklash boshlandimi
 */
export function initHeroVideo(video, { poster, sources, observeEl, onReady, onFallback }) {
  if (!video || !sources || sources.length === 0 || !shouldLoadHeroVideo()) return false;

  const isMobile = isMobileViewport();
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

    if (typeof onFallback === 'function') {
      try { onFallback(); } catch {}
    }
  };

  // Video elementiga barcha mobil/desktop atributlarini o'rnatish
  // muted ni HTML atribut sifatida ham, video.muted = true sifatida ham play() dan OLDIN qo'yish
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

  // Fallback himoyalari (faqat mobil/touch qurilmalarda faol)
  if (isMobile) {
    // 1) 3000 ms ichida 'playing' hodisasi kelmasa
    playTimer = setTimeout(() => {
      if (!ready) {
        triggerFallback();
      }
    }, 3000);

    // 2) 'webkitbeginfullscreen', 'enterpictureinpicture', 'webkitpresentationmodechanged', 'fullscreenchange'
    const fullscreenEvents = [
      'webkitbeginfullscreen',
      'enterpictureinpicture',
      'webkitpresentationmodechanged',
      'fullscreenchange',
    ];
    fullscreenEvents.forEach((evt) => {
      video.addEventListener(evt, () => triggerFallback());
    });
  }

  // 3) 'error' yoki 'stalled' 5 s dan ortiq
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
