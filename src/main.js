/**
 * main.js — App shell and router for SOL SHIELD.
 * Routes: title → briefing → play → debrief
 */
import './styles/base.css';
import './styles/game.css';

import { loadConfig } from './game/config.js';
import { createInitialState } from './game/state.js';
import { createRng, randInt } from './game/rng.js';
import { prepareStorm } from './game/storm.js';
import { renderTitle } from './ui/screens/title.js';
import { renderBriefing } from './ui/screens/briefing.js';
import { renderPlay } from './ui/screens/play.js';
import { renderDebrief } from './ui/screens/debrief.js';
import { renderAbout } from './ui/screens/about.js';
import { loadGlossary } from './ui/components/glossaryTip.js';
import { stopReadAloud } from './ui/components/readAloud.js';

const app = document.getElementById('app');
let config = null;

// ── Boot ────────────────────────────────────────────────────────────────────
async function init() {
  try {
    config = await loadConfig();
  } catch (e) {
    app.innerHTML = '<p style="color:var(--color-danger);padding:32px;">Could not load game data. Please refresh.</p>';
    console.error(e);
    return;
  }

  // Load glossary in background (non-blocking)
  loadGlossary();

  showTitle();
}

// ── Screens ─────────────────────────────────────────────────────────────────
function showScreen(el) {
  stopReadAloud();
  app.innerHTML = '';
  app.appendChild(el);
  window.scrollTo(0, 0);
}

function showTitle() {
  showScreen(renderTitle({
    onPlay: showBriefing,
    onHowItWorks: showBriefing,
    onAbout: showAbout,
  }));
}

function showBriefing() {
  showScreen(renderBriefing({
    onStart: (mode) => startGame(mode),
    onBack: showTitle,
  }));
}

function showAbout() {
  showScreen(renderAbout({
    onBack: showTitle,
  }));
}

/**
 * Start a new game with a chosen mode.
 * @param {'moon'|'mars'} mode
 */
async function startGame(mode) {
  // Show loading state briefly
  app.innerHTML = '<p style="padding:48px;text-align:center;color:var(--color-text-dim)">Loading real NASA storm data...</p>';

  // Generate seed for this run
  const seed = Date.now() ^ (Math.random() * 0x100000000);
  const rng = createRng(seed);

  // Load real storm from NASA DONKI archive
  let storm;
  try {
    storm = await prepareStorm(rng);
  } catch (e) {
    console.warn('Could not load storms.json, using placeholder:', e.message);
    // Graceful fallback: placeholder storm
    const stormSol = randInt(rng, 5, 8);
    storm = {
      eventId: 'placeholder',
      tier: 2,
      stormSol,
      watchSol: stormSol - 3,
      warningSol: stormSol - 1,
      flareClass: 'M9.0',
      peakTime: '2024-05-04T06:19Z',
      flareLink: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/',
      activeRegionNum: '13663',
      kidTitle: 'A strong solar storm (placeholder)',
      kidStory: 'A strong solar flare was detected. Particle storm followed.',
    };
  }

  // Generate power dip sols (non-storm sols)
  const dipSols = generateDipSols(rng, storm.stormSol, mode, config);

  // Create initial state
  const state = createInitialState(config, storm, mode, dipSols);

  // Mars communication delay (1–3 sols, seeded)
  if (mode === 'mars') {
    state.marsDelay = randInt(rng, 1, 3);
  }

  showScreen(renderPlay({
    state,
    config,
    onDebrief: (finalState) => showDebrief(finalState),
  }));
}

/**
 * Generate power dip sol numbers.
 * @param {function} rng
 * @param {number} stormSol
 * @param {string} mode
 * @param {object} config
 * @returns {number[]}
 */
function generateDipSols(rng, stormSol, mode, config) {
  const available = [];
  for (let s = 1; s <= 10; s++) {
    if (s !== stormSol) available.push(s);
  }

  const count = mode === 'mars'
    ? (config.marsDipSols || 3)
    : (config.powerDipSols || 2);

  const dips = [];
  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(rng() * available.length);
    dips.push(available.splice(idx, 1)[0]);
  }
  return dips.sort((a, b) => a - b);
}

function showDebrief(finalState) {
  showScreen(renderDebrief({
    state: finalState,
    config,
    onReplay: () => showBriefing(),
    onTitle: showTitle,
  }));
}

// ── Start ───────────────────────────────────────────────────────────────────
init();
