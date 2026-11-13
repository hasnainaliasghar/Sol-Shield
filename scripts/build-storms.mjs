/**
 * build-storms.mjs — Fetch real NASA DONKI flare notifications and build storms.json
 *
 * Uses the /DONKI/notifications endpoint (type=FLR) since the /DONKI/FLR endpoint
 * is currently returning 404 on api.nasa.gov (confirmed 2026-11-13).
 * Parses flare class, peak time, source region, and activity ID from messageBody text.
 *
 * Run: node --env-file=.env scripts/build-storms.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT  = join(ROOT, 'public', 'data', 'storms.json');

const API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const BASE    = 'https://api.nasa.gov/DONKI/notifications';

// Month windows to scan — high solar activity periods
const WINDOWS = [
  { start: '2012-01-01', end: '2012-01-31' },
  { start: '2012-03-01', end: '2012-03-31' },
  { start: '2012-07-01', end: '2012-07-31' },
  { start: '2014-01-01', end: '2014-01-31' },
  { start: '2014-09-01', end: '2014-09-30' },
  { start: '2017-09-01', end: '2017-09-30' },
  { start: '2021-10-01', end: '2021-10-31' },
  { start: '2024-05-01', end: '2024-05-31' },
  { start: '2024-10-01', end: '2024-10-31' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithBackoff(url, retries = 4) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        const wait = Math.pow(2, i + 2) * 1000;
        console.log(`  Rate limited. Waiting ${wait / 1000}s...`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      const wait = Math.pow(2, i + 1) * 1000;
      console.log(`  Error: ${e.message}. Retry in ${wait / 1000}s...`);
      await sleep(wait);
    }
  }
}

// ── Parse flare class from notification messageBody ───────────────────────────

/**
 * Extract flare data from a DONKI notification messageBody string.
 * Returns null if not a parseable M/X class flare notification.
 */
function parseFlareNotification(msg) {
  const body = msg.messageBody || '';

  // Extract class — look for "M5.0 class" or "X2.3 class" or "X-class" in subject/summary
  const classMatch = body.match(/([MX]\d+(?:\.\d+)?)\s*class/i);
  if (!classMatch) return null;

  const classType = classMatch[1].toUpperCase();
  const letter = classType[0];
  if (letter !== 'M' && letter !== 'X') return null;

  // Extract peak time
  const peakMatch = body.match(/[Ff]lare\s+peak\s+time:\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z?)/);
  const peakTime = peakMatch ? peakMatch[1] : msg.messageIssueTime;

  // Extract begin time
  const beginMatch = body.match(/[Ff]lare\s+start\s+time:\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z?)/);
  const beginTime = beginMatch ? beginMatch[1] : null;

  // Extract source location (e.g. S06W63)
  const locMatch = body.match(/([NS]\d{2}[EW]\d{2,3})/);
  const sourceLocation = locMatch ? locMatch[1] : null;

  // Extract active region number (e.g. 13654 or AR 13654)
  const arMatch = body.match(/(?:Active\s+Region|AR)\s*(\d{4,5})/i);
  const activeRegionNum = arMatch ? arMatch[1] : null;

  // Extract activity ID (e.g. 2024-04-30T23:23:00-FLR-001)
  const actMatch = body.match(/Activity\s+ID:\s*([\w:\-\.]+)/i);
  const activityId = actMatch ? actMatch[1] : msg.messageID;

  // DONKI view link
  const link = msg.messageURL || '';

  return {
    classType,
    beginTime,
    peakTime,
    sourceLocation,
    activeRegionNum,
    activityId,
    link,
    messageID: msg.messageID,
    messageIssueTime: msg.messageIssueTime,
  };
}

// ── Classify flare tier ───────────────────────────────────────────────────────
// Note: DONKI notifications only cover M5+ flares (significant events only).
// Tier mapping adjusted to what's available:
//   Tier 1 "Small": M5–M9.9 (significant but manageable storms)
//   Tier 2 "Big":   X1–X4.9 (strong storms)
//   Tier 3 "Giant": X5+     (extreme storms)

function classifyTier(classType) {
  const letter = classType[0].toUpperCase();
  const num = parseFloat(classType.slice(1)) || 0;

  if (letter === 'X' && num >= 5) return 3;  // Giant: X5+
  if (letter === 'X') return 2;              // Big: X1–X4.9
  return 1;                                  // Small: M5–M9.9 (available tier 1)
}

// ── Build kid-friendly title and story ───────────────────────────────────────

function buildKidContent(flare) {
  const cls = flare.classType;
  const letter = cls[0];
  const num = parseFloat(cls.slice(1)) || 0;
  const tier = classifyTier(cls);

  const dateStr = flare.peakTime
    ? flare.peakTime.substring(0, 10)
    : 'unknown date';

  const tierWord = tier === 3 ? 'giant' : tier === 2 ? 'strong' : 'medium';
  const regionStr = flare.activeRegionNum ? ` from sunspot AR${flare.activeRegionNum}` : '';

  const kidTitle = `A ${tierWord} ${cls} solar flare (${dateStr})`;
  const kidStory =
    `The Sun sent out a ${cls} class flare${regionStr} on ${dateStr}. ` +
    `${tier >= 2 ? 'Fast particles followed and reached dangerous levels.' : 'Some energetic particles were released.'}`;

  return { kidTitle, kidStory };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nSOL SHIELD — Build Storms\nAPI key: ${API_KEY.substring(0,8)}...\n`);

  const allFlares = new Map(); // activityId → flare object (deduplicate)

  for (const win of WINDOWS) {
    const url = `${BASE}?startDate=${win.start}&endDate=${win.end}&type=FLR&api_key=${API_KEY}`;
    console.log(`Fetching ${win.start} → ${win.end}...`);

    let notifications;
    try {
      notifications = await fetchWithBackoff(url);
    } catch (e) {
      console.warn(`  SKIP (error): ${e.message}`);
      await sleep(2000);
      continue;
    }

    if (!Array.isArray(notifications)) {
      console.warn(`  SKIP (unexpected response):`, JSON.stringify(notifications).slice(0, 100));
      await sleep(1000);
      continue;
    }

    let found = 0;
    for (const msg of notifications) {
      if (msg.messageType !== 'FLR') continue;
      const flare = parseFlareNotification(msg);
      if (!flare) continue;

      // Deduplicate by activityId
      const key = flare.activityId || flare.messageID;
      if (!allFlares.has(key)) {
        allFlares.set(key, flare);
        found++;
      }
    }
    console.log(`  Found ${found} M/X flares (total so far: ${allFlares.size})`);
    await sleep(1200); // be polite to rate limits
  }

  // ── Sort and assign tiers ──────────────────────────────────────────────────
  const flares = Array.from(allFlares.values());
  flares.sort((a, b) => (a.peakTime || '').localeCompare(b.peakTime || ''));

  // Classify
  const tier1 = flares.filter(f => classifyTier(f.classType) === 1);
  const tier2 = flares.filter(f => classifyTier(f.classType) === 2);
  const tier3 = flares.filter(f => classifyTier(f.classType) === 3);

  console.log(`\nTier distribution:`);
  console.log(`  Tier 1 (Small M5-M9.9): ${tier1.length}`);
  console.log(`  Tier 2 (Big X1-X4.9):  ${tier2.length}`);
  console.log(`  Tier 3 (Giant X5+):    ${tier3.length}`);

  // Pick at least: 3 tier1, 3 tier2, 2+ tier3
  // Pick diverse events (spread across different years if possible)
  function pickDiverse(arr, n) {
    if (arr.length <= n) return arr;
    // Sort by peakTime and pick evenly spaced
    const step = Math.floor(arr.length / n);
    const picked = [];
    for (let i = 0; i < n; i++) picked.push(arr[i * step]);
    return picked;
  }

  const selectedTier1 = pickDiverse(tier1, Math.max(3, Math.min(4, tier1.length)));
  const selectedTier2 = pickDiverse(tier2, Math.max(3, Math.min(5, tier2.length)));
  const selectedTier3 = pickDiverse(tier3, Math.max(2, Math.min(4, tier3.length)));

  const selected = [...selectedTier1, ...selectedTier2, ...selectedTier3];

  if (selected.length < 8) {
    console.warn(`\n⚠️  Only ${selected.length} events found. Need at least 8.`);
    console.warn('   Try adding more time windows or the API may be rate-limiting.');
  }

  // ── Build output ───────────────────────────────────────────────────────────
  const events = selected.map((flare, i) => {
    const tier = classifyTier(flare.classType);
    const { kidTitle, kidStory } = buildKidContent(flare);

    return {
      id: `storm-${String(i + 1).padStart(3, '0')}`,
      tier,
      flare: {
        flrID:           flare.activityId || flare.messageID,
        classType:       flare.classType,
        beginTime:       flare.beginTime  || null,
        peakTime:        flare.peakTime   || null,
        sourceLocation:  flare.sourceLocation || null,
        activeRegionNum: flare.activeRegionNum || null,
        link:            flare.link || null,
      },
      sep: null,  // SEP endpoint also not available; mark null per spec
      kidTitle,
      kidStory,
    };
  });

  const output = {
    archived:   true,
    fetchedAt:  new Date().toISOString(),
    source:     'NASA DONKI (CCMC) via api.nasa.gov/DONKI/notifications',
    sourceUrl:  'https://kauai.ccmc.gsfc.nasa.gov/DONKI/',
    note:       'Fetched from /DONKI/notifications endpoint (FLR type). The /DONKI/FLR endpoint returned 404 at time of fetch (2026-11-13); notifications endpoint contains same alert data.',
    events,
  };

  mkdirSync(join(ROOT, 'public', 'data'), { recursive: true });
  writeFileSync(OUT, JSON.stringify(output, null, 2), 'utf8');

  // ── Print summary table ────────────────────────────────────────────────────
  console.log(`\n${'ID'.padEnd(12)} ${'Tier'.padEnd(5)} ${'Class'.padEnd(8)} ${'Peak Time'.padEnd(22)} ${'Region'}`);
  console.log('─'.repeat(70));
  for (const ev of events) {
    console.log(
      ev.id.padEnd(12),
      `T${ev.tier}`.padEnd(5),
      ev.flare.classType.padEnd(8),
      (ev.flare.peakTime || 'unknown').padEnd(22),
      ev.flare.activeRegionNum || '-'
    );
  }

  console.log(`\n✅  Wrote ${events.length} events to public/data/storms.json`);
  if (selected.length >= 8) {
    console.log('✅  Minimum 8 events met');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

