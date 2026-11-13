/**
 * blockPicker.js — Block allocation UI component.
 * Shows Add/Remove buttons for Air, Food, Shield + Ask Mission Control.
 */
import { S } from '../strings.js';

/**
 * Create the block picker component.
 * @param {object} opts
 * @param {object}   opts.state   - Current game state.
 * @param {object}   opts.config  - Balance config.
 * @param {function} opts.onAdd   - (system) => void
 * @param {function} opts.onRemove - (system) => void
 * @param {function} opts.onAskControl - () => void
 * @param {object}   opts.blockCounts - { air, food, shield } allocated this sol
 * @returns {HTMLElement}
 */
export function createBlockPicker({ state, config, onAdd, onRemove, onAskControl, blockCounts }) {
  const wrap = document.createElement('div');
  wrap.className = 'block-picker';

  const maxBlocks = state.dipSols && state.dipSols.includes(state.sol)
    ? config.powerDipBlocks
    : config.blocksPerSol;

  const spent = maxBlocks - state.blocksLeft;

  wrap.innerHTML = `
    <div class="blocks-remaining">
      <strong>${state.blocksLeft}</strong> power block${state.blocksLeft !== 1 ? 's' : ''} left
    </div>
    <div class="block-buttons" id="block-buttons"></div>
  `;

  const grid = wrap.querySelector('#block-buttons');

  const systems = [
    { id: 'air',    label: S.playAir,    color: 'air' },
    { id: 'food',   label: S.playFood,   color: 'food' },
    { id: 'shield', label: S.playShield, color: 'shield' },
  ];

  systems.forEach(({ id, label, color }) => {
    const count = blockCounts[id] || 0;
    const group = document.createElement('div');
    group.className = 'block-btn-group';
    group.innerHTML = `
      <span class="block-system-name">${label}</span>
      <button
        class="block-add ${color}"
        aria-label="Add one ${label} block"
        ${state.blocksLeft <= 0 ? 'disabled' : ''}
      >+</button>
      <div class="block-count" aria-live="polite" aria-label="${label} blocks allocated">${count}</div>
      <button
        class="block-remove"
        aria-label="Remove one ${label} block"
        ${count <= 0 ? 'disabled' : ''}
      >−</button>
    `;
    group.querySelector('.block-add').addEventListener('click', () => onAdd(id));
    group.querySelector('.block-remove').addEventListener('click', () => onRemove(id));
    grid.appendChild(group);
  });

  // Ask Mission Control button
  const askBtn = document.createElement('button');
  askBtn.className = 'btn btn-secondary ask-control-btn';
  askBtn.disabled = state.blocksLeft <= 0;
  askBtn.setAttribute('aria-label', 'Ask Mission Control for advice (costs 1 block)');
  askBtn.innerHTML = `📡 ${S.playAskControl} <small>${S.playAskControlCost}</small>`;
  askBtn.addEventListener('click', onAskControl);
  wrap.appendChild(askBtn);

  return wrap;
}

