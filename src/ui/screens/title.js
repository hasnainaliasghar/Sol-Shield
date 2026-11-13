/**
 * title.js — Title screen.
 */
import { S } from '../strings.js';
import { stopReadAloud } from '../components/readAloud.js';

/**
 * Render the title screen.
 * @param {object} opts
 * @param {function} opts.onPlay       - Start a new game.
 * @param {function} opts.onHowItWorks - Show briefing.
 * @param {function} opts.onAbout      - Show about screen.
 * @returns {HTMLElement}
 */
export function renderTitle({ onPlay, onHowItWorks, onAbout }) {
  stopReadAloud();

  const el = document.createElement('div');
  el.className = 'title-screen screen';

  el.innerHTML = `
    <div>
      <div class="title-logo" aria-label="${S.appTitle}">${S.appTitle}</div>
      <div class="title-tagline">${S.appTagline}</div>
    </div>
    <div class="title-buttons">
      <button class="btn btn-primary" id="btn-play">${S.titlePlay}</button>
      <button class="btn btn-secondary" id="btn-briefing">${S.titleHowItWorks}</button>
      <button class="btn btn-secondary" id="btn-about">${S.titleAbout}</button>
    </div>
    <p style="font-size:0.8rem;color:var(--color-text-dim);margin-top:var(--space-md)">
      ${S.titleNASANote}
    </p>
  `;

  el.querySelector('#btn-play').addEventListener('click', onPlay);
  el.querySelector('#btn-briefing').addEventListener('click', onHowItWorks);
  el.querySelector('#btn-about').addEventListener('click', onAbout);

  return el;
}

