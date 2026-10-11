// NEVO GROUP — hero fon video boshqaruvchisi (home va katalog uchun umumiy).
// Fon video FAQAT desktop (>=900px va mouse pointer) da yuklanadi.
// Mobil/touch qurilmalarda (ayniqsa Xiaomi/MIUI va boshqa OEM brauzerlar <video> ni sahifa ustidan
// o'z pleyerida qora blok qilib ochib matnni yopgani sababli) video butunlay o'chiriladi va rasmli slayder foni qoladi.

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

export function shouldLoadHeroVideo() {
  if (typeof window === 'undefined') return false;
  // Mobil va sensorli qurilmalarda video mutlaqo yuklanmaydi
  if (isMobileOrTouch()) return false;
  if (mq('(prefers-reduced-motion: reduce)')) return false;
  const conn = navigator.connection;
  if (conn && conn.saveData) return false;
  return true;
}

/**
 * @param {HTMLVideoElement|null} video
 * @param {{ poster?: string, sources: {src:string,type:string}[], observeEl?: Element|null, onReady?: () => void }} opts
 * @returns {boolean} yuklash boshlandimi
 */
export function initHeroVideo(video, { poster, sources, observeEl, onReady }) {
  if (!video || !sources || sources.length === 0 || !shouldLoadHeroVideo()) return false;

  if (poster) {
    video.poster = poster;
  }

  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;

  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.setAttribute('tabindex', '-1');
  video.setAttribute('aria-hidden', 'true');
  video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
  video.setAttribute('disablePictureInPicture', '');
  video.setAttribute('disableRemotePlayback', '');

  video.disablePictureInPicture = true;
  video.disableRemotePlayback = true;
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
    try {
      video.muted = true;
      const p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {});
      }
    } catch {}
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
