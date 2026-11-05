/* Shared code of both dashboard screens (index.html and detail.html).
   It draws every chart from specs.js with the data of data.js (no server, no fetch: architecture.md)
   and writes the KPIs and the "Showing" line for the current filters. */
'use strict';

// ── State of the dashboard ────────────────────────────────────────────────────
// Filters (I1, I2) and, on the detail screen, the selected country (I7) and the sort order (I9).
const STATE = { hotel: 'Both', year: 'All', country: 'Portugal', sort: 'guests' };
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
    .then(function (result) { VIEWS[name] = result.view; return result.view; })
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

// ── Start: called by each page with the names of its charts ──────────────────
function startDashboard(chartNames) {
  updateActiveFilters();
  updateKpis();
  return Promise.all(chartNames.map(embedChart));
}
