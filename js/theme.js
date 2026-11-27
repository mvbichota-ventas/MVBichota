/* MV Bichota shared light/dark theme controller */
(function () {
  'use strict';
  const KEY = 'mv-bichota-theme';
  let saved = 'light';
  try { saved = localStorage.getItem(KEY) || 'light'; } catch (_) {}
  if (saved !== 'dark' && saved !== 'light') saved = 'light';
  document.documentElement.setAttribute('data-theme', saved);

  function paint(button, theme) {
    const dark = theme === 'dark';
    button.innerHTML = '<span aria-hidden="true">' + (dark ? '☀' : '☾') + '</span><span class="theme-toggle__label">' + (dark ? 'Modo claro' : 'Modo oscuro') + '</span>';
    button.setAttribute('aria-label', dark ? 'Activar modo claro' : 'Activar modo oscuro');
    button.setAttribute('aria-pressed', dark ? 'true' : 'false');
    button.title = dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  }

  function init() {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      paint(button, document.documentElement.getAttribute('data-theme') || 'light');
      button.addEventListener('click', function () {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem(KEY, next); } catch (_) {}
        document.querySelectorAll('[data-theme-toggle]').forEach(function (item) { paint(item, next); });
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
