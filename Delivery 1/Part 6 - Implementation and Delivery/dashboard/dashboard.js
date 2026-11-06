/* Shared code of both dashboard screens (index.html and detail.html).
   It draws every chart from specs.js with the data of data.js (no server, no fetch: architecture.md)
   and writes the KPIs and the "Showing" line for the current filters. */
'use strict';

// ── State of the dashboard ────────────────────────────────────────────────────
// Filters (I1, I2) and, on the detail screen, the selected country (I7) and the sort order (I9).
const STATE = { hotel: 'Both', year: 'All', country: 'Portugal', sort: 'guests', month: null };
const VIEWS = {};          // Vega view of each chart, by chart name (c1 ... c8)

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

// ── Number formats: thousands separators and units (COGA plain language) ─────
const NBSP = ' ';
function formatCount(value) { return new Intl.NumberFormat('en-GB').format(value); }
function formatPercent(value) { return value.toFixed(1) + NBSP + '%'; }
function formatEuros(value) { return '€' + value.toFixed(1); }

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
    selected_country: STATE.country,
    sort_order: STATE.sort
  };
}

// A copy of a chart spec with its data and the current state
function specWithState(name) {
  const spec = JSON.parse(JSON.stringify(DASHBOARD_SPECS[name]));
  spec.datasets = namedDatasets(spec);
  const values = parameterValues();
  (spec.params || []).forEach(function (param) {
    if (param.name in values) { param.value = values[param.name]; }
  });
  return spec;
}

// Draw one chart in the element with the same id; SVG renderer only (wcag-accessibility skill)
function embedChart(name) {
  return vegaEmbed('#' + name, specWithState(name), { renderer: 'svg', actions: false })
    .then(function (result) { VIEWS[name] = result.view; buildKeyboard(name); return result.view; })
    .catch(function (error) {
      const container = document.getElementById(name);
      container.textContent = 'This chart could not be drawn. Please reload the page; if it happens again, ' +
        'use the data table or contact us (see the accessibility page).';
      container.setAttribute('role', 'alert');
      console.error('Chart ' + name + ':', error);
    });
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

// The precomputed values of the selected country for the current filters
function currentCountry() {
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
  setText('kpi-stays-context', 'bookings not cancelled, of ' + formatCount(kpis.bookings));
  setText('kpi-guests', formatCount(kpis.guests));
  setText('kpi-guests-context', 'people in those stays');
  setText('kpi-cancel', formatPercent(kpis.cancel_rate));
  setText('kpi-cancel-context', 'of ' + formatCount(kpis.bookings) + ' bookings; duplicates included (see note)');
  setText('kpi-price', formatEuros(kpis.median_price));
  setText('kpi-price-context', 'median of stays with a price; euros assumed');
  // Detail screen
  const country = currentCountry();
  setText('kpi-countries', formatCount(kpis.countries_of_origin));
  setText('kpi-countries-context', 'countries with guests (known country)');
  setText('kpi-largest', kpis.largest_market);
  setText('kpi-largest-context', formatPercent(kpis.largest_market_share) + ' of the guests');
  setText('kpi-country-guests-label', 'Guests from ' + STATE.country);
  setText('kpi-country-guests', formatCount(country.guests));
  setText('kpi-country-guests-context', formatPercent(100 * country.guests / kpis.guests) + ' of all guests');
  setText('kpi-country-cancel-label', STATE.country + ': bookings cancelled');
  setText('kpi-country-cancel', formatPercent(country.cancel_rate));
  setText('kpi-country-cancel-context', 'of ' + formatCount(country.bookings) + ' bookings; duplicates included');
}

// ── Interactions (Part 5: I1 to I9) ──────────────────────────────────────────

const DEFAULT_STATE = { hotel: 'Both', year: 'All', country: 'Portugal', sort: 'guests' };
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];

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
  updateCountryDetails();
  if (STATE.month && !monthIsShown(STATE.month)) { setLinkedMonth(null); } else { updateMonthDetails(); }
  updateTextAlternatives();
  return Promise.all([
    setParameter('hotel_filter', STATE.hotel),
    setParameter('year_filter', STATE.year === 'All' ? 'All' : Number(STATE.year))
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
      formatPercent(row.cancel_rate) + ' of bookings cancelled, median price ' + formatEuros(row.median_price) + '</li>';
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
    if (box) { box.innerHTML = '<p>Point at a month in any chart to compare the guests, cancellations and price of that month; a dashed line marks it in the three charts.</p>'; }
  }
  return setParameter('linked_month', monthKey);
}

// A point under the pointer in C1, C2 or C3 links its month in the three charts; the month stays
// linked when the pointer leaves, so the values can still be read
function connectLinkedMonth() {
  ['c1', 'c2', 'c3'].forEach(function (name) {
    if (!VIEWS[name]) { return; }
    // Between the points: the nearest point, from the chart's pointer selection
    VIEWS[name].addSignalListener('picked_month', function (signalName, value) {
      if (value && value.month_key && value.month_key.length) { setLinkedMonth(value.month_key[0]); }
    });
    // Right on a point (the visible points are drawn above the selection layer)
    VIEWS[name].addEventListener('pointerover', function (event, item) {
      if (item && item.mark && item.mark.marktype === 'symbol' && item.datum && item.datum.month_key) {
        setLinkedMonth(item.datum.month_key);
      }
    });
  });
}

// ── I7, I9: selected country and sort order on the detail screen ────────────

// Countries in the order of the bars: by guests (most first) or alphabetical; "Other" always last
function countryOrder() {
  const rows = DASHBOARD_DATA.country_medians.filter(function (row) {
    return row.hotel_filter === STATE.hotel && row.year_filter === String(STATE.year) && row.country_group !== 'Other';
  });
  rows.sort(function (a, b) {
    return STATE.sort === 'guests' ? b.guests - a.guests : a.country_group.localeCompare(b.country_group);
  });
  return rows.map(function (row) { return row.country_group; }).concat(['Other']);
}

function updateCountryDetails() {
  const box = document.getElementById('country-details');
  if (!box) { return; }
  const country = currentCountry();
  const kpis = currentKpis();
  const name = STATE.country === 'Other' ? 'Other (all other countries and unknown)' : STATE.country;
  box.innerHTML = '<p><strong>' + name + '</strong></p><ul>' +
    '<li>' + formatCount(country.guests) + ' guests (' + formatPercent(100 * country.guests / kpis.guests) + ' of all)</li>' +
    '<li>Median stay: ' + country.median_nights + ' nights</li>' +
    '<li>Median advance: ' + country.median_lead_time + ' days</li>' +
    '<li>Bookings cancelled: ' + formatPercent(country.cancel_rate) + '</li></ul>';
  const order = countryOrder();
  const position = order.indexOf(STATE.country);
  const previous = document.getElementById('previous-country');
  const next = document.getElementById('next-country');
  previous.disabled = position <= 0;                       // disabled at the ends (wcag skill)
  next.disabled = position >= order.length - 1;
  previous.setAttribute('aria-label', position > 0 ? 'Previous country: ' + order[position - 1] : 'Previous country (none)');
  next.setAttribute('aria-label', position < order.length - 1 ? 'Next country: ' + order[position + 1] : 'Next country (none)');
}

function selectCountry(name) {
  if (name === STATE.country) { return Promise.resolve(); }
  STATE.country = name;
  updateKpis();
  updateCountryDetails();
  updateTextAlternatives();
  return setParameter('selected_country', name);
}

function listenToBarClicks(chart) {
  if (!VIEWS[chart]) { return; }
  VIEWS[chart].addSignalListener('clicked_country', function (signalName, value) {
    if (value && value.country_group && value.country_group.length) { selectCountry(value.country_group[0]); }
  });
}

// Draw some charts again with the current state. Used for the sort order: found in the browser,
// changing sort_order in a drawn chart does not reorder its bars (Vega does not recompute the sorted
// axis when only the sort key changes), so the three bar charts are drawn again instead.
function redrawCharts(names) {
  return Promise.all(names.map(function (name) {
    if (VIEWS[name]) { VIEWS[name].finalize(); delete VIEWS[name]; }
    return embedChart(name).then(function () { listenToBarClicks(name); });
  }));
}

function connectCountrySelection() {
  ['c4', 'c7', 'c8'].forEach(listenToBarClicks);
  document.getElementById('previous-country').addEventListener('click', function () {
    const order = countryOrder();
    selectCountry(order[Math.max(order.indexOf(STATE.country) - 1, 0)]);
  });
  document.getElementById('next-country').addEventListener('click', function () {
    const order = countryOrder();
    selectCountry(order[Math.min(order.indexOf(STATE.country) + 1, order.length - 1)]);
  });
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

// ── I8: Show more ────────────────────────────────────────────────────────────
function connectShowMore() {
  const button = document.getElementById('show-more');
  const section = document.getElementById('more-charts');
  button.addEventListener('click', function () {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    section.hidden = expanded;
    // The marks of the hidden charts had no position: order them again now that they are shown
    if (expanded === false) { ['c7', 'c8', 'c5'].forEach(buildKeyboard); }
    button.textContent = expanded ? 'Show more: length of stay, booking advance and map'
      : 'Show less: hide length of stay, booking advance and map';
  });
}

// ── Keyboard and focus layer (task 6.6, wcag-accessibility skill) ────────────
// Every data mark can be reached with the keyboard: Tab enters a chart (one stop per chart), the arrow keys
// move between its marks, Alt + up/down arrow changes series (hotel, panel or group) keeping the position,
// Home/End go to the first/last mark, Enter or Space shows the value box again and Escape hides it.
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
  c4: { pattern: / % of the guests of the hotel /, series: function (l) { return l.split(': ')[0].split(', ')[1]; },
        seriesWord: 'Panel', order: 'y', unit: 'Bar', onFocus: function (l) { selectCountry(l.split(', ')[0]); } },
  c6: { pattern: / % of the guests of the group /, series: function (l) { return l.split(', ')[0]; }, seriesWord: 'Line',
        order: 'x', unit: 'Month' },
  c7: { pattern: / nights \(median\)$/, series: function () { return ''; }, order: 'y', unit: 'Bar',
        onFocus: function (l) { selectCountry(l.split(': ')[0]); } },
  c5: { pattern: /^[^,;]*: [\d,]+ guests$/, series: function () { return ''; }, order: 'value', unit: 'Country' }
};
KEYBOARD_CONFIG.c2 = KEYBOARD_CONFIG.c1;
KEYBOARD_CONFIG.c3 = KEYBOARD_CONFIG.c1;
KEYBOARD_CONFIG.c8 = Object.assign({}, KEYBOARD_CONFIG.c7, { pattern: / days in advance \(median\)$/ });

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
      return config.order === 'x' ? ra.left - rb.left : ra.top - rb.top;
    });
  });
  const previous = KEYBOARD[name] || {};
  KEYBOARD[name] = Object.assign(previous, { series: series, groups: groups, parts: parts, config: config });
  // The Tab stop: the mark that was focused, else the selected country or linked month, else the first
  let start = null;
  if (previous.key) { start = marks.find(function (el) { return markKey(el) === previous.key; }); }
  if (!start && config.onFocus && name !== 'c1' && name !== 'c2' && name !== 'c3') {
    start = groups[series[0]] && groups[series[0]].find(function (el) { return markKey(el).split(', ')[0] === STATE.country; });
  }
  if (!start && series.length) { start = groups[series[0]][0]; }
  if (start) { start.setAttribute('tabindex', '0'); }
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
  else if (event.key === 'Enter' || event.key === ' ') { showValueBox(event.target); }
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
  // Ring and value box for keyboard focus only (a mouse click on a bar shows its selection, not a focus ring)
  if (element.matches(':focus-visible')) {
    drawFocusRing(name, element);
    showValueBox(element);
  }
  if (!(state.quiet && key === state.key)) {
    const series = state.series.length > 1 ? state.config.seriesWord + ': ' + state.series[here.s] + '. ' : '';
    const help = firstTime ? ' Arrow keys: next or previous' + (state.series.length > 1 ? '; Alt plus up or down arrow: change '
      + state.config.seriesWord.toLowerCase() : '') + '; Escape: hide the value box.' : '';
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
    // Bars and countries: double rectangle, white outside and blue inside (3:1 on any background)
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
    // Points: two concentric circles, white and blue
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
  box.style.top = (rect.top + window.scrollY - box.offsetHeight - 10) + 'px';
}

function hideValueBox() {
  const box = document.getElementById('keyboard-value');
  if (box) { box.hidden = true; }
}

// ── Text alternatives and data tables (task 6.7, WCAG 1.1.1) ────────────────
// Each chart has a short text (its type and what it shows, also the SVG's aria-label), a long text with
// the main values for the current filters, and a collapsible data table with every value it draws.
// All of them are computed here from data.js with the same rules as the charts.

function inFilters(row) {
  return (STATE.hotel === 'Both' || row.hotel === STATE.hotel) && (STATE.year === 'All' || String(row.year) === STATE.year);
}
function hotelsShown() { return STATE.hotel === 'Both' ? ['City Hotel', 'Resort Hotel'] : [STATE.hotel]; }
function monthLabel(isoDate) { return monthName(isoDate.slice(0, 7)); }

// C1-C3: the monthly rows of each hotel shown
function monthTableRows() {
  return DASHBOARD_DATA.month_hotel.filter(inFilters);
}

// C4: share of each country group in each hotel (as the chart: sums of guests after the filters)
function countryShares() {
  const sums = {}, totals = {};
  DASHBOARD_DATA.country_month.filter(inFilters).forEach(function (row) {
    const key = row.country_group + '|' + row.hotel;
    sums[key] = (sums[key] || 0) + row.guests;
    totals[row.hotel] = (totals[row.hotel] || 0) + row.guests;
  });
  return { sums: sums, totals: totals };
}

// C6: share of each calendar month in the selected country and in all guests
function seasonShares() {
  const country = {}, all = {};
  let countryTotal = 0, allTotal = 0;
  DASHBOARD_DATA.country_month.filter(inFilters).forEach(function (row) {
    all[row.calendar_month] = (all[row.calendar_month] || 0) + row.guests;
    allTotal += row.guests;
    if (row.country_group === STATE.country) {
      country[row.calendar_month] = (country[row.calendar_month] || 0) + row.guests;
      countryTotal += row.guests;
    }
  });
  return Object.keys(all).map(Number).sort(function (a, b) { return a - b; }).map(function (m) {
    return { month: MONTH_NAMES[m - 1], country: m in country ? 100 * country[m] / countryTotal : null,
             all: 100 * all[m] / allTotal };
  });
}

// C7, C8: precomputed medians for the filters, in the order of the bars
function medianRows() {
  const order = countryOrder();
  return DASHBOARD_DATA.country_medians.filter(function (row) {
    return row.hotel_filter === STATE.hotel && row.year_filter === String(STATE.year);
  }).sort(function (a, b) { return order.indexOf(a.country_group) - order.indexOf(b.country_group); });
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
    return showing + hotelsShown().map(function (hotel) {
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
    }).join(' ') + ' Selected: ' + STATE.country + '.';
  }
  if (name === 'c6') {
    const rows = seasonShares();
    const e1 = extremes(rows.filter(function (r) { return r.country !== null; }), function (r) { return r.country; });
    const e2 = extremes(rows, function (r) { return r.all; });
    return showing + STATE.country + ': most guests in ' + e1.high.month + ' (' + formatPercent(e1.high.country) +
      ' of its guests), fewest in ' + e1.low.month + ' (' + formatPercent(e1.low.country) + '). All guests: most in ' +
      e2.high.month + ' (' + formatPercent(e2.high.all) + '), fewest in ' + e2.low.month + ' (' + formatPercent(e2.low.all) + ').';
  }
  if (name === 'c7' || name === 'c8') {
    const field = name === 'c7' ? 'median_nights' : 'median_lead_time';
    const unit = name === 'c7' ? ' nights' : ' days';
    const rows = medianRows();
    const e = extremes(rows, function (r) { return r[field]; });
    const selected = rows.find(function (r) { return r.country_group === STATE.country; });
    // Several countries can share the longest or shortest median: all of them are named
    const names = function (value) {
      return rows.filter(function (r) { return r[field] === value; }).map(function (r) { return r.country_group; }).join(', ');
    };
    return showing + 'Longest: ' + names(e.high[field]) + ' (' + e.high[field] + unit + '); shortest: ' + names(e.low[field]) +
      ' (' + e.low[field] + unit + '). Selected, ' + STATE.country + ': ' + selected[field] + unit + '.';
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
  return '<div class="table-scroll" role="region" tabindex="0" aria-label="' + caption + '"><table><caption>' + caption + '</caption><thead><tr>' +
    columns.map(function (c, i) { return '<th scope="col"' + (i ? ' class="number"' : '') + '>' + c + '</th>'; }).join('') +
    '</tr></thead><tbody>' + rows.map(function (cells) {
      return '<tr><th scope="row">' + cells[0] + '</th>' + cells.slice(1).map(function (c) { return '<td class="number">' + c + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>';
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
  if (name === 'c6') {
    return tableHtml(caption, ['Month of arrival', STATE.country + ': % of its guests', 'All guests: % of all guests'],
      seasonShares().map(function (r) { return [r.month, r.country === null ? '–' : formatPercent(r.country), formatPercent(r.all)]; }));
  }
  if (name === 'c7' || name === 'c8') {
    const field = name === 'c7' ? 'median_nights' : 'median_lead_time';
    return tableHtml(caption, ['Country', name === 'c7' ? 'Median nights per stay' : 'Median days from booking to arrival', 'Guests'],
      medianRows().map(function (r) { return [r.country_group, String(r[field]), formatCount(r.guests)]; }));
  }
  if (name === 'c5') {
    return tableHtml(caption, ['Country', 'Guests'], mapRows().map(function (r) { return [r.country, formatCount(r.guests)]; }));
  }
  return '';
}

function updateTextAlternatives() {
  Object.keys(DASHBOARD_SPECS).forEach(function (name) {
    const long = document.getElementById(name + '-long');
    if (!long) { return; }                                   // this chart is on the other screen
    long.textContent = longText(name);
    const table = document.getElementById(name + '-table');
    if (table) { table.innerHTML = tableFor(name); }
  });
}

// ── Fill pattern of the selected country (pattern-rules: colour is not the only code) ─
// Vega draws the selected bars in orange; the page gives them orange stripes. A MutationObserver puts
// the pattern back each time Vega redraws a bar with the plain orange fill.
const SELECTED_FILL = '#B35900';
function applySelectedPattern(svg) {
  svg.querySelectorAll('.mark-rect path[fill="' + SELECTED_FILL + '"]').forEach(function (bar) {   // bars only
    bar.setAttribute('fill', 'url(#pattern-selected)');
    bar.setAttribute('data-selected', 'true');
  });
  svg.querySelectorAll('path[data-selected="true"]').forEach(function (bar) {
    if (bar.getAttribute('fill') !== 'url(#pattern-selected)') { bar.removeAttribute('data-selected'); }
  });
}
function watchSelectedPattern(svg) {
  if (!document.getElementById('pattern-selected') || svg.dataset.pattern) { return; }
  svg.dataset.pattern = 'on';
  applySelectedPattern(svg);
  new MutationObserver(function () { applySelectedPattern(svg); })
    .observe(svg, { subtree: true, childList: true, attributes: true, attributeFilter: ['fill'] });
}

// A resize or zoom moves the marks: remove the rings (they come back with the next key press)
window.addEventListener('resize', function () { Object.keys(KEYBOARD).forEach(clearFocusRing); hideValueBox(); });

// ── Start: called by each page with the names of its charts ──────────────────
function startDashboard(chartNames) {
  STATE.month = null;
  readStateFromAddress();
  showStateInControls();
  updateActiveFilters();
  updateKpis();
  updateLinkToOtherScreen();
  updateCountryDetails();
  updateTextAlternatives();
  return Promise.all(chartNames.map(embedChart)).then(function () {
    connectFilters();
    if (document.getElementById('month-details')) { connectLinkedMonth(); }
    if (document.getElementById('country-details')) { connectCountrySelection(); }
    if (document.getElementById('show-more')) { connectShowMore(); }
    document.body.setAttribute('data-dashboard-ready', 'true');   // used by the browser checks
  });
}
