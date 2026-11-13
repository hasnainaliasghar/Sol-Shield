/**
 * debrief.js — Full debrief screen with Why Chain, NASA event card, stars, badges.
 */
import { S } from '../strings.js';
import { countStars } from '../../game/engine.js';
import { buildWhyChain } from '../../game/whyChain.js';
import { createReadAloudBtn } from '../components/readAloud.js';

/**
 * Render the debrief screen.
 * @param {object} opts
 * @param {object}   opts.state   - Final game state.
 * @param {object}   opts.config  - Balance config.
 * @param {function} opts.onReplay - Replay with a different storm.
 * @param {function} opts.onTitle  - Go back to title.
 * @returns {HTMLElement}
 */
export function renderDebrief({ state, config, onReplay, onTitle }) {
  const el = document.createElement('div');
  el.className = 'screen';
  el.setAttribute('role', 'main');

  const outcome = state.outcome || 'success';
  const stars   = countStars(state, config);
  const { sentences, counterfactual, nasaCard } = buildWhyChain(state, config);

  const resultLabels = {
    'success':   S.debriefSuccess,
    'fail-dose': S.debriefFailDose,
    'fail-air':  S.debriefFailAir,
    'fail-food': S.debriefFailFood,
  };

  const starStr = '⭐'.repeat(stars) + '☆'.repeat(Math.max(0, 3 - stars));

  // ── Badges ────────────────────────────────────────────────────────────────
  const badges = computeBadges(state);

  // ── Build HTML ────────────────────────────────────────────────────────────
  el.innerHTML = `
    <div class="debrief-result">
      <h1>${resultLabels[outcome] || 'Mission Complete'}</h1>
      <div class="stars-row" aria-label="${stars} out of 3 stars">${starStr}</div>
      ${badges.length ? `<div class="badges-row">${badges.map(b => `<span class="badge-chip" title="${b.desc}">${b.label}</span>`).join('')}</div>` : ''}
    </div>

    <div class="card why-chain" id="why-chain-card">
      <h3>${S.debriefWhyChainTitle}</h3>
      <div id="why-sentences"></div>
      ${counterfactual ? `<p style="color:var(--color-accent);margin-top:8px"><em>💡 ${counterfactual}</em></p>` : ''}
    </div>

    ${nasaCard ? `
    <div class="card nasa-event-card" id="nasa-event-card">
      <h3>🛸 ${S.debriefNASACard}</h3>
      <p style="font-size:0.85rem;color:var(--color-text-dim);margin-bottom:8px">${nasaCard.kidTitle}</p>
      <table>
        <tr><td>${S.debriefFlareClass}:</td><td><strong>${nasaCard.flareClass}</strong></td></tr>
        <tr><td>${S.debriefPeakTime}:</td><td>${nasaCard.peakTime || 'unknown'}</td></tr>
        ${nasaCard.activeRegionNum ? `<tr><td>Active region:</td><td>AR${nasaCard.activeRegionNum}</td></tr>` : ''}
        ${nasaCard.sourceLocation ? `<tr><td>Location:</td><td>${nasaCard.sourceLocation}</td></tr>` : ''}
        ${nasaCard.link ? `<tr><td></td><td><a href="${nasaCard.link}" target="_blank" rel="noopener noreferrer">${S.debriefDONKILink}</a></td></tr>` : ''}
      </table>
      <div class="honesty-notes" style="margin-top:12px">
        <p>${nasaCard.archivedNote}</p>
        <p>${nasaCard.honestyNote}</p>
        <p>${S.debriefHonestyNote2}</p>
      </div>
    </div>
    ` : ''}

    <div class="btn-row" style="margin-top:16px" id="debrief-btns">
      <button class="btn btn-primary" id="btn-replay">${S.debriefReplay}</button>
      <button class="btn btn-secondary" id="btn-title">🏠 Title</button>
    </div>
    <div style="margin-top:8px" id="read-aloud-wrap"></div>
  `;

  // Fill Why Chain sentences
  const sentenceWrap = el.querySelector('#why-sentences');
  sentences.forEach(s => {
    const p = document.createElement('p');
    p.textContent = s;
    sentenceWrap.appendChild(p);
  });

  // Read aloud button
  const readAloudWrap = el.querySelector('#read-aloud-wrap');
  const readBtn = createReadAloudBtn(() => {
    const whyText = sentences.join(' ');
    const ctf = counterfactual ? ` ${counterfactual}` : '';
    return `Mission debrief. ${whyText}${ctf}`;
  });
  readBtn.textContent = `🔊 ${S.debriefReadAloud}`;
  readAloudWrap.appendChild(readBtn);

  // Events
  el.querySelector('#btn-replay').addEventListener('click', onReplay);
  el.querySelector('#btn-title').addEventListener('click', onTitle);

  return el;
}

// ── Badge logic ───────────────────────────────────────────────────────────────

function computeBadges(state) {
  const badges = [];
  const { log, storm, outcome, mode } = state;

  // Early Shield: shield >= 60 before warning sol
  const warningSol = storm?.warningSol || 99;
  const shieldLogs = log.filter(e => e.type === 'endSol' && e.sol < warningSol);
  if (shieldLogs.length > 0) {
    // Check if shield was >= 60 at any point before warning
    const allocBefore = log.filter(e => e.type === 'allocate' && e.system === 'shield' && e.sol < warningSol);
    if (allocBefore.length >= 6) {  // built significant shield before warning
      badges.push({ label: S.badgeEarlyShield, desc: S.badgeEarlyShieldDesc });
    }
  }

  // Asked Earth: asked Mission Control at least once
  if (state.askedControl && state.askedControl.length > 0) {
    const askedBeforeStorm = state.askedControl.some(sol => sol < (storm?.stormSol || 99));
    if (askedBeforeStorm) {
      badges.push({ label: S.badgeAskedEarth, desc: S.badgeAskedEarthDesc });
    }
  }

  // Calm Under Pressure: success with air and food both >= 50
  if (outcome === 'success' && state.air >= 50 && state.food >= 50) {
    badges.push({ label: S.badgeCalmUnderPressure, desc: S.badgeCalmDesc });
  }

  // Mars Ready: success on Mars mode
  if (outcome === 'success' && mode === 'mars') {
    badges.push({ label: S.badgeMarsReady, desc: S.badgeMarsReadyDesc });
  }

  return badges;
}
