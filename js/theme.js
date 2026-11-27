/* MV Bichota theme controller — shared by storefront and admin */
(function () {
  'use strict';
  var KEY = 'mv-bichota-theme';
  var root = document.documentElement;

  function readTheme() {
    try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; }
    catch (error) { return 'light'; }
  }
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    try { localStorage.setItem(KEY, theme); } catch (error) {}
    document.querySelectorAll('[data-theme-toggle]').forEach(paint);
  }
  function paint(button) {
    var dark = root.getAttribute('data-theme') === 'dark';
    button.textContent = dark ? '☀' : '☾';
    button.setAttribute('aria-label', dark ? 'Activar modo claro' : 'Activar modo oscuro');
    button.setAttribute('aria-pressed', dark ? 'true' : 'false');
    button.setAttribute('title', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  }
  root.setAttribute('data-theme', readTheme());
  root.style.colorScheme = readTheme();

  function init() {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      paint(button);
      button.addEventListener('click', function (event) {
        event.preventDefault();
        applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
