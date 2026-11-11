/* Shared code of both dashboard screens (index.html and detail.html).
   It draws every chart from specs.js with the data of data.js (no server, no fetch: architecture.md),
   in the light or the night theme, and writes the KPIs and the "Showing" line for the current filters. */
'use strict';

// ── State of the dashboard ────────────────────────────────────────────────────
// Filters (I1, I2); on the main screen the linked month (I5); on the detail screen the selected country (I7),
// the sort order (I9), the view of the first card (dumbbell or map) and the month of the animation.
const STATE = { hotel: 'Both', year: 'All', country: null, sort: 'guests', month: null, view: 'c4', frame: 1 };   // country: null = none
const VIEWS = {};          // Vega view of each chart, by chart name (c1 ... c9)
const CHARTS = [];         // the charts of this page

const HOTEL_LABELS = {
  'Both': 'Both hotels',
  'City Hotel': 'City Hotel (Lisbon)',
  'Resort Hotel': 'Resort Hotel (Algarve)'
};
const YEAR_LABELS = {
  'All': 'All years (July 2015 to August 2017)',
  '2015': '2015 (July to December only)',
  '2016': '2016',
  '2017': '2017 (January to August only)'
};
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];
const MIN_STAYS = 20;      // months with fewer stays of a country are not drawn in C9 (as in the notebook)

// ── Number formats: thousands separators and units (COGA plain language) ─────
const NBSP = ' ';
function formatCount(value) { return new Intl.NumberFormat('en-GB').format(value); }
function formatPercent(value) { return value.toFixed(1) + NBSP + '%'; }
function formatEuros(value) { return '€' + value.toFixed(1); }
function formatShort(value) { return String(Math.round(value * 10) / 10); }     // 2, 2.5, 13

// ── Charts ───────────────────────────────────────────────────────────────────

// The named datasets a spec uses (its own data and the data of its lookups), taken from data.js
function namedDatasets(spec) {
  const names = new Set();
  (function walk(node) {
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node && typeof node === 'object') {
      if (node.data && typeof node.data === 'object' && node.data.name) { names.add(node.data.name); }
      Object.values(node).forEach(walk);
    }
  })(spec);
  const datasets = {};
  names.forEach(function (name) { datasets[name] = DASHBOARD_DATA[name]; });
  return datasets;
}

// Values of the chart parameters for the current state
function parameterValues() {
  return {
    hotel_filter: STATE.hotel,
    year_filter: STATE.year === 'All' ? 'All' : Number(STATE.year),
    selected_country: STATE.country || '',
    sort_order: STATE.sort,
    linked_month: STATE.month,
    frame_month: STATE.frame
  };
}

function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

// Night mode: every light colour of a spec is swapped for its night colour (the list is in specs.js,
// written by the notebook next to the palette)
function themedText(text) {
  if (!isDark()) { return text; }
  const swap = DASHBOARD_THEMES.dark;
  return text.replace(/#[0-9A-Fa-f]{6}/g, function (hex) { return swap[hex.toUpperCase()] || hex; });
}

// A copy of a chart spec with the theme, its data and the current state. The title is written by the page
// (the card's heading), so the chart uses all of its box for the data.
function specWithState(name) {
  const spec = JSON.parse(themedText(JSON.stringify(DASHBOARD_SPECS[name])));
  delete spec.title;
  spec.datasets = namedDatasets(spec);
  const values = parameterValues();
  (spec.params || []).forEach(function (param) {
    if (param.name in values) { param.value = values[param.name]; }
  });
  return spec;
}

function isShown(element) { return element && !element.hidden && element.offsetParent !== null; }

// Draw one chart in the element with the same id; SVG renderer only (wcag-accessibility skill).
// A chart in a hidden box is drawn when its box is shown (it needs the size of its box).
function embedChart(name) {
  const container = document.getElementById(name);
  if (!isShown(container)) { return Promise.resolve(null); }
  const options = { renderer: 'svg', actions: false, tooltip: { theme: isDark() ? 'dark' : 'light' } };
  return vegaEmbed('#' + name, specWithState(name), options)
    .then(function (result) {
      VIEWS[name] = result.view;
      buildKeyboard(name);
      listenToChart(name);
      return result.view;
    })
    .catch(function (error) {
      container.textContent = 'This chart could not be drawn. Please reload the page; if it happens again, ' +
        'use the data table.';
      container.setAttribute('role', 'alert');
      console.error('Chart ' + name + ':', error);
    });
}

// Draw some charts again with the current state (sort order, theme, a box shown again)
function redrawCharts(names) {
  return Promise.all(names.map(function (name) {
    if (VIEWS[name]) { VIEWS[name].finalize(); delete VIEWS[name]; }
    const container = document.getElementById(name);
    if (container) { container.innerHTML = ''; delete container.dataset.keyboard; }
    return embedChart(name);
  }));
}

// The card headings come from the specs (one source for the notebook and the page)
function writeCardTitle(name, cardName) {
  const spec = DASHBOARD_SPECS[name];
  const target = cardName || name;
  setText(target + '-title', spec.title.text);
  setText(target + '-subtitle', spec.title.subtitle);
}

// ── KPIs and active filters ──────────────────────────────────────────────────

function setText(id, text) {
  const element = document.getElementById(id);
  if (element) { element.textContent = text; }
}

// The row of precomputed KPIs for the current filters (task 6.1: one row per filter combination)
function currentKpis() {
  return DASHBOARD_DATA.filter_kpis.find(function (row) {
    return row.hotel_filter === STATE.hotel && row.year_filter === String(STATE.year);
  });
}

// The precomputed values of the selected country for the current filters (null if no country is selected)
function currentCountry() {
  if (!STATE.country) { return null; }
  return DASHBOARD_DATA.country_medians.find(function (row) {
    return row.hotel_filter === STATE.hotel && row.year_filter === String(STATE.year) &&
      row.country_group === STATE.country;
  });
}

function updateActiveFilters() {
  setText('active-filters-text', HOTEL_LABELS[STATE.hotel] + ' · ' + YEAR_LABELS[STATE.year]);
}

function updateKpis() {
  const kpis = currentKpis();
  // Main screen
  setText('kpi-stays', formatCount(kpis.stays));
  setText('kpi-stays-context', 'not cancelled, of ' + formatCount(kpis.bookings) + ' bookings');
  setText('kpi-guests', formatCount(kpis.guests));
  setText('kpi-guests-context', 'people in those stays');
  setText('kpi-cancel', formatPercent(kpis.cancel_rate));
  setText('kpi-cancel-context', 'duplicates included');
  setText('kpi-price', formatEuros(kpis.median_price));
  setText('kpi-price-context', 'euros assumed');
  // Detail screen
  const country = currentCountry();
  setText('kpi-countries', formatCount(kpis.countries_of_origin));
  setText('kpi-countries-context', 'with guests');
  setText('kpi-largest', kpis.largest_market);
  setText('kpi-largest-context', formatPercent(kpis.largest_market_share) + ' of guests');
  if (!country) {
    // No country selected: the same two figures for all the guests
    setText('kpi-country-guests-label', 'Guests (all countries)');
    setText('kpi-country-guests', formatCount(kpis.guests));
    setText('kpi-country-guests-context', 'no country selected');
    setText('kpi-country-cancel-label', 'Bookings cancelled (all)');
    setText('kpi-country-cancel', formatPercent(kpis.cancel_rate));
    setText('kpi-country-cancel-context', 'duplicates included');
    return;
  }
  setText('kpi-country-guests-label', 'Guests from ' + STATE.country);
  setText('kpi-country-guests', formatCount(country.guests));
  setText('kpi-country-guests-context', formatPercent(100 * country.guests / kpis.guests) + ' of all');
  setText('kpi-country-cancel-label', STATE.country + ': cancelled');
  setText('kpi-country-cancel', country.cancel_rate === null ? '–' : formatPercent(country.cancel_rate));
  setText('kpi-country-cancel-context', 'duplicates included');
}

// ── Interactions (Part 5: I1 to I9, and the animation of C9) ─────────────────

const DEFAULT_STATE = { hotel: 'Both', year: 'All', country: 'Portugal', sort: 'guests' };

// Short message for screen readers (the visible "Showing" and selection boxes are also live regions)
function announce(message) {
  const announcer = document.getElementById('announcer');
  if (!announcer) { return; }
  announcer.textContent = '';
  window.setTimeout(function () { announcer.textContent = message; }, 50);
}

// Set a chart parameter in every chart of the page that has it, then redraw them
function setParameter(name, value) {
  const updates = [];
  Object.keys(VIEWS).forEach(function (chart) {
    const view = VIEWS[chart];
    try { view.signal(name, value); } catch (error) { return; }   // this chart has no such parameter
    // After Vega redraws, the keyboard layer is rebuilt on the new marks
    updates.push(view.runAsync().then(function () { refreshKeyboard(chart); }));
  });
  return Promise.all(updates);
}

// I3: the filters travel in the address of the other screen (?hotel=...&year=...)
function readStateFromAddress() {
  const params = new URLSearchParams(window.location.search);
  const countries = DASHBOARD_DATA.country_medians.map(function (row) { return row.country_group; });
  if (params.get('hotel') in HOTEL_LABELS) { STATE.hotel = params.get('hotel'); }
  if (params.get('year') in YEAR_LABELS) { STATE.year = params.get('year'); }
  if (countries.indexOf(params.get('country')) >= 0) { STATE.country = params.get('country'); }
}

function updateLinkToOtherScreen() {
  const link = document.getElementById('link-other-screen');
  if (!link) { return; }
  const page = link.getAttribute('href').split('?')[0];
  link.setAttribute('href', page + '?' + new URLSearchParams({ hotel: STATE.hotel, year: STATE.year }).toString());
}

// The filter controls show the state (after reading the address or a reset)
function showStateInControls() {
  document.querySelectorAll('input[name="hotel"]').forEach(function (radio) { radio.checked = radio.value === STATE.hotel; });
  const year = document.getElementById('year');
  if (year) { year.value = STATE.year; }
  document.querySelectorAll('input[name="sort"]').forEach(function (radio) { radio.checked = radio.value === STATE.sort; });
}

// I1, I2, I4: apply the filters to the KPIs, the "Showing" line, the link and every chart
function applyFilters() {
  updateActiveFilters();
  updateKpis();
  updateLinkToOtherScreen();
  fillCountryList();                 // the points of the country list depend on the filters
  updateCountryDetails();
  if (STATE.month && !monthIsShown(STATE.month)) { setLinkedMonth(null); } else { updateMonthDetails(); }
  const frameChanged = fitFrameToFilters();
  updateTextAlternatives();
  return Promise.all([
    setParameter('hotel_filter', STATE.hotel),
    setParameter('year_filter', STATE.year === 'All' ? 'All' : Number(STATE.year)),
    frameChanged ? setParameter('frame_month', STATE.frame) : Promise.resolve()
  ]);
}

function connectFilters() {
  document.querySelectorAll('input[name="hotel"]').forEach(function (radio) {
    radio.addEventListener('change', function () { STATE.hotel = radio.value; applyFilters(); });
  });
  const year = document.getElementById('year');
  year.addEventListener('change', function () { STATE.year = year.value; applyFilters(); });
  document.getElementById('reset-filters').addEventListener('click', function () {
    STATE.hotel = DEFAULT_STATE.hotel;
    STATE.year = DEFAULT_STATE.year;
    showStateInControls();
    applyFilters();
    announce('Filters reset: ' + HOTEL_LABELS[STATE.hotel] + ', ' + YEAR_LABELS[STATE.year] + '.');
  });
}

// ── I5: linked month on the main screen ─────────────────────────────────────

function monthRows(monthKey) {
  return DASHBOARD_DATA.month_hotel.filter(function (row) {
    return row.arrival_month.slice(0, 7) === monthKey && (STATE.hotel === 'Both' || row.hotel === STATE.hotel);
  });
}

function monthIsShown(monthKey) {
  return monthRows(monthKey).length > 0 && (STATE.year === 'All' || monthKey.slice(0, 4) === STATE.year);
}

function monthName(monthKey) {
  return MONTH_NAMES[Number(monthKey.slice(5, 7)) - 1] + ' ' + monthKey.slice(0, 4);
}

// The exact values of the linked month, written next to the charts (wcag skill: always visible)
function updateMonthDetails() {
  const box = document.getElementById('month-details');
  if (!box || !STATE.month) { return; }
  const items = monthRows(STATE.month).map(function (row) {
    return '<li><strong>' + row.hotel + ':</strong> ' + formatCount(row.guests) + ' guests, ' +
      formatPercent(row.cancel_rate) + ' cancelled, ' + formatEuros(row.median_price) + ' per night</li>';
  });
  box.innerHTML = '<p><strong>' + monthName(STATE.month) + '</strong></p><ul>' + items.join('') + '</ul>';
}

function setLinkedMonth(monthKey) {
  if (monthKey === STATE.month) { return Promise.resolve(); }
  STATE.month = monthKey;
  if (monthKey) {
    updateMonthDetails();
  } else {
    const box = document.getElementById('month-details');
    if (box) { box.innerHTML = '<p>Point at a month in a chart to see its guests, cancellations and price here.</p>'; }
  }
  return setParameter('linked_month', monthKey);
}

// Listeners of a chart that has just been drawn (again): the linked month (C1-C3) or a click on a country
function listenToChart(name) {
  const view = VIEWS[name];
  if (['c1', 'c2', 'c3'].indexOf(name) >= 0) {
    // Between the points: the nearest point, from the chart's pointer selection (the line charts only)
    try {
      view.addSignalListener('picked_month', function (signalName, value) {
        if (value && value.month_key && value.month_key.length) { setLinkedMonth(value.month_key[0]); }
      });
    } catch (error) { /* the heatmap has no pointer selection: its cells are large enough */ }
    // Right on a point or a heatmap cell
    view.addEventListener('pointerover', function (event, item) {
      if (item && item.mark && ['symbol', 'rect'].indexOf(item.mark.marktype) >= 0 && item.datum && item.datum.month_key) {
        setLinkedMonth(item.datum.month_key);
      }
    });
  }
  // A click on a country selects it; a second click on the selected country clears the selection
  if (['c4', 'c7', 'c8', 'c9'].indexOf(name) >= 0) {
    view.addEventListener('click', function (event, item) {
      if (item && item.datum && item.datum.country_group) { toggleCountry(item.datum.country_group); }
    });
  }
  if (name === 'c5') {
    view.addEventListener('click', function (event, item) {
      if (item && item.datum && item.datum.country_name) { toggleCountry(item.datum.country_name); }
    });
  }
}

// ── I7, I9: selected country and sort order on the detail screen ────────────

// The countries that can be selected: the top 10 and Other, and the countries of the list (at least 20 stays)
function selectableRow(name) {
  return DASHBOARD_DATA.country_medians.find(function (row) {
    return row.hotel_filter === 'Both' && row.year_filter === 'All' && row.country_group === name;
  });
}
function isListCountry(name) { const row = name && selectableRow(name); return !!row && !row.in_top; }

// Countries in the order of the rows: a selected country of the list first, then by guests (most first)
// or alphabetical; "Other" always last
function countryOrder() {
  const rows = DASHBOARD_DATA.country_medians.filter(function (row) {
    return row.hotel_filter === STATE.hotel && row.year_filter === String(STATE.year) && row.in_top && row.country_group !== 'Other';
  });
  rows.sort(function (a, b) {
    return STATE.sort === 'guests' ? b.guests - a.guests : a.country_group.localeCompare(b.country_group);
  });
  const order = rows.map(function (row) { return row.country_group; }).concat(['Other']);
  return isListCountry(STATE.country) ? [STATE.country].concat(order) : order;
}

function updateCountryDetails() {
  const box = document.getElementById('country-details');
  if (!box) { return; }
  const country = currentCountry();
  const kpis = currentKpis();
  showComboValue(STATE.country || '');
  document.getElementById('no-country').disabled = !STATE.country;
  if (!country) {
    box.innerHTML = '<p>No country selected. Choose one in the list, or click a country in a chart.</p>';
  } else {
    const name = STATE.country === 'Other' ? 'Other and unknown' : STATE.country;     // one line in the panel
    const enough = country.nights_median !== null;
    box.innerHTML = '<p><strong>' + name + '</strong></p><ul>' +
      '<li>' + formatCount(country.guests) + ' guests (' + formatPercent(100 * country.guests / kpis.guests) + ')</li>' +
      (enough ? '<li>Median stay: ' + formatShort(country.nights_median) + ' nights</li>' +
                '<li>Median advance: ' + formatShort(country.lead_median) + ' days</li>'
              : '<li>Fewer than 20 stays with these filters: no medians</li>') +
      '<li>Cancelled: ' + (country.cancel_rate === null ? '–' : formatPercent(country.cancel_rate)) + '</li></ul>';
  }
  const order = countryOrder();
  const position = STATE.country ? order.indexOf(STATE.country) : -1;
  const previous = document.getElementById('previous-country');
  const next = document.getElementById('next-country');
  previous.disabled = position <= 0;                       // disabled at the ends (wcag skill)
  next.disabled = position >= order.length - 1;
  previous.setAttribute('aria-label', position > 0 ? 'Previous country: ' + order[position - 1] : 'Previous country (none)');
  next.setAttribute('aria-label', position < order.length - 1 ? 'Next country: ' + order[position + 1] : 'Next country (none)');
}

// Select a country (or none, with null). A country of the list adds a row to C4, C7 and C8, so those charts are
// drawn again when it comes or goes; the other changes only set the chart parameter.
function selectCountry(name) {
  name = name || null;
  if (name === STATE.country) { return Promise.resolve(); }
  const rowsChange = isListCountry(name) || isListCountry(STATE.country);
  STATE.country = name;
  updateKpis();
  updateCountryDetails();
  updateTextAlternatives();
  announce(name ? 'Selected country: ' + name + '.' : 'No country selected.');
  const done = setParameter('selected_country', name || '');
  return rowsChange ? done.then(function () { return redrawCharts(['c4', 'c7', 'c8']); }) : done;
}

// A second click (or Enter) on the selected country clears the selection
function toggleCountry(name) {
  if (name === STATE.country) { return selectCountry(null); }
  if (!selectableRow(name)) {
    announce(name + ' has fewer than 20 stays: it is counted in Other.');
    return Promise.resolve();
  }
  return selectCountry(name);
}

// The list of countries: no country, the top 10 and Other (by guests), then the other countries (A to Z).
// It is a custom list (WAI-ARIA select-only combobox) so that a point on the right can mark the countries that
// do not get a bubble in C9 with the current filters: C9 shows only countries with at least 20 stays in EVERY month.
// Other has no point: it is a group, not a country of the bubble chart.
function bubbleCountries() {
  const shown = new Set();
  DASHBOARD_DATA.country_season.forEach(function (row) {
    if (forFilters(row) && row.all_months && row.country_group !== 'Other') { shown.add(row.country_group); }
  });
  return shown;
}

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const COMBO = { open: false, active: -1, typed: '', typedAt: 0 };

function comboOptions() { return Array.from(document.querySelectorAll('#country-listbox [role="option"]')); }

function fillCountryList() {
  const listbox = document.getElementById('country-listbox');
  if (!listbox) { return; }
  const rows = DASHBOARD_DATA.country_medians.filter(function (row) { return row.hotel_filter === 'Both' && row.year_filter === 'All'; });
  const top = rows.filter(function (row) { return row.in_top && row.country_group !== 'Other'; })
    .sort(function (a, b) { return b.guests - a.guests; }).map(function (row) { return row.country_group; }).concat(['Other']);
  const more = rows.filter(function (row) { return !row.in_top; }).map(function (row) { return row.country_group; })
    .sort(function (a, b) { return a.localeCompare(b); });
  const shown = bubbleCountries();
  let n = 0;
  const option = function (value, text, markable) {
    const noBubble = markable && value !== 'Other' && !shown.has(value);
    n += 1;
    return '<div role="option" id="country-option-' + n + '" data-value="' + escapeHtml(value) + '" data-label="' + escapeHtml(text) + '"' +
      (noBubble ? ' data-no-bubble="true"' : '') + ' aria-selected="false"><span class="option-name">' + escapeHtml(text) + '</span>' +
      (noBubble ? '<span class="no-bubble-mark" aria-hidden="true">●</span><span class="sr-only">, not shown in the bubble chart</span>' : '') + '</div>';
  };
  listbox.innerHTML = option('', 'No country', false) +
    '<div role="group" aria-labelledby="country-group-top"><div role="presentation" class="group-label" id="country-group-top">Top 10 countries</div>' +
    top.map(function (c) { return option(c, c === 'Other' ? 'Other (all other countries)' : c, true); }).join('') + '</div>' +
    '<div role="group" aria-labelledby="country-group-more"><div role="presentation" class="group-label" id="country-group-more">More countries (at least 20 stays)</div>' +
    more.map(function (c) { return option(c, c, true); }).join('') + '</div>';
  showComboValue(STATE.country || '');
}

// The closed list shows the selected country, with the same point if it has no bubble
function showComboValue(value) {
  const combo = document.getElementById('country-select');
  if (!combo) { return; }
  const options = comboOptions();
  options.forEach(function (o) { o.setAttribute('aria-selected', String(o.getAttribute('data-value') === value)); });
  const chosen = options.find(function (o) { return o.getAttribute('data-value') === value; });
  const label = chosen ? chosen.getAttribute('data-label') : (value || 'No country');
  const noBubble = chosen && chosen.getAttribute('data-no-bubble') === 'true';
  combo.setAttribute('data-value', value);
  combo.innerHTML = '<span class="combo-value">' + escapeHtml(label) + '</span>' +
    (noBubble ? '<span class="no-bubble-mark" aria-hidden="true">●</span><span class="sr-only">, not shown in the bubble chart</span>' : '') +
    '<span class="combo-arrow" aria-hidden="true">▾</span>';
}

function setActiveOption(index) {
  const options = comboOptions();
  const combo = document.getElementById('country-select');
  options.forEach(function (o) { o.classList.remove('active'); });
  COMBO.active = Math.max(0, Math.min(index, options.length - 1));
  const option = options[COMBO.active];
  if (!option) { return; }
  option.classList.add('active');
  combo.setAttribute('aria-activedescendant', option.id);
  option.scrollIntoView({ block: 'nearest' });
}

// The list opens below the box (or above it if there is no room); it is fixed to the window, so the scrolling
// filter panel never cuts it
function openCombo() {
  const combo = document.getElementById('country-select');
  const popup = document.getElementById('country-popup');
  const box = combo.getBoundingClientRect();
  const below = window.innerHeight - box.bottom - 8;
  const above = box.top - 8;
  const height = Math.min(360, Math.max(below, above));
  const width = Math.max(box.width, 290);
  popup.style.left = Math.max(8, Math.min(box.left, window.innerWidth - width - 8)) + 'px';   // never past the window edge
  popup.style.width = width + 'px';
  popup.style.maxHeight = height + 'px';
  if (below >= Math.min(360, above) || below >= 240) { popup.style.top = (box.bottom + 2) + 'px'; popup.style.bottom = ''; }
  else { popup.style.top = ''; popup.style.bottom = (window.innerHeight - box.top + 2) + 'px'; }
  popup.hidden = false;
  combo.setAttribute('aria-expanded', 'true');
  COMBO.open = true;
  const options = comboOptions();
  const current = options.findIndex(function (o) { return o.getAttribute('data-value') === (STATE.country || ''); });
  setActiveOption(current < 0 ? 0 : current);
}

function closeCombo(choose) {
  const combo = document.getElementById('country-select');
  const popup = document.getElementById('country-popup');
  if (!COMBO.open) { return; }
  const option = comboOptions()[COMBO.active];
  popup.hidden = true;
  combo.setAttribute('aria-expanded', 'false');
  combo.removeAttribute('aria-activedescendant');
  COMBO.open = false;
  if (choose && option) { selectCountry(option.getAttribute('data-value')); }
}

// Type-ahead: letters typed within half a second jump to the next country starting with them
function typeAhead(letter) {
  const now = Date.now();
  COMBO.typed = (now - COMBO.typedAt < 500 ? COMBO.typed : '') + letter.toLowerCase();
  COMBO.typedAt = now;
  const options = comboOptions();
  const start = COMBO.typed.length === 1 ? COMBO.active + 1 : COMBO.active;
  for (let k = 0; k < options.length; k += 1) {
    const index = (start + k) % options.length;
    if (options[index].getAttribute('data-label').toLowerCase().indexOf(COMBO.typed) === 0) { setActiveOption(index); return; }
  }
}

function connectCountryCombo() {
  const combo = document.getElementById('country-select');
  const popup = document.getElementById('country-popup');
  if (!combo || !popup) { return; }
  combo.addEventListener('click', function () { if (COMBO.open) { closeCombo(false); } else { openCombo(); } });
  combo.addEventListener('keydown', function (event) {
    const count = comboOptions().length;
    const key = event.key;
    let handled = true;
    if (!COMBO.open) {
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') { openCombo(); }
      else if (key === 'Home') { openCombo(); setActiveOption(0); }
      else if (key === 'End') { openCombo(); setActiveOption(count - 1); }
      else if (key.length === 1 && /\S/.test(key) && !event.ctrlKey && !event.metaKey && !event.altKey) { openCombo(); typeAhead(key); }
      else { handled = false; }
    } else if (key === 'ArrowDown' && !event.altKey) { setActiveOption(COMBO.active + 1); }
    else if (key === 'ArrowUp' && event.altKey) { closeCombo(true); }
    else if (key === 'ArrowUp') { setActiveOption(COMBO.active - 1); }
    else if (key === 'Home') { setActiveOption(0); }
    else if (key === 'End') { setActiveOption(count - 1); }
    else if (key === 'PageDown') { setActiveOption(COMBO.active + 10); }
    else if (key === 'PageUp') { setActiveOption(COMBO.active - 10); }
    else if (key === 'Enter' || key === ' ') { closeCombo(true); }
    else if (key === 'Escape') { closeCombo(false); }
    else if (key === 'Tab') { closeCombo(true); handled = false; }       // WAI-ARIA pattern: Tab keeps the option
    else if (key.length === 1 && /\S/.test(key) && !event.ctrlKey && !event.metaKey && !event.altKey) { typeAhead(key); }
    else { handled = false; }
    if (handled) { event.preventDefault(); }
  });
  // Mouse: the focus stays on the box; a click on an option chooses it, a click elsewhere closes the list
  popup.addEventListener('mousedown', function (event) { event.preventDefault(); });
  popup.addEventListener('click', function (event) {
    const option = event.target.closest('[role="option"]');
    if (!option) { return; }
    setActiveOption(comboOptions().indexOf(option));
    closeCombo(true);
  });
  document.addEventListener('mousedown', function (event) {
    if (COMBO.open && !combo.contains(event.target) && !popup.contains(event.target)) { closeCombo(false); }
  });
  combo.addEventListener('blur', function () { closeCombo(false); });
  window.addEventListener('resize', function () { closeCombo(false); });
}

function connectCountrySelection() {
  document.getElementById('previous-country').addEventListener('click', function () {
    const order = countryOrder();
    selectCountry(order[Math.max(order.indexOf(STATE.country) - 1, 0)]);
  });
  document.getElementById('next-country').addEventListener('click', function () {
    const order = countryOrder();
    selectCountry(order[Math.min(order.indexOf(STATE.country) + 1, order.length - 1)]);
  });
  // The button is disabled once no country is selected, so the focus moves to the list instead of being lost
  document.getElementById('no-country').addEventListener('click', function () {
    selectCountry(null);
    document.getElementById('country-select').focus();
  });
  connectCountryCombo();
  // Found in the browser: changing sort_order in a drawn chart does not reorder its rows (Vega does not
  // recompute the sorted axis when only the sort key changes), so the three country charts are drawn again
  document.querySelectorAll('input[name="sort"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      STATE.sort = radio.value;
      updateCountryDetails();
      redrawCharts(['c4', 'c7', 'c8']);
      updateTextAlternatives();
      announce(STATE.sort === 'guests' ? 'Countries sorted by number of guests, Other last.'
        : 'Countries sorted alphabetically, Other last.');
    });
  });
}

// ── The first card of the detail screen: dumbbell chart (C4) or map (C5) ─────
// Only one of them is shown, so no more than three charts are visible at once (cognitive accessibility)
function showCountryView(name) {
  STATE.view = name;
  const other = name === 'c4' ? 'c5' : 'c4';
  const toggle = document.querySelector('.table-toggle[data-charts="c4"], .table-toggle[data-charts="c5"]');
  const tableShown = toggle && toggle.getAttribute('aria-pressed') === 'true';
  document.getElementById(other).hidden = true;
  document.getElementById(other + '-table').hidden = true;
  document.getElementById(name).hidden = tableShown;
  document.getElementById(name + '-table').hidden = !tableShown;
  if (toggle) { toggle.setAttribute('data-charts', name); toggle.setAttribute('aria-controls', name + '-table'); }
  writeCardTitle(name, 'c4');
  if (!tableShown) { return VIEWS[name] ? redrawCharts([name]) : embedChart(name); }
  updateTextAlternatives([name]);      // the table of the other view is written now that it is shown
  return Promise.resolve();
}

function connectCountryView() {
  document.querySelectorAll('input[name="country-view"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (radio.checked) {
        showCountryView(radio.value);
        announce(radio.value === 'c5' ? 'Map of the guests per country shown.' : 'Dumbbell chart of the countries shown.');
      }
    });
  });
}

// ── Data tables shown in the place of their chart ───────────────────────────
function connectTableToggles() {
  document.querySelectorAll('.table-toggle').forEach(function (button) {
    button.addEventListener('click', function () {
      const showTable = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(showTable));
      const names = button.getAttribute('data-charts').split(' ');
      names.forEach(function (name) {
        document.getElementById(name).hidden = showTable;
        document.getElementById(name + '-table').hidden = !showTable;
      });
      updateTextAlternatives();
      // A chart shown again is drawn again, so it takes the current size of its box
      if (!showTable) { redrawCharts(names); }
    });
  });
}

// ── C9: animation through the months (course 07: time as a third dimension, Play button) ─
let playTimer = null;

// Months that C9 can show for the current filters (2015 and 2017 are partial years)
function availableMonths() {
  const months = new Set();
  DASHBOARD_DATA.country_season.forEach(function (row) {
    if (row.hotel_filter === STATE.hotel && row.year_filter === String(STATE.year) && row.stays >= MIN_STAYS) {
      months.add(row.calendar_month);
    }
  });
  return Array.from(months).sort(function (a, b) { return a - b; });
}

// Keep the month of the animation inside the months of the filters; true if it changed
function fitFrameToFilters() {
  const slider = document.getElementById('frame-month');
  if (!slider) { return false; }
  const months = availableMonths();
  slider.min = months[0];
  slider.max = months[months.length - 1];
  const before = STATE.frame;
  if (months.indexOf(STATE.frame) < 0) { STATE.frame = months[0]; }
  showFrame();
  return STATE.frame !== before;
}

function showFrame() {
  const slider = document.getElementById('frame-month');
  if (!slider) { return; }
  slider.value = STATE.frame;
  slider.setAttribute('aria-valuetext', MONTH_NAMES[STATE.frame - 1]);
  setText('frame-month-name', MONTH_NAMES[STATE.frame - 1]);
}

function setFrame(month) {
  STATE.frame = month;
  showFrame();
  updateTextAlternatives(['c9']);
  return setParameter('frame_month', month);
}

function stopPlaying(message) {
  if (playTimer) { window.clearInterval(playTimer); playTimer = null; }
  const button = document.getElementById('play');
  button.setAttribute('aria-pressed', 'false');
  button.querySelector('.play-text').textContent = 'Play';
  button.firstElementChild.textContent = '▶';
  if (message) { announce(message); }
}

function connectPlayer() {
  const slider = document.getElementById('frame-month');
  const button = document.getElementById('play');
  slider.addEventListener('input', function () { stopPlaying(); setFrame(Number(slider.value)); });
  button.addEventListener('click', function () {
    if (playTimer) { stopPlaying('Animation paused in ' + MONTH_NAMES[STATE.frame - 1] + '.'); return; }
    const months = availableMonths();
    // At the last month, Play starts again from the first one
    if (STATE.frame >= months[months.length - 1]) { setFrame(months[0]); }
    button.setAttribute('aria-pressed', 'true');
    button.querySelector('.play-text').textContent = 'Pause';
    button.firstElementChild.textContent = '❚❚';
    announce('Animation playing from ' + MONTH_NAMES[STATE.frame - 1] + '. Press Pause to stop it.');
    // One month every 1.5 seconds; it stops by itself at the last month (WCAG 2.2.2: it can be paused)
    playTimer = window.setInterval(function () {
      const list = availableMonths();
      const next = list[list.indexOf(STATE.frame) + 1];
      if (next === undefined) { stopPlaying('Animation finished in ' + MONTH_NAMES[STATE.frame - 1] + '.'); return; }
      setFrame(next);
    }, 1500);
  });
}

// ── Night mode: the charts are drawn again with the night colours ──────────
function onThemeChange() {
  redrawCharts(Object.keys(VIEWS));
  announce(isDark() ? 'Night mode on.' : 'Night mode off.');
}

// ── Notes about the data (dialog) ─────────────────────────────────────────────
function connectNotes() {
  const button = document.getElementById('open-notes');
  const dialog = document.getElementById('notes-dialog');
  if (!button || !dialog) { return; }
  button.addEventListener('click', function () { dialog.showModal(); });
}

// ── Keyboard and focus layer (task 6.6, wcag-accessibility skill) ────────────
// Every data mark can be reached with the keyboard: Tab enters a chart (one stop per chart), the arrow keys
// move between its marks, Alt + up/down arrow changes series (hotel), Home/End go to the first/last mark,
// Enter or Space shows the value box again and Escape hides it.
// The focus ring is drawn in an SVG overlay above the chart (the skill's pattern), never with CSS outline.

const FOCUS_BLUE = '#0066CC';

function monthKeyFromLabel(label) {
  const words = label.split(': ')[0].split(', ')[1].split(' ');      // "City Hotel, August 2016: ..." -> August 2016
  const month = MONTH_NAMES.indexOf(words[0]) + 1;
  return words[1] + '-' + (month < 10 ? '0' : '') + month;
}

// How the marks of each chart are found, grouped into series, ordered and named
const KEYBOARD_CONFIG = {
  c1: { pattern: /^(City|Resort) Hotel, /, series: function (l) { return l.split(', ')[0]; }, seriesWord: 'Hotel',
        order: 'x', unit: 'Month', onFocus: function (l) { setLinkedMonth(monthKeyFromLabel(l)); } },
  // Detail screen: moving the focus only shows the value; Enter or Space selects the country (again: clears it)
  c4: { pattern: / % of the guests of the hotel /, series: function (l) { return l.split(': ')[0].split(', ')[1]; },
        seriesWord: 'Hotel', order: 'y', unit: 'Country', onSelect: function (l) { toggleCountry(l.split(', ')[0]); } },
  c9: { pattern: / % of its guests arrive this month/, series: function () { return ''; }, order: 'x', unit: 'Country',
        onSelect: function (l) { toggleCountry(l.split(', ')[0]); } },
  c7: { pattern: /: nights per stay, median /, series: function () { return ''; }, order: 'y', unit: 'Country',
        onSelect: function (l) { toggleCountry(l.split(': ')[0]); } },
  c5: { pattern: /^[^,;]*: [\d,]+ guests$/, series: function () { return ''; }, order: 'value', unit: 'Country',
        onSelect: function (l) { toggleCountry(l.split(': ')[0]); } }
};
// C2 (heatmap): one series per hotel, its cells in reading order (row by row: month after month)
KEYBOARD_CONFIG.c2 = Object.assign({}, KEYBOARD_CONFIG.c1, { order: 'reading', unit: 'Month' });
KEYBOARD_CONFIG.c3 = KEYBOARD_CONFIG.c1;
KEYBOARD_CONFIG.c8 = Object.assign({}, KEYBOARD_CONFIG.c7, { pattern: /: days booked in advance, median / });

const KEYBOARD = {};       // per chart: series names, marks per series, position, overlay, live region

function markKey(element) { return element.getAttribute('aria-label').split(': ')[0]; }

function chartParts(name) {
  const container = document.getElementById(name);
  let overlay = container.querySelector('.focus-overlay');
  if (!overlay) {
    overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    overlay.classList.add('focus-overlay');
    overlay.setAttribute('aria-hidden', 'true');             // invisible to screen readers
    overlay.setAttribute('pointer-events', 'none');          // never catches a click
    container.appendChild(overlay);
  }
  let live = container.querySelector('.chart-announcer');
  if (!live) {
    live = document.createElement('div');
    live.className = 'chart-announcer sr-only';
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    container.appendChild(live);
  }
  return { container: container, overlay: overlay, live: live };
}

// Find the data marks of a chart and make them focusable (roving tabindex: one Tab stop per chart)
function buildKeyboard(name) {
  const config = KEYBOARD_CONFIG[name];
  const parts = chartParts(name);
  const svg = parts.container.querySelector('svg.marks') || parts.container.querySelector('svg:not(.focus-overlay)');
  if (!config || !svg) { return; }
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', DASHBOARD_SPECS[name].description);    // short text alternative
  watchSelectedPattern(svg);
  const marks = Array.from(svg.querySelectorAll('.role-mark [aria-label]')).filter(function (el) {
    return config.pattern.test(el.getAttribute('aria-label'));
  });
  const groups = {};
  const series = [];
  marks.forEach(function (el) {
    const key = config.series(el.getAttribute('aria-label'));
    if (!(key in groups)) { groups[key] = []; series.push(key); }
    groups[key].push(el);
    el.setAttribute('tabindex', '-1');
    el.setAttribute('role', 'graphics-symbol');
    el.style.outline = 'none';                                // the overlay draws the focus, never CSS outline
  });
  series.forEach(function (key) {
    groups[key].sort(function (a, b) {
      if (config.order === 'value') {
        return Number(b.getAttribute('aria-label').match(/: ([\d,]+) guests$/)[1].replace(/,/g, '')) -
               Number(a.getAttribute('aria-label').match(/: ([\d,]+) guests$/)[1].replace(/,/g, ''));
      }
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      if (config.order === 'reading') { return Math.round(ra.top) - Math.round(rb.top) || ra.left - rb.left; }
      return config.order === 'x' ? ra.left - rb.left : ra.top - rb.top;
    });
  });
  const previous = KEYBOARD[name] || {};
  KEYBOARD[name] = Object.assign(previous, { series: series, groups: groups, parts: parts, config: config });
  // The Tab stop: the mark that was focused, else the selected country or linked month, else the first
  let start = null;
  if (previous.key) { start = marks.find(function (el) { return markKey(el) === previous.key; }); }
  if (!start && config.onSelect && STATE.country) {
    start = groups[series[0]] && groups[series[0]].find(function (el) { return markKey(el).split(', ')[0] === STATE.country; });
  }
  if (!start && series.length) { start = groups[series[0]][0]; }
  if (start) { start.setAttribute('tabindex', '0'); }
  if (name === 'c2') { drawHeatmapDots(name); }
  if (!parts.container.dataset.keyboard) {                   // listeners once per container (they survive redraws)
    parts.container.dataset.keyboard = 'on';
    parts.container.addEventListener('keydown', function (event) { onChartKey(name, event); });
    parts.container.addEventListener('focusin', function (event) { onChartFocus(name, event.target); });
    parts.container.addEventListener('focusout', function (event) {
      if (!parts.container.contains(event.relatedTarget)) { leaveChart(name); }
    });
  }
}

// After a redraw: rebuild, and if the focus was in this chart put it back on the same mark
function refreshKeyboard(name) {
  const state = KEYBOARD[name];
  const hadFocus = state && state.inside;
  buildKeyboard(name);
  if (!KEYBOARD[name] || !KEYBOARD[name].parts) { return; }
  if (hadFocus && state.key && !KEYBOARD[name].parts.container.contains(document.activeElement)) {
    const all = [].concat.apply([], KEYBOARD[name].series.map(function (s) { return KEYBOARD[name].groups[s]; }));
    const again = all.find(function (el) { return markKey(el) === state.key; });
    if (again) { state.quiet = true; again.focus(); }
  } else if (hadFocus && document.activeElement && KEYBOARD[name].parts.container.contains(document.activeElement)) {
    drawFocusRing(name, document.activeElement);
  }
}

function moveFocus(name, seriesIndex, markIndex) {
  const state = KEYBOARD[name];
  if (!state || !state.series.length) { return; }
  seriesIndex = Math.max(0, Math.min(seriesIndex, state.series.length - 1));
  const list = state.groups[state.series[seriesIndex]];
  markIndex = Math.max(0, Math.min(markIndex, list.length - 1));   // a shorter series: go to its last mark
  state.series.forEach(function (s) { state.groups[s].forEach(function (el) { el.setAttribute('tabindex', '-1'); }); });
  list[markIndex].setAttribute('tabindex', '0');
  list[markIndex].focus();
}

function position(name, element) {
  const state = KEYBOARD[name];
  for (let s = 0; s < state.series.length; s++) {
    const i = state.groups[state.series[s]].indexOf(element);
    if (i >= 0) { return { s: s, i: i }; }
  }
  return null;
}

function onChartKey(name, event) {
  const state = KEYBOARD[name];
  const here = state && position(name, event.target);
  if (!here) { return; }
  const list = state.groups[state.series[here.s]];
  let handled = true;
  if (event.altKey && event.key === 'ArrowDown') { moveFocus(name, here.s + 1, here.i); }
  else if (event.altKey && event.key === 'ArrowUp') { moveFocus(name, here.s - 1, here.i); }
  else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { moveFocus(name, here.s, here.i + 1); }
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { moveFocus(name, here.s, here.i - 1); }
  else if (event.key === 'Home') { moveFocus(name, here.s, 0); }
  else if (event.key === 'End') { moveFocus(name, here.s, list.length - 1); }
  else if (event.key === 'Enter' || event.key === ' ') {
    if (state.config.onSelect) { state.config.onSelect(event.target.getAttribute('aria-label')); }
    showValueBox(event.target);
  }
  else if (event.key === 'Escape') { hideValueBox(); }
  else { handled = false; }
  if (handled) { event.preventDefault(); }                      // the arrows must not scroll the page
}

function onChartFocus(name, element) {
  const state = KEYBOARD[name];
  const here = state && position(name, element);
  if (!here) { return; }
  const key = markKey(element);
  const label = element.getAttribute('aria-label');
  const list = state.groups[state.series[here.s]];
  const firstTime = !state.inside;
  state.inside = true;
  // The active series at full opacity, the others dimmed (wcag skill)
  state.series.forEach(function (s, index) {
    state.groups[s].forEach(function (el) { el.style.opacity = (state.series.length > 1 && index !== here.s) ? '0.4' : ''; });
  });
  element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  // Ring and value box for keyboard focus only (a mouse click on a mark shows its selection, not a focus ring)
  if (element.matches(':focus-visible')) {
    drawFocusRing(name, element);
    showValueBox(element);
  }
  if (!(state.quiet && key === state.key)) {
    const series = state.series.length > 1 ? state.config.seriesWord + ': ' + state.series[here.s] + '. ' : '';
    const help = firstTime ? ' Arrow keys: next or previous' + (state.series.length > 1 ? '; Alt plus up or down arrow: change '
      + state.config.seriesWord.toLowerCase() : '') + (state.config.onSelect ? '; Enter: select or clear this country' : '') +
      '; Escape: hide the value box.' : '';
    state.parts.live.textContent = series + state.config.unit + ' ' + (here.i + 1) + ' of ' + list.length + ': ' + label + '.' + help;
  }
  state.quiet = false;
  state.key = key;
  if (state.config.onFocus) { state.config.onFocus(label); }   // keyboard version of I5 and I7
}

function leaveChart(name) {
  const state = KEYBOARD[name];
  if (!state) { return; }
  state.inside = false;
  state.series.forEach(function (s) { state.groups[s].forEach(function (el) { el.style.opacity = ''; }); });
  clearFocusRing(name);
  hideValueBox();
}

// ── Focus ring: an SVG overlay above the chart, shaped like the mark (skill pattern) ─
function clearFocusRing(name) {
  const overlay = KEYBOARD[name] && KEYBOARD[name].parts.overlay;
  while (overlay && overlay.firstChild) { overlay.removeChild(overlay.firstChild); }
}

function drawFocusRing(name, element) {
  const overlay = KEYBOARD[name].parts.overlay;
  const container = KEYBOARD[name].parts.container;
  clearFocusRing(name);
  const base = container.getBoundingClientRect();
  const box = element.getBoundingClientRect();
  const left = box.left - base.left + container.scrollLeft;
  const top = box.top - base.top + container.scrollTop;
  const isBar = element.closest('g.mark-rect') || element.closest('g.mark-shape') || element.tagName === 'path' && !element.closest('g.mark-symbol');
  const NS = 'http://www.w3.org/2000/svg';
  if (isBar) {
    // Boxes and countries: double rectangle, white outside and blue inside (3:1 on any background)
    [{ stroke: '#FFFFFF', width: 5 }, { stroke: FOCUS_BLUE, width: 3 }].forEach(function (ring) {
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('x', left - ring.width / 2 - 2);
      rect.setAttribute('y', top - ring.width / 2 - 2);
      rect.setAttribute('width', box.width + ring.width + 4);
      rect.setAttribute('height', box.height + ring.width + 4);
      rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', ring.stroke);
      rect.setAttribute('stroke-width', ring.width);
      overlay.appendChild(rect);
    });
  } else {
    // Points and bubbles: two concentric circles, white and blue
    const r = Math.max(box.width, box.height) / 2;
    [{ stroke: '#FFFFFF', r: r + 6, width: 3 }, { stroke: FOCUS_BLUE, r: r + 4, width: 2.5 }].forEach(function (ring) {
      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('cx', left + box.width / 2);
      circle.setAttribute('cy', top + box.height / 2);
      circle.setAttribute('r', ring.r);
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', ring.stroke);
      circle.setAttribute('stroke-width', ring.width);
      overlay.appendChild(circle);
    });
  }
}

// ── Value box: the exact value of the focused mark, visible next to it (dismissible with Escape) ─
function showValueBox(element) {
  let box = document.getElementById('keyboard-value');
  if (!box) {
    box = document.createElement('div');
    box.id = 'keyboard-value';
    box.setAttribute('aria-hidden', 'true');                  // the chart's live region already reads it
    document.body.appendChild(box);
  }
  box.textContent = element.getAttribute('aria-label');
  const rect = element.getBoundingClientRect();
  box.hidden = false;
  const left = Math.min(rect.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - box.offsetWidth - 8);
  box.style.left = Math.max(8, left) + 'px';
  const above = rect.top + window.scrollY - box.offsetHeight - 10;
  box.style.top = (above < window.scrollY + 4 ? rect.bottom + window.scrollY + 10 : above) + 'px';
}

function hideValueBox() {
  const box = document.getElementById('keyboard-value');
  if (box) { box.hidden = true; }
}

// ── Text alternatives and data tables (task 6.7, WCAG 1.1.1) ────────────────
// Each chart has a short text (its type and what it shows, also the SVG's aria-label), a long text with
// the main values for the current filters, and a data table with every value it draws (the "Table" button).
// All of them are computed here from data.js with the same rules as the charts.

function inFilters(row) {
  return (STATE.hotel === 'Both' || row.hotel === STATE.hotel) && (STATE.year === 'All' || String(row.year) === STATE.year);
}
function forFilters(row) { return row.hotel_filter === STATE.hotel && row.year_filter === String(STATE.year); }
function hotelsShown() { return STATE.hotel === 'Both' ? ['City Hotel', 'Resort Hotel'] : [STATE.hotel]; }
function monthLabel(isoDate) { return monthName(isoDate.slice(0, 7)); }

// C1-C3: the monthly rows of each hotel shown
function monthTableRows() {
  return DASHBOARD_DATA.month_hotel.filter(inFilters);
}

// C4: share of each country in each hotel (as the chart: the hotel totals count the top 10 and Other only)
function countryShares() {
  const sums = {}, totals = {};
  DASHBOARD_DATA.country_hotel.filter(inFilters).forEach(function (row) {
    const key = row.country_group + '|' + row.hotel;
    sums[key] = (sums[key] || 0) + row.guests;
    if (row.in_top) { totals[row.hotel] = (totals[row.hotel] || 0) + row.guests; }
  });
  return { sums: sums, totals: totals };
}

// C7, C8: precomputed box numbers for the filters, in the order of the rows
function boxRows() {
  const order = countryOrder();
  return DASHBOARD_DATA.country_medians.filter(function (row) {
    return forFilters(row) && (row.in_top || row.country_group === STATE.country) && row.nights_median !== null;
  }).sort(function (a, b) { return order.indexOf(a.country_group) - order.indexOf(b.country_group); });
}

// C9: the countries drawn for the month shown, most of their year first
function frameRows() {
  return DASHBOARD_DATA.country_season.filter(function (row) {
    return forFilters(row) && row.calendar_month === STATE.frame && row.all_months &&
      ((row.in_top && row.country_group !== 'Other') || row.country_group === STATE.country);
  }).sort(function (a, b) { return b.share - a.share; });
}

// C5: guests per country (every country with guests; the smallest are not drawn on the map)
function mapRows() {
  const sums = {};
  DASHBOARD_DATA.country_map.filter(inFilters).forEach(function (row) {
    sums[row.country_name] = (sums[row.country_name] || 0) + row.guests;
  });
  return Object.keys(sums).map(function (name) { return { country: name, guests: sums[name] }; })
    .sort(function (a, b) { return b.guests - a.guests || a.country.localeCompare(b.country); });
}

function extremes(rows, value) {
  let high = rows[0], low = rows[0];
  rows.forEach(function (row) { if (value(row) > value(high)) { high = row; } if (value(row) < value(low)) { low = row; } });
  return { high: high, low: low };
}

function longText(name) {
  const showing = HOTEL_LABELS[STATE.hotel] + ', ' + YEAR_LABELS[STATE.year] + '. ';
  if (['c1', 'c2', 'c3'].indexOf(name) >= 0) {
    const field = { c1: 'guests', c2: 'cancel_rate', c3: 'median_price' }[name];
    const show = { c1: function (v) { return formatCount(v) + ' guests'; }, c2: formatPercent, c3: formatEuros }[name];
    // C2 is a heatmap: a reader also needs to know how its colour classes work
    const intro = name === 'c2' ? 'Colour classes of 10 points, from 0 to 9 % to 60 % or more. ' : '';
    return showing + intro + hotelsShown().map(function (hotel) {
      const rows = monthTableRows().filter(function (row) { return row.hotel === hotel; });
      const e = extremes(rows, function (row) { return row[field]; });
      return hotel + ': highest in ' + monthLabel(e.high.arrival_month) + ' (' + show(e.high[field]) + '), lowest in ' +
        monthLabel(e.low.arrival_month) + ' (' + show(e.low[field]) + ').';
    }).join(' ') + ' Every month is in the data table.';
  }
  if (name === 'c4') {
    const shares = countryShares();
    return showing + hotelsShown().map(function (hotel) {
      const rows = countryOrder().filter(function (c) { return c !== 'Other'; }).map(function (c) {
        return { country: c, share: 100 * (shares.sums[c + '|' + hotel] || 0) / shares.totals[hotel] };
      }).sort(function (a, b) { return b.share - a.share; });
      const other = 100 * (shares.sums['Other|' + hotel] || 0) / shares.totals[hotel];
      return hotel + ': ' + rows.slice(0, 3).map(function (r) { return r.country + ' ' + formatPercent(r.share); }).join(', ') +
        ' are the largest; Other ' + formatPercent(other) + '.';
    }).join(' ') + (STATE.country ? ' Selected: ' + STATE.country + '.' : ' No country selected.');
  }
  if (name === 'c9') {
    const rows = frameRows();
    if (!rows.length) { return showing + 'No country has enough stays in ' + MONTH_NAMES[STATE.frame - 1] + '.'; }
    const ahead = extremes(rows, function (r) { return r.median_lead_time; });
    const selected = rows.find(function (r) { return r.country_group === STATE.country; });
    return showing + MONTH_NAMES[STATE.frame - 1] + ': the largest part of their year arrives for ' + rows[0].country_group +
      ' (' + formatPercent(rows[0].share) + ' of its guests); furthest ahead: ' + ahead.high.country_group + ' (' +
      formatShort(ahead.high.median_lead_time) + ' days); least ahead: ' + ahead.low.country_group + ' (' +
      formatShort(ahead.low.median_lead_time) + ' days).' + (!STATE.country ? '' : selected ? ' Selected, ' + STATE.country + ': ' +
      formatPercent(selected.share) + ', booked ' + formatShort(selected.median_lead_time) + ' days ahead.' :
      ' ' + STATE.country + ' is not drawn: it has fewer than ' + MIN_STAYS + ' stays in some month, or it is Other.');
  }
  if (name === 'c7' || name === 'c8') {
    const prefix = name === 'c7' ? 'nights' : 'lead';
    const unit = name === 'c7' ? ' nights' : ' days';
    const rows = boxRows();
    const e = extremes(rows, function (r) { return r[prefix + '_median']; });
    const selected = rows.find(function (r) { return r.country_group === STATE.country; });
    // Several countries can share the longest or shortest median: all of them are named
    const names = function (value) {
      return rows.filter(function (r) { return r[prefix + '_median'] === value; }).map(function (r) { return r.country_group; }).join(', ');
    };
    return showing + 'Longest median: ' + names(e.high[prefix + '_median']) + ' (' + formatShort(e.high[prefix + '_median']) + unit +
      '); shortest: ' + names(e.low[prefix + '_median']) + ' (' + formatShort(e.low[prefix + '_median']) + unit + ').' +
      (selected ? ' Selected, ' + STATE.country + ': median ' + formatShort(selected[prefix + '_median']) + unit + ', middle half ' +
      formatShort(selected[prefix + '_q1']) + ' to ' + formatShort(selected[prefix + '_q3']) + unit + '.' : '');
  }
  if (name === 'c5') {
    const rows = mapRows();
    return showing + rows.length + ' countries have guests. The most: ' + rows.slice(0, 5).map(function (r) {
      return r.country + ' (' + formatCount(r.guests) + ')'; }).join(', ') + '. Very small countries are not drawn; all are in the data table.';
  }
  return '';
}

// A table as HTML text, from a caption, the column names and the rows (cells already formatted)
function tableHtml(caption, columns, rows) {
  return '<table><caption>' + caption + '</caption><thead><tr>' +
    columns.map(function (c, i) { return '<th scope="col"' + (i ? ' class="number"' : '') + '>' + c + '</th>'; }).join('') +
    '</tr></thead><tbody>' + rows.map(function (cells) {
      return '<tr><th scope="row">' + cells[0] + '</th>' + cells.slice(1).map(function (c) { return '<td class="number">' + c + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table>';
}

function tableFor(name) {
  const caption = 'Data of the chart "' + DASHBOARD_SPECS[name].title.text + '": ' + HOTEL_LABELS[STATE.hotel] + ', ' + YEAR_LABELS[STATE.year];
  if (['c1', 'c2', 'c3'].indexOf(name) >= 0) {
    const field = { c1: 'guests', c2: 'cancel_rate', c3: 'median_price' }[name];
    const show = { c1: formatCount, c2: formatPercent, c3: formatEuros }[name];
    const unit = { c1: 'guests', c2: '% of bookings cancelled', c3: 'median price per night' }[name];
    const months = [];
    monthTableRows().forEach(function (row) { if (months.indexOf(row.arrival_month) < 0) { months.push(row.arrival_month); } });
    months.sort();
    return tableHtml(caption, ['Month'].concat(hotelsShown().map(function (h) { return h + ': ' + unit; })), months.map(function (m) {
      return [monthLabel(m)].concat(hotelsShown().map(function (h) {
        const row = DASHBOARD_DATA.month_hotel.find(function (r) { return r.arrival_month === m && r.hotel === h; });
        return row ? show(row[field]) : '–';
      }));
    }));
  }
  if (name === 'c4') {
    const shares = countryShares();
    return tableHtml(caption, ['Country'].concat(hotelsShown().map(function (h) { return h + ': % of its guests (guests)'; })),
      countryOrder().map(function (c) {
        return [c].concat(hotelsShown().map(function (h) {
          const guests = shares.sums[c + '|' + h] || 0;
          return formatPercent(100 * guests / shares.totals[h]) + ' (' + formatCount(guests) + ')';
        }));
      }));
  }
  if (name === 'c9') {
    return tableHtml(caption + ', ' + MONTH_NAMES[STATE.frame - 1] + ' (countries with at least ' + MIN_STAYS + ' stays in every month)',
      ['Country', '% of its guests arriving this month', 'Days booked in advance (median)', 'Guests this month'],
      frameRows().map(function (r) {
        return [r.country_group, formatPercent(r.share), formatShort(r.median_lead_time), formatCount(r.guests)];
      }));
  }
  if (name === 'c7' || name === 'c8') {
    const prefix = name === 'c7' ? 'nights' : 'lead';
    return tableHtml(caption, ['Country', 'Median', 'Box (middle half)', 'Line (most stays)', 'Guests'],
      boxRows().map(function (r) {
        return [r.country_group, formatShort(r[prefix + '_median']), formatShort(r[prefix + '_q1']) + ' to ' + formatShort(r[prefix + '_q3']),
          formatShort(r[prefix + '_low']) + ' to ' + formatShort(r[prefix + '_high']), formatCount(r.guests)];
      }));
  }
  if (name === 'c5') {
    return tableHtml(caption, ['Country', 'Guests'], mapRows().map(function (r) { return [r.country, formatCount(r.guests)]; }));
  }
  return '';
}

function updateTextAlternatives(names) {
  (names || CHARTS).forEach(function (name) {
    const long = document.getElementById(name + '-long');
    if (long) { long.textContent = longText(name); }
    const short = document.getElementById(name + '-short');
    if (short && !short.textContent) { short.textContent = DASHBOARD_SPECS[name].description; }
    const table = document.getElementById(name + '-table');
    if (table && !table.hidden) { table.innerHTML = tableFor(name); }   // tables are written when they are shown
  });
}

// ── Fill pattern of the selected country's box (pattern-rules: colour is not the only code) ─
// Vega draws the selected box in green; the page gives it white stripes. A MutationObserver puts
// the pattern back each time Vega redraws a box with the plain green fill. The light band behind the
// row (drawn with low opacity) keeps its plain colour.
const SELECTED_FILL = '#009E73';
function applySelectedPattern(svg) {
  svg.querySelectorAll('.mark-rect path[fill="' + SELECTED_FILL + '"]').forEach(function (box) {
    const opacity = Number(box.getAttribute('opacity') || box.getAttribute('fill-opacity') || 1);
    if (opacity < 1) { return; }
    box.setAttribute('fill', 'url(#pattern-selected)');
    box.setAttribute('data-selected', 'true');
  });
  svg.querySelectorAll('path[data-selected="true"]').forEach(function (box) {
    if (box.getAttribute('fill') !== 'url(#pattern-selected)') { box.removeAttribute('data-selected'); }
  });
}
function watchSelectedPattern(svg) {
  if (!document.getElementById('pattern-selected') || svg.dataset.pattern) { return; }
  svg.dataset.pattern = 'on';
  applySelectedPattern(svg);
  new MutationObserver(function () { applySelectedPattern(svg); })
    .observe(svg, { subtree: true, childList: true, attributes: true, attributeFilter: ['fill'] });
}

// ── Dots of the heatmap (pattern-rules skill: quantitative heatmaps) ─────────
// Over each cell of C2, dots whose size and density grow with the class of the value, in an SVG overlay that
// does not catch the pointer and is hidden from screen readers; dark dots on light cells, white on dark ones.
// The cell's own colour stays visible under the dots.
function relativeLuminance(hex) {
  const c = [1, 3, 5].map(function (i) {
    const v = parseInt(hex.substr(i, 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function drawHeatmapDots(name) {
  const container = document.getElementById(name);
  const svg = container && container.querySelector('svg.marks');
  if (!svg) { return; }
  let overlay = container.querySelector('.dots-overlay');
  if (!overlay) {
    overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    overlay.classList.add('dots-overlay');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('pointer-events', 'none');
    container.insertBefore(overlay, container.querySelector('.focus-overlay'));
  }
  const NS = 'http://www.w3.org/2000/svg';
  let defs = '';
  let cells = '';
  const base = container.getBoundingClientRect();
  svg.querySelectorAll('.mark-rect path[aria-label]').forEach(function (cell, index) {
    const match = cell.getAttribute('aria-label').match(/: ([\d.]+) % of bookings cancelled$/);
    const fill = cell.getAttribute('fill') || '#FFFFFF';
    if (!match || fill.charAt(0) !== '#') { return; }
    const level = Math.min(6, Math.floor(Number(match[1]) / 10)) / 6;          // the class, from 0 to 1
    // Sizes from the skill's range (radius 0.8-2.8 px, spacing 12-4 px), kept where the dots never cover more
    // than about 40 % of the cell, so its colour stays visible under them (found in the browser: 2.8 px dots
    // every 4 px hid the darkest colour)
    const radius = 0.8 + 1.4 * level;                                            // 0.8 to 2.2 px
    const gap = 12 - 6 * level;                                                  // 12 to 6 px between dots
    const dot = relativeLuminance(fill) > 0.25 ? '#1A1A1A' : '#FFFFFF';
    const box = cell.getBoundingClientRect();
    defs += '<pattern id="dots-' + name + '-' + index + '" patternUnits="userSpaceOnUse" width="' + gap + '" height="' + gap + '">' +
      '<circle cx="' + gap / 2 + '" cy="' + gap / 2 + '" r="' + radius + '" fill="' + dot + '" fill-opacity="0.65"/></pattern>';
    cells += '<rect x="' + (box.left - base.left + 1) + '" y="' + (box.top - base.top + 1) + '" width="' + Math.max(0, box.width - 2) +
      '" height="' + Math.max(0, box.height - 2) + '" fill="url(#dots-' + name + '-' + index + ')"/>';
  });
  overlay.innerHTML = '<defs>' + defs + '</defs>' + cells;
  overlay.setAttribute('xmlns', NS);
}

// A resize or zoom moves the marks: remove the rings (they come back with the next key press) and draw the
// heatmap's dots again once Vega has drawn the chart at its new size
let resizeTimer = null;
window.addEventListener('resize', function () {
  Object.keys(KEYBOARD).forEach(clearFocusRing);
  hideValueBox();
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(function () { if (VIEWS.c2) { drawHeatmapDots('c2'); } }, 400);
});

// ── Start: called by each page with the names of its charts ──────────────────
function startDashboard(chartNames) {
  chartNames.forEach(function (name) { CHARTS.push(name); });
  STATE.month = null;
  readStateFromAddress();
  showStateInControls();
  updateActiveFilters();
  updateKpis();
  updateLinkToOtherScreen();
  updateCountryDetails();
  fitFrameToFilters();
  fillCountryList();
  chartNames.forEach(function (name) {
    if (DASHBOARD_SPECS[name].title && document.getElementById(name + '-subtitle')) { writeCardTitle(name); }
  });
  updateTextAlternatives();
  connectThemeButton(onThemeChange);
  connectNotes();
  return Promise.all(chartNames.map(embedChart)).then(function () {
    connectFilters();
    connectTableToggles();
    if (document.getElementById('country-details')) { connectCountrySelection(); }
    if (document.querySelector('input[name="country-view"]')) { connectCountryView(); }
    if (document.getElementById('play')) { connectPlayer(); }
    document.body.setAttribute('data-dashboard-ready', 'true');   // used by the browser checks
  });
}
