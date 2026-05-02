(function () {
  const header = document.querySelector('.site-header');
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /* ---------- Tag reveal targets synchronously, before first paint ---------- */
  // Run immediately (script is at end of body, so DOM is parsed). This avoids
  // a flash-of-visible-content where elements would render fully then blink
  // invisible once .reveal is added inside DOMContentLoaded.
  const revealSelectors = [
    '.section-head',
    '.pillar',
    '.strategy-visual',
    '.products-grid .card',
    '.stat',
    '.insights-teaser .insight-card',
    '.insights-grid .placeholder-card',
    '.placeholder-grid .placeholder-card',
    '.team-card',
    '.presence__item',
    '.cta-band',
    '.profile-prose > div',
    '.contact-grid > *',
    '.service',
    '.page-header__title, .page-header__lead',
  ].join(',');

  const revealTargets = document.querySelectorAll(revealSelectors);
  if (!reducedMotion && 'IntersectionObserver' in window) {
    revealTargets.forEach((el) => el.classList.add('reveal'));
    document
      .querySelectorAll('.pillars, .products-grid, .stats-grid, .insights-teaser, .team-grid, .presence, .insights-grid, .placeholder-grid')
      .forEach((c) => c.classList.add('reveal-stagger'));

    // Prepare stat counters: wrap each digit run inside .stat__value as
    // <span class="stat-num" data-target="N">0</span>. Runs synchronously
    // (script is at end of body) so the page paints with zeros, not the
    // final values, then the reveal observer animates them up.
    document.querySelectorAll('.stat__value').forEach((statValue) => {
      const walker = document.createTreeWalker(statValue, NodeFilter.SHOW_TEXT, null);
      const numericNodes = [];
      let node;
      while ((node = walker.nextNode())) {
        if (/\d/.test(node.nodeValue)) numericNodes.push(node);
      }
      numericNodes.forEach((textNode) => {
        const frag = document.createDocumentFragment();
        textNode.nodeValue.split(/(\d+)/).forEach((part) => {
          if (!part) return;
          if (/^\d+$/.test(part)) {
            const span = document.createElement('span');
            span.className = 'stat-num';
            span.dataset.target = part;
            span.textContent = '0';
            frag.appendChild(span);
          } else {
            frag.appendChild(document.createTextNode(part));
          }
        });
        textNode.parentNode.replaceChild(frag, textNode);
      });
    });
  }

  function animateStatNumbers(statEl, duration) {
    const dur = duration || 1600;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    statEl.querySelectorAll('.stat-num').forEach((el) => {
      if (el.dataset.counted === '1') return;
      el.dataset.counted = '1';
      const target = parseInt(el.dataset.target, 10) || 0;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / dur);
        el.textContent = String(Math.round(easeOutCubic(t) * target));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

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

    /* ---------- Observe reveal targets ---------- */
    if (!reducedMotion && 'IntersectionObserver' in window && revealTargets.length) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            if (entry.target.matches('.stat')) animateStatNumbers(entry.target);
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

      revealTargets.forEach((t) => revealObserver.observe(t));
    }

    /* ---------- Hero auto-snap to next section (index page) ---------- */
    const hero = document.querySelector('.hero');
    const nextSection = hero ? hero.nextElementSibling : null;

    if (hero && nextSection && !reducedMotion && window.matchMedia('(min-width: 769px)').matches) {
      let snapping = false;
      let armed = true;
      let lastWheelTime = 0;

      const targetY = () => hero.offsetHeight - 1; // top of next section

      const triggerSnap = () => {
        if (snapping || !armed) return;
        const y = window.scrollY;
        // Only snap when user is still inside the hero region
        if (y <= 0 || y >= hero.offsetHeight * 0.7) return;
        snapping = true;
        armed = false;
        window.scrollTo({ top: targetY(), behavior: 'smooth' });
        setTimeout(() => { snapping = false; }, 1100);
      };

      // Re-arm only when the user has fully returned to the very top
      window.addEventListener('scroll', () => {
        if (snapping) return;
        if (window.scrollY < 4) armed = true;
      }, { passive: true });

      // Wheel-driven snap: small downward gesture from top → glide to section 2
      window.addEventListener('wheel', (e) => {
        if (snapping || !armed) return;
        if (window.scrollY > hero.offsetHeight * 0.7) return;
        if (e.deltaY <= 0) return;
        // throttle: ignore if a wheel just fired
        const now = performance.now();
        if (now - lastWheelTime < 80) return;
        lastWheelTime = now;
        // queue the snap on the next frame so the native scroll has begun
        requestAnimationFrame(triggerSnap);
      }, { passive: true });

      // Touch-driven snap: small swipe up → snap
      let touchStartY = null;
      window.addEventListener('touchstart', (e) => {
        if (window.scrollY > hero.offsetHeight * 0.7) { touchStartY = null; return; }
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (touchStartY == null || snapping || !armed) return;
        const dy = touchStartY - e.touches[0].clientY;
        if (dy > 18) {
          touchStartY = null;
          requestAnimationFrame(triggerSnap);
        }
      }, { passive: true });

      // Fallback: any scroll-event movement past a small threshold while armed
      window.addEventListener('scroll', () => {
        if (snapping || !armed) return;
        const y = window.scrollY;
        if (y > 8 && y < hero.offsetHeight * 0.5) requestAnimationFrame(triggerSnap);
      }, { passive: true });
    }

    /* ---------- Pointer-tracked gold glow on product cards ---------- */
    document.querySelectorAll('.products-grid .card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width) * 100;
        const my = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mx', mx + '%');
        card.style.setProperty('--my', my + '%');
      });
    });
  });
})();
