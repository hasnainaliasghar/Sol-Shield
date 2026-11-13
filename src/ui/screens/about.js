/**
 * about.js — "About the Science" screen (stub for Phase 2; full implementation in Phase 7).
 */
import { S } from '../strings.js';

/**
 * Render the About screen.
 * @param {object} opts
 * @param {function} opts.onBack - Go back to title.
 * @returns {HTMLElement}
 */
export function renderAbout({ onBack }) {
  const el = document.createElement('div');
  el.className = 'about-screen screen';

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:var(--space-sm)">
      <button class="btn btn-secondary btn-sm" id="btn-back">← Back</button>
      <h2>${S.aboutTitle}</h2>
    </div>

    <section class="card">
      <h3>${S.aboutDataTitle}</h3>
      <p>${S.aboutDONKI}</p>
      <p><a href="https://kauai.ccmc.gsfc.nasa.gov/DONKI/" target="_blank" rel="noopener">${S.aboutDONKILink}</a></p>
      <p>${S.aboutBVAD}</p>
      <p>${S.aboutRadiation}</p>
    </section>

    <section class="card">
      <h3>${S.aboutSimplifiedTitle}</h3>
      <p>${S.aboutSimplified1}</p>
      <p>${S.aboutSimplified2}</p>
      <p>${S.aboutSimplified3}</p>
    </section>

    <section class="card">
      <h3>${S.aboutHonestyTitle}</h3>
      <p>${S.aboutHonesty1}</p>
      <p>${S.aboutHonesty2}</p>
      <p>${S.aboutHonesty3}</p>
    </section>

    <section class="card">
      <p style="font-size:0.8rem;color:var(--color-text-dim)">${S.aboutPrivacy}</p>
      <p style="font-size:0.8rem;color:var(--color-text-dim)">${S.aboutCredit}</p>
      <p style="font-size:0.8rem;color:var(--color-text-dim)">${S.aboutNASANote}</p>
    </section>
  `;

  el.querySelector('#btn-back').addEventListener('click', onBack);

  return el;
}

