/**
 * engine.test.js — Vitest unit tests for the game engine.
 */
import { describe, it, expect } from 'vitest';
import {
  allocateBlock,
  endSol,
  applyStorm,
  checkOutcome,
  countStars,
  blocksForSol,
} from '../src/game/engine.js';
import { createInitialState } from '../src/game/state.js';

// ── Test config (matches balance.json starting values) ──────────────────────
const cfg = {
  blocksPerSol: 5,
  powerDipBlocks: 4,
  powerDipSols: 2,
  airGainPerBlock: 12,
  foodGainPerBlock: 10,
  shieldGainPerBlock: 10,
  airDrainPerSol: 14,
  foodDrainPerSol: 9,
  bgDose: 3,
  shieldReduction: 0.8,
  stormStrengths: { tier1: 25, tier2: 50, tier3: 80 },
  stormShieldFactor: 0.9,
  successDoseLimit: 75,
  starDoseThreshold: 35,
  starSurvivalMin: 30,
  initialAir: 70,
  initialFood: 70,
  initialShield: 30,
  initialDose: 0,
  marsDipSols: 3,
  marsDipMinBlocks: 3,
  marsDipMaxBlocks: 4,
  marsDoseFactor: 0.6,
};

const placeholderStorm = {
  tier: 2,
  stormSol: 6,
  watchSol: 3,
  warningSol: 5,
};

function makeState(overrides = {}) {
  const base = createInitialState(cfg, placeholderStorm, 'moon', []);
  return { ...base, ...overrides };
}

// ── allocateBlock ────────────────────────────────────────────────────────────

describe('allocateBlock', () => {
  it('adds air correctly', () => {
    const s = makeState();
    const s2 = allocateBlock(s, 'air', cfg);
    expect(s2.air).toBe(70 + 12);
    expect(s2.blocksLeft).toBe(4);
  });

  it('adds food correctly', () => {
    const s = makeState();
    const s2 = allocateBlock(s, 'food', cfg);
    expect(s2.food).toBe(70 + 10);
    expect(s2.blocksLeft).toBe(4);
  });

  it('adds shield correctly', () => {
    const s = makeState();
    const s2 = allocateBlock(s, 'shield', cfg);
    expect(s2.shield).toBe(30 + 10);
    expect(s2.blocksLeft).toBe(4);
  });

  it('does not go below 0 blocks', () => {
    let s = makeState({ blocksLeft: 0 });
    const s2 = allocateBlock(s, 'air', cfg);
    expect(s2.blocksLeft).toBe(0); // unchanged
    expect(s2.air).toBe(70); // unchanged
  });

  it('caps air at 100', () => {
    const s = makeState({ air: 95 });
    const s2 = allocateBlock(s, 'air', cfg);
    expect(s2.air).toBe(100);
  });

  it('caps shield at 100', () => {
    const s = makeState({ shield: 95 });
    const s2 = allocateBlock(s, 'shield', cfg);
    expect(s2.shield).toBe(100);
  });

  it('records log entry', () => {
    const s = makeState();
    const s2 = allocateBlock(s, 'air', cfg);
    const last = s2.log[s2.log.length - 1];
    expect(last.type).toBe('allocate');
    expect(last.system).toBe('air');
  });

  it('marks askedControl when system is control', () => {
    const s = makeState();
    const s2 = allocateBlock(s, 'control', cfg);
    expect(s2.askedControl).toContain(1);
    expect(s2.blocksLeft).toBe(4);
  });
});

// ── endSol ───────────────────────────────────────────────────────────────────

describe('endSol', () => {
  it('drains air and food normally', () => {
    const s = makeState({ stormPhase: 'none' });
    const s2 = endSol(s, cfg);
    expect(s2.air).toBe(70 - 14);
    expect(s2.food).toBe(70 - 9);
  });

  it('halves food drain on storm sol', () => {
    const s = makeState({ stormPhase: 'active' });
    const s2 = endSol(s, cfg);
    expect(s2.food).toBe(70 - Math.floor(9 / 2)); // 70 - 4 = 66
  });

  it('applies background dose based on shield', () => {
    // With shield=0: dose += 3 * (1 - 0) = 3
    const s = makeState({ shield: 0 });
    const s2 = endSol(s, cfg);
    expect(s2.dose).toBeCloseTo(3, 5);
  });

  it('shield reduces background dose', () => {
    // With shield=100: dose += 3 * (1 - 1*0.8) = 3*0.2 = 0.6
    const s = makeState({ shield: 100 });
    const s2 = endSol(s, cfg);
    expect(s2.dose).toBeCloseTo(0.6, 5);
  });

  it('records log entry', () => {
    const s = makeState();
    const s2 = endSol(s, cfg);
    const last = s2.log[s2.log.length - 1];
    expect(last.type).toBe('endSol');
  });
});

// ── power dips ───────────────────────────────────────────────────────────────

describe('power dips', () => {
  it('blocksForSol returns reduced blocks on dip sols', () => {
    const s = makeState({ sol: 3, dipSols: [3, 7] });
    expect(blocksForSol(s, cfg)).toBe(4);
  });

  it('blocksForSol returns normal blocks on non-dip sols', () => {
    const s = makeState({ sol: 1, dipSols: [3, 7] });
    expect(blocksForSol(s, cfg)).toBe(5);
  });
});

// ── applyStorm ────────────────────────────────────────────────────────────────

describe('applyStorm', () => {
  it('applies tier 1 storm dose with no shield', () => {
    const s = makeState({ shield: 0 });
    const storm = { tier: 1 };
    const s2 = applyStorm(s, storm, cfg);
    // dose = 25 * (1 - 0) = 25
    expect(s2.dose).toBeCloseTo(25, 5);
  });

  it('applies tier 2 storm dose', () => {
    const s = makeState({ shield: 0 });
    const storm = { tier: 2 };
    const s2 = applyStorm(s, storm, cfg);
    expect(s2.dose).toBeCloseTo(50, 5);
  });

  it('applies tier 3 storm dose', () => {
    const s = makeState({ shield: 0 });
    const storm = { tier: 3 };
    const s2 = applyStorm(s, storm, cfg);
    expect(s2.dose).toBeCloseTo(80, 5);
  });

  it('shield reduces storm dose', () => {
    const s = makeState({ shield: 100 });
    const storm = { tier: 2 };
    const s2 = applyStorm(s, storm, cfg);
    // dose = 50 * (1 - 1*0.9) = 50 * 0.1 = 5
    expect(s2.dose).toBeCloseTo(5, 5);
  });

  it('applies half dose on second sol for tier 3', () => {
    const s = makeState({ shield: 0 });
    const storm = { tier: 3 };
    const s2 = applyStorm(s, storm, cfg, true);
    expect(s2.dose).toBeCloseTo(40, 5); // 80/2 = 40
  });

  it('applies mars dose factor', () => {
    const s = makeState({ shield: 0, mode: 'mars' });
    const storm = { tier: 2 };
    const s2 = applyStorm(s, storm, cfg);
    // dose = 50 * 0.6 * (1 - 0) = 30
    expect(s2.dose).toBeCloseTo(30, 5);
  });

  it('records storm log entry', () => {
    const s = makeState({ shield: 0 });
    const s2 = applyStorm(s, { tier: 2 }, cfg);
    const last = s2.log[s2.log.length - 1];
    expect(last.type).toBe('storm');
    expect(last.tier).toBe(2);
  });
});

// ── checkOutcome ──────────────────────────────────────────────────────────────

describe('checkOutcome', () => {
  it('returns null mid-game with healthy state', () => {
    const s = makeState({ sol: 5 });
    expect(checkOutcome(s, cfg)).toBeNull();
  });

  it('returns success at sol 10 with healthy state', () => {
    const s = makeState({ sol: 10, air: 50, food: 50, dose: 20 });
    expect(checkOutcome(s, cfg)).toBe('success');
  });

  it('fails on dose >= 75', () => {
    const s = makeState({ sol: 5, dose: 75 });
    expect(checkOutcome(s, cfg)).toBe('fail-dose');
  });

  it('fails on air <= 0', () => {
    const s = makeState({ sol: 5, air: 0 });
    expect(checkOutcome(s, cfg)).toBe('fail-air');
  });

  it('fails on food <= 0', () => {
    const s = makeState({ sol: 5, food: 0 });
    expect(checkOutcome(s, cfg)).toBe('fail-food');
  });

  it('dose check takes priority over air/food', () => {
    const s = makeState({ sol: 5, dose: 80, air: 0, food: 0 });
    expect(checkOutcome(s, cfg)).toBe('fail-dose');
  });
});

// ── countStars ────────────────────────────────────────────────────────────────

describe('countStars', () => {
  it('returns 0 on failure', () => {
    const s = makeState({ outcome: 'fail-dose' });
    expect(countStars(s, cfg)).toBe(0);
  });

  it('returns 1 for basic success', () => {
    const s = makeState({ outcome: 'success', dose: 60, air: 20, food: 20 });
    expect(countStars(s, cfg)).toBe(1);
  });

  it('returns 2 for low dose success', () => {
    const s = makeState({ outcome: 'success', dose: 20, air: 20, food: 20 });
    expect(countStars(s, cfg)).toBe(2);
  });

  it('returns 3 for excellent success', () => {
    const s = makeState({ outcome: 'success', dose: 20, air: 50, food: 50 });
    expect(countStars(s, cfg)).toBe(3);
  });
});

// ── determinism ──────────────────────────────────────────────────────────────

describe('determinism', () => {
  it('same sequence of allocations gives same result', () => {
    function runSequence() {
      let s = makeState();
      s = allocateBlock(s, 'shield', cfg);
      s = allocateBlock(s, 'air', cfg);
      s = allocateBlock(s, 'food', cfg);
      s = endSol(s, cfg);
      return { air: s.air, food: s.food, shield: s.shield, dose: s.dose };
    }
    expect(runSequence()).toEqual(runSequence());
  });
});

