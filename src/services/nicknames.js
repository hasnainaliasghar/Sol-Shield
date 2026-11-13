/**
 * nicknames.js — Generate a fun anonymous nickname for the leaderboard.
 * No real names, emails, or free text. Kids safe.
 * Format: Adjective + Noun + 2-digit number (e.g. "BraveStar42")
 */

const ADJECTIVES = [
  'Brave', 'Swift', 'Cosmic', 'Solar', 'Stellar',
  'Lunar', 'Bright', 'Bold', 'Calm', 'Daring',
  'Eager', 'Fierce', 'Giant', 'Happy', 'Iron',
  'Jolly', 'Kind', 'Lucky', 'Mighty', 'Noble',
  'Orbital', 'Plucky', 'Quick', 'Radiant', 'Super',
  'True', 'Ultra', 'Vivid', 'Wise', 'Zippy',
];

const NOUNS = [
  'Star', 'Comet', 'Rocket', 'Pilot', 'Shield',
  'Rover', 'Orbit', 'Probe', 'Flare', 'Nova',
  'Pulsar', 'Quasar', 'Nebula', 'Aurora', 'Cosmos',
  'Meteor', 'Photon', 'Neutron', 'Titan', 'Atlas',
  'Eagle', 'Falcon', 'Hawk', 'Lynx', 'Phoenix',
  'Dragon', 'Griffin', 'Pegasus', 'Sphinx', 'Vega',
];

/**
 * Generate a random nickname using seeded selection from the lists.
 * @param {number} seed - Integer seed (e.g. from Math.random()*1e9|0)
 * @returns {string} - e.g. "BraveStar42"
 */
export function generateNickname(seed) {
  // Simple LCG for reproducibility
  let s = (seed >>> 0) + 1;
  const next = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s;
  };

  const adj   = ADJECTIVES[next() % ADJECTIVES.length];
  const noun  = NOUNS[next() % NOUNS.length];
  const num   = (next() % 90) + 10; // 10-99

  return `${adj}${noun}${num}`;
}

/**
 * Generate a random nickname (no seed needed — uses crypto random).
 * @returns {string}
 */
export function randomNickname() {
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  return generateNickname(seed);
}

