/**
 * strings.js — All player-facing text at grade 3-5 reading level.
 * Sentences are 12 words or fewer.
 */

export const S = {
  // ── App title ──────────────────────────────────────────────────────────────
  appTitle: 'SOL SHIELD',
  appTagline: 'Junior Astronaut Mission Trainer',

  // ── Title screen ──────────────────────────────────────────────────────────
  titlePlay: 'Play Mission',
  titleHowItWorks: 'How It Works',
  titleAbout: 'About the Science',
  titleReadAloud: 'Read Aloud',
  titleNASANote: 'Uses real NASA space weather data.',

  // ── Briefing screen ───────────────────────────────────────────────────────
  briefingTitle: 'Mission Briefing',
  briefingP1: 'You run a Moon outpost for 10 sols.',
  briefingP2: 'A sol is one day on another world.',
  briefingP3: 'Each sol you get power blocks.',
  briefingP4: 'Spend them on Air, Shield, and Food.',
  briefingP5: 'A real solar storm from NASA is coming.',
  briefingP6: 'Build your shield before it arrives.',
  briefingP7: 'You can ask Mission Control for help.',
  briefingP8: 'Asking costs one power block.',
  briefingChooseMoon: 'Moon Mission',
  briefingChooseMars: 'Mars Mission',
  briefingMoonDesc: 'Messages reach Earth instantly.',
  briefingMarsDesc: 'Messages take 1–3 sols to arrive.',
  briefingStart: 'Start Mission',

  // ── Play screen ───────────────────────────────────────────────────────────
  playSolLabel: 'Sol',
  playOf: 'of 10',
  playBlocksLeft: 'Power blocks left',
  playAir: 'Air',
  playFood: 'Food',
  playShield: 'Shield',
  playDose: 'Crew Health',
  playDoseSafe: 'Safe',
  playDoseOkay: 'Okay',
  playDoseHigh: 'High',
  playDoseDanger: 'Danger!',
  playAirLasts: (n) => `Air lasts: ${n} sols`,
  playFoodLasts: (n) => `Food lasts: ${n} sols`,
  playEndSol: 'End Sol',
  playConfirmUnspent: (n) => `You have ${n} block${n !== 1 ? 's' : ''} left. End sol anyway?`,
  playConfirmYes: 'Yes, end sol',
  playConfirmNo: 'Keep planning',
  playAskControl: 'Ask Mission Control',
  playAskControlCost: '(costs 1 block)',
  playAskQ1: 'How big will the storm be?',
  playAskQ2: 'What should I do?',
  playAskSend: 'Send Message',
  playAskCancel: 'Cancel',
  playBlockAdd: '+1',
  playBlockRemove: '−1',

  // ── Storm phase banners ───────────────────────────────────────────────────
  phaseNone: '☀️ All Quiet',
  phaseWatch: '👁 Sunspot Watch',
  phaseWarning: '⚡ Flare Warning!',
  phaseActive: '🌩 Storm Active!',
  phaseOver: '✅ Storm Passed',

  phaseWatchMsg: (region) =>
    region
      ? `A big sunspot group (AR${region}) is growing on the Sun.`
      : 'A big sunspot group is growing on the Sun.',
  phaseWarningMsg: (cls) =>
    `The Sun sent out a ${cls} flare. Particles may arrive soon!`,
  phaseActiveMsg: 'The particle storm is here. Crew is sheltering.',
  phaseOverMsg: 'The storm has passed. Well done!',

  // ── Power dip ─────────────────────────────────────────────────────────────
  powerDipMsg: 'Lunar dust on the solar panels. Only 4 blocks today.',

  // ── Mission Control chat ──────────────────────────────────────────────────
  mcSending: 'Message sent to Earth...',
  mcReceiving: '📡 Reply received!',
  mcDelay: (n) => `Your message is traveling. Reply in ${n} sol${n !== 1 ? 's' : ''}.`,
  mcLate: 'Earth answered. But the storm already hit!',
  mcLabel: 'Mission Control says:',

  // ── Debrief screen ────────────────────────────────────────────────────────
  debriefTitle: 'Mission Debrief',
  debriefSuccess: '🎉 Mission Success!',
  debriefFailDose: '📋 Mission Ended: High Radiation',
  debriefFailAir: '📋 Mission Ended: Low Air',
  debriefFailFood: '📋 Mission Ended: Low Food',
  debriefStars: (n) => `${n} ⭐`,
  debriefWhyChainTitle: 'What Happened?',
  debriefNASACard: 'Real NASA Storm Data',
  debriefFlareClass: 'Flare class',
  debriefPeakTime: 'Peak time',
  debriefDONKILink: 'View on NASA DONKI →',
  debriefArchivedNote: 'Data from NASA DONKI (archived).',
  debriefHonestyNote:
    'A flare class tells us how strong the flare was. It is not the exact radiation the crew felt.',
  debriefHonestyNote2:
    'Game numbers are simplified for learning.',
  debriefReplay: 'Try a Different Real Storm',
  debriefReadAloud: 'Read It Aloud',

  // ── Badges ────────────────────────────────────────────────────────────────
  badgeEarlyShield: '🛡 Early Shield',
  badgeEarlyShieldDesc: 'Shield was ready before the warning.',
  badgeCalmUnderPressure: '🧘 Calm Under Pressure',
  badgeCalmDesc: 'You kept all systems healthy.',
  badgeAskedEarth: '📡 Asked Earth in Time',
  badgeAskedEarthDesc: 'You asked Mission Control before the storm.',
  badgeMarsReady: '🚀 Mars Ready',
  badgeMarsReadyDesc: 'You succeeded on Mars mode!',

  // ── About screen ──────────────────────────────────────────────────────────
  aboutTitle: 'About the Science',
  aboutDataTitle: 'Where does the data come from?',
  aboutDONKI:
    'Solar storms in this game are real events from NASA DONKI.',
  aboutDONKILink: 'NASA DONKI (space weather events)',
  aboutBVAD:
    'Oxygen and food numbers come from NASA life-support research.',
  aboutRadiation:
    'Radiation limits come from NASA astronaut health standards.',
  aboutSimplifiedTitle: 'What is simplified?',
  aboutSimplified1:
    'Real particles can arrive minutes after a flare. The game stretches this to give you time to plan.',
  aboutSimplified2:
    'The Shield meter is simplified. Real shelters use water or soil mass.',
  aboutSimplified3:
    'Radiation dose in-game is a learning tool, not a real measurement.',
  aboutHonestyTitle: '3 Honesty Notes',
  aboutHonesty1: '1. This data is archived, not live.',
  aboutHonesty2:
    '2. A flare class is not a measured surface radiation dose.',
  aboutHonesty3: '3. Game numbers are simplified for learning.',
  aboutPrivacy: 'We store only a made-up nickname and game results. No names, no emails.',
  aboutCredit: 'Built for the 2026 NASA Space Apps Challenge.',
  aboutNASANote: 'NASA does not endorse this project.',

  // ── Glossary triggers ─────────────────────────────────────────────────────
  glossarySol: 'Sol',
  glossarySolarFlare: 'solar flare',
  glossaryParticleStorm: 'particle storm',
  glossaryRadiationDose: 'radiation dose',
  glossaryShielding: 'shielding',
  glossaryPowerBlock: 'power block',
  glossaryCommDelay: 'communication delay',
  glossaryMissionControl: 'Mission Control',

  // ── Error / fallback ──────────────────────────────────────────────────────
  errorLoadData: 'Could not load game data. Please refresh.',
  errorNoBlocks: 'No blocks left! End this sol first.',
};

