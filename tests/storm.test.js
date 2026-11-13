/**
 * storm.test.js — Tests for storm.js logic.
 */
import { describe, it, expect } from 'vitest';
import { pickStormEvent, buildStormTimeline } from '../src/game/storm.js';
import { createRng } from '../src/game/rng.js';

// Mock storm events
const mockEvents = [
  { id: 'storm-001', tier: 1, flare: { classType: 'M8.7', peakTime: '2012-01-23T04:15Z', link: 'https://example.com/1' }, kidTitle: 'T1', kidStory: 'Story 1' },
  { id: 'storm-002', tier: 2, flare: { classType: 'X2.2', peakTime: '2017-09-06T09:10Z', link: 'https://example.com/2' }, kidTitle: 'T2', kidStory: 'Story 2' },
  { id: 'storm-003', tier: 3, flare: { classType: 'X9.3', peakTime: '2017-09-06T12:02Z', link: 'https://example.com/3' }, kidTitle: 'T3', kidStory: 'Story 3' },
  { id: 'storm-004', tier: 1, flare: { classType: 'M6.2', peakTime: '2012-07-28T20:55Z', link: 'https://example.com/4' }, kidTitle: 'T1b', kidStory: 'Story 4' },
];

describe('pickStormEvent', () => {
  it('returns an event from the list', () => {
    const rng = createRng(42);
    const ev = pickStormEvent(mockEvents, rng, null);
    expect(mockEvents).toContainEqual(ev);
  });

  it('avoids last storm when pool allows', () => {
    // Run many times and check we never repeat the same event consecutively
    const rng = createRng(123);
    let lastId = null;
    for (let i = 0; i < 20; i++) {
      const ev = pickStormEvent(mockEvents, rng, lastId);
      if (lastId !== null && mockEvents.length > 1) {
        expect(ev.id).not.toBe(lastId);
      }
      lastId = ev.id;
    }
  });

  it('still returns something when pool has only one event', () => {
    const rng = createRng(1);
    const single = [mockEvents[0]];
    const ev = pickStormEvent(single, rng, mockEvents[0].id);
    expect(ev).toBeDefined();
  });
});

describe('buildStormTimeline', () => {
  it('stormSol is always between 5 and 8', () => {
    for (let seed = 0; seed < 100; seed++) {
      const rng = createRng(seed);
      const timeline = buildStormTimeline(mockEvents[1], rng);
      expect(timeline.stormSol).toBeGreaterThanOrEqual(5);
      expect(timeline.stormSol).toBeLessThanOrEqual(8);
    }
  });

  it('watchSol = stormSol - 3', () => {
    const rng = createRng(42);
    const t = buildStormTimeline(mockEvents[0], rng);
    expect(t.watchSol).toBe(t.stormSol - 3);
  });

  it('warningSol = stormSol - 1', () => {
    const rng = createRng(42);
    const t = buildStormTimeline(mockEvents[0], rng);
    expect(t.warningSol).toBe(t.stormSol - 1);
  });

  it('timeline order: watchSol < warningSol < stormSol', () => {
    const rng = createRng(99);
    const t = buildStormTimeline(mockEvents[2], rng);
    expect(t.watchSol).toBeLessThan(t.warningSol);
    expect(t.warningSol).toBeLessThan(t.stormSol);
  });

  it('tier maps to the event tier', () => {
    const rng = createRng(7);
    const t3 = buildStormTimeline(mockEvents[2], rng);
    expect(t3.tier).toBe(3);
    const rng2 = createRng(7);
    const t1 = buildStormTimeline(mockEvents[0], rng2);
    expect(t1.tier).toBe(1);
  });

  it('flareClass comes from event', () => {
    const rng = createRng(5);
    const t = buildStormTimeline(mockEvents[1], rng);
    expect(t.flareClass).toBe('X2.2');
  });

  it('is deterministic with same seed', () => {
    const t1 = buildStormTimeline(mockEvents[0], createRng(55));
    const t2 = buildStormTimeline(mockEvents[0], createRng(55));
    expect(t1.stormSol).toBe(t2.stormSol);
  });
});

