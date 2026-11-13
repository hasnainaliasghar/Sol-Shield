/**
 * verify-data.mjs — Sanity checks on public/data/storms.json.
 * Fails (exit code 1) if any required field is missing or counts are wrong.
 * Run: node scripts/verify-data.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PATH = join(__dirname, '..', 'public', 'data', 'storms.json');

let errors = 0;
function fail(msg) { console.error('❌', msg); errors++; }
function ok(msg)   { console.log('✅', msg); }

let data;
try {
  data = JSON.parse(readFileSync(PATH, 'utf8'));
} catch (e) {
  fail(`Cannot read storms.json: ${e.message}`);
  process.exit(1);
}

// 1. Top-level fields
if (data.archived !== true)      fail('archived must be true');
else ok('archived: true');

if (!data.fetchedAt)             fail('fetchedAt missing');
else ok(`fetchedAt: ${data.fetchedAt}`);

if (!Array.isArray(data.events)) fail('events must be an array');
else ok(`events is an array`);

if (errors) process.exit(1);

// 2. Minimum event count
if (data.events.length < 8) fail(`Need ≥8 events, got ${data.events.length}`);
else ok(`Event count: ${data.events.length} (≥8)`);

// 3. All 3 tiers present
const tiers = new Set(data.events.map(e => e.tier));
[1, 2, 3].forEach(t => {
  if (!tiers.has(t)) fail(`Tier ${t} missing from events`);
  else ok(`Tier ${t} present`);
});

// 4. Per-event required fields
data.events.forEach((ev, i) => {
  const id = ev.id || `events[${i}]`;
  if (!ev.flare)                   { fail(`${id}: flare object missing`); return; }
  if (!ev.flare.classType)         fail(`${id}: flare.classType missing`);
  if (!ev.flare.peakTime)          fail(`${id}: flare.peakTime missing`);
  if (!ev.flare.link)              fail(`${id}: flare.link missing`);
  if (!ev.kidTitle)                fail(`${id}: kidTitle missing`);
  if (!ev.kidStory)                fail(`${id}: kidStory missing`);
  if (![1,2,3].includes(ev.tier)) fail(`${id}: tier must be 1, 2 or 3`);
});

const validEvents = data.events.filter(ev =>
  ev.flare && ev.flare.classType && ev.flare.peakTime && ev.flare.link
);
if (validEvents.length === data.events.length) {
  ok(`All ${validEvents.length} events have classType, peakTime, and link`);
}

// 5. Tier counts
const t1 = data.events.filter(e => e.tier === 1).length;
const t2 = data.events.filter(e => e.tier === 2).length;
const t3 = data.events.filter(e => e.tier === 3).length;
if (t1 < 3) fail(`Need ≥3 tier-1 events, got ${t1}`);
else ok(`Tier 1 count: ${t1}`);
if (t2 < 3) fail(`Need ≥3 tier-2 events, got ${t2}`);
else ok(`Tier 2 count: ${t2}`);
if (t3 < 2) fail(`Need ≥2 tier-3 events, got ${t3}`);
else ok(`Tier 3 count: ${t3}`);

// Result
console.log('');
if (errors) {
  console.error(`\n🚨 ${errors} error(s) found. Fix before deploying.\n`);
  process.exit(1);
} else {
  console.log('✅ storms.json passed all checks.\n');
}

