/**
 * play.js — Main game play screen.
 * Manages the full 10-sol game loop using pure engine functions.
 */
import { S } from '../strings.js';
import { createMeter, updateMeter, createDoseBar, updateDoseBar } from '../components/meter.js';
import { createBlockPicker } from '../components/blockPicker.js';
import { createStormTimeline } from '../components/stormTimeline.js';
import { createControlChat, appendChatBubble, animateMoonReply } from '../components/controlChat.js';
import { allocateBlock, endSol, applyStorm, checkOutcome, blocksForSol } from '../../game/engine.js';
import { getMissionControlReply } from '../../game/missionControl.js';

/**
 * Render the play screen and run the game loop.
 * @param {object} opts
 * @param {object}   opts.state     - Initial game state.
 * @param {object}   opts.config    - Balance config.
 * @param {function} opts.onDebrief - (finalState) => void
 * @returns {HTMLElement}
 */
export function renderPlay({ state: initialState, config, onDebrief }) {
  let state = { ...initialState };
  // blockCounts tracks allocations this sol for the UI
  let blockCounts = { air: 0, food: 0, shield: 0 };

  const el = document.createElement('div');
  el.className = 'screen';
  el.style.gap = '0';
  el.setAttribute('role', 'main');

  // ── Build DOM structure ───────────────────────────────────────────────────
  el.innerHTML = `
    <div class="top-bar">
      <div class="sol-label" aria-live="polite" id="sol-label">Sol 1 of 10</div>
      <div class="storm-badge none" id="storm-badge" aria-live="polite" aria-atomic="true">☀️ All Quiet</div>
    </div>

    <div id="storm-timeline-wrap"></div>
    <div id="event-cards" role="status" aria-live="polite" style="margin:4px 0;"></div>
    <div id="chat-wrap" class="hidden"></div>

    <div class="meters-grid" id="meters-grid">
      <!-- meters injected here -->
    </div>

    <div id="dose-wrap" style="margin:8px 0;"></div>

    <div id="block-picker-wrap"></div>

    <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-primary" id="btn-end-sol" style="flex:1">
        ${S.playEndSol}
      </button>
    </div>

    <!-- Modal for confirm unspent blocks -->
    <div class="modal-backdrop hidden" id="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div class="modal">
        <h2 id="confirm-title">End Sol?</h2>
        <p id="confirm-msg"></p>
        <div class="btn-row">
          <button class="btn btn-primary" id="btn-confirm-yes">${S.playConfirmYes}</button>
          <button class="btn btn-secondary" id="btn-confirm-no">${S.playConfirmNo}</button>
        </div>
      </div>
    </div>

    <!-- Modal for Mission Control question -->
    <div class="modal-backdrop hidden" id="mc-modal" role="dialog" aria-modal="true" aria-labelledby="mc-title">
      <div class="modal">
        <h2 id="mc-title">📡 Ask Mission Control</h2>
        <p>Costs 1 power block. Choose a question:</p>
        <div class="question-list">
          <button class="question-btn" id="q1">${S.playAskQ1}</button>
          <button class="question-btn" id="q2">${S.playAskQ2}</button>
        </div>
        <button class="btn btn-secondary btn-sm" id="btn-mc-cancel">${S.playAskCancel}</button>
      </div>
    </div>
  `;

  // ── References ────────────────────────────────────────────────────────────
  const solLabel       = el.querySelector('#sol-label');
  const stormBadge     = el.querySelector('#storm-badge');
  const timelineWrap   = el.querySelector('#storm-timeline-wrap');
  const eventCards     = el.querySelector('#event-cards');
  const chatWrap       = el.querySelector('#chat-wrap');
  const metersGrid     = el.querySelector('#meters-grid');
  const doseWrap       = el.querySelector('#dose-wrap');
  const pickerWrap     = el.querySelector('#block-picker-wrap');
  const btnEndSol      = el.querySelector('#btn-end-sol');
  const confirmModal   = el.querySelector('#confirm-modal');
  const confirmMsg     = el.querySelector('#confirm-msg');
  const btnConfirmYes  = el.querySelector('#btn-confirm-yes');
  const btnConfirmNo   = el.querySelector('#btn-confirm-no');
  const mcModal        = el.querySelector('#mc-modal');
  const btnMcCancel    = el.querySelector('#btn-mc-cancel');

  // ── Chat state ────────────────────────────────────────────────────────────
  let chatEl = null;
  let chatMessages = [];

  // ── Meter elements ────────────────────────────────────────────────────────
  let airMeter, foodMeter, shieldMeter, doseBar;

  // ── Init render ───────────────────────────────────────────────────────────
  function initRender() {
    metersGrid.innerHTML = '';
    airMeter   = createMeter({ id: 'air',    label: S.playAir,    value: state.air,    sub: airLasts() });
    foodMeter  = createMeter({ id: 'food',   label: S.playFood,   value: state.food,   sub: foodLasts() });
    shieldMeter = createMeter({ id: 'shield', label: S.playShield, value: state.shield });
    metersGrid.appendChild(airMeter);
    metersGrid.appendChild(foodMeter);
    metersGrid.appendChild(shieldMeter);

    doseWrap.innerHTML = '';
    doseBar = createDoseBar(state.dose);
    doseWrap.appendChild(doseBar);

    renderAll();
  }

  function airLasts() {
    if (config.airDrainPerSol === 0) return '';
    const sols = Math.floor(state.air / config.airDrainPerSol);
    return S.playAirLasts(sols);
  }
  function foodLasts() {
    if (config.foodDrainPerSol === 0) return '';
    const sols = Math.floor(state.food / config.foodDrainPerSol);
    return S.playFoodLasts(sols);
  }

  function renderAll() {
    // Sol label
    solLabel.textContent = `Sol ${state.sol} of 10`;

    // Storm badge
    updateStormBadge();

    // Timeline
    timelineWrap.innerHTML = '';
    timelineWrap.appendChild(createStormTimeline({ currentSol: state.sol, storm: state.storm }));

    // Meters
    updateMeter(airMeter, state.air, airLasts());
    updateMeter(foodMeter, state.food, foodLasts());
    updateMeter(shieldMeter, state.shield);
    updateDoseBar(doseBar, state.dose);

    // Block picker
    pickerWrap.innerHTML = '';
    pickerWrap.appendChild(createBlockPicker({
      state,
      config,
      blockCounts,
      onAdd: handleAdd,
      onRemove: handleRemove,
      onAskControl: handleAskControl,
    }));
  }

  function updateStormBadge() {
    const phase = state.stormPhase;
    stormBadge.className = `storm-badge ${phase}`;
    const labels = {
      none:    S.phaseNone,
      watch:   S.phaseWatch,
      warning: S.phaseWarning,
      active:  S.phaseActive,
      over:    S.phaseOver,
    };
    stormBadge.textContent = labels[phase] || S.phaseNone;
  }

  // ── Block handlers ────────────────────────────────────────────────────────
  function handleAdd(system) {
    if (state.blocksLeft <= 0) return;
    const prev = state[system];
    state = allocateBlock(state, system, config);
    if (state[system] > prev || system === 'control') {
      blockCounts[system] = (blockCounts[system] || 0) + 1;
    }
    renderAll();
  }

  function handleRemove(system) {
    if ((blockCounts[system] || 0) <= 0) return;
    const maxBlocks = state.dipSols && state.dipSols.includes(state.sol)
      ? config.powerDipBlocks : config.blocksPerSol;
    if (state.blocksLeft >= maxBlocks) return;

    // Reverse the allocation
    state = { ...state, blocksLeft: state.blocksLeft + 1 };
    if (system === 'air')    state = { ...state, air:    Math.max(0, Math.min(100, state.air    - config.airGainPerBlock)) };
    if (system === 'food')   state = { ...state, food:   Math.max(0, Math.min(100, state.food   - config.foodGainPerBlock)) };
    if (system === 'shield') state = { ...state, shield: Math.max(0, Math.min(100, state.shield - config.shieldGainPerBlock)) };
    blockCounts[system] = Math.max(0, (blockCounts[system] || 0) - 1);
    renderAll();
  }

  // ── Ask Mission Control ───────────────────────────────────────────────────
  function handleAskControl() {
    if (state.blocksLeft <= 0) return;
    mcModal.classList.remove('hidden');
    el.querySelector('#q1').focus();
  }

  function sendQuestion(question) {
    mcModal.classList.add('hidden');

    // Cost 1 block
    state = allocateBlock(state, 'control', config);
    blockCounts.control = (blockCounts.control || 0) + 1;
    renderAll();

    // Show chat panel
    if (!chatEl) {
      chatEl = createControlChat([]);
      chatWrap.innerHTML = '';
      chatWrap.appendChild(chatEl);
      chatWrap.classList.remove('hidden');
    }
    const msgContainer = chatEl.querySelector('#chat-messages');

    const reply = getMissionControlReply(question, state);

    if (state.mode === 'moon') {
      // Show sent question immediately
      appendChatBubble(msgContainer, { kind: 'sent', text: question });
      animateMoonReply(msgContainer, reply, 1200);
    } else {
      // Mars: delay 1–3 sols
      const delay = state.marsDelay || 2;
      appendChatBubble(msgContainer, { kind: 'sent', text: question });
      appendChatBubble(msgContainer, { kind: 'pending', text: S.mcDelay(delay) });

      // Queue for later
      state = {
        ...state,
        pendingReplies: [
          ...state.pendingReplies,
          { sol: state.sol + delay, question, text: reply }
        ]
      };
    }
  }

  el.querySelector('#q1').addEventListener('click', () => sendQuestion(S.playAskQ1));
  el.querySelector('#q2').addEventListener('click', () => sendQuestion(S.playAskQ2));
  btnMcCancel.addEventListener('click', () => mcModal.classList.add('hidden'));

  // ── End Sol ───────────────────────────────────────────────────────────────
  btnEndSol.addEventListener('click', handleEndSolClick);

  function handleEndSolClick() {
    const maxBlocks = blocksForSol(state, config);
    const unspent = state.blocksLeft;

    if (unspent > 0) {
      confirmMsg.textContent = S.playConfirmUnspent(unspent);
      confirmModal.classList.remove('hidden');
      btnConfirmYes.focus();
    } else {
      doEndSol();
    }
  }

  btnConfirmYes.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
    doEndSol();
  });
  btnConfirmNo.addEventListener('click', () => confirmModal.classList.add('hidden'));

  function doEndSol() {
    // Apply storm effects first if active
    updateStormPhase();

    // Show pending MC replies that arrive this sol
    deliverPendingReplies();

    // End-of-sol drains
    state = endSol(state, config);

    // Check outcome (may end game early)
    const outcome = checkOutcome(state, config);
    if (outcome) {
      state = { ...state, outcome };
      onDebrief(state);
      return;
    }

    // Advance to next sol
    state = { ...state, sol: state.sol + 1, blocksLeft: blocksForSol({ ...state, sol: state.sol + 1 }, config) };
    blockCounts = { air: 0, food: 0, shield: 0 };

    // Clear event cards for new sol
    eventCards.innerHTML = '';

    // Check storm phase for new sol
    updateStormPhaseForNewSol();

    // Check for power dip
    checkPowerDip();

    renderAll();

    // Scroll to top of play screen
    el.scrollTop = 0;
  }

  function updateStormPhase() {
    const { storm, sol } = state;
    if (!storm) return;

    // Apply storm damage when entering active phase
    if (sol === storm.stormSol && state.stormPhase !== 'active') {
      state = { ...state, stormPhase: 'active' };
      state = applyStorm(state, storm, config, false);
      showEventCard('storm', S.phaseActiveMsg);
    } else if (storm.tier === 3 && sol === storm.stormSol + 1 && state.stormPhase === 'active') {
      state = applyStorm(state, storm, config, true);
      showEventCard('storm', 'Second day of the storm. Crew shelters again.');
    }
    if (sol > storm.stormSol && state.stormPhase === 'active') {
      if (!(storm.tier === 3 && sol === storm.stormSol + 1)) {
        state = { ...state, stormPhase: 'over' };
      }
    }
    if (storm.tier === 3 && sol > storm.stormSol + 1 && state.stormPhase === 'active') {
      state = { ...state, stormPhase: 'over' };
    }
  }

  function updateStormPhaseForNewSol() {
    const { storm, sol } = state;
    if (!storm) return;

    if (sol === storm.watchSol) {
      state = { ...state, stormPhase: 'watch' };
      const region = storm.activeRegionNum || null;
      showEventCard('watch', S.phaseWatchMsg(region));
    } else if (sol === storm.warningSol) {
      state = { ...state, stormPhase: 'warning' };
      showEventCard('warning', S.phaseWarningMsg(storm.flareClass || 'M-class'));
    } else if (sol === storm.stormSol) {
      // storm phase set in updateStormPhase (called at end-of-previous-sol? no, do it here)
      state = { ...state, stormPhase: 'active' };
      state = applyStorm(state, storm, config, false);
      showEventCard('storm', S.phaseActiveMsg);
    } else if (storm.tier === 3 && sol === storm.stormSol + 1 && state.stormPhase === 'active') {
      state = applyStorm(state, storm, config, true);
      showEventCard('storm', 'Second day of the storm. Crew shelters again.');
    } else if (sol > storm.stormSol && state.stormPhase === 'active') {
      state = { ...state, stormPhase: 'over' };
      showEventCard('over', S.phaseOverMsg);
    }
  }

  function checkPowerDip() {
    if (state.dipSols && state.dipSols.includes(state.sol)) {
      showEventCard('dip', S.powerDipMsg);
    }
  }

  function deliverPendingReplies() {
    if (!state.pendingReplies || !state.pendingReplies.length) return;

    const toDeliver = state.pendingReplies.filter(r => r.sol === state.sol + 1);
    const remaining = state.pendingReplies.filter(r => r.sol !== state.sol + 1);
    state = { ...state, pendingReplies: remaining };

    if (toDeliver.length && chatEl) {
      const msgContainer = chatEl.querySelector('#chat-messages');
      for (const r of toDeliver) {
        const afterStorm = state.sol >= (state.storm ? state.storm.stormSol : 99);
        const text = afterStorm ? `${S.mcLate} ${r.text}` : r.text;
        appendChatBubble(msgContainer, { kind: 'received', text });
      }
      chatWrap.classList.remove('hidden');
    }
  }

  function showEventCard(type, text) {
    const card = document.createElement('div');
    card.className = `event-card ${type}`;
    card.textContent = text;
    eventCards.appendChild(card);
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  initRender();

  // Show first-sol power dip if applicable
  checkPowerDip();

  return el;
}

