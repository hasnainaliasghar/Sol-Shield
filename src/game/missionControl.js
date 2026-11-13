/**
 * missionControl.js — Rule-based Mission Control replies.
 * Uses real storm data. Never reveals storm sol before Watch phase.
 */
import { S } from '../ui/strings.js';

/**
 * Get a rule-based reply from Mission Control.
 * @param {string} question - The question text.
 * @param {object} state    - Current game state.
 * @returns {string} Reply text.
 */
export function getMissionControlReply(question, state) {
  const storm = state.storm;
  const phase = state.stormPhase;
  const tier = storm ? storm.tier : 1;
  const flareClass = storm ? (storm.flareClass || 'M-class') : 'M-class';

  // Before Watch: don't reveal any storm details
  if (phase === 'none') {
    if (question.includes('How big')) {
      return 'No big flare seen yet. Keep your shield growing just in case.';
    }
    return 'We see no storm yet. Balance air, food, and shield. Shield will cost food growth.';
  }

  // Watch phase
  if (phase === 'watch') {
    if (question.includes('How big')) {
      const sizeWords = tier === 1 ? 'a small' : tier === 2 ? 'a big' : 'a very large';
      return `The sunspot looks like ${sizeWords} storm. Prepare your shield.`;
    }
    const advice = tier >= 2
      ? 'This looks like a big one. Shield first. It will cost food growth.'
      : 'A small storm may come. Keep a balance. Shield will cost food growth.';
    return advice;
  }

  // Warning phase
  if (phase === 'warning') {
    if (question.includes('How big')) {
      return `We saw a ${flareClass} flare. ${tier >= 3 ? 'This is very strong!' : tier >= 2 ? 'This is a strong storm.' : 'This is a small storm.'}`;
    }
    if (tier >= 2) {
      return `Shield as much as you can! A ${flareClass} flare means a strong particle storm. Shield will cost food growth.`;
    }
    return `Keep building shield. A ${flareClass} flare is on the way. Shield will cost food growth.`;
  }

  // Active storm
  if (phase === 'active') {
    if (question.includes('How big')) {
      return `The storm is here. It is a tier ${tier} storm from a ${flareClass} flare.`;
    }
    return 'Stay sheltered. There is nothing more to do right now. Focus on food after.';
  }

  // Storm over
  if (phase === 'over') {
    if (question.includes('How big')) {
      return `The storm was tier ${tier} from a ${flareClass} flare. It has passed.`;
    }
    return 'The storm is over. Now focus on air and food for the rest of the mission.';
  }

  return 'We are watching the Sun. Stay prepared.';
}

