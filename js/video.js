(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const video = document.querySelector('.hero__video');
    if (!video) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      video.removeAttribute('autoplay');
      video.pause();
      return;
    }

    // ensure playback begins after hydration on some mobile browsers
    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => { /* autoplay blocked — poster shows */ });
      }
    };

    if (video.readyState >= 2) {
      tryPlay();
    } else {
      video.addEventListener('loadeddata', tryPlay, { once: true });
    }

    // pause when fully off-screen to save resources
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          tryPlay();
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.05 });

    io.observe(video);

    const unmuteBtn = document.querySelector('.hero__unmute');
    const soundToggle = document.querySelector('.hero__sound-toggle');

    const syncSoundState = () => {
      if (!soundToggle) return;
      soundToggle.setAttribute('aria-pressed', video.muted ? 'false' : 'true');
    };

    if (unmuteBtn) {
      unmuteBtn.addEventListener('click', () => {
        video.muted = false;
        tryPlay();
        unmuteBtn.classList.add('is-hidden');
        syncSoundState();
      });
    }

    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        video.muted = !video.muted;
        if (!video.muted) {
          tryPlay();
          if (unmuteBtn) unmuteBtn.classList.add('is-hidden');
        }
        syncSoundState();
      });
    }

    syncSoundState();
  });
})();
