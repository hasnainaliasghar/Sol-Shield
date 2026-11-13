/**
 * storm.js — Maps a real DONKI event to a playable storm timeline.
 * Uses seeded RNG for replayability. Avoids repeating last storm (localStorage).
 */
import { randInt } from './rng.js';

/**
 * Load storms.json from the static data folder.
 * @returns {Promise<object>} The full storms data object.
 */
export async function loadStorms() {
  const res = await fetch('/data/storms.json');
  if (!res.ok) throw new Error('Failed to load storms.json');
  return res.json();
}

/**
 * Pick a storm event using a seeded RNG, avoiding the last-used event.
 * @param {object[]} events  - Array from storms.json.
 * @param {function} rng     - Seeded RNG function.
 * @param {string}   lastId  - ID of last storm (from localStorage), to avoid repeat.
 * @returns {object} A selected storm event.
 */
export function pickStormEvent(events, rng, lastId = null) {
  // Filter out last event if possible
  const pool = events.length > 1 && lastId
    ? events.filter(e => e.id !== lastId)
    : events;

  const idx = Math.floor(rng() * pool.length);
  return pool[idx];
}

/**
 * Get the last-used storm ID from localStorage (safe — wrapped in try/catch).
 * @returns {string|null}
 */
export function getLastStormId() {
  try {
    return localStorage.getItem('solshield_lastStormId');
  } catch {
    return null;
  }
}

/**
 * Save the used storm ID to localStorage.
 * @param {string} id
 */
export function saveLastStormId(id) {
  try {
    localStorage.setItem('solshield_lastStormId', id);
  } catch {
    // ignore (private browsing etc.)
  }
}

/**
 * Build a playable storm timeline from a DONKI event.
 *
 * @param {object} event - A storms.json event record.
 * @param {function} rng - Seeded RNG (for stormSol selection).
 * @returns {object} Storm timeline used by the game engine.
 */
export function buildStormTimeline(event, rng) {
  // Storm sol: randomly between 5 and 8 (gives player 4-7 sols to prepare)
  const stormSol = randInt(rng, 5, 8);

  // Timeline:
  //   watchSol    = stormSol - 3  (sunspot watch)
  //   warningSol  = stormSol - 1  (flare warning)
  //   stormSol    = stormSol      (storm hits)
  //   stormSol+1  = tier 3 only   (second storm day)
  const watchSol   = stormSol - 3;  // earliest possible: sol 2
  const warningSol = stormSol - 1;

  return {
    // Event identity
    eventId:         event.id,
    tier:            event.tier,
    kidTitle:        event.kidTitle,
    kidStory:        event.kidStory,

    // Flare data (real NASA values)
    flareClass:      event.flare.classType,
    beginTime:       event.flare.beginTime  || null,
    peakTime:        event.flare.peakTime   || null,
    sourceLocation:  event.flare.sourceLocation || null,
    activeRegionNum: event.flare.activeRegionNum || null,
    flareLink:       event.flare.link       || null,

    // SEP data (may be null — /DONKI/SEP endpoint unavailable at time of fetch)
    sep: event.sep || null,

    // Playable timeline
    stormSol,
    watchSol,
    warningSol,
  };
}

/**
 * Full helper: load storms, pick an event, build the timeline, save to localStorage.
 * @param {function} rng - Seeded RNG.
 * @returns {Promise<object>} Storm timeline object.
 */
export async function prepareStorm(rng) {
  const data = await loadStorms();
  const lastId = getLastStormId();
  const event  = pickStormEvent(data.events, rng, lastId);
  saveLastStormId(event.id);
  return buildStormTimeline(event, rng);
}

