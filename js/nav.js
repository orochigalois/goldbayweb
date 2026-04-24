(function () {
  const header = document.querySelector('.site-header');
  const body = document.body;

  // scroll state
  const updateScrollState = () => {
    if (!header) return;
    if (window.scrollY > 40) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };
  updateScrollState();
  window.addEventListener('scroll', updateScrollState, { passive: true });

  // mobile menu
  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');

    if (toggle && mobileNav) {
      const close = () => {
        toggle.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('is-open');
        body.style.overflow = '';
      };

      toggle.addEventListener('click', () => {
        const isOpen = toggle.getAttribute('aria-expanded') === 'true';
        if (isOpen) {
          close();
        } else {
          toggle.setAttribute('aria-expanded', 'true');
          mobileNav.classList.add('is-open');
          body.style.overflow = 'hidden';
        }
      });

      mobileNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) close();
      });
    }

    // team-card accordions
    document.querySelectorAll('.team-card__toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.team-card');
        if (!card) return;
        const expanded = card.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      });
    });

    // Anchor nav active state on products page
    const anchorLinks = document.querySelectorAll('.anchor-nav a[href^="#"]');
    if (anchorLinks.length) {
      const targets = Array.from(anchorLinks)
        .map((a) => document.querySelector(a.getAttribute('href')))
        .filter(Boolean);

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = '#' + entry.target.id;
            anchorLinks.forEach((a) => {
              a.classList.toggle('is-active', a.getAttribute('href') === id);
            });
          }
        });
      }, { rootMargin: '-40% 0px -55% 0px' });

      targets.forEach((t) => observer.observe(t));
    }
  });
})();
