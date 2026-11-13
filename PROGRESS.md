# PROGRESS.md — SOL SHIELD Build Status

## Phase 1: Skeleton & Engine ✅ COMPLETE
- Vite + vanilla JS scaffolded
- Full folder structure created
- balance.json with all tunable numbers
- rng.js (seeded Mulberry32 RNG)
- config.js (loads balance.json)
- state.js (initial state factory)
- engine.js (allocateBlock, endSol, applyStorm, checkOutcome, countStars, blocksForSol)
- 33 Vitest tests passing

## Phase 2: Playable Loop ✅ COMPLETE
- All strings in src/ui/strings.js at grade 4 level
- public/data/glossary.json with 8 terms
- Title, Briefing, Play, Debrief (stub), About (stub) screens built
- meter.js, blockPicker.js, stormTimeline.js, controlChat.js, glossaryTip.js, readAloud.js components
- base.css + game.css: mobile-first 360px, 44px touch targets, WCAG AA, ARIA, reduced-motion
- main.js router: title → briefing → play → debrief
- missionControl.js rule-based replies (Phase 4 early start)
- Placeholder tier 2 storm (random sol 5–8)
- Build succeeds, 33 tests pass
- **Decision**: Wrote missionControl.js early since play.js imports it

## Phase 3: Real NASA Data — IN PROGRESS
- Next: write build-storms.mjs, verify-data.mjs, storm.js

## Phase 4: Mission Control — PARTIAL
- missionControl.js rules implemented early (used by play.js)
- Chat UI with Moon instant reply working
- Mars delayed reply queue wired
- TODO: Polish chat animations, verify accuracy per tier

## Phase 5: Debrief & Why Chain — NOT STARTED
## Phase 6: Balance — NOT STARTED
## Phase 7: Content & Accessibility — NOT STARTED
## Phase 8: Optional Services — NOT STARTED
## Phase 9: Mars Mode — NOT STARTED
## Phase 10: Deploy & Docs — NOT STARTED

## Decisions
- Used DEMO_KEY for NASA API (no user-provided key yet)
- Groq/Supabase: will implement graceful fallback (game works without them)
- Model switched from Sonnet to Opus 4.6 (Thinking) due to quota

## Known Issues
- Debrief screen is a stub (Phase 5 will flesh out)
- About screen is a stub (Phase 7 will flesh out)
- No real storm data yet (Phase 3)

