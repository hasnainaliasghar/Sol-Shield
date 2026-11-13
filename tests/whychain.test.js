/**
 * whychain.test.js — Tests for whyChain.js
 */
import { describe, it, expect } from 'vitest';
import { buildWhyChain } from '../src/game/whyChain.js';

const cfg = {
  blocksPerSol: 5,
  powerDipBlocks: 4,
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
  marsDoseFactor: 0.6,
};

const mockStorm = {
  tier: 2,
  stormSol: 6,
  watchSol: 3,
  warningSol: 5,
  flareClass: 'X2.2',
  peakTime: '2017-09-06T09:10Z',
  flareLink: 'https://ccmc.gsfc.nasa.gov/DONKI/view/Alert/1',
  activeRegionNum: '12673',
  kidTitle: 'A big X2.2 flare',
  kidStory: 'A strong flare hit in September 2017.',
};

function makeState(overrides = {}) {
  return {
    sol: 10,
    air: 50,
    food: 50,
    shield: 30,
    dose: 20,
    outcome: 'success',
    storm: mockStorm,
    mode: 'moon',
    log: [],
    askedControl: [],
    pendingReplies: [],
    dipSols: [],
    ...overrides,
  };
}

describe('buildWhyChain', () => {
  it('returns sentences array and nasaCard', () => {
    const state = makeState();
    const { sentences, nasaCard } = buildWhyChain(state, cfg);
    expect(Array.isArray(sentences)).toBe(true);
    expect(sentences.length).toBeGreaterThanOrEqual(1);
    expect(nasaCard).not.toBeNull();
  });

  it('nasaCard has real flare class and link', () => {
    const state = makeState();
    const { nasaCard } = buildWhyChain(state, cfg);
    expect(nasaCard.flareClass).toBe('X2.2');
    expect(nasaCard.link).toContain('DONKI');
  });

  it('nasaCard has honesty note', () => {
    const state = makeState();
    const { nasaCard } = buildWhyChain(state, cfg);
    expect(nasaCard.honestyNote).toContain('flare class');
  });

  it('nasaCard has archived note', () => {
    const state = makeState();
    const { nasaCard } = buildWhyChain(state, cfg);
    expect(nasaCard.archivedNote).toContain('archived');
  });

  it('fail-shield produces descriptive sentences', () => {
    const stormLog = { type: 'storm', sol: 6, tier: 2, shieldAtStorm: 10, doseAdded: 45, doseAfter: 80, isSecondSol: false };
    const state = makeState({
      outcome: 'fail-dose',
      dose: 80,
      shield: 10,
      log: [stormLog],
    });
    const { sentences } = buildWhyChain(state, cfg);
    const all = sentences.join(' ').toLowerCase();
    expect(all).toContain('radiation');
  });

  it('fail-air produces relevant sentences', () => {
    const state = makeState({ outcome: 'fail-air', air: 0 });
    const { sentences } = buildWhyChain(state, cfg);
    const all = sentences.join(' ').toLowerCase();
    expect(all).toContain('air');
  });

  it('fail-food produces relevant sentences', () => {
    const state = makeState({ outcome: 'fail-food', food: 0 });
    const { sentences } = buildWhyChain(state, cfg);
    const all = sentences.join(' ').toLowerCase();
    expect(all).toContain('food');
  });

  it('success produces positive sentences', () => {
    const state = makeState({ outcome: 'success', shield: 70, dose: 20 });
    const { sentences } = buildWhyChain(state, cfg);
    const all = sentences.join(' ').toLowerCase();
    expect(all).toMatch(/survived|safe|good/);
  });

  it('counterfactual is generated for fail-dose', () => {
    const stormLog = { type: 'storm', sol: 6, tier: 2, shieldAtStorm: 5, doseAdded: 48, doseAfter: 80, isSecondSol: false };
    const state = makeState({
      outcome: 'fail-dose',
      dose: 80,
      shield: 5,
      log: [stormLog],
    });
    const { counterfactual } = buildWhyChain(state, cfg);
    expect(counterfactual).not.toBeNull();
  });

  it('Mars late reply adds explanation', () => {
    const state = makeState({
      mode: 'mars',
      pendingReplies: [{ sol: 8, question: 'q', text: 'reply' }],
      storm: { ...mockStorm, stormSol: 6 },
    });
    const { sentences } = buildWhyChain(state, cfg);
    const all = sentences.join(' ').toLowerCase();
    expect(all).toMatch(/mars|reply|sol/);
  });
});

