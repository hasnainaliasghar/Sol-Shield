/**
 * state.js — Initial game state shape and factory.
 * All values come from balance.json (passed as config).
 */

/**
 * Create a fresh initial state for a new run.
 * @param {object} config - Balance config from balance.json.
 * @param {object} storm   - Storm timeline object from storm.js.
 * @param {string} mode    - "moon" or "mars".
 * @param {number[]} dipSols - Array of sol numbers that are power dips.
 * @returns {object} Initial state.
 */
export function createInitialState(config, storm, mode = 'moon', dipSols = []) {
  return {
    sol: 1,                    // current sol (1–10)
    blocksLeft: config.blocksPerSol,
    air: config.initialAir,
    food: config.initialFood,
    shield: config.initialShield,
    dose: config.initialDose,
    stormPhase: 'none',        // none | watch | warning | active | over
    storm,                     // storm timeline object
    dipSols,                   // sols with power dips
    log: [],                   // event log for Why Chain
    askedControl: [],          // sols when Mission Control was asked
    pendingReplies: [],        // { sol, question, text } delayed MC replies
    mode,                      // moon | mars
    outcome: null,             // null | 'success' | 'fail-air' | 'fail-food' | 'fail-dose'
  };
}

