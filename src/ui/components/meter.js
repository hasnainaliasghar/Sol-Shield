/**
 * meter.js — Resource meter component (Air, Food, Shield, Dose).
 */

/**
 * Render a vertical resource meter card.
 * @param {object} opts
 * @param {string} opts.id       - 'air' | 'food' | 'shield'
 * @param {string} opts.label    - Display label
 * @param {number} opts.value    - Current value (0–100)
 * @param {string} [opts.sub]    - Sublabel text (e.g. "lasts 4 sols")
 * @returns {HTMLElement}
 */
export function createMeter({ id, label, value, sub = '' }) {
  const card = document.createElement('div');
  card.className = 'meter-card';

  const pct = Math.max(0, Math.min(100, value));

  card.innerHTML = `
    <div class="meter-label">${label}</div>
    <div class="meter-bar-wrap">
      <div
        class="meter-bar ${id}"
        style="height:${pct}%"
        role="meter"
        aria-label="${label}"
        aria-valuenow="${Math.round(value)}"
        aria-valuemin="0"
        aria-valuemax="100"
      ></div>
    </div>
    <div class="meter-value">${Math.round(value)}</div>
    ${sub ? `<div class="meter-sublabel">${sub}</div>` : ''}
  `;

  return card;
}

/**
 * Update an existing meter card in-place.
 * @param {HTMLElement} card
 * @param {number} value
 * @param {string} [sub]
 */
export function updateMeter(card, value, sub) {
  const pct = Math.max(0, Math.min(100, value));
  const bar = card.querySelector('.meter-bar');
  const valEl = card.querySelector('.meter-value');
  const subEl = card.querySelector('.meter-sublabel');

  bar.style.height = `${pct}%`;
  bar.setAttribute('aria-valuenow', Math.round(value));
  valEl.textContent = Math.round(value);
  if (subEl && sub !== undefined) subEl.textContent = sub;
}

/**
 * Render the horizontal dose (crew health) bar.
 * @param {number} dose - 0–100
 * @returns {HTMLElement}
 */
export function createDoseBar(dose) {
  const section = document.createElement('div');
  section.className = 'dose-section';

  const level = doseLevel(dose);
  const pct = Math.max(0, Math.min(100, dose));

  section.innerHTML = `
    <div class="dose-label-row">
      <span>Crew Health</span>
      <span class="dose-status">${level.label}</span>
    </div>
    <div class="dose-bar-wrap">
      <div
        class="dose-bar ${level.cls}"
        style="width:${pct}%"
        role="meter"
        aria-label="Crew radiation dose"
        aria-valuenow="${Math.round(dose)}"
        aria-valuemin="0"
        aria-valuemax="100"
      ></div>
    </div>
  `;

  return section;
}

export function updateDoseBar(section, dose) {
  const pct = Math.max(0, Math.min(100, dose));
  const level = doseLevel(dose);
  const bar = section.querySelector('.dose-bar');
  const statusEl = section.querySelector('.dose-status');

  bar.style.width = `${pct}%`;
  bar.className = `dose-bar ${level.cls}`;
  bar.setAttribute('aria-valuenow', Math.round(dose));
  if (statusEl) statusEl.textContent = level.label;
}

function doseLevel(dose) {
  if (dose < 25)  return { label: '✅ Safe',    cls: 'safe' };
  if (dose < 50)  return { label: '⚠️ Okay',    cls: 'okay' };
  if (dose < 70)  return { label: '🔶 High',    cls: 'high' };
  return          { label: '🔴 Danger!', cls: 'danger' };
}

