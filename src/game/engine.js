/**
 * engine.js — Pure game logic functions. No DOM access.
 * All numbers read from config (balance.json). Never hardcoded here.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, val));
}

// ─── allocateBlock ────────────────────────────────────────────────────────────

/**
 * Spend one power block on a system.
 * @param {object} state  - Current game state (immutable input).
 * @param {string} system - 'air' | 'food' | 'shield' | 'control'
 * @param {object} config - Balance config.
 * @returns {object} New state after the block is allocated.
 */
export function allocateBlock(state, system, config) {
  if (state.blocksLeft <= 0) return state; // no blocks left

  const s = { ...state };
  s.blocksLeft -= 1;

  if (system === 'air') {
    s.air = clamp(s.air + config.airGainPerBlock);
  } else if (system === 'food') {
    s.food = clamp(s.food + config.foodGainPerBlock);
  } else if (system === 'shield') {
    s.shield = clamp(s.shield + config.shieldGainPerBlock);
  } else if (system === 'control') {
    // Block cost taken; reply handled by missionControl.js
    s.askedControl = [...s.askedControl, s.sol];
  }

  s.log = [
    ...s.log,
    { type: 'allocate', sol: s.sol, system, blocksLeft: s.blocksLeft },
  ];
  return s;
}

/**
 * Remove one block allocation (undo).
 * @param {object} state
 * @param {string} system - 'air' | 'food' | 'shield'
 * @param {object} config
 * @returns {object} New state.
 */
export function deallocateBlock(state, system, config) {
  // Cannot deallocate if blocks are already at max
  const maxBlocks = state.dipSols && state.dipSols.includes(state.sol)
    ? config.powerDipBlocks
    : config.blocksPerSol;
  if (state.blocksLeft >= maxBlocks) return state;

  const s = { ...state };
  s.blocksLeft += 1;

  if (system === 'air') {
    s.air = clamp(s.air - config.airGainPerBlock);
  } else if (system === 'food') {
    s.food = clamp(s.food - config.foodGainPerBlock);
  } else if (system === 'shield') {
    s.shield = clamp(s.shield - config.shieldGainPerBlock);
  }

  return s;
}

// ─── endSol ──────────────────────────────────────────────────────────────────

/**
 * Apply end-of-sol drains and background dose.
 * Storm sol food halving is applied here if stormPhase === 'active'.
 * @param {object} state
 * @param {object} config
 * @returns {object} New state after sol ends.
 */
export function endSol(state, config) {
  const s = { ...state };
  const isStormSol = s.stormPhase === 'active';

  // Air drain (always full)
  s.air = clamp(s.air - config.airDrainPerSol);

  // Food drain — halved on storm sols (crew shelters, garden stops)
  const foodDrain = isStormSol
    ? Math.floor(config.foodDrainPerSol / 2)
    : config.foodDrainPerSol;
  s.food = clamp(s.food - foodDrain);

  // Background radiation dose (shield reduces it)
  const bgDrain = config.bgDose * (1 - (s.shield / 100) * config.shieldReduction);
  s.dose = clamp(s.dose + bgDrain, 0, 100);

  s.log = [
    ...s.log,
    {
      type: 'endSol',
      sol: s.sol,
      airAfter: s.air,
      foodAfter: s.food,
      doseAfter: s.dose,
      foodDrain,
      isStormSol,
    },
  ];

  return s;
}

// ─── applyStorm ──────────────────────────────────────────────────────────────

/**
 * Apply storm radiation dose at storm start.
 * @param {object} state
 * @param {object} storm  - { tier, strength } from storm timeline.
 * @param {object} config
 * @param {boolean} isSecondSol - true for the second sol of a tier-3 storm.
 * @returns {object} New state after storm dose applied.
 */
export function applyStorm(state, storm, config, isSecondSol = false) {
  const s = { ...state };
  const strength = config.stormStrengths[`tier${storm.tier}`];
  const rawDose = isSecondSol ? strength / 2 : strength;

  // Mars mode adds a dose multiplier (thin atmosphere, simplified)
  const modeDose = s.mode === 'mars' ? rawDose * config.marsDoseFactor : rawDose;

  // Shield reduces dose
  const dose = modeDose * (1 - (s.shield / 100) * config.stormShieldFactor);
  s.dose = clamp(s.dose + dose, 0, 100);

  s.log = [
    ...s.log,
    {
      type: 'storm',
      sol: s.sol,
      tier: storm.tier,
      strength,
      shieldAtStorm: s.shield,
      doseAdded: dose,
      doseAfter: s.dose,
      isSecondSol,
    },
  ];
  return s;
}

// ─── checkOutcome ─────────────────────────────────────────────────────────────

/**
 * Check win/fail conditions.
 * @param {object} state
 * @param {object} config
 * @returns {string|null} 'success' | 'fail-air' | 'fail-food' | 'fail-dose' | null
 */
export function checkOutcome(state, config) {
  if (state.dose >= config.successDoseLimit) return 'fail-dose';
  if (state.air <= 0) return 'fail-air';
  if (state.food <= 0) return 'fail-food';
  if (state.sol >= 10) return 'success';
  return null;
}

// ─── countStars ──────────────────────────────────────────────────────────────

/**
 * Count stars earned on success.
 * @param {object} state - Final state.
 * @param {object} config
 * @returns {number} 0–3 stars.
 */
export function countStars(state, config) {
  if (state.outcome !== 'success') return 0;
  let stars = 1; // base: survived
  if (state.dose < config.starDoseThreshold) stars++;
  if (state.air >= config.starSurvivalMin && state.food >= config.starSurvivalMin) stars++;
  return stars;
}

// ─── blocksForSol ─────────────────────────────────────────────────────────────

/**
 * How many blocks are available for a given sol?
 * @param {object} state
 * @param {object} config
 * @returns {number}
 */
export function blocksForSol(state, config) {
  if (state.dipSols && state.dipSols.includes(state.sol)) {
    return config.powerDipBlocks;
  }
  return config.blocksPerSol;
}

