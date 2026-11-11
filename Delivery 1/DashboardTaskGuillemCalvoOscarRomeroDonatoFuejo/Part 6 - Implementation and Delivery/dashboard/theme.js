/* Light or night theme, set before the page is drawn (so it never flashes white at night).
   The choice made with the "Night mode" button is remembered in this browser only; without one, the page
   follows the system setting (prefers-color-scheme). Used by the three pages. */
'use strict';
(function () {
  let theme = null;
  try { theme = window.localStorage.getItem('hotel-dashboard-theme'); } catch (error) { theme = null; }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();

// Change the theme and remember it; returns the new theme
function switchTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { window.localStorage.setItem('hotel-dashboard-theme', next); } catch (error) { /* not remembered: fine */ }
  return next;
}

// The "Night mode" button of a page: pressed when the night theme is on
function connectThemeButton(onChange) {
  const button = document.getElementById('theme-toggle');
  if (!button) { return; }
  const show = function () {
    button.setAttribute('aria-pressed', String(document.documentElement.getAttribute('data-theme') === 'dark'));
  };
  show();
  button.addEventListener('click', function () {
    switchTheme();
    show();
    if (onChange) { onChange(); }
  });
}
