(function () {
  const STORAGE_KEY = 'goldbay-lang';
  const DEFAULT_LANG = 'en';
  const VALID = ['en', 'zh'];

  function getStoredLang() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return VALID.includes(v) ? v : DEFAULT_LANG;
    } catch (e) {
      return DEFAULT_LANG;
    }
  }

  function applyLang(lang) {
    const root = document.documentElement;
    root.setAttribute('data-lang', lang);
    root.lang = lang === 'zh' ? 'zh-CN' : 'en';

    document.querySelectorAll('.lang-toggle button[data-lang]').forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.dataset.lang === lang ? 'true' : 'false');
    });

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* noop */ }
  }

  // apply as early as possible to avoid FOUC
  applyLang(getStoredLang());

  document.addEventListener('DOMContentLoaded', () => {
    // reapply so toggle aria-pressed is correct after buttons exist
    applyLang(getStoredLang());

    document.querySelectorAll('.lang-toggle button[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        applyLang(btn.dataset.lang);
      });
    });
  });
})();
