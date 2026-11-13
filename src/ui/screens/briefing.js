/**
 * briefing.js — Mission briefing screen with mode selector.
 */
import { S } from '../strings.js';

/**
 * Render the briefing/mode selection screen.
 * @param {object} opts
 * @param {function} opts.onStart - (mode: 'moon'|'mars') => void
 * @param {function} opts.onBack  - Go back to title.
 * @returns {HTMLElement}
 */
export function renderBriefing({ onStart, onBack }) {
  let selectedMode = 'moon';

  const el = document.createElement('div');
  el.className = 'briefing-screen screen';

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:var(--space-sm)">
      <button class="btn btn-secondary btn-sm" id="btn-back">← Back</button>
      <h2>${S.briefingTitle}</h2>
    </div>

    <div class="card">
      <p>${S.briefingP1}</p>
      <p>${S.briefingP2}</p>
      <p>${S.briefingP3}</p>
      <p>${S.briefingP4}</p>
      <p>${S.briefingP5}</p>
      <p>${S.briefingP6}</p>
      <p>${S.briefingP7}</p>
      <p>${S.briefingP8}</p>
    </div>

    <div>
      <h3 style="margin-bottom:var(--space-sm)">Choose your mission:</h3>
      <div class="mode-cards">
        <div class="mode-card selected" id="mode-moon" role="button" tabindex="0" aria-pressed="true">
          <div style="font-size:1.5rem">🌙</div>
          <h3>${S.briefingChooseMoon}</h3>
          <p>${S.briefingMoonDesc}</p>
        </div>
        <div class="mode-card" id="mode-mars" role="button" tabindex="0" aria-pressed="false">
          <div style="font-size:1.5rem">🔴</div>
          <h3>${S.briefingChooseMars}</h3>
          <p>${S.briefingMarsDesc}</p>
        </div>
      </div>
    </div>

    <button class="btn btn-primary" id="btn-start">${S.briefingStart}</button>
  `;

  const moonCard = el.querySelector('#mode-moon');
  const marsCard = el.querySelector('#mode-mars');

  function selectMode(mode) {
    selectedMode = mode;
    moonCard.classList.toggle('selected', mode === 'moon');
    marsCard.classList.toggle('selected', mode === 'mars');
    moonCard.setAttribute('aria-pressed', String(mode === 'moon'));
    marsCard.setAttribute('aria-pressed', String(mode === 'mars'));
  }

  moonCard.addEventListener('click', () => selectMode('moon'));
  marsCard.addEventListener('click', () => selectMode('mars'));
  moonCard.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') selectMode('moon'); });
  marsCard.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') selectMode('mars'); });

  el.querySelector('#btn-start').addEventListener('click', () => onStart(selectedMode));
  el.querySelector('#btn-back').addEventListener('click', onBack);

  return el;
}

