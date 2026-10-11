// NEVO GROUP — hero fon video boshqaruvchisi (home va katalog uchun umumiy).
// Video faqat qulay sharoitda yuklanadi; aks holda poster/rasm fallback qoladi.

function mq(query) {
  try {
    return typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false;
  } catch {
    return false;
  }
}

export function isMobileViewport() {
  return mq('(max-width: 768px)');
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
 * @param {{ sources: {src:string,type:string}[], observeEl?: Element|null, onReady?: () => void }} opts
 * @returns {boolean} yuklash boshlandimi
 */
export function initHeroVideo(video, { sources, observeEl, onReady }) {
  if (!video || !sources || sources.length === 0 || !shouldLoadHeroVideo()) return false;

  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.preload = 'auto';

  for (const s of sources) {
    const el = document.createElement('source');
    el.src = s.src;
    el.type = s.type;
    video.appendChild(el);
  }

  let ready = false;
  video.addEventListener(
    'playing',
    () => {
      if (ready) return;
      ready = true;
      if (onReady) onReady();
    },
    { once: true }
  );

  const tryPlay = () => {
    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };

  video.load();
  tryPlay();

  if ('IntersectionObserver' in window && observeEl) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!video.isConnected) {
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
    if (!video.isConnected) return;
    if (document.hidden) video.pause();
    else if (ready) tryPlay();
  });

  return true;
}
