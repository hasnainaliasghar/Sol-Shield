/**
 * Debug a single SmartEarly run to trace state
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const config = JSON.parse(readFileSync(join(ROOT, 'public', 'data', 'balance.json'), 'utf8'));

function createRng(seed) {
  let s = seed >>> 0;
  return function rand() {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}
function randInt(rng, min, max) { return Math.floor(rng() * (max - min + 1)) + min; }
function clamp(v, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, v)); }

function endSol(state, isStormSol) {
  const s = { ...state };
  s.air  = clamp(s.air  - config.airDrainPerSol);
  s.food = clamp(s.food - (isStormSol ? Math.floor(config.foodDrainPerSol / 2) : config.foodDrainPerSol));
  s.dose = clamp(s.dose + config.bgDose * (1 - (s.shield / 100) * config.shieldReduction), 0, 100);
  return s;
}

function applyStorm(state, tier, isSecondSol = false) {
  const s = { ...state };
  const strength = config.stormStrengths[`tier${tier}`];
  const raw = isSecondSol ? strength / 2 : strength;
  const dose = raw * (1 - (s.shield / 100) * config.stormShieldFactor);
  s.dose = clamp(s.dose + dose, 0, 100);
  return s;
}

// trace one run with tier 3, seed 0
const seed = 0;
const tier = 3;
const rng = createRng(seed);
const stormSol = randInt(rng, 5, 8);
const watchSol = stormSol - 3;
const warningSol = stormSol - 1;

const available = Array.from({length: 10}, (_, i) => i + 1).filter(s => s !== stormSol);
const dipSols = [];
for (let i = 0; i < config.powerDipSols; i++) {
  const idx = Math.floor(rng() * available.length);
  dipSols.push(available.splice(idx, 1)[0]);
}

console.log(`stormSol=${stormSol}, watchSol=${watchSol}, warningSol=${warningSol}`);
console.log(`dipSols=${dipSols.join(',')}`);
console.log(`tier3 strength=${config.stormStrengths.tier3}`);
console.log();

let state = {
  sol: 1,
  air: config.initialAir,
  food: config.initialFood,
  shield: config.initialShield,
  dose: config.initialDose,
};

for (let sol = 1; sol <= 10; sol++) {
  const maxBlocks = dipSols.includes(sol) ? config.powerDipBlocks : config.blocksPerSol;
  
  // SmartEarly strategy
  let alloc;
  if (sol >= watchSol && sol <= warningSol) {
    const shieldBlocks = Math.min(3, maxBlocks);
    const rem = maxBlocks - shieldBlocks;
    alloc = { shield: shieldBlocks, air: Math.ceil(rem/2), food: rem - Math.ceil(rem/2) };
  } else {
    const shieldBlocks = Math.max(1, Math.floor(maxBlocks/5));
    const rem = maxBlocks - shieldBlocks;
    alloc = { shield: shieldBlocks, air: Math.ceil(rem/2), food: rem - Math.ceil(rem/2) };
  }
  
  state = {
    ...state,
    air:    clamp(state.air    + alloc.air    * config.airGainPerBlock),
    food:   clamp(state.food   + alloc.food   * config.foodGainPerBlock),
    shield: clamp(state.shield + alloc.shield * config.shieldGainPerBlock),
  };

  let preDose = state.dose;
  
  if (sol === stormSol) {
    state = applyStorm(state, tier, false);
    console.log(`Sol ${sol} [STORM] alloc=${JSON.stringify(alloc)} maxB=${maxBlocks} shield=${state.shield.toFixed(1)} stormDose=+${(state.dose-preDose).toFixed(1)}`);
  } else if (tier === 3 && sol === stormSol + 1) {
    state = applyStorm(state, tier, true);
    console.log(`Sol ${sol} [STORM+1] alloc=${JSON.stringify(alloc)} maxB=${maxBlocks} shield=${state.shield.toFixed(1)} stormDose=+${(state.dose-preDose).toFixed(1)}`);
  } else {
    console.log(`Sol ${sol} alloc=${JSON.stringify(alloc)} maxB=${maxBlocks}`);
  }

  const isStormSol = sol === stormSol || (tier === 3 && sol === stormSol + 1);
  state = endSol(state, isStormSol);
  
  console.log(`  -> air=${state.air.toFixed(1)} food=${state.food.toFixed(1)} shield=${state.shield.toFixed(1)} dose=${state.dose.toFixed(1)}`);
  
  if (state.dose >= config.successDoseLimit) { console.log('FAIL-DOSE'); break; }
  if (state.air <= 0) { console.log('FAIL-AIR'); break; }
  if (state.food <= 0) { console.log('FAIL-FOOD'); break; }
}

console.log(`\nFinal: air=${state.air.toFixed(1)} food=${state.food.toFixed(1)} shield=${state.shield.toFixed(1)} dose=${state.dose.toFixed(1)}`);
console.log(state.dose < 75 && state.air > 0 && state.food > 0 ? 'SUCCESS' : 'FAIL');

