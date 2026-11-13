/**
 * rng.js — Seeded Mulberry32 pseudo-random number generator.
 * Gives deterministic, replayable runs when given the same seed.
 */

/**
 * Create a seeded RNG function.
 * @param {number} seed - Integer seed value.
 * @returns {function} - Returns a function that yields floats in [0, 1).
 */
export function createRng(seed) {
  let s = seed >>> 0; // ensure 32-bit unsigned
  return function rand() {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

/**
 * Pick a random integer in [min, max] inclusive using provided rng function.
 */
export function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Pick a random element from an array using provided rng function.
 */
export function randChoice(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

