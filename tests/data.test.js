/**
 * data.test.js — Runs same checks as verify-data.mjs (for CI via vitest).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_PATH = join(process.cwd(), 'public', 'data', 'storms.json');

describe('storms.json data integrity', () => {
  let data;

  it('file exists and is valid JSON', () => {
    expect(existsSync(DATA_PATH)).toBe(true);
    const raw = readFileSync(DATA_PATH, 'utf8');
    data = JSON.parse(raw);
    expect(data).toBeTruthy();
  });

  it('archived is true', () => {
    data = data || JSON.parse(readFileSync(DATA_PATH, 'utf8'));
    expect(data.archived).toBe(true);
  });

  it('fetchedAt is present', () => {
    data = data || JSON.parse(readFileSync(DATA_PATH, 'utf8'));
    expect(data.fetchedAt).toBeTruthy();
  });

  it('has at least 8 events', () => {
    data = data || JSON.parse(readFileSync(DATA_PATH, 'utf8'));
    expect(data.events.length).toBeGreaterThanOrEqual(8);
  });

  it('has all three tiers', () => {
    data = data || JSON.parse(readFileSync(DATA_PATH, 'utf8'));
    const tiers = new Set(data.events.map(e => e.tier));
    expect(tiers.has(1)).toBe(true);
    expect(tiers.has(2)).toBe(true);
    expect(tiers.has(3)).toBe(true);
  });

  it('every event has classType, peakTime, and link', () => {
    data = data || JSON.parse(readFileSync(DATA_PATH, 'utf8'));
    for (const ev of data.events) {
      expect(ev.flare?.classType).toBeTruthy();
      expect(ev.flare?.peakTime).toBeTruthy();
      expect(ev.flare?.link).toBeTruthy();
    }
  });

  it('at least 3 tier-1, 3 tier-2, 2 tier-3 events', () => {
    data = data || JSON.parse(readFileSync(DATA_PATH, 'utf8'));
    const t1 = data.events.filter(e => e.tier === 1).length;
    const t2 = data.events.filter(e => e.tier === 2).length;
    const t3 = data.events.filter(e => e.tier === 3).length;
    expect(t1).toBeGreaterThanOrEqual(3);
    expect(t2).toBeGreaterThanOrEqual(3);
    expect(t3).toBeGreaterThanOrEqual(2);
  });
});

