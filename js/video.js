(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const video = document.querySelector('.hero__video');
    if (!video) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      // Hide the video and rely on poster-like background
      video.removeAttribute('autoplay');
      video.pause();
      video.style.display = 'none';
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
  });
})();
