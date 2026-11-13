/**
 * stormTimeline.js — Visual timeline showing sol markers and storm phases.
 */

/**
 * Create storm timeline component.
 * @param {object} opts
 * @param {number} opts.currentSol  - Current sol (1–10)
 * @param {object} opts.storm       - Storm timeline { watchSol, warningSol, stormSol, tier }
 * @returns {HTMLElement}
 */
export function createStormTimeline({ currentSol, storm }) {
  const wrap = document.createElement('div');
  wrap.className = 'storm-timeline';
  wrap.setAttribute('aria-label', 'Mission timeline');

  for (let sol = 1; sol <= 10; sol++) {
    if (sol > 1) {
      const line = document.createElement('div');
      line.className = 'timeline-line';
      wrap.appendChild(line);
    }

    const step = document.createElement('div');
    step.className = 'timeline-step';

    // Determine dot style
    let dotClass = '';
    let stepLabel = `${sol}`;
    if (sol < currentSol) dotClass = 'past';
    else if (sol === currentSol) dotClass = 'current';

    // Storm markers (only show phases that have already been revealed)
    if (storm && sol <= currentSol) {
      if (sol === storm.watchSol)   { dotClass = 'watch';   stepLabel = '👁'; }
      if (sol === storm.warningSol) { dotClass = 'warning'; stepLabel = '⚡'; }
      if (sol === storm.stormSol || (storm.tier === 3 && sol === storm.stormSol + 1)) {
        dotClass = 'storm'; stepLabel = '🌩';
      }
    }

    step.innerHTML = `
      <div class="timeline-dot ${dotClass}" title="Sol ${sol}"></div>
      <div style="font-size:0.65rem;color:var(--color-text-dim)">${stepLabel}</div>
    `;
    wrap.appendChild(step);
  }

  return wrap;
}

