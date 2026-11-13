/**
 * whyChain.js — Builds plain-language cause→effect→result chains from the event log.
 * No DOM access. Pure functions only.
 */

import { applyStorm } from './engine.js';

/**
 * Build the Why Chain from a completed game state.
 * @param {object} state  - Final game state (with log, storm, outcome).
 * @param {object} config - Balance config.
 * @returns {object} { sentences: string[], counterfactual: string|null, nasaCard: object }
 */
export function buildWhyChain(state, config) {
  const { log, storm, outcome, mode } = state;

  const sentences = [];

  // ── 1. Describe the storm outcome ────────────────────────────────────────
  const stormLog = log.find(e => e.type === 'storm' && !e.isSecondSol);
  const shieldAtStorm = stormLog ? stormLog.shieldAtStorm : state.shield;

  if (outcome === 'success') {
    sentences.push(`Your crew survived all 10 sols. Good work!`);
    if (shieldAtStorm >= 60) {
      sentences.push(`You built up the shield early. The storm hit, but the crew stayed safe.`);
    } else if (shieldAtStorm >= 30) {
      sentences.push(`Your shield was partly ready when the storm hit. The crew got some radiation but stayed under the limit.`);
    } else {
      sentences.push(`Your shield was low, but the crew still managed to survive. It was close!`);
    }
  } else if (outcome === 'fail-dose') {
    sentences.push(`The crew got too much radiation. They had to return to Earth for care.`);
    if (shieldAtStorm < 30) {
      sentences.push(`The storm shelter was only ${Math.round(shieldAtStorm)}% ready when the storm arrived.`);
      sentences.push(`A stronger shield would have blocked more of the radiation.`);
    } else {
      sentences.push(`Even with some shielding, the ${storm?.flareClass || 'strong'} flare sent too many particles.`);
    }
  } else if (outcome === 'fail-air') {
    sentences.push(`The crew ran out of breathable air.`);
    sentences.push(`Too many blocks went to shield and food, and not enough to air.`);
  } else if (outcome === 'fail-food') {
    sentences.push(`The crew ran out of food.`);
    sentences.push(`The storm sols halved food production, and the reserves were too low.`);
  }

  // ── 2. Key decision description ──────────────────────────────────────────
  const allocLog = log.filter(e => e.type === 'allocate');
  const shieldBlocks = allocLog.filter(e => e.system === 'shield').length;
  const airBlocks    = allocLog.filter(e => e.system === 'air').length;
  const foodBlocks   = allocLog.filter(e => e.system === 'food').length;
  const controlBlocks = allocLog.filter(e => e.system === 'control').length;

  if (shieldBlocks === 0) {
    sentences.push(`You used 0 blocks on shield the whole mission. Without shielding, the storm hit hard.`);
  } else {
    sentences.push(`You used ${shieldBlocks} block${shieldBlocks !== 1 ? 's' : ''} on shield, ${airBlocks} on air, and ${foodBlocks} on food.`);
  }

  // ── 3. Mars late-reply note ──────────────────────────────────────────────
  if (mode === 'mars') {
    const lateReplies = state.pendingReplies?.filter(r => r.sol > (storm?.stormSol || 10));
    if (lateReplies && lateReplies.length > 0) {
      sentences.push(`On Mars, Mission Control replies took 1–3 sols. Some answers arrived after the storm.`);
      sentences.push(`This is why Mars crews must plan ahead, without waiting for Earth's reply.`);
    } else if (controlBlocks > 0) {
      sentences.push(`You asked Mission Control. On Mars, the reply took extra sols to arrive.`);
    }
  } else if (controlBlocks > 0) {
    sentences.push(`You asked Mission Control ${controlBlocks} time${controlBlocks !== 1 ? 's' : ''}. On the Moon, replies arrived right away.`);
  }

  // ── 4. Counterfactual ────────────────────────────────────────────────────
  let counterfactual = null;
  if (storm && outcome !== 'success') {
    // Re-simulate storm with shield+20
    const hypotheticalShield = Math.min(100, shieldAtStorm + 20);
    const hypotheticalState = {
      dose: state.dose - (stormLog?.doseAdded || 0),
      shield: hypotheticalShield,
      mode: state.mode,
      log: [],
      dipSols: state.dipSols || [],
      sol: storm.stormSol,
    };
    const afterHypo = applyStorm(hypotheticalState, storm, config, false);
    const doseSaved = Math.round((stormLog?.doseAdded || 0) - (afterHypo.dose - hypotheticalState.dose));

    if (doseSaved > 2 && outcome === 'fail-dose') {
      counterfactual = `If your shield had been 20 points higher at the storm, the crew would have received about ${doseSaved} fewer dose points. That might have kept them safe.`;
    } else if (outcome === 'fail-air' || outcome === 'fail-food') {
      counterfactual = `If you had spent 2 more blocks on ${outcome === 'fail-air' ? 'air' : 'food'} before the last few sols, the mission might have succeeded.`;
    }
  }

  // ── 5. NASA event card ───────────────────────────────────────────────────
  const nasaCard = storm ? {
    tier:            storm.tier,
    flareClass:      storm.flareClass,
    peakTime:        storm.peakTime,
    sourceLocation:  storm.sourceLocation,
    activeRegionNum: storm.activeRegionNum,
    link:            storm.flareLink,
    kidTitle:        storm.kidTitle,
    kidStory:        storm.kidStory,
    archivedNote:    'Data from NASA DONKI (archived). Not live data.',
    honestyNote:     'A flare class tells us how strong the flare was. It is not the exact radiation the crew felt.',
  } : null;

  return { sentences, counterfactual, nasaCard };
}

